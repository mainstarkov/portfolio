//go:build js && wasm

package main

import (
	"encoding/json"
	"syscall/js"
)

func main() {
	analyze := js.FuncOf(func(this js.Value, args []js.Value) any {
		edges := sourceEdges(args[0].String(), []byte(args[1].String()))
		output, _ := json.Marshal(edges)
		return string(output)
	})
	defer analyze.Release()
	js.Global().Set("repomapAnalyzeSource", analyze)
	select {}
}
