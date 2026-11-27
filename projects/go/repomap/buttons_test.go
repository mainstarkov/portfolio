package main

import (
	"slices"
	"strings"
	"testing"
)

func TestGoButtonDestinations(t *testing.T) {
	source := []byte(`package example
 // Telegram
 func row(text, data string) [][]button { return [][]button{{{Text: text, Data: data}}} }
 func (b *bot) link() string { return "https://t.me/" + b.Username + "?startgroup=group" }
 func (b *bot) menu() {
  label := "Start game"
  if ready { label = "New round" }
  row("Help", "help")
  say(button{Text:label,Data:fmt.Sprintf("play:%s",code)})
  say(button{Text:"Add to group",URL:b.link()})
 }
 func (b *bot) handleCallback(c *callback) {
  parts := strings.Split(c.Data, ":")
  action := parts[0]
  if action == "play" { b.start() }
  switch parts[0] {case "help": b.rules()}
 }`)
	items := sourceEdges("bot.go", source)
	tests := []struct{ from, to, label string }{
		{"Help", "help", "Кнопка"}, {"help", "rules", "Callback"},
		{"Start game", "play:%s", "Кнопка"}, {"New round", "play:%s", "Кнопка"},
		{"play", "start", "Callback"}, {"Add to group", "https://t.me/{Username}?startgroup=group", "Ссылка Telegram"},
	}
	if len(items) != len(tests) {
		t.Fatalf("unexpected edges: %+v", items)
	}
	for _, test := range tests {
		if !slices.ContainsFunc(items, func(item edge) bool {
			return item.From == test.from && item.To == test.to && item.Label == test.label && item.Line > 0
		}) {
			t.Errorf("missing edge %s -> %s (%s)", test.from, test.to, strings.TrimSpace(test.label))
		}
	}
}
