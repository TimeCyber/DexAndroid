import re
import sys

for f in sys.argv[1:]:
    print("====", f)
    t = open(f, encoding="utf-8").read()
    for m in re.finditer(
        r'(?:text|content-desc)="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
        t,
    ):
        label, x1, y1, x2, y2 = m.groups()
        if label:
            print(f"{label!r} center=({(int(x1)+int(x2))//2},{(int(y1)+int(y2))//2}) bounds=[{x1},{y1}][{x2},{y2}]")
