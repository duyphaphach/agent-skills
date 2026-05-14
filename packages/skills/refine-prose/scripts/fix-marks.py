#!/usr/bin/env python3
"""Step 1 of the refine-prose skill: strip AI-trace marks.

Deterministic. Replaces em dashes, en dashes, smart quotes, ellipsis
characters, and odd unicode spaces with plain keyboard characters. The same
input always produces the same output, so this runs once with no fix loop.

Usage:
  fix-marks.py FILE [FILE ...]   rewrite files in place, report what changed
  fix-marks.py -                 read stdin, write fixed text to stdout

Skips, with a note and exit 0:
  - files with the marker `ai-marks: keep` on any line
  - lock files and known binary file extensions
  - files whose first 4 KB contain a NUL byte
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _marks import fix, find_marks

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


def is_binary(path):
    try:
        with path.open("rb") as f:
            return b"\x00" in f.read(4096)
    except OSError:
        return True


def fix_file(raw_path):
    """Fix one file in place. Return a one-line status string."""
    path = Path(raw_path)
    if not path.exists() or not path.is_file():
        return f"skip (not a file): {raw_path}"
    if path.name in SKIP_NAMES or path.suffix.lower() in SKIP_SUFFIXES:
        return f"skip (lock or binary type): {raw_path}"
    if is_binary(path):
        return f"skip (binary content): {raw_path}"
    try:
        original = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return f"skip (unreadable as utf-8): {raw_path}"
    if OPT_OUT_MARKER in original:
        return f"skip (ai-marks: keep marker): {raw_path}"

    cleaned = fix(original)
    if cleaned == original:
        return f"clean: {raw_path}"

    names = ", ".join(name for _, name in find_marks(original))
    try:
        path.write_text(cleaned, encoding="utf-8")
    except OSError as e:
        return f"error (could not write): {raw_path}: {e}"
    return f"fixed: {raw_path} ({names})"


def main():
    args = [a for a in sys.argv[1:] if a.strip()]

    if not args or args == ["-"]:
        text = sys.stdin.read()
        sys.stdout.write(fix(text))
        marks = find_marks(text)
        if marks:
            names = ", ".join(name for _, name in marks)
            print(f"fixed {len(marks)} mark type(s): {names}", file=sys.stderr)
        else:
            print("clean", file=sys.stderr)
        return 0

    for p in args:
        print(fix_file(p), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
