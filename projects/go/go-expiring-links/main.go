package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"sync"
	"time"
)

type link struct {
	URL     string
	Expires time.Time
}

func routes() *http.ServeMux {
	mux := http.NewServeMux()
	var mu sync.Mutex
	links := map[string]link{}
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	mux.HandleFunc("POST /links", func(w http.ResponseWriter, r *http.Request) {
		var input struct {
			URL string
			TTL int
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192)).Decode(&input) != nil || input.TTL < 1 || input.TTL > 86400 {
			http.Error(w, "provide url and ttl (1..86400 seconds)", 400)
			return
		}
		u, err := url.Parse(input.URL)
		if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Hostname() == "" || u.User != nil {
			http.Error(w, "invalid HTTP URL", 400)
			return
		}
		var bytes [12]byte
		if _, err := rand.Read(bytes[:]); err != nil {
			http.Error(w, "could not create link", 500)
			return
		}
		id := hex.EncodeToString(bytes[:])
		mu.Lock()
		now := time.Now()
		if len(links) >= 1000 {
			for key, value := range links {
				if !now.Before(value.Expires) {
					delete(links, key)
				}
			}
		}
		if len(links) >= 1000 {
			mu.Unlock()
			http.Error(w, "capacity reached", 503)
			return
		}
		links[id] = link{u.String(), now.Add(time.Duration(input.TTL) * time.Second)}
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(201)
		json.NewEncoder(w).Encode(map[string]string{"path": "/r/" + id})
	})
	mux.HandleFunc("GET /r/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		mu.Lock()
		item, ok := links[id]
		if ok && !time.Now().Before(item.Expires) {
			delete(links, id)
			ok = false
		}
		mu.Unlock()
		if !ok {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		http.Redirect(w, r, item.URL, http.StatusFound)
	})
	return mux
}
func main() {
	log.Fatal((&http.Server{Addr: "127.0.0.1:8081", Handler: routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}).ListenAndServe())
}
