package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type job struct {
	ID     int    `json:"id"`
	Status string `json:"status"`
	SHA256 string `json:"sha256,omitempty"`
}
type work struct {
	id   int
	text string
}

func main() {
	tasks := make(chan work, 32)
	jobs := map[int]job{}
	next := 1
	var mu sync.Mutex
	go func() {
		for item := range tasks {
			result := sha256.Sum256([]byte(item.text))
			mu.Lock()
			jobs[item.id] = job{item.id, "done", hex.EncodeToString(result[:])}
			mu.Unlock()
		}
	}()
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	mux.HandleFunc("POST /jobs", func(w http.ResponseWriter, r *http.Request) {
		var request struct{ Text string }
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192)).Decode(&request) != nil || request.Text == "" {
			http.Error(w, "provide non-empty text", 400)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		item := job{ID: next, Status: "queued"}
		select {
		case tasks <- work{next, request.Text}:
			jobs[next] = item
			if len(jobs) > 128 {
				delete(jobs, next-128)
			}
			next++
		default:
			http.Error(w, "queue full", 503)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(202)
		json.NewEncoder(w).Encode(item)
	})
	mux.HandleFunc("GET /jobs/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		mu.Lock()
		item, ok := jobs[id]
		mu.Unlock()
		if !ok {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(item)
	})
	log.Fatal((&http.Server{Addr: "127.0.0.1:8083", Handler: mux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}).ListenAndServe())
}
