package main

import (
	"encoding/json"
	"io"
	"log"
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
	type booking struct {
		Room  string    `json:"room"`
		Start time.Time `json:"start"`
		End   time.Time `json:"end"`
	}
	var bookings []booking
	mux.HandleFunc("POST /bookings", func(w http.ResponseWriter, r *http.Request) {
		var b booking
		if !decode(w, r, &b) {
			return
		}
		b.Room = strings.TrimSpace(b.Room)
		if b.Room == "" || !b.Start.Before(b.End) {
			http.Error(w, "provide a room and an increasing RFC3339 interval", 400)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		for _, current := range bookings {
			if strings.EqualFold(current.Room, b.Room) && b.Start.Before(current.End) && current.Start.Before(b.End) {
				http.Error(w, "room already booked", 409)
				return
			}
		}
		if len(bookings) >= 1000 {
			http.Error(w, "booking capacity reached", 503)
			return
		}
		bookings = append(bookings, b)
		output(w, 201, b)
	})
	mux.HandleFunc("GET /bookings", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		snapshot := append([]booking{}, bookings...)
		mu.Unlock()
		output(w, 200, snapshot)
	})
	return mux
}
func main() {
	server := http.Server{Addr: "127.0.0.1:8085", Handler: routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
	log.Printf("http://%s", server.Addr)
	log.Fatal(server.ListenAndServe())
}
