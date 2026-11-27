import argparse
import json
import os
import random
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

parser = argparse.ArgumentParser()
parser.add_argument("--demo", action="store_true")
args = parser.parse_args()
cards = json.loads(Path(__file__).with_name("cards.json").read_text(encoding="utf-8"))
if args.demo:
    print(f"{cards[0][0]} — {cards[0][1]}")
    raise SystemExit
token = os.environ.get("TELEGRAM_BOT_TOKEN")
if not token:
    parser.error("Set TELEGRAM_BOT_TOKEN or use --demo")

def call(method, data):
    request = Request(f"https://api.telegram.org/bot{token}/{method}",
                      json.dumps(data).encode(),
                      {"Content-Type": "application/json"})
    with urlopen(request, timeout=35) as response:
        return json.load(response)["result"]

offset = 0
active = {}
while True:
    try:
        for update in call("getUpdates", {"offset": offset, "timeout": 25, "allowed_updates": ["message"]}):
            message = update.get("message", {})
            chat = message.get("chat", {}).get("id")
            words = message.get("text", "").split()
            command = words[0].split("@")[0] if words else ""
            reply = None
            if command == "/start":
                reply = "/card — вопрос. /answer — ответ."
            elif command == "/card":
                card = random.choice(cards)
                active[chat] = card[1]
                reply = card[0]
            elif command == "/answer":
                reply = active.get(chat, "Сначала вызовите /card.")
            if chat is not None and reply:
                call("sendMessage", {"chat_id": chat, "text": reply})
            offset = update["update_id"] + 1
    except (URLError, TimeoutError) as error:
        print(f"Telegram request failed: {type(error).__name__}", flush=True)
        time.sleep(5)
