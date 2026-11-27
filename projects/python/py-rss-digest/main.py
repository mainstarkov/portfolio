import argparse
import xml.etree.ElementTree as ET
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("feed", type=Path)
parser.add_argument("--limit", type=int, default=10)
args = parser.parse_args()
if args.limit < 1:
    parser.error("--limit must be positive")
document = ET.parse(args.feed).getroot()
entries = document.findall("./channel/item") + document.findall("./{*}entry")
for entry in entries[:args.limit]:
    title = entry.findtext("{*}title", default="Untitled")
    link = entry.find("{*}link")
    url = (link.get("href") or link.text or "").strip() if link is not None else ""
    print(f"- {' '.join(title.split())}" + (f" — {url}" if url else ""))
