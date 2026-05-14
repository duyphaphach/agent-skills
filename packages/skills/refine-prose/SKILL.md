---
name: refine-prose
description: Refines prose to plain spoken English plus real technical terms, and strips AI-trace marks like em dashes and smart quotes. Use when the user asks to refine, simplify, plain-language, or clean up a document, README, comment block, or chunk of text, or to remove em dashes, smart quotes, or curly punctuation. Trigger with "refine this", "make this plainer", "plain English pass", "strip em dashes".
license: MIT
metadata:
  author: "alexpham"
  repository: "git@github.com:duyphaphach/agent-skills.git"
  version: "1.0.0"
  keywords: "prose, writing, plain-english, ngsl, nawl, linter, em-dash, smart-quotes, ai-detection, refine, gate, loop"
---

# Refine Prose

Keeps text to common spoken English plus real technical terms, and strips the
typographic marks that flag writing as AI-made. The rule: if you would not say
it out loud, do not write it.

This skill is the on-demand replacement for two older hook-based plugins,
`refine-prose` and `ai-marks`. It runs only when you invoke it. It does not
watch file writes and it does not check chat replies. That always-on behavior
needs a hook and cannot live in a skill.

## When to use

- The user asks to refine, simplify, plain-language, or clean up a file or block of text.
- The user asks to strip em dashes, smart quotes, ellipsis characters, or curly punctuation.
- Before handing over a README, doc, or comment block that should read as plain English.

Run it on prose only: Markdown, doc text, comment blocks. Do not run it on code logic.

## What is in this skill

All paths are relative to this skill folder.

| Piece | What it is |
|-------|-----------|
| `scripts/fix-marks.py` | Step 1. Deterministic mark stripper. File or stdin. Runs once. |
| `scripts/lint.py` | The gate. Lists every word outside the common-word set. File or stdin. Exit 0 = clean, 2 = issues. |
| `scripts/add-exception.py` | Adds a validated word to your personal exception list. Last resort only. |
| `scripts/_marks.py` | Shared mark map. Do not edit. |
| `scripts/_lint_core.py` | Shared word-set logic. Do not edit. |
| `wordlists/` | Three fixed lists: NGSL+NAWL common words, real tech terms, the blocklist. |
| `exceptions/` | Built-in exception categories (numbers, brands, units, and so on). Fixed. |
| `references/decision-process.md` | The full per-word fix process, the fit-score table, and the exception categories. |

## The workflow: script, gate, loop

Run these three steps in order on the target file.

### Step 1: strip AI marks (script, runs once)

```bash
python3 scripts/fix-marks.py path/to/file.md
```

This is deterministic. It swaps em dashes, en dashes, smart quotes, ellipsis
characters, and odd unicode spaces for plain keyboard characters. The same
input always gives the same output, so there is no loop here. It prints what
it changed for each file.

### Step 2: the gate

```bash
python3 scripts/lint.py path/to/file.md
```

- Exit 0: the file is clean. You are done.
- Exit 2: stderr lists each word outside the common-word set, with line numbers.

### Step 3: the fix loop

For each flagged word, follow the process in `references/decision-process.md`.
Short form:

0. Can the word be removed with no loss of meaning? Remove it. Done.
1. If not, think of three plain alternatives.
2. Check each one: `echo 'alternative' | python3 scripts/lint.py -` (exit 0 means it passes).
3. Score each on fit, 1 to 10. Pick the best that scores 9 or higher.
4. If nothing scores 9 or higher, the word is a real gap. Add it as an exception:
   `python3 scripts/add-exception.py <category> <word>`

Apply your fixes to the file, then run Step 2 again. Repeat until the gate
returns exit 0.

**Cap the loop at 5 rounds.** If the file still fails after 5 rounds, stop.
Show the user the words that remain with your best suggestion for each, and let
them decide. Never loop without a limit.

## Rules

- Never edit files under `wordlists/` or `exceptions/` in this skill. They are fixed. To grow the allowlist, use `add-exception.py`, which writes only to `~/.claude/refine-prose-exceptions/`.
- Add an exception only as a last resort: a genuine proper noun, an abbreviation, or a protocol name with no plain swap. The default is always to rewrite the sentence.
- The gate skips backtick spans, fenced code blocks, URLs, links, HTML tags, and frontmatter. To name a mark or a term on purpose without tripping the gate, wrap it in backticks.
- Quoting the user or quoting a log line still counts against the gate. Rewrite around the quote, or accept the flag on purpose.
- `fix-marks.py` skips any file with the marker `ai-marks: keep` on a line, plus lock files and binary files.

## The decision chain (how the gate judges one word)

In order:

1. In the blocklist? Reject. The block always wins.
2. In NGSL+NAWL, tech-terms, or an exception file? Accept.
3. Its stem in any of those sets? Accept.
4. Otherwise reject.

Full detail, the fit-score table, and the list of exception categories are in
`references/decision-process.md`.

## Quick reference

| Goal | Command |
|------|---------|
| Strip marks from a file | `python3 scripts/fix-marks.py FILE` |
| Strip marks from piped text | `echo "text" \| python3 scripts/fix-marks.py -` |
| Run the gate on a file | `python3 scripts/lint.py FILE` |
| Check one candidate word | `echo "word" \| python3 scripts/lint.py -` |
| Add a validated exception | `python3 scripts/add-exception.py CATEGORY WORD` |
