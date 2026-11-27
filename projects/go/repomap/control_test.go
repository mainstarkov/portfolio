package main

import "testing"

func TestGoControlBranches(t *testing.T) {
	src := []byte(`package demo
func handleCallback(ok bool) {
 if !ok { return }
 switch action { case "vote": vote(); default: reject() }
}`)
	flows := controlFlows("bot.go", src)
	if len(flows) != 1 || len(flows[0].Steps) != 2 {
		t.Fatalf("flows: %+v", flows)
	}
	condition, choice := flows[0].Steps[0], flows[0].Steps[1]
	if condition.Text != "!ok" || condition.Branches[0].Steps[0].Kind != "exit" || condition.Branches[1].Label != "Нет" {
		t.Fatalf("condition: %+v", condition)
	}
	if choice.Branches[0].Label != `"vote"` || choice.Branches[1].Steps[0].Text != "reject()" {
		t.Fatalf("choice: %+v", choice)
	}
}

func TestPythonControlBranches(t *testing.T) {
	src := []byte(`class Bot:
    def dispatch(self, command):
        if command == "/balance":
            send_balance()
        elif command == "/support":
            if self.support:
                send_support()
            else:
                reject()
        else:
            return
`)
	flows := controlFlows("bot.py", src)
	if len(flows) != 1 || flows[0].Name != "dispatch" || len(flows[0].Steps) != 1 {
		t.Fatalf("flows: %+v", flows)
	}
	balance := flows[0].Steps[0]
	support := balance.Branches[1].Steps[0]
	if support.Text != `command == "/support"` || support.Branches[0].Steps[0].Branches[1].Steps[0].Text != "reject()" || support.Branches[1].Steps[0].Kind != "exit" {
		t.Fatalf("unexpected branches: %+v", support)
	}
}
