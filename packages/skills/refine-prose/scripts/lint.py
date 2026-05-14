#!/usr/bin/env python3
"""Gate for the refine-prose skill.

Lints prose against the NGSL+NAWL common-word set, the real tech-terms list,
and the exception files. Reports every word that falls outside the set.

Usage:
  lint.py FILE [FILE ...]      lint one or more files
  lint.py -                    lint raw text from stdin
  echo "word" | lint.py -      quick-check a single word or phrase

Exit codes:
  0  clean
  2  at least one word outside the set (listed on stderr), or a file was
     unreadable
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lint_core import find_violations

MAX_REPORT = 40


def lint_text(text, label):
    """Print violations for one blob of text. Return True if any were found."""
    issues = find_violations(text)
    if not issues:
        return False
    print(f"refine-prose: {label}: {len(issues)} word(s) outside the set",
          file=sys.stderr)
    for line, word in issues[:MAX_REPORT]:
        print(f"  L{line}: {word}", file=sys.stderr)
    if len(issues) > MAX_REPORT:
        print(f"  ... and {len(issues) - MAX_REPORT} more", file=sys.stderr)
    return True


def main():
    args = [a for a in sys.argv[1:] if a.strip()]
    any_issues = False

    if not args or args == ["-"]:
        any_issues = lint_text(sys.stdin.read(), "<stdin>")
    else:
        for p in args:
            try:
                raw = Path(p).read_text(errors="replace")
            except (FileNotFoundError, IsADirectoryError, PermissionError) as e:
                print(f"refine-prose: cannot read {p}: {e}", file=sys.stderr)
                any_issues = True
                continue
            if lint_text(raw, p):
                any_issues = True

    if not any_issues:
        print("refine-prose: clean", file=sys.stderr)
    return 2 if any_issues else 0


if __name__ == "__main__":
    sys.exit(main())
