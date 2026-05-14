#!/usr/bin/env python3
"""PreToolUse hook: deterministically gate writes to refine-prose files.

Rules enforced (rejected with exit code 2 on stderr):

  1. Any write to the plugin's three FIXED lists is rejected outright:
       wordlists/ngsl-nawl-combined.txt
       wordlists/tech-terms.txt
       wordlists/block.txt
     These are immutable at runtime. To change them, fork the plugin.

  2. Any write to a file inside the plugin's exceptions/ folder is rejected.
     The bundled categories are fixed by the plugin maintainer.

  3. Writes to user-side exception files (~/.claude/refine-prose-exceptions/*.txt)
     are validated word by word. Each NEW word in the proposed content must:
       (a) be a single lowercase token (hyphens allowed, no digits)
       (b) NOT be in the blocklist
       (c) NOT already be allowed via NGSL+NAWL, tech-terms, or via stem match

Tool inputs handled: Write, Edit, MultiEdit. Bash writes (echo >> file) are
not covered here.

Exit codes:
  0 -- pass (write proceeds)
  2 -- block (stderr has the reason; agent sees it and must rewrite)
"""
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lint_core import (
    ALLOWED, TECH, BLOCKED, EXCEPTIONS,
    ALLOWED_STEMS, TECH_STEMS,
    PLUGIN_DIR, USER_EXCEPTIONS_DIR,
    stem,
)

FIXED_LIST_PATHS = {
    str(PLUGIN_DIR / "wordlists" / "ngsl-nawl-combined.txt"),
    str(PLUGIN_DIR / "wordlists" / "tech-terms.txt"),
    str(PLUGIN_DIR / "wordlists" / "block.txt"),
}
PLUGIN_EXCEPTIONS_PREFIX = str(PLUGIN_DIR / "exceptions") + os.sep
USER_EXCEPTIONS_PREFIX = str(USER_EXCEPTIONS_DIR) + os.sep

WORD_RE = re.compile(r"\b[A-Za-z][A-Za-z\-']*\b")
VALID_EXCEPTION_RE = re.compile(r"^[a-z]+(?:-[a-z]+)*$")

def fail(msg):
    print(f"refine-prose validator: {msg}", file=sys.stderr)
    sys.exit(2)

def is_plugin_fixed_path(path):
    norm = os.path.normpath(path)
    if norm in FIXED_LIST_PATHS:
        return True
    if norm.startswith(PLUGIN_EXCEPTIONS_PREFIX):
        return True
    return False

def is_user_exception_path(path):
    norm = os.path.normpath(path)
    return norm.startswith(USER_EXCEPTIONS_PREFIX) and norm.endswith(".txt")

def proposed_word_blobs(tool_name, tool_input):
    """Return every text chunk that may add words to the file."""
    blobs = []
    if tool_name == "Write":
        blobs.append(tool_input.get("content", ""))
    elif tool_name == "Edit":
        blobs.append(tool_input.get("new_string", ""))
    elif tool_name == "MultiEdit":
        for edit in tool_input.get("edits", []) or []:
            blobs.append(edit.get("new_string", ""))
    return [b for b in blobs if isinstance(b, str) and b.strip()]

def existing_words(path):
    p = Path(path)
    if not p.exists():
        return set()
    return {
        w.strip().lower()
        for w in p.read_text(errors="replace").splitlines()
        if w.strip() and not w.startswith("#")
    }

def candidate_words(blob):
    return {m.group().lower() for m in WORD_RE.finditer(blob)}

def reject_word(w):
    """Return a reason string if w cannot be added, else None."""
    if not VALID_EXCEPTION_RE.match(w):
        return "not a valid lowercase token (use [a-z] with optional hyphens)"
    if w in BLOCKED:
        return "is on the blocklist -- exceptions cannot override the block"
    if w in ALLOWED:
        return "is already in NGSL+NAWL -- no exception needed"
    if w in TECH:
        return "is already in tech-terms -- no exception needed"
    s = stem(w)
    if s in ALLOWED_STEMS:
        return f"already passes via stem '{s}' in NGSL+NAWL -- no exception needed"
    if s in TECH_STEMS:
        return f"already passes via stem '{s}' in tech-terms -- no exception needed"
    return None

def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool_name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    if not file_path:
        return 0

    if is_plugin_fixed_path(file_path):
        fail(
            f"This file is part of the refine-prose plugin and is fixed.\n"
            f"  Path: {file_path}\n"
            f"To change behavior, edit user-side files under "
            f"~/.claude/refine-prose-exceptions/ instead. The bundled lists "
            f"in the plugin are read-only at runtime."
        )

    if not is_user_exception_path(file_path):
        return 0  # not our file, leave alone

    # Validate every NEW word the write would add
    blobs = proposed_word_blobs(tool_name, tool_input)
    if not blobs:
        return 0

    current = existing_words(file_path)
    proposed = set()
    for blob in blobs:
        proposed |= candidate_words(blob)
    new_words = proposed - current

    if not new_words:
        return 0

    failures = []
    for w in sorted(new_words):
        reason = reject_word(w)
        if reason:
            failures.append((w, reason))

    if not failures:
        return 0

    lines = [
        f"refine-prose validator: rejecting write to {file_path}",
        f"  reason: {len(failures)} of {len(new_words)} new word(s) failed the gate.",
        "",
    ]
    for w, reason in failures:
        lines.append(f"  - '{w}' {reason}")
    lines += [
        "",
        "Default action: REWRITE the sentence to use common English instead.",
        "Add a word to your exceptions folder only when it is genuinely a proper",
        "noun, an abbreviation, or a specific protocol name with no plain swap.",
    ]
    print("\n".join(lines), file=sys.stderr)
    return 2

if __name__ == "__main__":
    sys.exit(main())
