import argparse
import re
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("srt", type=Path)
parser.add_argument("milliseconds", type=int)
args = parser.parse_args()
timestamp = r"[0-9]{2,}:[0-5][0-9]:[0-5][0-9],[0-9]{3}"
timing = re.compile(rf"^({timestamp})([ 	]+-->[ 	]+)({timestamp})(.*)$", re.MULTILINE)

def shift(value):
    hours, minutes, seconds, millis = map(int, re.split("[:,]", value))
    total = max(0, ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis + args.milliseconds)
    seconds, millis = divmod(total, 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"

def replace(match):
    start, arrow, end, settings = match.groups()
    return f"{shift(start)}{arrow}{shift(end)}{settings}"

print(timing.sub(replace, args.srt.read_text(encoding="utf-8-sig")), end="")
