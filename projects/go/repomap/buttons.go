package main

import (
	"go/ast"
	"go/token"
	"path"
	"slices"
	"strings"
)

func goButtonEdges(file string, set *token.FileSet, tree *ast.File) []edge {
	var result []edge
	packages := map[string]bool{}
	links := linkHelpers(tree)
	for _, item := range tree.Imports {
		name := path.Base(literal(item.Path))
		if item.Name != nil {
			name = item.Name.Name
		}
		packages[name] = true
	}
	for _, decl := range tree.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Body == nil {
			continue
		}
		add := func(node ast.Node, from, to, label string) {
			if from != "" && to != "" {
				result = append(result, edge{from, to, label, "bot", file, set.Position(node.Pos()).Line})
			}
		}
		if strings.Contains(strings.ToLower(fn.Name.Name), "callback") {
			callbackBranches(fn, packages, add)
		}
		values := textAssignments(fn)
		ast.Inspect(fn.Body, func(node ast.Node) bool {
			switch item := node.(type) {
			case *ast.CompositeLit:
				var text, data, link ast.Expr
				for _, expr := range item.Elts {
					pair, ok := expr.(*ast.KeyValueExpr)
					if !ok {
						continue
					}
					name, ok := pair.Key.(*ast.Ident)
					if !ok {
						continue
					}
					switch name.Name {
					case "Text":
						text = pair.Value
					case "Data", "CallbackData":
						data = pair.Value
					case "URL":
						link = pair.Value
					}
				}
				if text == nil || (fn.Name.Name == "row" && len(fn.Body.List) == 1) {
					break
				}
				captions := buttonCaptions(text, values)
				switch {
				case data != nil:
					for _, caption := range captions {
						add(item, caption, buttonValue(data), "Кнопка")
					}
				case link != nil:
					for _, caption := range captions {
						add(item, caption, buttonLink(link, links), "Ссылка Telegram")
					}
				}
			case *ast.CallExpr:
				name, ok := item.Fun.(*ast.Ident)
				if ok && name.Name == "row" && len(item.Args) == 2 && literal(item.Args[0]) != "" && literal(item.Args[1]) != "" {
					add(item, literal(item.Args[0]), literal(item.Args[1]), "Кнопка")
				}
			}
			return true
		})
	}
	return result
}

func linkHelpers(tree *ast.File) map[string]string {
	links := map[string]string{}
	for _, decl := range tree.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Body == nil || len(fn.Body.List) != 1 {
			continue
		}
		statement, ok := fn.Body.List[0].(*ast.ReturnStmt)
		if !ok || len(statement.Results) != 1 {
			continue
		}
		value := linkTemplate(statement.Results[0])
		if strings.HasPrefix(value, "https://") || strings.HasPrefix(value, "http://") {
			links[fn.Name.Name] = value
		}
	}
	return links
}

func linkTemplate(expr ast.Expr) string {
	if value := literal(expr); value != "" {
		return value
	}
	switch item := expr.(type) {
	case *ast.BinaryExpr:
		if item.Op == token.ADD {
			return linkTemplate(item.X) + linkTemplate(item.Y)
		}
	case *ast.SelectorExpr:
		return "{" + item.Sel.Name + "}"
	case *ast.Ident:
		return "{" + item.Name + "}"
	}
	return "{…}"
}

func buttonLink(expr ast.Expr, links map[string]string) string {
	if call, ok := expr.(*ast.CallExpr); ok {
		if method, ok := call.Fun.(*ast.SelectorExpr); ok && links[method.Sel.Name] != "" {
			return links[method.Sel.Name]
		}
	}
	return buttonValue(expr)
}

func textAssignments(fn *ast.FuncDecl) map[string][]string {
	values := map[string][]string{}
	ast.Inspect(fn.Body, func(node ast.Node) bool {
		assign, ok := node.(*ast.AssignStmt)
		if ok && len(assign.Lhs) == len(assign.Rhs) {
			for i, left := range assign.Lhs {
				id, ok := left.(*ast.Ident)
				value := literal(assign.Rhs[i])
				if ok && value != "" && !slices.Contains(values[id.Name], value) {
					values[id.Name] = append(values[id.Name], value)
				}
			}
		}
		return true
	})
	return values
}

