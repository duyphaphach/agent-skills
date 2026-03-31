# Ekotek - Agent Skills Repository

## AGENTS.md (Symlink to CLAUDE.md)

This repo contains Ekotek Agent Skills — folders of instructions, references, scripts, and assets that AI agents use to work more accurately. For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Repo Structure

```
manifest.json                   # Root source of truth — global config + skills array
packages/
├── skills/
│   ├── index.json              # Generated — agent-skills-discovery RFC index
│   └── <skill-name>/
│       ├── SKILL.md            # Entry point — frontmatter + overview + reference index
│       ├── references/         # Detailed reference docs (API guides, guidelines, etc.)
│       ├── scripts/            # Helper scripts for the skill
│       └── assets/             # Static assets (CSS, images, etc.)
└── tools/                      # Shared tool packages and helpers
```

## Reference File Conventions

Every file in `references/` must have YAML frontmatter with three fields:

```yaml
---
name: "Human-Readable Title"
description: "One-line summary of the file's contents."
tags: [tag1, tag2, tag3]
---
```

- **name**: Descriptive title (e.g., "Elements API", "Marketplace Guidelines")
- **description**: Single sentence summarizing what the file covers
- **tags**: Array of searchable keywords — include API method names, category terms, and key concepts

### Content style

- Plain markdown only — no JSX components (`<Tabs>`, `<Steps>`, `<Note>`, `<Frame>`, etc.)
- Use fenced code blocks with language identifiers (e.g., ` ```typescript `)
- Use markdown tables for structured data
- Use blockquotes (`>`) for callouts and notes
- End each reference with a "Best Practices" section where applicable
- Keep references focused on one API domain or topic per file

### When adding references from external docs

Source documentation often uses JSX/HTML components. Strip these when converting:

| Source component       | Convert to                                        |
| ---------------------- | ------------------------------------------------- |
| `<Tabs>` / `<Tab>`     | Separate sections with `###` headings             |
| `<Note>` / `<Warning>` | Blockquote (`>`)                                  |
| `<Steps>` / `<Step>`   | Numbered list with `###` sub-headings             |
| `<Accordion>`          | Standard markdown table or section                |
| `<Frame>` / `<img>`    | Remove (image URLs won't resolve in this context) |
| `<Button>` / `<a>`     | Inline markdown link                              |

## SKILL.md Frontmatter

```yaml
---
name: skill-name
description: One-line description used for discovery and matching.
license: MIT
metadata:
  author: "Author Name"
  version: "1.0.0"
  keywords: "ai, agent, skill, keyword1, keyword2"
---
```

The SKILL.md should include:

- Quick start workflow
- Core API patterns with code examples
- Reference Documentation section linking to all files in `references/`
- Scripts and assets
- License information (must be an OSI-approved license)

## Scripts

- `node scripts/add-skill.js <name> "<description>"` — Scaffold a new skill
- `node scripts/sync-skills.js` — Sync manifest.json, platform plugin files, marketplace.json, packages/skills/index.json, and README.md with the packages/skills directory

## Workflow

1. Add or edit reference files in `packages/skills/<name>/references/`
2. Update `SKILL.md` reference links if files were added/removed/renamed
3. Run `node scripts/sync-skills.js` if SKILL.md frontmatter changed (updates manifest.json, platform plugin files, index.json, and README)

## Development

- **Always use conventional commit prefixes** (e.g. `feat:`).
- **Never force push, amend, or rewrite history** unless the user explicitly requests it and confirms. Force pushes can break release tracking and cause data loss.
- **Never push to `main` directly** unless the user explicitly asks. Default to creating a feature branch and opening a PR.

## Resources

[ARCHITECTURE.md](ARCHITECTURE.md): Project Architecture
[CONTRIBUTING.md](.github/CONTRIBUTING.md): Project Contribution Guidelines

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **agent-skills** (290 symbols, 508 relationships, 18 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/agent-skills/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/agent-skills/context` | Codebase overview, check index freshness |
| `gitnexus://repo/agent-skills/clusters` | All functional areas |
| `gitnexus://repo/agent-skills/processes` | All execution flows |
| `gitnexus://repo/agent-skills/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
