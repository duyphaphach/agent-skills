---
name: content-writer
description: 'Write a full blog article. Takes a finished outline, or a keyword plus location plus content angle, and produces a complete article that follows the wording rules, plus a table suggesting where images or visualizations belong. Use whenever the user wants to write, draft, or produce a blog article or post, e.g. "write a blog post about X", "turn this outline into an article", "draft an article on this keyword". Part of the content-marketing skill stack. Keywords: write, draft, blog article, content writing, copywriting, article from outline.'
license: MIT
metadata:
  author: "alexpham"
  repository: "git@github.com:duyphaphach/agent-skills.git"
  version: "1.0.0"
  keywords: "content-writing, blog-article, copywriting, draft, article, image-suggestions"
allowed-tools:
  - "*"
---

# Content Writer

Step 3 of the content-marketing stack. Turn an outline or a keyword brief into a finished article plus an image suggestion table.

Slash command: `/content-writer`. Trigger word: "write".

## When to use

- "Write a blog post about X"
- "Turn this outline into an article"
- "Draft an article on this keyword"

## When not to use

- Researching the topic: use `content-researcher`
- Scoring the result: use `content-auditor`
- Running the full produce-and-publish flow: use `marketing-pipeline`

---

## Steps

| # | Step | Mode |
|---|------|------|
| 1 | Determine the input: a full outline, or keyword + location + angle | ASK if incomplete |
| 2 | If there is no outline, build a working one | AUTO |
| 3 | Load the wording rules, pick a voice | AUTO |
| 4 | Write the article | AUTO |
| 5 | Build the image suggestion table | AUTO |
| 6 | Save `article.md` | AUTO |
| 7 | Strip AI-trace marks with `fix-marks.py` | AUTO |

### Step 1 - Input (ASK if incomplete)

Two valid inputs:

- A full outline (heading tree). Write straight from it.
- Keyword + location + angle. Enough to build an outline and write.

If neither is complete, ask once for what is missing. For an outline backed by real research, point the user to `content-researcher`.

### Step 2 - Working outline (AUTO)

With only a keyword brief, draft a quick heading tree first. This does not replace `content-researcher`; it just gives the article a spine.

### Step 3 - Rules and voice (AUTO)

Load the wording rules. They are shared with `content-auditor`, so what you write matches what gets scored:

1. `../content-auditor/references/wording-language-rules/common.md`
2. `locales/common.md` and `locales/<locale>.md`
3. `topics/common.md` and `topics/<topic>.md`

Infer the locale from the location, the topic from the keyword. Pick a voice from [`references/style.md`](references/style.md): the one the user named, else Helpful expert.

### Step 4 - Write (AUTO)

Write the article in Markdown, following every wording rule and the chosen voice. Before saving, the draft MUST pass this checklist. These are the deterministic checks `content-auditor` runs, so a draft that meets them clears the gate without rework:

- The keyword is in the H1 title and within the first 100 words.
- 3 to 8 content H2 sections. The image-suggestions heading from step 5 counts as one more, so the auditor sees 4 to 9.
- 800 to 2500 words.
- Average sentence 22 words or fewer; average paragraph 70 words or fewer; no paragraph over 110 words.
- At least 3 links.
- Every factual or statistical claim names a source.

Mark image spots inline: `[IMAGE: short description]`.

### Step 5 - Image suggestion table (AUTO)

After the article, add this table. One row per spot a visual earns its place: a step, data, a comparison, a screenshot. Skip decorative-only images.

```markdown
## Image and visualization suggestions

| Section | Why a visual helps | Suggested visual |
|---------|--------------------|------------------|
| <H2 name> | <what the visual makes clearer> | <chart, diagram, screenshot, photo> |
```

### Step 6 - Save (AUTO)

Save the article and its image table to `article.md`.

### Step 7 - Strip AI-trace marks (AUTO)

Before returning the article, run the bundled cleaner over the saved file:

```bash
python3 -B scripts/fix-marks.py article.md
```

It rewrites the file in place, swapping em dashes, smart quotes, and other marks that signal AI authorship for plain keyboard characters. It is deterministic and runs once. Then tell the user the article is ready and the next step is `content-auditor` to score it.

## Files

| Path | Use |
|------|-----|
| `scripts/fix-marks.py` | Strip AI-trace marks from the finished article (bundled from refine-prose) |
| `references/style.md` | Voice presets |
