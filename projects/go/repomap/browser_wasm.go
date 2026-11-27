//go:build js && wasm

package main

import (
	"encoding/json"
	"syscall/js"
)

func main() {
	analyze := js.FuncOf(func(this js.Value, args []js.Value) any {
		file, data := args[0].String(), []byte(args[1].String())
		result := struct {
			Edges []edge
			Flows []controlFlow
		}{sourceEdges(file, data), controlFlows(file, data)}
		output, _ := json.Marshal(result)
		return string(output)
	})
	defer analyze.Release()
	js.Global().Set("repomapAnalyzeSource", analyze)
	select {}
}
