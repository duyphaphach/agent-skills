---
name: refine-prose
description: Refines writing into plain, spoken English and strips AI-trace marks (em dashes, smart quotes, curly punctuation, odd unicode spaces). You MUST use this skill before sending any drafted message to the user and before finishing any document, README, or code comment, not only when explicitly asked. Also triggers on "refine this", "make this plainer", "plain English pass", or "strip em dashes".
license: MIT
metadata:
  author: "alexpham"
  repository: "git@github.com:duyphaphach/agent-skills.git"
  version: "1.0.0"
  keywords: "prose, writing, plain-english, ngsl, nawl, linter, em-dash, smart-quotes, ai-detection, refine, gate"
---

# Refine Prose

Keeps writing to common spoken English plus real technical terms, and removes the marks that flag text as machine-made. The rule: if you would not say it out loud, do not write it.

This skill runs on demand. It does not watch file writes or chat replies on its own, so you must run it yourself.

## When to use

Run it every time, on your own, without being asked:

- [ ] Before you send a drafted message to the user
- [ ] Before you finish writing or editing a document, `README`, or code comment

Run it on request when the user asks to refine, simplify, or plain-language any text, or to strip `em dashes` and `smart quotes`.

Run it on writing only: Markdown, doc text, comment blocks. Not on code logic.

## What is in this skill

| Path | What it is |
|------|------------|
| `scripts/fix-marks.py` | Step 1. Removes the typographic marks. Same output every run. |
| `scripts/lint.py` | Step 2, the gate. Lists words outside the common-word set. |
| `scripts/add-exception.py` | Adds, lists, or removes your personal exceptions. |
| `scripts/_marks.py`, `scripts/_lint_core.py` | The shared engine. Leave these alone unless you are changing the skill itself. |
| `wordlists/` | The three base lists: common words, tech terms, the blocklist. |
| `exceptions/` | Built-in exception files, one per category. |
| `references/decision-process.md` | The full per-word process and every table. Read it for detail. |

## Workflow

Three steps, in order, on the target file.

### Step 1: remove the marks

```bash
python3 scripts/fix-marks.py path/to/file.md
```

Changes `em dashes`, `smart quotes`, `ellipsis`, and odd spaces to plain keyboard characters. Runs once: same input, same output, no loop. Pass several files at once and they run together.

### Step 2: run the gate

```bash
python3 scripts/lint.py path/to/file.md
```

| Exit | Meaning |
|------|---------|
| 0 | Clean. You are done. |
| 2 | Words fall outside the set. Each is listed with a line, a column, and a tag. |

A `[blocked, must rewrite]` tag is a fancy word that can never become an exception. An `[unknown]` tag is a word in no list. Any word written with a leading capital is skipped, so names, headings, and acronyms never reach the gate.

### Step 3: fix the flagged words, then run the gate again

For each flagged word, follow `references/decision-process.md`. Short version: drop the word if you can; if not, find a plain replacement and check it with `echo 'word' | python3 scripts/lint.py -`; add an exception only as a last resort.

Repeat Step 2 and Step 3 until the gate returns 0. **Stop after 5 rounds.** If words still fail, show the user what is left with your best idea for each.

## Before you finish

- [ ] `fix-marks.py` has run on the file
- [ ] `lint.py` returns exit 0
- [ ] Every `[blocked]` word was rewritten, not turned into an exception

## Commands

| Goal | Command |
|------|---------|
| Remove marks from files | `python3 scripts/fix-marks.py FILE ...` |
| Remove marks from piped text | `... \| python3 scripts/fix-marks.py -` |
| Run the gate | `python3 scripts/lint.py FILE ...` |
| Run the gate, machine-readable | `python3 scripts/lint.py --json FILE` |
| Check one word | `echo 'word' \| python3 scripts/lint.py -` |
| Check several words at once | `printf 'one\ntwo\n' \| python3 scripts/lint.py -` |
| Run the gate on a whole folder | `python3 scripts/lint.py docs/*.md` |
| Add personal exceptions | `python3 scripts/add-exception.py CATEGORY WORD ...` |
| List personal exceptions | `python3 scripts/add-exception.py --list` |
| Remove personal exceptions | `python3 scripts/add-exception.py --remove CATEGORY WORD ...` |

## Key rules

- A `[blocked]` word must be rewritten. `add-exception.py` will refuse it.
- Add an exception only for a lowercase abbreviation or protocol name with no plain replacement. A capitalized name is already skipped, so it needs no exception. The default is to rewrite.
- The gate skips backtick spans, fenced code, URLs, links, HTML, and frontmatter. To name a mark or a term on purpose, wrap it in backticks.
- Quoting the user or a log line still counts. Rewrite around the quote, or accept the flag on purpose.
- Any word written with a leading capital is skipped (`Kubernetes`, `ORM`, heading words). A word that also appears in lowercase is still checked on its lowercase use.
- `fix-marks.py` skips any file holding the marker `ai-marks: keep`, plus lock files and binary files.
- `add-exception.py` writes only to `~/.refine-prose/`. The base lists ship with the skill.

## Worked example

Before:

```text
We leverage a comprehensive toolset — the best workflow for Kubernetes.
```

`fix-marks.py` turns the `em dash` into a hyphen. `lint.py` then flags `leverage` and `comprehensive` as `[blocked]`; `Kubernetes` is skipped because it is capitalized. After the fix:

```text
We use a full set of tools, the best workflow for Kubernetes.
```

The gate returns 0.

## Worth knowing

For the most accurate word matching, install the `Snowball` stemmer: `pip install snowballstemmer`. Without it the skill uses a simpler backup method, fine for most words but weaker on odd forms.
