package main

import (
	"encoding/json"
	"io"
	"log"
	"maps"
	"net/http"
	"strings"
	"sync"
	"time"
)

func decode(w http.ResponseWriter, r *http.Request, target any) bool {
	d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096))
	d.DisallowUnknownFields()
	if d.Decode(target) != nil || d.Decode(new(any)) != io.EOF {
		http.Error(w, "invalid JSON", 400)
		return false
	}
	return true
}
func output(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(value)
}
func routes() http.Handler {
	var mu sync.Mutex
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	type vote struct{ Voter, Option string }
	counts := map[string]int{"Go": 0, "Python": 0, "Rust": 0}
	voters := map[string]bool{}
	mux.HandleFunc("POST /votes", func(w http.ResponseWriter, r *http.Request) {
		var v vote
		if !decode(w, r, &v) {
			return
		}
		v.Voter = strings.TrimSpace(v.Voter)
		if v.Voter == "" || len(v.Voter) > 100 {
			http.Error(w, "provide a voter ID", 400)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		if _, ok := counts[v.Option]; !ok {
			http.Error(w, "choose Go, Python, or Rust", 400)
			return
		}
		if voters[v.Voter] {
			http.Error(w, "already voted", 409)
			return
		}
		if len(voters) >= 10000 {
			http.Error(w, "voter capacity reached", 503)
			return
		}
		voters[v.Voter] = true
		counts[v.Option]++
		output(w, 201, map[string]string{"option": v.Option})
	})
	mux.HandleFunc("GET /results", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		snapshot := maps.Clone(counts)
		mu.Unlock()
		output(w, 200, snapshot)
	})
	return mux
}
func main() {
	server := http.Server{Addr: "127.0.0.1:8087", Handler: routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
	log.Printf("http://%s", server.Addr)
	log.Fatal(server.ListenAndServe())
}
