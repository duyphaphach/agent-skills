#!/usr/bin/env python3
"""Gate for the refine-prose skill.

Flags every word outside the common-word set (NGSL + NAWL), the tech-terms
list, and the exception files. Blocked words are tagged apart from merely
unknown ones: a blocked word can never become an exception, so it must be
rewritten.

Usage:
  lint.py FILE [FILE ...]          lint files (run in parallel)
  lint.py -                        lint raw text from stdin
  echo "word" | lint.py -          quick-check one word
  printf 'a\nb\nc\n' | lint.py -   check several candidates in one run
  lint.py --json FILE              machine-readable output on stdout

Exit codes:
  0  clean
  2  at least one word outside the set, or a file could not be read
"""
from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lint_core import find_violations

MAX_WORKERS = 8


def _as_dicts(violations: list[tuple[int, int, str, str]]) -> list[dict]:
    return [
        {"line": line, "col": col, "word": word, "kind": kind}
        for line, col, word, kind in violations
    ]


def lint_file(path: str) -> dict:
    """Worker: lint one file. Safe to run in a thread (own file only)."""
    try:
        text = Path(path).read_text(errors="replace")
    except (OSError, ValueError) as error:
        return {"path": path, "ok": False, "error": str(error), "violations": []}
    violations = _as_dicts(find_violations(text))
    return {"path": path, "ok": not violations, "violations": violations}


def lint_stdin() -> dict:
    violations = _as_dicts(find_violations(sys.stdin.read()))
    return {"path": "<stdin>", "ok": not violations, "violations": violations}


def report_text(results: list[dict], max_report: int) -> None:
    for result in results:
        if result.get("error"):
            print(f"refine-prose: cannot read {result['path']}: {result['error']}",
                  file=sys.stderr)
            continue
        violations = result["violations"]
        if violations:
            blocked = sum(1 for v in violations if v["kind"] == "blocked")
            print(f"refine-prose: {result['path']}: {len(violations)} word(s) "
                  f"outside the set, {blocked} blocked", file=sys.stderr)
            for v in violations[:max_report]:
                tag = "[blocked, must rewrite]" if v["kind"] == "blocked" else "[unknown]"
                print(f"  L{v['line']}:{v['col']} {v['word']} {tag}", file=sys.stderr)
            if len(violations) > max_report:
                print(f"  ... and {len(violations) - max_report} more", file=sys.stderr)
        else:
            print(f"refine-prose: clean: {result['path']}", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="lint.py",
        description="Flag words outside the refine-prose common-word set.",
    )
    parser.add_argument("files", nargs="*",
                        help="files to lint; omit or pass - to read stdin")
    parser.add_argument("--json", action="store_true",
                        help="machine-readable output on stdout")
    parser.add_argument("--max-report", type=int, default=40,
                        help="words listed per file in text mode (default 40)")
    args = parser.parse_args()

    if not args.files or args.files == ["-"]:
        results = [lint_stdin()]
    else:
        workers = min(MAX_WORKERS, len(args.files))
        with ThreadPoolExecutor(max_workers=workers) as pool:
            results = list(pool.map(lint_file, args.files))

    any_issues = any(not result["ok"] for result in results)

    if args.json:
        print(json.dumps(
            {"status": "issues" if any_issues else "clean", "files": results},
            indent=2,
        ))
    else:
        report_text(results, args.max_report)
        if not any_issues:
            print("refine-prose: clean", file=sys.stderr)

    return 2 if any_issues else 0


if __name__ == "__main__":
    sys.exit(main())
