#!/usr/bin/env python3
"""Step 1 of the refine-prose skill: strip AI-trace marks.

Replaces em dashes, en dashes, smart quotes, ellipsis characters, and odd
unicode spaces with plain keyboard characters. The same input always gives
the same output, so this runs once with no fix loop.

Usage:
  fix-marks.py FILE [FILE ...]   rewrite files in place (run in parallel)
  fix-marks.py -                 read stdin, write fixed text to stdout

Skips, with a note and exit 0:
  - files with the marker `ai-marks: keep` on any line
  - lock files and known binary file extensions
  - files whose first 4 KB hold a NUL byte
"""
from __future__ import annotations

import argparse
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _marks import count_marks, fix, fix_file

MAX_WORKERS = 8


def _format(result: dict) -> str:
    path = result["path"]
    status = result["status"]
    if status == "fixed":
        summary = ", ".join(f"{count} {name}" for name, count in result["counts"].items())
        return f"fixed: {path} ({summary})"
    if status == "clean":
        return f"clean: {path}"
    if status == "skip":
        return f"skip ({result['reason']}): {path}"
    return f"error ({result['reason']}): {path}"


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="fix-marks.py",
        description="Strip AI-trace marks. Step 1 of the refine-prose skill.",
    )
    parser.add_argument("files", nargs="*",
                        help="files to fix in place; omit or pass - for stdin")
    args = parser.parse_args()

    if not args.files or args.files == ["-"]:
        text = sys.stdin.read()
        sys.stdout.write(fix(text))
        counts = count_marks(text)
        if counts:
            summary = ", ".join(f"{count} {name}" for name, count in counts.items())
            print(f"fixed: {summary}", file=sys.stderr)
        else:
            print("clean", file=sys.stderr)
        return 0

    workers = min(MAX_WORKERS, len(args.files))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for result in pool.map(fix_file, args.files):
            print(_format(result), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
