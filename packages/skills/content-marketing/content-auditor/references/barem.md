# Barem - the rating rubric

"Barem" is the grading scale. `barem.json` is the machine-readable source of truth - `score.mjs` reads it, and so does the auditor. This file explains it in plain words. Edit `barem.json` to change scoring; keep this file in step.

## Two rubrics

| Rubric | Scores | Total |
|--------|--------|-------|
| `outline` | An article outline | 100 |
| `article` | A finished article | 100 |

Pass threshold: **80**. Set by `pass_threshold` in `barem.json`.

## Two kinds of criterion

| Type | Scored by | Determinism |
|------|-----------|-------------|
| `auto` | `score.mjs` - exact counts and checks | Identical every run |
| `judgment` | The auditor, picking one fixed level | Low variance - levels are coarse |

`auto` criteria carry most of the points (60 of 100 for outlines, 68 for articles). That is what keeps the score stable: the same outline gets the same score, because the bulk of it is arithmetic, not opinion.

A `judgment` criterion can only take one of its listed `levels` (e.g. `0`, `10`, `20`). `score.mjs` rejects any other value. The `guide` field says what each level means - judge against it, do not invent a number in between.

## Outline rubric

| Criterion | Points | Type |
|-----------|--------|------|
| Keyword in the H1 title | 12 | auto |
| Keyword in at least one H2 | 8 | auto |
| 4 to 9 H2 sections | 10 | auto |
| At least 3 H3 sub-points | 10 | auto |
| States a named angle | 8 | auto |
| Includes an image plan | 12 | auto |
| Answers the dominant search intent | 20 | judgment |
| Covers gaps the top results miss | 20 | judgment |

## Article rubric

| Criterion | Points | Type |
|-----------|--------|------|
| Keyword in the H1 title | 8 | auto |
| Keyword in the first 100 words | 10 | auto |
| 3 to 9 H2 sections | 8 | auto |
| 800 to 2500 words | 8 | auto |
| Average sentence ≤ 22 words | 8 | auto |
| Average paragraph ≤ 70 words | 8 | auto |
| No paragraph over 110 words | 6 | auto |
| At least 3 links | 6 | auto |
| Image or visualization section present | 6 | auto |
| Readability | 12 | judgment |
| Voice and tone match | 10 | judgment |
| Depth and accuracy | 10 | judgment |

## How a score is produced

1. `score.mjs` parses the document and scores every `auto` criterion. This never varies.
2. The auditor scores each `judgment` criterion, picking one allowed level, and writes `{criterion_id: points}` to a small JSON file.
3. `score.mjs --judgment <file>` merges the two, prints the total, and gates on the threshold.
