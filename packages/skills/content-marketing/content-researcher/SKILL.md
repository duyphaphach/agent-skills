---
name: content-researcher
description: 'Research a topic for a blog article. Given a keyword, a location, and a content angle, it searches the named sources, pulls 20 articles, rates them, and returns the 5 best as ready-to-use outlines with links to the originals. Use whenever the user wants to research a topic before writing, find what competitors rank for, plan what an article should cover, or get outline options - e.g. "research outlines for this keyword", "what should an article on X cover", "find the best articles on X". Part of the content-marketing skill stack. Keywords: research, content research, keyword, competitor analysis, blog outline, content planning.'
license: MIT
metadata:
  author: "alexpham"
  repository: "git@github.com:duyphaphach/agent-skills.git"
  version: "1.0.0"
  keywords: "content-research, keyword-research, competitor-analysis, outline, content-planning, seo"
allowed-tools:
  - "*"
---

# Content Researcher

Step 1 of the content-marketing stack. Turn a keyword into **5 outline options**, each backed by the best articles already ranking for that topic.

Slash command: `/content-researcher`. Trigger word: "research".

## When to use

- "Research outlines for the keyword X"
- "What should a blog post on X cover"
- "Find the best articles on X and plan an article"

## When not to use

- Scoring an outline or article: use `content-auditor`
- Writing the article: use `content-writer`
- Running the whole research-to-publish flow: use `marketing-pipeline`

## Where this sits

```
> content-researcher   5 outlines + links
  content-auditor      scores the outlines
  content-writer       writes the chosen one
  marketing-pipeline   runs all of it, then publishes
```

---

## Steps

`ASK` = stop and ask the user. `AUTO` = run without asking.

| # | Step | Mode |
|---|------|------|
| 1 | Collect keyword, location, angle | ASK if missing |
| 2 | Search the named sources, gather 20 articles | AUTO |
| 3 | Rate all 20 on quality | AUTO |
| 4 | Pick the 5 best; build an outline for each | AUTO |
| 5 | Return the 5 outlines with links | AUTO |

### Step 1 - Inputs (ASK if missing)

Three inputs. If the user already gave one, do not re-ask it. Ask only for what is missing, in one message.

| Input | Meaning |
|-------|---------|
| Keyword | The search term the article targets |
| Location | Region/market for results (local ranking, language) |
| Angle | The framing of the article - see [`references/angles.md`](references/angles.md) |

### Step 2 - Gather 20 articles (AUTO)

Search the sources listed in [`references/sources.md`](references/sources.md), scoped to the location. Collect **20 articles** on the keyword. Record the title and full URL of each.

### Step 3 - Rate all 20 (AUTO)

Rate each article on these signals. Keep a short reason per article so the picks are explainable.

| Signal | Looks for |
|--------|-----------|
| Relevance | Directly answers the keyword's intent |
| Depth | Goes past surface-level, covers sub-topics |
| Credibility | Named author, sources cited, recognized publication |
| Freshness | Recent, or updated; not stale on a fast-moving topic |
| Structure | Clear headings a reader can scan |

### Step 4 - Pick 5 and outline (AUTO)

Take the **5 highest-rated** articles. For each, build one outline. Every outline MUST meet the checks below before it leaves this step. These mirror the criteria `content-auditor` scores deterministically, so a fresh outline clears the gate without rework:

- An H1 title that contains the keyword.
- 4 to 9 H2 sections, and the keyword appears in at least one H2.
- At least 3 H3 sub-points across the outline.
- One named angle from [`references/angles.md`](references/angles.md), stated on an `Angle:` line.
- An `Image plan` block listing which sections need a visual and why.

Make the 5 genuinely different - vary angle, depth, and audience so the marketer has a real choice.

### Step 5 - Return the brief (AUTO)

Save `research-brief.md` in the format below, then tell the user it is ready and the next step is `content-auditor` to score the outlines.

---

## Output format - research-brief.md

```markdown
# Research Brief: <keyword>

- Keyword: <keyword>
- Location: <location>
- Requested angle: <angle, or "open">

## Rated sources (20)

| Rank | Title | URL | Score /5 | Why |
|------|-------|-----|----------|-----|
| 1 | ... | https://... | 4.6 | ... |

## Outlines (from the top 5)

### Outline 1 - <short name> - Angle: <angle>

Based on: <title> - <full URL>

- H1: <title>
  - H2: <section>
    - H3: <sub-point>
- Image plan:
  - <section>: <why a visual helps>

### Outline 2 - ...
(repeat for all 5)
```
