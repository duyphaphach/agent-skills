#!/usr/bin/env python3
"""PostToolUse hook: lint Markdown files against NGSL+NAWL+tech-terms.

Reads file paths from CLI args (manual mode) or from JSON on stdin (hook
mode). Exits 2 on violations, with the report on stderr.

Default extension scope is .md only. Override with PLAIN_PROSE_EXTS env var,
e.g. PLAIN_PROSE_EXTS=".md,.mdx,.txt"
"""
import os
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lint_core import find_violations

DEFAULT_EXTS = (".md",)

def get_extensions():
    raw = os.environ.get("PLAIN_PROSE_EXTS", "")
    if not raw:
        return DEFAULT_EXTS
    parts = [p.strip().lower() for p in raw.split(",") if p.strip()]
    return tuple(p if p.startswith(".") else "." + p for p in parts)

def collect_paths():
    cli = [p for p in sys.argv[1:] if p.strip()]
    if cli:
        return cli
    if sys.stdin.isatty():
        return []
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return []
    tool_input = payload.get("tool_input") or {}
    paths = []
    for key in ("file_path", "notebook_path"):
        v = tool_input.get(key)
        if isinstance(v, str): paths.append(v)
    fps = tool_input.get("file_paths")
    if isinstance(fps, list):
        paths.extend(p for p in fps if isinstance(p, str))
    return paths

def main():
    exts = get_extensions()
    paths = [p for p in collect_paths() if p.lower().endswith(exts)]
    if not paths:
        return 0
    any_issues = False
    for p in paths:
        try:
            raw = Path(p).read_text(errors="replace")
        except FileNotFoundError:
            continue
        issues = find_violations(raw)
        if not issues: continue
        any_issues = True
        print(f"refine-prose: {p}", file=sys.stderr)
        for line, word in issues[:25]:
            print(f"  L{line}: '{word}' is not in the common word set", file=sys.stderr)
        if len(issues) > 25:
            print(f"  ... and {len(issues)-25} more unique words", file=sys.stderr)
    if any_issues:
        print(
            "\nFor each flagged word, follow this process:\n"
            "\n"
            "  1. Brainstorm THREE alternative words or short phrasings that\n"
            "     fit the sentence and mean roughly the same.\n"
            "\n"
            "  2. For each alternative, check it passes the linter. The fast\n"
            "     check is:\n"
            "       echo 'alternative-word' | refine-prose-lint /dev/stdin\n"
            "     (exit 0 = passes; exit 2 = also flagged)\n"
            "\n"
            "  3. Score each alternative on FIT (1-10):\n"
            "       10 = means exactly the same, reads naturally in this sentence\n"
            "       7-9 = means roughly the same, minor naturalness loss\n"
            "       4-6 = related but awkward here\n"
            "       1-3 = unrelated or wrong\n"
            "\n"
            "  4. Pick the highest-scoring alternative and rewrite.\n"
            "\n"
            "  5. ONLY if no alternative scores 9 or above, the word is a real\n"
            "     gap in the allowlist. Then:\n"
            "       a. Choose a category from\n"
            "            ~/.claude/refine-prose-exceptions/<category>.txt\n"
            "          (existing categories: numbers, ordinals, days-and-months,\n"
            "           brands, file-formats, streams, plugin-internal, places,\n"
            "           business-abbreviations, units, academic-citations,\n"
            "           regional-spellings) -- or create a new category file if\n"
            "           none fit cleanly.\n"
            "       b. Append the word to that file.\n"
            "       c. The PreToolUse validator confirms the addition is real.\n"
            "          If it rejects you, go back to step 1.",
            file=sys.stderr,
        )
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