func buttonCaptions(expr ast.Expr, values map[string][]string) []string {
	if id, ok := expr.(*ast.Ident); ok && len(values[id.Name]) > 0 {
		return values[id.Name]
	}
	return []string{buttonValue(expr)}
}

func buttonValue(expr ast.Expr) string {
	if value := literal(expr); value != "" {
		return value
	}
	switch item := expr.(type) {
	case *ast.CallExpr:
		if len(item.Args) > 0 {
			if value := literal(item.Args[0]); value != "" {
				return value
			}
		}
		if selector, ok := item.Fun.(*ast.SelectorExpr); ok {
			return selector.Sel.Name + "(…)"
		}
	case *ast.SelectorExpr:
		return item.Sel.Name + " (из данных)"
	case *ast.Ident:
		return item.Name + " (из данных)"
	}
	return "Вычисляется при запуске"
}

func callbackBranches(fn *ast.FuncDecl, packages map[string]bool, add func(ast.Node, string, string, string)) {
	// Aliases of a callback prefix, such as action := parts[0].
	prefixes := map[string]bool{}
	ast.Inspect(fn.Body, func(node ast.Node) bool {
		if assign, ok := node.(*ast.AssignStmt); ok && len(assign.Lhs) == 1 && len(assign.Rhs) == 1 {
			if id, ok := assign.Lhs[0].(*ast.Ident); ok && isCallbackKey(assign.Rhs[0], prefixes) {
				prefixes[id.Name] = true
			}
		}
		return true
	})
	ast.Inspect(fn.Body, func(node ast.Node) bool {
		switch item := node.(type) {
		case *ast.SwitchStmt:
			if !isCallbackKey(item.Tag, prefixes) {
				break
			}
			for _, statement := range item.Body.List {
				clause := statement.(*ast.CaseClause)
				for _, expr := range clause.List {
					key := literal(expr)
					if key != "" {
						add(clause, key, branchTargets(clause, packages), "Callback")
					}
				}
			}
		case *ast.IfStmt:
			// Ignore nested conditions inside the body when selecting a branch's key.
			ast.Inspect(item.Cond, func(node ast.Node) bool {
				test, ok := node.(*ast.BinaryExpr)
				if !ok || test.Op != token.EQL {
					return true
				}
				for _, pair := range [][2]ast.Expr{{test.X, test.Y}, {test.Y, test.X}} {
					key := literal(pair[1])
					if key != "" && isCallbackKey(pair[0], prefixes) {
						add(item, key, branchTargets(item.Body, packages), "Callback")
					}
				}
				return true
			})
		}
		return true
	})
}

func isCallbackKey(expr ast.Expr, aliases map[string]bool) bool {
	switch item := expr.(type) {
	case *ast.Ident:
		return aliases[item.Name] || strings.EqualFold(item.Name, "data")
	case *ast.SelectorExpr:
		return item.Sel.Name == "Data" || item.Sel.Name == "CallbackData"
	case *ast.IndexExpr:
		index, ok := item.Index.(*ast.BasicLit)
		return ok && index.Kind == token.INT && index.Value == "0"
	}
	return false
}

func branchTargets(node ast.Node, packages map[string]bool) string {
	var names []string
	ast.Inspect(node, func(node ast.Node) bool {
		call, ok := node.(*ast.CallExpr)
		if !ok {
			return true
		}
		method, ok := call.Fun.(*ast.SelectorExpr)
		if !ok {
			return true
		}
		receiver, ok := method.X.(*ast.Ident)
		if !ok || packages[receiver.Name] {
			return true
		}
		name := method.Sel.Name
		if name != "answer" && !slices.Contains(names, name) {
			names = append(names, name)
		}
		return true
	})
	if len(names) == 0 {
		return "Логика в блоке callback"
	}
	return strings.Join(names, " · ")
}
