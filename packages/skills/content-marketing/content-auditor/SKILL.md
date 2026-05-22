---
name: content-auditor
description: 'Audit a blog outline or a finished article and return a score with specific fixes. Reviews against a fixed rubric, lists what is Good and what is Bad, and for every Bad item gives the exact quote, the problem, and a better suggestion in a table. Scoring is deterministic - the same input scores the same. Use whenever the user wants to score, audit, review, grade, or check the quality of an outline or an article, including an already-published post - e.g. "score this draft", "audit this outline", "is this article good enough", "review this blog post". Part of the content-marketing skill stack. Keywords: audit, score, review, grade, quality check, content audit, rubric.'
license: MIT
metadata:
  author: "alexpham"
  repository: "git@github.com:duyphaphach/agent-skills.git"
  version: "1.0.0"
  keywords: "content-audit, scoring, review, rubric, quality-gate, barem, deterministic"
allowed-tools:
  - "*"
---

# Content Auditor

Step 2 of the content-marketing stack. Score an **outline** or an **article** against a fixed rubric and return precise, actionable fixes.

Slash command: `/content-auditor`. Trigger words: "audit", "score".

## When to use

- "Score this draft" / "audit this outline"
- "Is this article good enough to publish"
- "Review this published blog post" - auditing existing content works the same way

## When not to use

- Researching a topic: use `content-researcher`
- Writing or rewriting: use `content-writer`
- Running the full produce-and-publish flow: use `marketing-pipeline`

## Why the score is stable

Most of the rubric is `auto` - counts, lengths, keyword placement - computed by [`scripts/score.mjs`](scripts/score.mjs). That arithmetic never varies. Only a few `judgment` criteria depend on reading, and each is locked to fixed levels (e.g. 0, 10, 20). So the same outline scores the same, every run. Never score an `auto` criterion by eye - always run the script.

---

## Steps

| # | Step | Mode |
|---|------|------|
| 1 | Detect input type (outline or article) and its locale + topic | AUTO - ASK only if locale/topic is unclear |
| 2 | Load `barem.json` and the matching wording rules | AUTO |
| 3 | Run `score.mjs` for the `auto` criteria | AUTO |
| 4 | Score the `judgment` criteria; write a judgment JSON | AUTO |
| 5 | Re-run `score.mjs --judgment` for the final score and gate | AUTO |
| 6 | Write the report: Good, Bad, Score | AUTO |

### Step 1 - Detect (AUTO)

An **outline** is a heading tree (lines like `H1:`, `H2:`). An **article** is finished prose. Pick `outline` or `article` accordingly.

Find the **locale** (e.g. `en`, `vi`) and **topic** (e.g. `finance`). Infer from the content or a research brief if you can. If neither is clear, ask the user once - the wording rules depend on it.

### Step 2 - Load the rules (AUTO)

Read [`references/barem.json`](references/barem.json) - the rubric. See [`references/barem.md`](references/barem.md) for what each criterion means.

Load the wording rules that apply, in this order:

1. `references/wording-language-rules/common.md`
2. `references/wording-language-rules/locales/common.md` + `locales/<locale>.md`
3. `references/wording-language-rules/topics/common.md` + `topics/<topic>.md`

These do not change the rubric score. They sharpen the `readability` and `voice_match` judgments and feed the Bad list.

### Step 3 - Auto score (AUTO)

```bash
node scripts/score.mjs <file> --type <outline|article> --keyword "<keyword>"
```

This prints every `auto` criterion as OK or MISS and an auto subtotal. Deterministic.

### Step 4 - Judgment score (AUTO)

For each `judgment` criterion in `barem.json`, pick **one** of its allowed `levels`. Judge strictly against that criterion's `guide` text - do not invent a number between levels. Write the results to a JSON file:

```json
{ "search_intent": 20, "coverage_gap": 10 }
```

### Step 5 - Final score and gate (AUTO)

```bash
node scripts/score.mjs <file> --type <outline|article> --keyword "<keyword>" --judgment <judgment.json>
```

Prints the total out of 100 and gates on the threshold (80). Exit 0 = pass, 1 = fail.

### Step 6 - Report (AUTO)

Use this exact structure:

```markdown
## Audit: <outline or article name>

**Score: <total>/100 - <PASS or FAIL>** (gate 80)

Auto <auto>/<autoMax> · Judgment <judg>/<judgMax>

### Good

- <what works, one line each>

### Bad

| Quote | Problem | Better suggestion |
|-------|---------|-------------------|
| "<exact text from the content>" | <what is wrong> | <a concrete rewrite or fix> |

### Score breakdown

| Criterion | Score | Notes |
|-----------|-------|-------|
| <criterion> | <n>/<max> | <one line> |
```

Every Bad row must quote the **actual text** and offer a **concrete** fix, not a vague note. A MISS from `score.mjs` and any wording-rule violation both belong in the Bad table.
