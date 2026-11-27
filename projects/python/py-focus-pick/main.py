import argparse
import csv
from fractions import Fraction
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("tasks", type=Path)
parser.add_argument("--minutes", type=int, default=30)
args = parser.parse_args()
if args.minutes < 1:
    parser.error("--minutes must be positive")
candidates = []
with args.tasks.open(encoding="utf-8-sig", newline="") as stream:
    for line, row in enumerate(csv.DictReader(stream), 2):
        try:
            minutes = int(row["minutes"])
            impact = int(row["impact"])
            if minutes < 1 or impact not in range(1, 6):
                raise ValueError
        except (KeyError, ValueError):
            parser.error(f"Invalid task on line {line}")
        if minutes <= args.minutes:
            candidates.append((Fraction(impact, minutes), row["task"]))
if candidates:
    print(max(candidates, key=lambda item: item[0])[1])
else:
    print("No task fits the time budget")
