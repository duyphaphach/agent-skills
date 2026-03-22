# Architecture for Ekotek Agent Skills Repository

A living document for understanding how this repository is structured and how its parts fit together. Update as the codebase evolves.

## Project Structure

```
./
├── manifest.json                       # Source of truth — global config, keywords, skills array
├── packages/
│   ├── skills/
│   │   ├── index.json                  # Generated — agent-skills-discovery RFC index
│   │   └── <skill-name>/
│   │       ├── SKILL.md                # Entry point — frontmatter + instructions + reference index
│   │       ├── references/             # Detailed reference docs (API guides, guidelines, etc.)
│   │       ├── scripts/                # Helper scripts for the skill
│   │       └── assets/                 # Static assets (CSS, images, etc.)
│   └── tools/                          # Shared tool packages and helpers
├── scripts/
│   ├── sync-skills.js                  # Syncs manifest.json → plugin files, marketplace, index.json, README
│   └── add-skill.js                    # Scaffolds a new skill directory with SKILL.md
├── .claude-plugin/
│   ├── plugin.json                     # Generated — Claude Code plugin manifest
│   ├── plugin.schema.json              # JSON Schema for Claude Code plugin.json validation
│   └── marketplace.json                # Claude Code marketplace (single plugin entry)
├── .cursor-plugin/
│   ├── plugin.json                     # Generated — Cursor plugin manifest
│   └── plugin.schema.json              # JSON Schema for Cursor plugin.json validation
├── .github/
│   ├── workflows/validate-and-sync.yml # CI — validate skills, validate plugins, sync on main
│   └── CONTRIBUTING.md                 # Contribution guidelines
├── CLAUDE.md                           # Project instructions for Claude Code
├── AGENTS.md                           # Project instructions for other AI coding agents
├── README.md                           # Public-facing documentation
└── LICENSE                             # MIT
```

## Data Flow

```
manifest.json ──────────────────────────────────────► SKILL.md (writes author + repository)
      │                                                  │
      │                                    reads frontmatter
      │                                                  │
      ▼                                                  ▼
  sync-skills.js ──updates──► manifest.json (preserves global fields, updates skills array)
        │
        ├──generates──► .claude-plugin/plugin.json      (from manifest global fields + keywords)
        ├──generates──► .claude-plugin/marketplace.json  (single plugin entry)
        ├──generates──► .cursor-plugin/plugin.json      (from manifest global fields + keywords)
        ├──generates──► packages/skills/index.json      (agent-skills-discovery RFC index)
        └──generates──► README.md                       (updates skills table)
```

### What lives where

| Data | Source of truth | Flows to |
|------|----------------|----------|
| Plugin name, description, author, homepage, repo, license | `manifest.json` (global fields) | Both plugin.json files, marketplace.json |
| Plugin keywords | `manifest.json` → `keywords` | Both plugin.json files, marketplace.json |
| Author, repository | `manifest.json` (global fields) | `SKILL.md` → `metadata.author`, `metadata.repository` |
| Skill name, description, version, license | `SKILL.md` frontmatter | `manifest.json` → `skills[]`, `packages/skills/index.json` |
| Skill keywords | `SKILL.md` → `metadata.keywords` | `manifest.json` → `skills[].keywords` |
| Skill file listing | Filesystem (skill directory contents) | `packages/skills/index.json` → `skills[].files` |
| Plugin version | `manifest.json` → `version` | Both plugin.json files, marketplace.json |
| Skill version | `SKILL.md` → `metadata.version` | `manifest.json` → `skills[].version` |

## CI/CD Pipeline

**Workflow:** `.github/workflows/validate-and-sync.yml`

**Triggers:** Changes to `packages/skills/**`, `packages/tools/**`, `manifest.json`, `.claude-plugin/**`, `.cursor-plugin/**` on `main` or PRs to `main`.

```
detect-changes
    ├──► validate-skills (matrix per changed skill, uses Flash-Brew-Digital/validate-skill@v1)
    ├──► validate-plugins (ajv against JSON schemas, only if plugin files changed)
    └──► sync (runs on main only, after both validation jobs pass or are skipped)
              ├── node scripts/sync-skills.js
              └── auto-commit generated files
```

The `sync` job uses `always() && !failure() && !cancelled()` so that skipped validation jobs (e.g. no plugin files changed) don't block it.

## Scripts

| Script | Purpose | Reads | Writes |
|--------|---------|-------|--------|
| `sync-skills.js` | Discover skills from `packages/skills/*/SKILL.md`, update manifest and generated files | `SKILL.md` frontmatter, `manifest.json` | `manifest.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/plugin.json`, `packages/skills/index.json`, `README.md` |
| `add-skill.js` | Scaffold a new skill | `manifest.json` | `packages/skills/<name>/SKILL.md`, then calls `sync-skills.js` |

## Platform Differences

| Field | Claude Code | Cursor |
|-------|-------------|--------|
| `logo` | Not supported | Supported |
| `rules` | Not supported | Supported |
| `lspServers` | Supported | Not documented |
| `outputStyles` | Supported | Not documented |

Both platforms support: `name`, `description`, `version`, `author`, `homepage`, `repository`, `license`, `keywords`, `skills`, `commands`, `agents`, `hooks`, `mcpServers`.

## Project Identification

- **Project:** Ekotek Agent Skills
- **Repository:** <https://github.com/ekotek/agent-skills>
- **License:** MIT
