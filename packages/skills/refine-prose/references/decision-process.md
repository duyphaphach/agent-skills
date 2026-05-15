# The decision process

How the gate judges each word, and what to do when it flags one.

## How the gate judges a word

For every word, lowercased, in this order:

| Step | Test | Result |
|------|------|--------|
| 1 | On the blocklist? | `blocked` |
| 2 | In NGSL+NAWL, tech-terms, or an exception file? | `allowed` |
| 3 | Its stem in any of those sets? | `allowed` |
| 4 | None of the above | `unknown` |

The block always wins. An exact match beats a stem match.

## Capitalized words

The gate only judges words written in lowercase. Any word with a leading capital is skipped before the steps above run, so names, headings, and acronyms (`Kubernetes`, `ORM`, `Glossary`) are never flagged. The skip is per appearance: if the same word also shows up in lowercase, that lowercase use is still checked.

Three ways to handle a name or term the gate does not know, cheapest first:

| Way | When to use it |
|-----|----------------|
| Write it with a leading capital | The default. A capital is enough for the gate to skip the word. |
| Wrap it in backticks | Terms you want to keep lowercase. The gate skips backtick spans. |
| Add it with `add-exception.py` | A name or term that must pass even when written in lowercase. |

## What to do for each flagged word

Follow these in order. Stop at the first step that works.

### Step 0: try removing the word

Many fancy words are filler. If the sentence keeps its meaning without the word, drop it and stop.

- `comprehensive overview` becomes `overview`
- `robust system` becomes `system`

### Step 1: think of three plain replacements

If removal loses real meaning, think of three other words or short phrases that fit and mean about the same.

### Step 2: check each one against the gate

```bash
echo 'one-word-idea' | python3 scripts/lint.py -
```

Exit 0 means it passes. Exit 2 means it is also outside the set, so drop it. Check three at once:

```bash
printf 'first\nsecond\nthird\n' | python3 scripts/lint.py -
```

### Step 3: score each one that passed, on fit

| Score | Meaning |
|-------|---------|
| 10 | Means the same, reads naturally here |
| 7 to 9 | Means about the same, slight loss |
| 4 to 6 | Related but awkward here |
| 1 to 3 | Wrong or unrelated |

### Step 4: pick the best, or fall through

If the best word scores 9 or higher, use it. If nothing reaches 9, the word is a real gap: go to Step 5.

### Step 5: add an exception (last resort)

Only for a lowercase abbreviation or protocol name with no plain replacement. A capitalized name is skipped by the gate already, so it never needs an exception.

```bash
python3 scripts/add-exception.py CATEGORY WORD
```

`add-exception.py` checks the word first. It refuses a word that is not a single lowercase token, is on the blocklist, or already passes another way. It writes only to `~/.refine-prose/`. A `[blocked]` word can never be added: rewrite it.

## Exception categories

Pick the category that fits. A new category name is allowed if none do.

| Category | Holds |
|----------|-------|
| `common-english` | Everyday words that NGSL and NAWL miss |
| `tech-writing` | Developer-doc and tooling terms |
| `numbers` | Number words |
| `ordinals` | `first`, `second`, and so on |
| `days-and-months` | Calendar words |
| `brands` | Product and company names |
| `places` | Countries, regions, cities, state codes |
| `file-formats` | File extensions |
| `streams` | Standard channel names |
| `units` | `kb`, `mb`, `ms`, and similar |
| `business-abbreviations` | `q1`, `fy`, `ceo`, and similar |
| `academic-citations` | `etc`, `eg`, `ie`, and similar |
| `regional-spellings` | British, Canadian, Australian variants |
| `plugin-internal` | Words this skill uses in its own files |

## The base lists

| File | Holds |
|------|-------|
| `wordlists/ngsl-nawl-combined.txt` | NGSL plus NAWL: about 11,000 forms of everyday and academic English |
| `wordlists/tech-terms.txt` | Real technical jargon: protocols, languages, frameworks |
| `wordlists/block.txt` | Fancy machine-coded words, rejected even when common |

The base lists and the built-in `exceptions/` files ship with the skill. Your own exceptions live in `~/.refine-prose/` and grow through `add-exception.py`.
