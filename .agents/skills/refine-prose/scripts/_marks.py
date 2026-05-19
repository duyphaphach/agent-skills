# ai-marks: keep
"""Shared AI-trace mark map and helpers for the refine-prose skill.

`fix-marks.py` (step 1 of the skill) uses this module, so the rule set
lives in one place.

Marks are written as escape codes, not literal characters, so the file
stays plain ASCII and unambiguous. The `ai-marks: keep` marker on line one
tells the file fixer to skip this file regardless.
"""
from __future__ import annotations

from pathlib import Path

# Every AI-trace mark and the plain keyboard text it becomes.
REPLACEMENTS: dict[str, str] = {
    # Dashes: collapse every variant to a single ASCII hyphen.
    "—": "-",   # em dash
    "–": "-",   # en dash
    "―": "-",   # horizontal bar
    "−": "-",   # minus sign
    "‐": "-",   # hyphen
    "‑": "-",   # non-breaking hyphen
    "‒": "-",   # figure dash
    # Double quotes.
    "“": '"',   # left double smart quote
    "”": '"',   # right double smart quote
    "„": '"',   # low double quote
    "‟": '"',   # high-reversed double quote
    "«": '"',   # guillemet open
    "»": '"',   # guillemet close
    # Single quotes and apostrophes.
    "‘": "'",   # left single smart quote
    "’": "'",   # right single smart quote
    "‚": "'",   # low single quote
    "‛": "'",   # high-reversed single quote
    # Ellipsis.
    "…": "...",  # horizontal ellipsis
    # Odd spaces: collapse to a plain ASCII space.
    " ": " ",   # non-breaking space
    " ": " ",   # figure space
    " ": " ",   # punctuation space
    " ": " ",   # thin space
    " ": " ",   # hair space
    " ": " ",   # narrow no-break space
    # Zero-width characters: remove entirely.
    "​": "",    # zero-width space
    "‌": "",    # zero-width non-joiner
    "‍": "",    # zero-width joiner
    "﻿": "",    # byte-order mark
}

# Human-readable name for each mark, used in reports.
NAMES: dict[str, str] = {
    "—": "em dash",
    "–": "en dash",
    "―": "horizontal bar",
    "−": "minus sign",
    "‐": "hyphen",
    "‑": "non-breaking hyphen",
    "‒": "figure dash",
    "“": "left double smart quote",
    "”": "right double smart quote",
    "„": "low double quote",
    "‟": "high-reversed double quote",
    "«": "guillemet open",
    "»": "guillemet close",
    "‘": "left single smart quote",
    "’": "right single smart quote",
    "‚": "low single quote",
    "‛": "high-reversed single quote",
    "…": "ellipsis",
    " ": "non-breaking space",
    " ": "figure space",
    " ": "punctuation space",
    " ": "thin space",
    " ": "hair space",
    " ": "narrow no-break space",
    "​": "zero-width space",
    "‌": "zero-width non-joiner",
    "‍": "zero-width joiner",
    "﻿": "byte-order mark",
}

_TABLE = str.maketrans(REPLACEMENTS)


def fix(text: str) -> str:
    """Return text with every AI-trace mark replaced by a plain equivalent."""
    return text.translate(_TABLE)


def find_marks(text: str) -> list[tuple[str, str]]:
    """Return (mark, name) for each distinct AI-trace mark present."""
    seen: dict[str, str] = {}
    for ch in text:
        if ch in REPLACEMENTS and ch not in seen:
            seen[ch] = NAMES.get(ch, "AI mark")
    return list(seen.items())


def count_marks(text: str) -> dict[str, int]:
    """Return {mark name: count} for every AI-trace mark present, in order of
    first appearance."""
    counts: dict[str, int] = {}
    for ch in text:
        if ch in REPLACEMENTS:
            name = NAMES.get(ch, "AI mark")
            counts[name] = counts.get(name, 0) + 1
    return counts


# --- file-level fixer (shared by fix-marks.py) -----------------------------

OPT_OUT_MARKER = "ai-marks: keep"

SKIP_SUFFIXES = {
    ".lock",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf",
    ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".mp3", ".mp4", ".wav", ".mov", ".avi",
    ".so", ".dylib", ".dll", ".exe", ".bin",
}

SKIP_NAMES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "composer.lock",
    "Pipfile.lock", "poetry.lock", "Cargo.lock", "Gemfile.lock", "uv.lock",
}


def _is_binary(path: Path) -> bool:
    try:
        with path.open("rb") as handle:
            return b"\x00" in handle.read(4096)
    except OSError:
        return True


def fix_file(raw_path: str) -> dict:
    """Strip AI-trace marks from one file, in place.

    Returns a result dict whose 'status' is one of: fixed, clean, skip, error.
    Safe to call from a worker thread: it touches only its own file.
    """
    path = Path(raw_path)
    if not path.is_file():
        return {"path": raw_path, "status": "skip", "reason": "not a file"}
    if path.name in SKIP_NAMES or path.suffix.lower() in SKIP_SUFFIXES:
        return {"path": raw_path, "status": "skip", "reason": "lock or binary type"}
    if _is_binary(path):
        return {"path": raw_path, "status": "skip", "reason": "binary content"}
    try:
        original = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return {"path": raw_path, "status": "skip", "reason": "unreadable as utf-8"}
    if OPT_OUT_MARKER in original:
        return {"path": raw_path, "status": "skip", "reason": "ai-marks: keep marker"}

    cleaned = fix(original)
    if cleaned == original:
        return {"path": raw_path, "status": "clean", "counts": {}}

    counts = count_marks(original)
    try:
        path.write_text(cleaned, encoding="utf-8")
    except OSError as error:
        return {"path": raw_path, "status": "error", "reason": str(error)}
    return {"path": raw_path, "status": "fixed", "counts": counts}
