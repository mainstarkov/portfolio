package main

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"sort"
	"time"
)

func process(input []byte) (any, error) {
	var raw [][]int
	if err := json.Unmarshal(input, &raw); err != nil || raw == nil {
		return nil, errors.New("expected an array of [start,end] pairs")
	}
	slots := make([][2]int, 0, len(raw))
	for _, pair := range raw {
		if len(pair) != 2 || pair[0] >= pair[1] {
			return nil, errors.New("each slot needs start < end")
		}
		slots = append(slots, [2]int{pair[0], pair[1]})
	}
	sort.Slice(slots, func(i, j int) bool { return slots[i][0] < slots[j][0] })
	merged := make([][2]int, 0, len(slots))
	for _, slot := range slots {
		if len(merged) == 0 || slot[0] > merged[len(merged)-1][1] {
			merged = append(merged, slot)
			continue
		}
		last := &merged[len(merged)-1]
		last[1] = max(last[1], slot[1])
	}
	return merged, nil
}
func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	mux.HandleFunc("POST /merge", func(w http.ResponseWriter, r *http.Request) {
		input, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 65536))
		if err != nil {
			http.Error(w, "request body exceeds limit or could not be read", 400)
			return
		}
		value, err := process(input)
		if err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(value)
	})
	log.Fatal((&http.Server{Addr: "127.0.0.1:8088", Handler: mux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}).ListenAndServe())
}
