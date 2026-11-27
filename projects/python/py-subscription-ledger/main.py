import argparse
import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("file", type=Path)
args = parser.parse_args()
total = Decimal(0)
try:
    with args.file.open(encoding="utf-8-sig", newline="") as stream:
        for line, row in enumerate(csv.DictReader(stream), 2):
            amount = Decimal(row["amount"])
            if not amount.is_finite() or amount < 0:
                raise ValueError(f"Invalid amount on line {line}")
            annual = amount * {"monthly": 12, "yearly": 1}[row["period"]]
            total += annual
            print(f'{row["name"]}: {annual:.2f}/year')
except (OSError, ValueError, KeyError, InvalidOperation) as error:
    parser.exit(1, f"{error}\n")
print(f"Total: {total:.2f}/year ({total / 12:.2f}/month)")
