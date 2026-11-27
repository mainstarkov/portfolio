import argparse
import re
from pathlib import Path
from urllib.parse import quote

parser = argparse.ArgumentParser()
parser.add_argument("folder", type=Path)
args = parser.parse_args()
if not args.folder.is_dir():
    parser.error("Expected a folder")
print("# Notes index\n")
for path in sorted(args.folder.rglob("*.md")):
    if path.is_symlink() or not path.is_file():
        continue
    content = path.read_text(encoding="utf-8")
    match = re.search(r"^# +(.+)$", content, re.MULTILINE)
    title = match.group(1).strip() if match else path.stem
    title = title.translate({ord(char): chr(92) + char for char in "[]\\"})
    print(f"- [{title}]({quote(path.as_posix())})")
