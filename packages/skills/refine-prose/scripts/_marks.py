# ai-marks: keep
"""Shared AI-trace character map and replacement helper.

Used by both the PostToolUse fixer and the Stop-hook linter so the
ruleset stays in sync.

This file must contain the literal unicode characters as dict keys.
The `ai-marks: keep` marker above tells the PostToolUse fixer to
skip this file, otherwise it would clobber its own ruleset.
"""
from __future__ import annotations

REPLACEMENTS: dict[str, str] = {
    # Dashes (collapse every variant to a single ASCII hyphen)
    "—": "-",   # em dash
    "–": "-",   # en dash
    "―": "-",   # horizontal bar
    "−": "-",   # math minus sign
    "‐": "-",   # hyphen
    "‑": "-",   # non-breaking hyphen
    "‒": "-",   # figure dash

    # Double quotes
    "“": '"',   # left double curly
    "”": '"',   # right double curly
    "„": '"',   # double low-9
    "‟": '"',   # double high-reversed-9
    "«": '"',   # guillemet open
    "»": '"',   # guillemet close

    # Single quotes / apostrophes
    "‘": "'",   # left single curly
    "’": "'",   # right single curly / curly apostrophe
    "‚": "'",   # single low-9
    "‛": "'",   # single high-reversed-9

    # Ellipsis
    "…": "...", # horizontal ellipsis

    # Spaces (collapse to plain ASCII space, or remove zero-width)
    " ": " ",   # non-breaking space
    " ": " ",   # thin space
    " ": " ",   # hair space
    " ": " ",   # narrow no-break space
    " ": " ",   # figure space
    " ": " ",   # punctuation space
    "​": "",    # zero-width space
    "‌": "",    # zero-width non-joiner
    "‍": "",    # zero-width joiner
    "﻿": "",    # byte-order mark / zero-width no-break
}

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
    " ": "non-breaking space",
    " ": "thin space",
    " ": "hair space",
    " ": "narrow no-break space",
    " ": "figure space",
    " ": "punctuation space",
    "​": "zero-width space",
    "‌": "zero-width non-joiner",
    "‍": "zero-width joiner",
    "﻿": "byte-order mark",
}

_TABLE = str.maketrans({k: v for k, v in REPLACEMENTS.items()})


def fix(text: str) -> str:
    """Return text with every AI-trace character replaced."""
    return text.translate(_TABLE)


def find_marks(text: str) -> list[tuple[str, str]]:
    """Return a list of (mark, name) for any AI-trace marks present."""
    seen: dict[str, str] = {}
    for ch in text:
        if ch in REPLACEMENTS and ch not in seen:
            seen[ch] = NAMES.get(ch, "AI mark")
    return list(seen.items())
