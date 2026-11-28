package main

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

type report struct {
	Valid      bool     `json:"valid"`
	Rows       int      `json:"rows"`
	Missing    []string `json:"missing"`
	WrongWidth []int    `json:"wrong_width"`
}

func process(input []byte) (any, error) {
	var request struct {
		CSV      string
		Required []string
	}
	if err := json.Unmarshal(input, &request); err != nil {
		return nil, errors.New("expected CSV text and required headers")
	}
	r := csv.NewReader(strings.NewReader(request.CSV))
	r.FieldsPerRecord = -1
	header, err := r.Read()
	if err != nil {
		return nil, errors.New("CSV header is missing or malformed")
	}
	names := map[string]bool{}
	for _, value := range header {
		if value == "" || names[value] {
			return nil, errors.New("empty or duplicate header")
		}
		names[value] = true
	}
	result := report{Missing: []string{}, WrongWidth: []int{}}
	for _, key := range request.Required {
		if !names[key] {
			result.Missing = append(result.Missing, key)
		}
	}
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("malformed CSV: %w", err)
		}
		result.Rows++
		if len(row) != len(header) {
			result.WrongWidth = append(result.WrongWidth, result.Rows+1)
		}
	}
	result.Valid = len(result.Missing) == 0 && len(result.WrongWidth) == 0
	return result, nil
}
func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	mux.HandleFunc("POST /audit", func(w http.ResponseWriter, r *http.Request) {
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
	log.Fatal((&http.Server{Addr: "127.0.0.1:8089", Handler: mux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}).ListenAndServe())
}
