package main

import (
	"bytes"
	"embed"
	"errors"
	"flag"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"html"
	"html/template"
	"io"
	"net/url"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

//go:embed report.html
var assets embed.FS

type edge struct {
	From, To, Label, Kind, File string
	Line                        int
}
type report struct {
	Project string
	Files   int
	Edges   []edge
}

var (
	htmlTag         = regexp.MustCompile("(?is)<(a|form)\\b([^>]*)>")
	htmlAttr        = regexp.MustCompile("(?i)([a-z][a-z0-9_-]*)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s\"'=<>]+))")
	command         = regexp.MustCompile("[\"'](/[a-zA-Z][a-zA-Z0-9_]{0,31})[\"']")
	explicitCommand = regexp.MustCompile("(?i)(?:CommandHandler|\\.command)[(\\s]*[\"']/?([a-z][a-z0-9_]{0,31})[\"']")
	button          = regexp.MustCompile("(?is)(?:InlineKeyboardButton|KeyboardButton|\\btext\\s*:|\\bText\\s*:)[(\\s]*(?:text\\s*=\\s*)?[\"'`]([^\"'`\\r\\n]{1,100})[\"'`](?:[\\s,]+(?:callback_data|CallbackData)\\s*[:=]\\s*[\"'`]([^\"'`\\r\\n]{1,100})[\"'`])?")
	telegram        = regexp.MustCompile("(?i)api\\.telegram\\.org|sendMessage|InlineKeyboard|telebot|telegraf|CommandHandler|CallbackQuery|Telegram")
)

func git(root string, args ...string) ([]byte, error) {
	cmd := exec.Command("git", append([]string{"-C", root}, args...)...)
	output, err := cmd.Output()
	if err != nil {
		var exit *exec.ExitError
		if errors.As(err, &exit) {
			return nil, fmt.Errorf("git: %s", strings.TrimSpace(string(exit.Stderr)))
		}
		return nil, err
	}
	return output, nil
}

func scan(directory string) (report, error) {
	top, err := git(directory, "rev-parse", "--show-toplevel")
	if err != nil {
		return report{}, err
	}
	root, err := filepath.EvalSymlinks(strings.TrimSuffix(string(top), "\n"))
	if err != nil {
		return report{}, err
	}
	listing, err := git(root, "ls-files", "-z", "--cached", "--others", "--exclude-standard")
	if err != nil {
		return report{}, err
	}
	out := report{Project: filepath.Base(root), Edges: []edge{}}
	seen := map[string]bool{}
	for _, name := range strings.Split(string(listing), "\x00") {
		if name == "" || seen[name] || !filepath.IsLocal(name) {
			continue
		}
		seen[name] = true
		ext := strings.ToLower(filepath.Ext(name))
		if !slices.Contains([]string{".go", ".html", ".htm", ".js", ".mjs", ".ts", ".tsx", ".py"}, ext) {
			continue
		}
		full := filepath.Join(root, name)
		if real, err := filepath.EvalSymlinks(full); err != nil || real != full {
			continue
		}
		info, err := os.Lstat(full)
		if err != nil || !info.Mode().IsRegular() || info.Size() > 2<<20 {
			continue
		}
		data, err := readSource(full)
		if err != nil {
			continue
		}
		out.Files++
		source := string(data)
		slash := filepath.ToSlash(name)
		if ext == ".html" || ext == ".htm" {
			out.Edges = append(out.Edges, siteEdges(slash, source)...)
		}
		if ext == ".go" {
			out.Edges = append(out.Edges, goEdges(slash, data)...)
		}
		if ext != ".go" && telegram.MatchString(source) {
			out.Edges = append(out.Edges, botEdges(slash, source)...)
		}
	}
	return out, nil
}

func readSource(filename string) ([]byte, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	return io.ReadAll(io.LimitReader(file, 2<<20))
}

func lineAt(s string, index int) int { return 1 + strings.Count(s[:index], "\n") }
func siteEdges(file, source string) []edge {
	var result []edge
	page := pagePath("/" + file)
	for _, loc := range htmlTag.FindAllStringSubmatchIndex(source, -1) {
		tag := strings.ToLower(source[loc[2]:loc[3]])
		attrs := map[string]string{}
		for _, attr := range htmlAttr.FindAllStringSubmatch(source[loc[4]:loc[5]], -1) {
			attrs[strings.ToLower(attr[1])] = html.UnescapeString(attr[2] + attr[3] + attr[4])
		}
		target := attrs["href"]
		label := "Ссылка"
		if tag == "form" {
			target = attrs["action"]
			if target == "" {
				target = page
			}
			method := strings.ToUpper(attrs["method"])
			if method == "" {
				method = "GET"
			}
			label = "Форма · " + method
		}
		address, err := url.Parse(target)
		if target == "" || err != nil || address.Host != "" || address.Scheme != "" {
			continue
		}
		dest := address.Path
		if dest == "" {
			dest = page
		} else if !strings.HasPrefix(dest, "/") {
			relative := dest
			dest = path.Join(path.Dir("/"+file), relative)
			if strings.HasSuffix(relative, "/") && dest != "/" {
				dest += "/"
			}
		}
		dest = pagePath(dest)
		if address.Fragment != "" {
			dest += "#" + address.Fragment
		}
		result = append(result, edge{page, dest, label, "site", file, lineAt(source, loc[0])})
	}
	return result
}

func pagePath(value string) string {
	if path.Base(value) == "index.html" || path.Base(value) == "index.htm" {
		dir := path.Dir(value)
		return strings.TrimSuffix(dir, "/") + "/"
	}
	return value
}

func literal(expression ast.Expr) string {
	tokenValue, ok := expression.(*ast.BasicLit)
	if !ok || tokenValue.Kind != token.STRING {
		return ""
	}
	value, _ := strconv.Unquote(tokenValue.Value)
	return value
}

func goEdges(file string, source []byte) []edge {
	set := token.NewFileSet()
	tree, err := parser.ParseFile(set, file, source, parser.SkipObjectResolution)
	if err != nil {
		return nil
	}
	var result []edge
	isBot := telegram.Match(source)
	ast.Inspect(tree, func(node ast.Node) bool {
		if isBot {
			if item, ok := goBotEdge(file, set, node); ok {
				result = append(result, item)
			}
		}
		call, ok := node.(*ast.CallExpr)
		if !ok || len(call.Args) < 2 {
			return true
		}
		fn, ok := call.Fun.(*ast.SelectorExpr)
		if !ok || (fn.Sel.Name != "HandleFunc" && fn.Sel.Name != "Handle") {
			return true
		}
		pattern := literal(call.Args[0])
		if pattern == "" {
			return true
		}
		handler := "Обработчик в " + file
		switch arg := call.Args[1].(type) {
		case *ast.Ident:
			handler = arg.Name
		case *ast.SelectorExpr:
			handler = arg.Sel.Name
		}
		result = append(result, edge{pattern, handler, "HTTP → обработчик", "api", file, set.Position(call.Pos()).Line})
		return true
	})
	return result
}

func goBotEdge(file string, set *token.FileSet, node ast.Node) (edge, bool) {
	switch item := node.(type) {
	case *ast.CaseClause:
		for _, expr := range item.List {
			cmd := literal(expr)
			if !strings.HasPrefix(cmd, "/") || !regexpCommand.MatchString(cmd) {
				continue
			}
			target := "Блок команды"
			// A direct call at the start of a case is a useful hint, even if later code has more branches.
			if len(item.Body) > 0 {
				if statement, ok := item.Body[0].(*ast.ExprStmt); ok {
					if call, ok := statement.X.(*ast.CallExpr); ok {
						if selector, ok := call.Fun.(*ast.SelectorExpr); ok {
							target = selector.Sel.Name
						}
					}
				}
			}
			return edge{cmd, target, "Команда", "bot", file, set.Position(item.Pos()).Line}, true
		}
	case *ast.CompositeLit:
		caption, destination := "", ""
		for _, value := range item.Elts {
			pair, ok := value.(*ast.KeyValueExpr)
			if !ok {
				continue
			}
			name, ok := pair.Key.(*ast.Ident)
			if !ok {
				continue
			}
			switch name.Name {
			case "Text":
				caption = literal(pair.Value)
			case "Data", "CallbackData", "URL":
				destination = literal(pair.Value)
				if destination == "" {
					if call, ok := pair.Value.(*ast.CallExpr); ok && len(call.Args) > 0 {
						destination = literal(call.Args[0])
					}
					if destination == "" {
						destination = "Вычисляется при запуске"
					}
				}
			}
		}
		if caption != "" && destination != "" {
			return edge{caption, destination, "Кнопка", "bot", file, set.Position(item.Pos()).Line}, true
		}
	}
	return edge{}, false
}

var regexpCommand = regexp.MustCompile("^/[a-zA-Z][a-zA-Z0-9_]{0,31}$")

func botEdges(file, source string) []edge {
	var result []edge
	seen := map[string]bool{}
	for _, pattern := range []*regexp.Regexp{explicitCommand, command} {
		for _, loc := range pattern.FindAllStringSubmatchIndex(source, -1) {
			name := "/" + strings.TrimPrefix(source[loc[2]:loc[3]], "/")
			if seen[name] {
				continue
			}
			seen[name] = true
			result = append(result, edge{"Telegram", name, "Команда", "bot", file, lineAt(source, loc[0])})
		}
	}
	for _, loc := range button.FindAllStringSubmatchIndex(source, -1) {
		caption := source[loc[2]:loc[3]]
		from := "Клавиатура"
		to := caption
		if loc[4] >= 0 {
			from = caption
			to = source[loc[4]:loc[5]]
		}
		key := from + "\x00" + to
		if seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, edge{from, to, "Кнопка", "bot", file, lineAt(source, loc[0])})
	}
	return result
}

