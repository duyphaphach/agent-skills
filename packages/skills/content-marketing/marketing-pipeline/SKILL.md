---
name: marketing-pipeline
description: 'Run the full content-marketing pipeline end to end. Chains content-researcher, content-writer, and content-auditor with sub-agents to produce a publish-ready article plus social-media versions, then publishes to WordPress, Facebook, or LinkedIn. Use whenever the user wants the whole flow rather than one step - e.g. "run the content pipeline for this keyword", "produce a publish-ready article on X", "research write and publish a post about X", "publish this article". Part of the content-marketing skill stack. Keywords: pipeline, content pipeline, produce, publish, end to end, marketing automation, WordPress, Facebook, LinkedIn.'
license: MIT
metadata:
  author: "alexpham"
  repository: "git@github.com:duyphaphach/agent-skills.git"
  version: "1.0.0"
  keywords: "content-pipeline, marketing-automation, produce, publish, orchestration, wordpress, facebook, linkedin"
allowed-tools:
  - "*"
---

# Marketing Pipeline

The orchestrator of the content-marketing stack. Runs the other three skills end to end, then publishes.

Slash command: `/marketing-pipeline`. Trigger words: "pipeline", "produce", "publish".

## Two pipelines

| Pipeline | Does | Run it for |
|----------|------|-----------|
| **content-producer** | Research, write, audit, revise into a publish-ready article plus social posts | "produce an article on X", "run the pipeline" |
| **content-publisher** | Pick a channel, check credentials, publish | "publish this article" |

Run `content-producer` then `content-publisher` for the whole flow, or `content-publisher` alone on an article you already have.

## Sub-agents

Each stage runs as a **sub-agent** so its token-heavy work stays out of the main thread. Only the main agent spawns sub-agents - sub-agents cannot spawn their own. This skill must be run by the main agent.

Each sub-agent is told to apply one sibling skill by reading that skill's `SKILL.md`:

- `../content-researcher/SKILL.md`
- `../content-writer/SKILL.md`
- `../content-auditor/SKILL.md`

---

## Pipeline 1 - content-producer

### Required outputs (hard requirement)

Every run writes a fresh folder, `pipeline-runs/<date>-<keyword-slug>/`, and MUST produce all six files below, each non-empty. The run is not complete until every one exists. Stage 9 enforces this with `check-outputs.mjs`; a run that fails that check has failed, no matter how good the article is.

| File | Contents |
|------|----------|
| `01-research-result.md` | All 20 researched articles, each with its rating and a one-line reason |
| `02-research-picks.md` | The 5 best articles picked from the 20, and why each won |
| `03-outlines.md` | The 5 outlines built from the picks |
| `04-picked-outline.md` | The single outline chosen to write |
| `05-audit-rounds.md` | Every audit round: the outline audits, the first article audit, and each revision re-audit, each with its score and Good/Bad findings |
| `06-final-products.md` | The final article, and below it the social-media versions |

Write each file the moment its stage produces the content, not in a batch at the end. `05-audit-rounds.md` is appended to across the run, once per audit round.

### Stages

| # | Stage | Runs as | Mode | Output |
|---|-------|---------|------|--------|
| 1 | Collect keyword, location, angle | main agent | ASK if missing | header of `01` |
| 2 | Research: rate 20 articles, pick 5, outline each | sub-agent (`content-researcher`) | AUTO | `01`, `02`, `03` |
| 3 | Audit the 5 outlines, score each | sub-agent (`content-auditor`) | AUTO | `05` (outline round) |
| 4 | Pick one outline | main agent | ASK | `04-picked-outline.md` |
| 5 | Write the article | sub-agent (`content-writer`) | AUTO | draft for `06` |
| 6 | Audit the article, gate at 80 | sub-agent (`content-auditor`) | AUTO, GATE | `05` (article round) |
| 7 | If the gate fails, revise and re-audit | sub-agents | AUTO, max 2 rounds | `05` (each round) |
| 8 | Write the final article and social versions | main agent | AUTO | `06-final-products.md` |
| 9 | Verify all six outputs exist | main agent | AUTO, GATE | `check-outputs.mjs` |
| 10 | Approve the result | main agent | ASK | - |

### Gate and revise loop (stages 6-7)

The auditor's `score.mjs` gates at 80. On a fail:

- Rounds 1 and 2: spawn `content-writer` to fix the Bad items the audit listed, then re-audit. Append each round to `05-audit-rounds.md`.
- Still failing after 2 rounds: stop and show the user the audit. Do not loop further; let the user decide.

### Output gate (stage 9)

Before declaring the run done, verify the six required files:

```bash
node scripts/check-outputs.mjs pipeline-runs/<date>-<keyword-slug>
```

It exits non-zero if any required file is missing or empty.

### Social versions (stage 8)

`06-final-products.md` holds the full website article, then the short social posts for Facebook and LinkedIn: a hook, a one-line summary, and a placeholder for the article link. A feed post is not a full article; keep the social versions short.

### Approval (stage 10)

Show the user `06-final-products.md` and the final score from `05-audit-rounds.md`. Get an explicit approve before any publishing.

---

## Pipeline 2 - content-publisher

| # | Step | Mode |
|---|------|------|
| 1 | Ask which channel: WordPress, Facebook, or LinkedIn | ASK |
| 2 | Check the channel's credentials | AUTO |
| 3 | If any are missing, ask the user and save what they give | ASK only if missing |
| 4 | Prepare the channel-correct file | AUTO |
| 5 | Publish | AUTO |

### Step 2-3 - Credentials

Credentials are stored once and reused. `publish.mjs` loads them from `~/marketing-pipeline/.credentials`; an environment variable already set wins over the file. Variable names per channel are in [`references/publishing.md`](references/publishing.md).

Check the channel with a dry run:

```bash
node scripts/publish.mjs <channel> <file> --dry-run
```

If it reports missing variables, ask the user for them, then save them with `credentials.mjs` so they are not asked again. Pass `KEY=VALUE` on stdin, never as arguments (arguments show up in the process list):

```bash
node scripts/credentials.mjs set <<'EOF'
FB_PAGE_ID=...
FB_PAGE_TOKEN=...
EOF
```

The credentials file sits in the user's home directory, outside the repo, owner-only. Never put a credential in a tracked file.

### Step 4 - Channel-correct file

- WordPress: the full article. Convert `article.md` to HTML and publish that.
- Facebook / LinkedIn: the matching `social-*.txt` promo post, not the full article.

### Step 5 - Publish

```bash
node scripts/publish.mjs <wordpress|facebook|linkedin> <file> --title "..." --status draft
```

Default to `--status draft` unless the user asked to go live. Report the result, including the post URL or ID the API returns.

---

## Files

| Path | Use |
|------|-----|
| `scripts/check-outputs.mjs` | Gate: verify a run produced all six required outputs |
| `scripts/publish.mjs` | Publish a file to WordPress, Facebook, or LinkedIn |
| `scripts/credentials.mjs` | Save and inspect publishing credentials |
| `references/publishing.md` | Per-channel credentials and setup |
