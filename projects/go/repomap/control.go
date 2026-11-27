package main

import (
	"bytes"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"path"
	"regexp"
	"strings"
)

type controlFlow struct {
	Name, File string
	Line, End  int
	Steps      []flowStep
	Limited    bool
}
type flowStep struct {
	Text, Kind string
	Line       int
	Branches   []flowBranch
}
type flowBranch struct {
	Label string
	Steps []flowStep
	Line  int
}

func controlFlows(file string, source []byte) []controlFlow {
	switch strings.ToLower(path.Ext(file)) {
	case ".go":
		return goControl(file, source)
	case ".py":
		return pythonControl(file, string(source))
	}
	return nil
}

func goControl(file string, source []byte) []controlFlow {
	set := token.NewFileSet()
	tree, err := parser.ParseFile(set, file, source, parser.SkipObjectResolution)
	if err != nil {
		return nil
	}
	var flows []controlFlow
	for _, item := range tree.Decls {
		fn, ok := item.(*ast.FuncDecl)
		if !ok || fn.Body == nil {
			continue
		}
		hasBranch := false
		ast.Inspect(fn.Body, func(node ast.Node) bool {
			switch node.(type) {
			case *ast.IfStmt, *ast.SwitchStmt, *ast.TypeSwitchStmt, *ast.SelectStmt, *ast.ForStmt, *ast.RangeStmt:
				hasBranch = true
			}
			return !hasBranch
		})
		if !hasBranch {
			continue
		}
		remaining := 180
		steps := goSteps(set, fn.Body.List, &remaining)
		flows = append(flows, controlFlow{fn.Name.Name, file, set.Position(fn.Pos()).Line, set.Position(fn.End()).Line, steps, remaining <= 0})
	}
	return flows
}

func nodeText(set *token.FileSet, value ast.Node) string {
	var out bytes.Buffer
	if value == nil || format.Node(&out, set, value) != nil {
		return ""
	}
	return out.String()
}

func goSteps(set *token.FileSet, statements []ast.Stmt, budget *int) []flowStep {
	var steps []flowStep
	for _, statement := range statements {
		if *budget <= 0 {
			break
		}
		*budget--
		step := flowStep{Line: set.Position(statement.Pos()).Line, Kind: "action"}
		switch item := statement.(type) {
		case *ast.IfStmt:
			prefix := ""
			if item.Init != nil {
				prefix = nodeText(set, item.Init) + "; "
			}
			step.Kind, step.Text = "condition", prefix+nodeText(set, item.Cond)
			step.Branches = []flowBranch{{"Да", goSteps(set, item.Body.List, budget), 0}, {"Нет", nil, 0}}
			if item.Else != nil {
				if block, ok := item.Else.(*ast.BlockStmt); ok {
					step.Branches[1].Steps = goSteps(set, block.List, budget)
				} else {
					step.Branches[1].Steps = goSteps(set, []ast.Stmt{item.Else}, budget)
				}
			}
		case *ast.SwitchStmt:
			step.Kind, step.Text = "choice", "switch "+nodeText(set, item.Tag)
			step.Branches = caseBranches(set, item.Body.List, budget)
		case *ast.TypeSwitchStmt:
			step.Kind, step.Text = "choice", "switch "+nodeText(set, item.Assign)
			step.Branches = caseBranches(set, item.Body.List, budget)
		case *ast.SelectStmt:
			step.Kind, step.Text = "choice", "select"
			for _, part := range item.Body.List {
				clause := part.(*ast.CommClause)
				label := nodeText(set, clause.Comm)
				if label == "" {
					label = "default"
				}
				if *budget <= 0 {
					break
				}
				*budget--
				step.Branches = append(step.Branches, flowBranch{label, goSteps(set, clause.Body, budget), set.Position(clause.Pos()).Line})
			}
		case *ast.ForStmt:
			step.Kind, step.Text = "choice", "for "+nodeText(set, item.Cond)
			step.Branches = []flowBranch{{"Тело цикла", goSteps(set, item.Body.List, budget), 0}}
		case *ast.RangeStmt:
			step.Kind, step.Text = "choice", "range "+nodeText(set, item.X)
			step.Branches = []flowBranch{{"Тело цикла", goSteps(set, item.Body.List, budget), 0}}
		case *ast.ReturnStmt:
			step.Kind, step.Text = "exit", nodeText(set, item)
		default:
			step.Text = nodeText(set, statement)
		}
		steps = append(steps, step)
	}
	return steps
}

