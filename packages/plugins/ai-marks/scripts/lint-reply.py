#!/usr/bin/env python3
"""Stop hook: flag AI-trace characters in the last assistant reply.

NOTE: A Stop hook cannot edit a reply that has already been shown to
the user. The closest match to "auto-replace" is to detect the marks
and exit non-zero, which forces Claude to rewrite the reply on the
next turn. The retry will be clean. The first reply you saw is not.

Loop guard: if `stop_hook_active` is true, exit 0 so we never trap
the agent in an endless rewrite loop.

Code spans (fenced blocks and inline backticks) are stripped before
scanning, so a reply can name a mark on purpose by wrapping it in
backticks without tripping the hook.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _marks import find_marks  # noqa: E402

# Strip code blocks and inline code so we can talk about the marks
# themselves without tripping the hook. Order matters: fenced blocks
# first, then inline backticks.
_STRIP_PATTERNS = [
    re.compile(r"```.*?```", re.DOTALL),
    re.compile(r"~~~.*?~~~", re.DOTALL),
    re.compile(r"`[^`\n]+`"),
]


def strip_code(text: str) -> str:
    for pat in _STRIP_PATTERNS:
        text = pat.sub("", text)
    return text


def extract_last_assistant_text(transcript_path: str | None) -> str:
    if not transcript_path:
        return ""
    p = Path(transcript_path)
    if not p.exists():
        return ""
    messages: list[dict] = []
    for line in p.read_text(errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            messages.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    for msg in reversed(messages):
        role = msg.get("type") or msg.get("role") or msg.get("message", {}).get("role")
        if role != "assistant":
            continue
        content = msg.get("message", msg).get("content")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(block.get("text", ""))
            if parts:
                return "\n".join(parts)
    return ""


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    if payload.get("stop_hook_active"):
        return 0

    reply = extract_last_assistant_text(payload.get("transcript_path"))
    if not reply:
        return 0

    scan = strip_code(reply)
    marks = find_marks(scan)
    if not marks:
        return 0

    listing = ", ".join(f"{m} ({name})" for m, name in marks)
    print(
        f"ai-marks: your reply contains AI-trace characters: {listing}",
        file=sys.stderr,
    )
    print(
        "Rewrite the reply using only keyboard characters. Use - for any "
        "dash, plain quotes for smart quotes, and ... for ellipsis. If you "
        "need to name a mark on purpose, wrap it in backticks.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
