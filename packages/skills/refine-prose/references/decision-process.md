# The decision process

How the gate judges words, and what to do for each word it rejects.

## The decision chain (per word)

For every word in the prose, in this order:

1. Word in the blocklist? **Reject.** The block beats everything.
2. Word in NGSL+NAWL, tech-terms, or an exception file? **Accept.**
3. Stem of the word in any of those stem sets? **Accept.**
4. Otherwise? **Reject.**

Block beats allow. Exact match beats stem. Stem is the fallback.

## What to do for each rejected word

Follow this in order. Stop at the first step that works.

### Step 0: try to remove the word

Many fancy words are filler. Ask: does the sentence lose real meaning if the
word is gone?

- "comprehensive overview" becomes "overview"
- "robust system" becomes "system"
- "crucial step" becomes "step"

If removal works, delete the word and stop. Done.

### Step 1: brainstorm three alternatives

If removal loses real information, think of three other words or short phrases
that fit the sentence and mean roughly the same thing.

### Step 2: check each alternative against the gate

```bash
echo 'alternative-word' | python3 scripts/lint.py -
```

Exit 0 means it passes. Exit 2 means it is also outside the set; drop it.

### Step 3: score each surviving alternative on fit

| Score | Meaning |
|-------|---------|
| 10 | Means exactly the same, reads naturally in this sentence |
| 7 to 9 | Means roughly the same, minor naturalness loss |
| 4 to 6 | Related but awkward here |
| 1 to 3 | Unrelated or wrong |

### Step 4: pick the best, or fall through

If the best alternative scores 9 or higher, rewrite the sentence with it. Done.

If nothing scores 9 or higher, the word is a real gap in the allowlist. Go to
Step 5.

### Step 5: add it as an exception

Only reach this step when the word is a genuine proper noun, an abbreviation,
or a specific protocol name with no plain swap.

```bash
python3 scripts/add-exception.py <category> <word>
```

`add-exception.py` validates the word before it writes. It rejects a word that
is not a single lowercase token, is on the blocklist, or already passes the
gate some other way. It writes only to `~/.claude/refine-prose-exceptions/`.

## Exception categories

Pick the category that fits. A new category name is allowed if none fit.

| Category | Holds |
|----------|-------|
| `numbers` | Number words: `zero`, `two`, up to `million` |
| `ordinals` | Ordinal words: `first`, `second`, up to `twelfth` |
| `days-and-months` | Calendar words |
| `brands` | Brand and product names common in tech docs |
| `file-formats` | File extensions: `md`, `png`, `csv`, and so on |
| `streams` | Standard channel names |
| `plugin-internal` | Words this skill and its tooling use |
| `places` | Countries, regions, common cities, US state codes |
| `business-abbreviations` | `q1`, `fy`, `llc`, `ceo`, and similar |
| `units` | `kb`, `mb`, `ghz`, `ms`, `psi`, and similar |
| `academic-citations` | `etc`, `eg`, `ie`, `viz`, `et`, `al` |
| `regional-spellings` | British, Canadian, Australian variants: `colour`, `organise`, `centre` |

## The lists behind the gate

| File | Holds |
|------|-------|
| `wordlists/ngsl-nawl-combined.txt` | NGSL plus NAWL, flattened. About 11,000 forms of everyday and academic English. |
| `wordlists/tech-terms.txt` | Real technical jargon only: protocols, languages, frameworks, engineering vocabulary. About 150 entries. |
| `wordlists/block.txt` | Fancy machine-coded words, always rejected even when they appear in NGSL or NAWL. About 110 entries. |

These three lists are fixed. The bundled `exceptions/` folder is also fixed.
Your personal exceptions live in `~/.claude/refine-prose-exceptions/` and grow
over time through `add-exception.py`.