func run(args []string) error {
	flags := flag.NewFlagSet("repomap", flag.ContinueOnError)
	output := flags.String("out", "repomap.html", "путь к новому HTML-отчёту")
	if err := flags.Parse(args); err != nil {
		return err
	}
	dir := "."
	if flags.NArg() == 1 {
		dir = flags.Arg(0)
	} else if flags.NArg() > 1 {
		return errors.New("usage: repomap [-out FILE] [GIT_DIRECTORY]")
	}
	graph, err := scan(dir)
	if err != nil {
		return err
	}
	page, err := template.ParseFS(assets, "report.html")
	if err != nil {
		return err
	}
	var result bytes.Buffer
	if err = page.Execute(&result, graph); err != nil {
		return err
	}
	file, err := os.OpenFile(*output, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
	if err != nil {
		return err
	}
	err = errors.Join(writeReport(file, result.Bytes()), file.Close())
	if err != nil {
		return err
	}
	fmt.Printf("%s · файлов: %d · связей: %d\n", *output, graph.Files, len(graph.Edges))
	return nil
}

func writeReport(dst io.Writer, data []byte) error {
	_, err := dst.Write(data)
	return err
}

func main() {
	if err := run(os.Args[1:]); err != nil && !errors.Is(err, flag.ErrHelp) {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
