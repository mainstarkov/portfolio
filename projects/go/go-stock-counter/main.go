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
	type movement struct {
		SKU   string
		Delta int
	}
	stock := map[string]int{}
	mux.HandleFunc("POST /movements", func(w http.ResponseWriter, r *http.Request) {
		var m movement
		if !decode(w, r, &m) {
			return
		}
		m.SKU = strings.TrimSpace(m.SKU)
		if m.SKU == "" || len(m.SKU) > 100 || m.Delta == 0 || m.Delta < -1000000 || m.Delta > 1000000 {
			http.Error(w, "provide sku and a nonzero delta between -1000000 and 1000000", 400)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		current, known := stock[m.SKU]
		if !known && len(stock) >= 1000 {
			http.Error(w, "SKU capacity reached", 503)
			return
		}
		next := current + m.Delta
		if next < 0 {
			http.Error(w, "not enough stock", 409)
			return
		}
		if next > 100000000 {
			http.Error(w, "stock limit reached", 409)
			return
		}
		stock[m.SKU] = next
		output(w, 200, map[string]int{m.SKU: next})
	})
	mux.HandleFunc("GET /stock", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		snapshot := maps.Clone(stock)
		mu.Unlock()
		output(w, 200, snapshot)
	})
	return mux
}
func main() {
	server := http.Server{Addr: "127.0.0.1:8086", Handler: routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
	log.Printf("http://%s", server.Addr)
	log.Fatal(server.ListenAndServe())
}
