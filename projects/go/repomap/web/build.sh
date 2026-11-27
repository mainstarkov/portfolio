#!/bin/sh
# Run from the RepoMap folder. Regenerate the GitHub Pages files.
set -eu
out="../../../docs/repomap"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
mkdir "$tmp/Лавка · сайт и бот"
cp -R example/. "$tmp/Лавка · сайт и бот"/
git -C "$tmp/Лавка · сайт и бот" init -q
go run . -out "$tmp/index.html" "$tmp/Лавка · сайт и бот"
mkdir -p "$out"
sed '/<title>/a\
<link rel="stylesheet" href="browser.css?v=tree-4">\
<script src="wasm_exec.js" defer></script>\
<script src="graph.js?v=tree-4" defer></script>\
<script src="browser.js?v=tree-1" defer></script>
' "$tmp/index.html" > "$out/index.html"
cp web/browser.js web/graph.js web/browser.css "$out/"
goroot="$(go env GOROOT)"
source="$goroot/lib/wasm/wasm_exec.js"
if [ ! -f "$source" ]; then source="$goroot/misc/wasm/wasm_exec.js"; fi
cp "$source" "$out/wasm_exec.js"
license="$goroot/LICENSE"
if [ ! -f "$license" ]; then license="$goroot/../LICENSE"; fi
cp "$license" "$out/GO-LICENSE.txt"
GOOS=js GOARCH=wasm go build -trimpath -ldflags="-s -w" -o "$out/repomap.wasm" .
