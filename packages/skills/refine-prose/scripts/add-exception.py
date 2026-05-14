#!/usr/bin/env python3
"""Add a validated word to your personal refine-prose exceptions.

Personal exceptions live in ~/.claude/refine-prose-exceptions/<category>.txt
and are merged into the allowlist the gate uses. This script is the only safe
way to grow that folder: it validates each word the same way the old
PreToolUse hook did, then appends.

Usage:
  add-exception.py CATEGORY WORD [WORD ...]

CATEGORY is a lowercase name such as: brands, places, units, file-formats,
plugin-internal, business-abbreviations, academic-citations,
regional-spellings, numbers, ordinals, days-and-months, streams. A new
category name is allowed.

Each WORD must:
  - be a single lowercase token, hyphens allowed, no digits
  - not be on the blocklist
  - not already pass via NGSL+NAWL, tech-terms, or a stem match

Exit codes:
  0  every word was added or was already allowed
  2  at least one word was rejected; nothing was written
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lint_core import (
    ALLOWED, TECH, BLOCKED, EXCEPTIONS,
    ALLOWED_STEMS, TECH_STEMS,
    USER_EXCEPTIONS_DIR, stem,
)

VALID_TOKEN = re.compile(r"^[a-z]+(?:-[a-z]+)*$")
VALID_CATEGORY = re.compile(r"^[a-z][a-z-]*$")


def reject_reason(w):
    """Return why w cannot be added, or None if it is a valid new exception."""
    if not VALID_TOKEN.match(w):
        return "not a single lowercase token (use [a-z] with optional hyphens)"
    if w in BLOCKED:
        return "is on the blocklist; the block always wins"
    if w in ALLOWED:
        return "is already in NGSL+NAWL; no exception needed"
    if w in TECH:
        return "is already in tech-terms; no exception needed"
    s = stem(w)
    if s in ALLOWED_STEMS or s in TECH_STEMS:
        return f"already passes via the stem '{s}'; no exception needed"
    return None


def main():
    if len(sys.argv) < 3:
        print("usage: add-exception.py CATEGORY WORD [WORD ...]", file=sys.stderr)
        return 2

    category = sys.argv[1].strip().lower()
    if not VALID_CATEGORY.match(category):
        print(f"refine-prose: bad category '{category}'. Use lowercase letters "
              "and hyphens only.", file=sys.stderr)
        return 2

    words = []
    for raw in sys.argv[2:]:
        w = raw.strip().lower()
        if w and w not in words:
            words.append(w)
    if not words:
        print("refine-prose: no words given", file=sys.stderr)
        return 2

    target = USER_EXCEPTIONS_DIR / f"{category}.txt"
    already = set()
    if target.exists():
        already = {
            line.strip().lower()
            for line in target.read_text(errors="replace").splitlines()
            if line.strip() and not line.startswith("#")
        }

    to_add, skipped, failures = [], [], []
    for w in words:
        if w in already or w in EXCEPTIONS:
            skipped.append(w)
            continue
        reason = reject_reason(w)
        if reason:
            failures.append((w, reason))
        else:
            to_add.append(w)

    if failures:
        print(f"refine-prose: rejecting {len(failures)} word(s); nothing written:",
              file=sys.stderr)
        for w, reason in failures:
            print(f"  '{w}' {reason}", file=sys.stderr)
        print("\nDefault action: rewrite the sentence to use a common word "
              "instead. Add an exception only for a genuine proper noun, "
              "abbreviation, or protocol name.", file=sys.stderr)
        return 2

    if to_add:
        try:
            USER_EXCEPTIONS_DIR.mkdir(parents=True, exist_ok=True)
            with target.open("a", encoding="utf-8") as f:
                for w in to_add:
                    f.write(w + "\n")
        except OSError as e:
            print(f"refine-prose: could not write {target}: {e}", file=sys.stderr)
            return 2
        print(f"refine-prose: added {len(to_add)} word(s) to {target}: "
              f"{', '.join(to_add)}", file=sys.stderr)

    if skipped:
        print(f"refine-prose: {len(skipped)} already allowed, skipped: "
              f"{', '.join(skipped)}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
