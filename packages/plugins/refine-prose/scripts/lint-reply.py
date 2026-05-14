#!/usr/bin/env python3
"""Stop hook: lint the last assistant reply against NGSL+NAWL+tech-terms.

Reads JSON from stdin (Claude Code Stop hook payload). Exits 2 with
violations on stderr to force a rewrite. Loop guard: if stop_hook_active
is true, exit 0 to avoid infinite retries.
"""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lint_core import find_violations

def extract_last_assistant_text(transcript_path):
    if not transcript_path or not Path(transcript_path).exists():
        return ""
    messages = []
    for line in Path(transcript_path).read_text(errors="replace").splitlines():
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

def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    if payload.get("stop_hook_active"):
        return 0
    reply = extract_last_assistant_text(payload.get("transcript_path"))
    if not reply:
        return 0
    issues = find_violations(reply)
    if not issues:
        return 0
    words = [w for _, w in issues]
    preview = ", ".join(words[:25])
    extra = f" (and {len(words)-25} more)" if len(words) > 25 else ""
    print(
        f"refine-prose: your reply contains {len(words)} word(s) outside NGSL+NAWL: {preview}{extra}",
        file=sys.stderr,
    )
    print(
        "\nREQUIRED: Start your rewritten reply with a single line containing\n"
        "  ## Refined\n"
        "followed by a blank line, then the body. This marker tells the user\n"
        "the reply was caught by the linter and rewritten.\n"
        "\n"
        "For each flagged word, follow this process:\n"
        "\n"
        "  0. FIRST, ask: can the word be removed with no change in meaning?\n"
        "     Many fancy words are filler.\n"
        "       'comprehensive overview' -> 'overview'\n"
        "       'robust system' -> 'system'\n"
        "       'crucial step' -> 'step'\n"
        "     If removal works, delete it and stop. Done.\n"
        "     If removal loses real information, continue to step 1.\n"
        "\n"
        "  1. Brainstorm THREE alternative words or short phrasings that fit\n"
        "     the sentence and mean roughly the same.\n"
        "\n"
        "  2. For each alternative, check it passes the linter:\n"
        "       echo 'alternative-word' | refine-prose-lint /dev/stdin\n"
        "     (exit 0 = passes; exit 2 = also flagged)\n"
        "\n"
        "  3. Score each alternative on FIT (1-10):\n"
        "       10 = means exactly the same, reads naturally here\n"
        "       7-9 = means roughly the same, minor naturalness loss\n"
        "       4-6 = related but awkward here\n"
        "       1-3 = unrelated or wrong\n"
        "\n"
        "  4. Pick the highest-scoring alternative and rewrite.\n"
        "\n"
        "  5. ONLY if no alternative scores 9 or above, the word is a real\n"
        "     gap in the allowlist. Then:\n"
        "       a. Choose a category at\n"
        "            ~/.claude/refine-prose-exceptions/<category>.txt\n"
        "          (existing: numbers, ordinals, days-and-months, brands,\n"
        "           file-formats, streams, plugin-internal, places,\n"
        "           business-abbreviations, units, academic-citations,\n"
        "           regional-spellings) or create a new category file if\n"
        "           none fit.\n"
        "       b. Append the word to that file.\n"
        "       c. The PreToolUse validator confirms the addition is real.\n"
        "          If it rejects you, go back to step 0.",
        file=sys.stderr,
    )
    return 2

if __name__ == "__main__":
    sys.exit(main())
