#!/usr/bin/env python3
"""Manage your personal refine-prose exceptions.

Personal exceptions live in ~/.refine-prose/<category>.txt
and merge into the allowlist the gate uses. This script is the safe way to
grow that folder: it validates each word before it writes.

Usage:
  add-exception.py CATEGORY WORD [WORD ...]    add words to a category
  add-exception.py --list [CATEGORY]           show current personal exceptions
  add-exception.py --remove CATEGORY WORD ...  remove words from a category

A word is valid to add when it:
  - is a single lowercase token, hyphens allowed, no digits
  - is not on the blocklist
  - does not already pass via NGSL+NAWL, tech-terms, or a stem match

Exit codes:
  0  every word was added, removed, or already in the wanted state
  2  bad input, or a word was rejected (then nothing is written)
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lint_core import (
    ALLOWED, ALLOWED_STEMS, BLOCKED, EXCEPTIONS, TECH, TECH_STEMS,
    USER_EXCEPTIONS_DIR, stem,
)

VALID_TOKEN = re.compile(r"^[a-z]+(?:-[a-z]+)*$")
VALID_CATEGORY = re.compile(r"^[a-z][a-z-]*$")


def reject_reason(word: str) -> str | None:
    """Why `word` cannot be added, or None when it is a valid new exception."""
    if not VALID_TOKEN.match(word):
        return "not a single lowercase token (use [a-z] with optional hyphens)"
    if word in BLOCKED:
        return "is on the blocklist; the block always wins"
    if word in ALLOWED:
        return "is already in NGSL+NAWL; no exception needed"
    if word in TECH:
        return "is already in tech-terms; no exception needed"
    word_stem = stem(word)
    if word_stem in ALLOWED_STEMS or word_stem in TECH_STEMS:
        return f"already passes via the stem '{word_stem}'; no exception needed"
    return None


def _read_words(path: Path) -> list[str]:
    if not path.exists():
        return []
    return [
        line.strip().lower()
        for line in path.read_text(errors="replace").splitlines()
        if line.strip() and not line.startswith("#")
    ]


def _clean_category(raw: str) -> str | None:
    category = raw.strip().lower()
    return category if VALID_CATEGORY.match(category) else None


def cmd_list(category: str | None) -> int:
    if not USER_EXCEPTIONS_DIR.is_dir():
        print(f"refine-prose: no personal exceptions yet ({USER_EXCEPTIONS_DIR})",
              file=sys.stderr)
        return 0
    files = sorted(USER_EXCEPTIONS_DIR.glob("*.txt"))
    if category:
        files = [f for f in files if f.stem == category]
    if not files:
        print("refine-prose: nothing to list", file=sys.stderr)
        return 0
    for path in files:
        words = _read_words(path)
        print(f"{path.stem} ({len(words)}): {', '.join(words)}", file=sys.stderr)
    return 0


def cmd_remove(category: str, words: list[str]) -> int:
    target = USER_EXCEPTIONS_DIR / f"{category}.txt"
    if not target.exists():
        print(f"refine-prose: no such category file: {target}", file=sys.stderr)
        return 2
    wanted = {word.strip().lower() for word in words}
    kept, removed = [], []
    for line in target.read_text(errors="replace").splitlines():
        if line.strip().lower() in wanted and not line.startswith("#"):
            removed.append(line.strip())
        else:
            kept.append(line)
    target.write_text("\n".join(kept) + ("\n" if kept else ""))
    if removed:
        print(f"refine-prose: removed {len(removed)} word(s) from {target}: "
              f"{', '.join(removed)}", file=sys.stderr)
    else:
        print(f"refine-prose: no matching words in {target}", file=sys.stderr)
    return 0


def cmd_add(category: str, words: list[str]) -> int:
    target = USER_EXCEPTIONS_DIR / f"{category}.txt"
    already = set(_read_words(target))

    to_add, skipped, failures = [], [], []
    for word in words:
        if word in already or word in EXCEPTIONS:
            skipped.append(word)
        elif reason := reject_reason(word):
            failures.append((word, reason))
        else:
            to_add.append(word)

    if failures:
        print(f"refine-prose: rejecting {len(failures)} word(s); nothing written:",
              file=sys.stderr)
        for word, reason in failures:
            print(f"  '{word}' {reason}", file=sys.stderr)
        print("\nDefault action: rewrite the sentence to use a common word. "
              "Add an exception only for a genuine proper noun, abbreviation, "
              "or protocol name.", file=sys.stderr)
        return 2

    if to_add:
        try:
            USER_EXCEPTIONS_DIR.mkdir(parents=True, exist_ok=True)
            with target.open("a", encoding="utf-8") as handle:
                for word in to_add:
                    handle.write(word + "\n")
        except OSError as error:
            print(f"refine-prose: could not write {target}: {error}", file=sys.stderr)
            return 2
        print(f"refine-prose: added {len(to_add)} word(s) to {target}: "
              f"{', '.join(to_add)}", file=sys.stderr)
    if skipped:
        print(f"refine-prose: {len(skipped)} already allowed, skipped: "
              f"{', '.join(skipped)}", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="add-exception.py",
        description="Add, list, or remove personal refine-prose exceptions.",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--list", action="store_true",
                      help="list current personal exceptions and exit")
    mode.add_argument("--remove", action="store_true",
                      help="remove the given words instead of adding them")
    parser.add_argument("args", nargs="*", metavar="CATEGORY WORD",
                        help="a category, then one or more words")
    opts = parser.parse_args()

    if opts.list:
        category = None
        if opts.args:
            category = _clean_category(opts.args[0])
            if category is None:
                print(f"refine-prose: bad category '{opts.args[0]}'", file=sys.stderr)
                return 2
        return cmd_list(category)

    if len(opts.args) < 2:
        print("usage: add-exception.py CATEGORY WORD [WORD ...]", file=sys.stderr)
        print("       add-exception.py --list [CATEGORY]", file=sys.stderr)
        print("       add-exception.py --remove CATEGORY WORD [WORD ...]", file=sys.stderr)
        return 2

    category = _clean_category(opts.args[0])
    if category is None:
        print(f"refine-prose: bad category '{opts.args[0]}'. Use lowercase "
              "letters and hyphens only.", file=sys.stderr)
        return 2

    words, seen = [], set()
    for raw in opts.args[1:]:
        word = raw.strip().lower()
        if word and word not in seen:
            seen.add(word)
            words.append(word)
    if not words:
        print("refine-prose: no words given", file=sys.stderr)
        return 2

    return cmd_remove(category, words) if opts.remove else cmd_add(category, words)


if __name__ == "__main__":
    sys.exit(main())
