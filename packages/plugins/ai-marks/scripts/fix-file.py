#!/usr/bin/env python3
"""PostToolUse hook: silently rewrite AI-trace characters in any file
that Write, Edit, MultiEdit, or NotebookEdit just touched.

Reads the JSON payload Claude Code sends on stdin, pulls the file
path out of `tool_input`, reads the file, applies the replacement
map from `_marks`, and writes back only if something changed.

Skip rules:
- File missing or unreadable -> exit 0
- Binary content (NUL byte in first 4KB) -> exit 0
- Lock files and known-noise paths -> exit 0
- File contains the opt-out marker `ai-marks: keep` on any line -> exit 0
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _marks import fix  # noqa: E402

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
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "composer.lock",
    "Pipfile.lock",
    "poetry.lock",
    "Cargo.lock",
    "Gemfile.lock",
    "uv.lock",
}


def is_binary(path: Path) -> bool:
    try:
        with path.open("rb") as f:
            chunk = f.read(4096)
    except OSError:
        return True
    return b"\x00" in chunk


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool = payload.get("tool_name") or payload.get("tool", "")
    if tool not in {"Write", "Edit", "MultiEdit", "NotebookEdit"}:
        return 0

    tool_input = payload.get("tool_input") or {}
    raw_path = (
        tool_input.get("file_path")
        or tool_input.get("path")
        or tool_input.get("notebook_path")
    )
    if not raw_path:
        return 0

    path = Path(raw_path)
    if not path.exists() or not path.is_file():
        return 0
    if path.name in SKIP_NAMES:
        return 0
    if path.suffix.lower() in SKIP_SUFFIXES:
        return 0
    if is_binary(path):
        return 0

    try:
        original = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return 0

    if OPT_OUT_MARKER in original:
        return 0

    cleaned = fix(original)
    if cleaned == original:
        return 0

    try:
        path.write_text(cleaned, encoding="utf-8")
    except OSError:
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
