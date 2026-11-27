package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestScan(t *testing.T) {
	root := t.TempDir()
	if output, err := exec.Command("git", "-C", root, "init", "-q").CombinedOutput(); err != nil {
		t.Fatalf("git init: %v: %s", err, output)
	}
	files := map[string]string{
		".gitignore":   "ignored.html\n",
		"index.html":   `<a href="catalog/index.html">View</a><a href="https://example.org/">External</a>`,
		"ignored.html": `<a href="/ignored">Ignored</a>`,
		"bot.py": `CommandHandler("start", welcome)
InlineKeyboardButton("Catalog", callback_data="catalog")`,
		"server.go": `package main
func start(){ mux.HandleFunc("GET /healthz", health) }`,
	}
	for name, content := range files {
		if err := os.WriteFile(filepath.Join(root, name), []byte(content), 0600); err != nil {
			t.Fatal(err)
		}
	}
	graph, err := scan(root)
	if err != nil {
		t.Fatal(err)
	}
	if graph.Files != 3 || len(graph.Edges) != 4 {
		t.Fatalf("unexpected scan: %+v", graph)
	}
	expected := map[string]string{"site": "/catalog/", "api": "health", "bot": "catalog"}
	for _, found := range graph.Edges {
		if found.To == expected[found.Kind] {
			delete(expected, found.Kind)
		}
	}
	if len(expected) != 0 {
		t.Fatalf("missing edges: %v", expected)
	}

	dest := filepath.Join(t.TempDir(), "map.html")
	if err := run([]string{"-out", dest, root}); err != nil {
		t.Fatal(err)
	}
	rendered, err := os.ReadFile(dest)
	if err != nil || !strings.Contains(string(rendered), "GET /healthz") {
		t.Fatalf("bad report: %s, %v", rendered, err)
	}
	if err := run([]string{"-out", dest, root}); err == nil {
		t.Fatal("overwrote an existing report")
	}
}
