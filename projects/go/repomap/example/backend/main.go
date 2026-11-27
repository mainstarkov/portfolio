package main

import "net/http"

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", health)
	mux.HandleFunc("POST /feedback", feedback)
}
func health(w http.ResponseWriter, r *http.Request)   { w.WriteHeader(http.StatusOK) }
func feedback(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusAccepted) }