func caseBranches(set *token.FileSet, parts []ast.Stmt, budget *int) []flowBranch {
	var branches []flowBranch
	for _, statement := range parts {
		if *budget <= 0 {
			break
		}
		*budget--
		clause := statement.(*ast.CaseClause)
		label := "default"
		if len(clause.List) > 0 {
			values := make([]string, 0, len(clause.List))
			for _, expr := range clause.List {
				values = append(values, nodeText(set, expr))
			}
			label = strings.Join(values, ", ")
		}
		branches = append(branches, flowBranch{label, goSteps(set, clause.Body, budget), set.Position(clause.Pos()).Line})
	}
	return branches
}

var pythonDef = regexp.MustCompile(`^(?:async\s+)?def\s+([a-zA-Z_]\w*)\s*\(`)

type pythonLine struct {
	text         string
	indent, line int
}

func pythonControl(file, source string) []controlFlow {
	var lines []pythonLine
	for i, raw := range strings.Split(source, "\n") {
		raw = strings.ReplaceAll(raw, "\t", "    ")
		text := strings.TrimSpace(raw)
		if text == "" || strings.HasPrefix(text, "#") {
			continue
		}
		lines = append(lines, pythonLine{text, len(raw) - len(strings.TrimLeft(raw, " ")), i + 1})
	}
	var flows []controlFlow
	for i := 0; i < len(lines); i++ {
		start := lines[i]
		match := pythonDef.FindStringSubmatch(start.text)
		if match == nil {
			continue
		}
		end := i + 1
		for end < len(lines) && lines[end].indent > start.indent {
			end++
		}
		if i+1 < end {
			budget := 180
			steps, _ := pythonSteps(lines[i+1:end], lines[i+1].indent, &budget)
			for _, step := range steps {
				if step.Kind == "condition" {
					flows = append(flows, controlFlow{match[1], file, start.line, lines[end-1].line, steps, budget <= 0})
					break
				}
			}
		}
		i = end - 1
	}
	return flows
}

func pythonSteps(lines []pythonLine, indent int, budget *int) ([]flowStep, int) {
	var steps []flowStep
	i := 0
	for i < len(lines) && lines[i].indent >= indent && *budget > 0 {
		row := lines[i]
		i++
		if row.indent != indent {
			continue
		}
		if strings.HasPrefix(row.text, "elif ") || row.text == "else:" {
			return steps, i - 1
		}
		*budget--
		step := flowStep{Text: row.text, Kind: "action", Line: row.line}
		if strings.HasPrefix(row.text, "if ") && strings.HasSuffix(row.text, ":") {
			step = pythonCondition(row, lines, &i, budget)
		} else if row.text == "return" || strings.HasPrefix(row.text, "return ") || strings.HasPrefix(row.text, "raise ") {
			step.Kind = "exit"
		}
		steps = append(steps, step)
	}
	return steps, i
}

func pythonCondition(row pythonLine, lines []pythonLine, i *int, budget *int) flowStep {
	text := strings.TrimSuffix(strings.TrimPrefix(strings.TrimPrefix(row.text, "if "), "elif "), ":")
	yes := pythonBody(row, lines, i, budget)
	no := []flowStep(nil)
	if *i < len(lines) && lines[*i].indent == row.indent && *budget > 0 {
		next := lines[*i]
		switch {
		case next.text == "else:":
			*i++
			no = pythonBody(next, lines, i, budget)
		case strings.HasPrefix(next.text, "elif ") && strings.HasSuffix(next.text, ":"):
			*i++
			*budget--
			no = []flowStep{pythonCondition(next, lines, i, budget)}
		}
	}
	return flowStep{text, "condition", row.line, []flowBranch{{"Да", yes, 0}, {"Нет", no, 0}}}
}

func pythonBody(row pythonLine, lines []pythonLine, i *int, budget *int) []flowStep {
	if *i >= len(lines) || lines[*i].indent <= row.indent {
		return nil
	}
	body, n := pythonSteps(lines[*i:], lines[*i].indent, budget)
	*i += n
	return body
}
