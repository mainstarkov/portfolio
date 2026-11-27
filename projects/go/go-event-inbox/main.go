package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

type event struct {
	ID   string    `json:"id"`
	Type string    `json:"type"`
	At   time.Time `json:"received_at"`
}

func main() {
	const capacity = 100
	var mu sync.Mutex
	events := make([]event, 0, capacity)
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	mux.HandleFunc("POST /events", func(w http.ResponseWriter, r *http.Request) {
		var item event
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&item) != nil {
			http.Error(w, "invalid JSON", 400)
			return
		}
		item.ID = strings.TrimSpace(item.ID)
		item.Type = strings.TrimSpace(item.Type)
		if item.ID == "" || item.Type == "" || len(item.ID) > 128 || len(item.Type) > 128 {
			http.Error(w, "id and type must be 1..128 bytes", 400)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		for _, known := range events {
			if known.ID == item.ID {
				if known.Type != item.Type {
					http.Error(w, "ID already used for another type", 409)
					return
				}
				w.WriteHeader(200)
				return
			}
		}
		if len(events) == capacity {
			copy(events, events[1:])
			events = events[:capacity-1]
		}
		item.At = time.Now().UTC()
		events = append(events, item)
		w.WriteHeader(201)
	})
	mux.HandleFunc("GET /events", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		snapshot := append(make([]event, 0, len(events)), events...)
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(snapshot)
	})
	log.Fatal((&http.Server{Addr: "127.0.0.1:8084", Handler: mux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}).ListenAndServe())
}
