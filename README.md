# Ekotek Agent Skills

This repository contains a collection of agent skills for Ekotek. These skills are designed to enhance the capabilities of agents by providing them with specialized functionalities.

## What are Agent Skills?

Agent Skills are folders of instructions, scripts, and resources that agents can discover and use to do things more accurately and efficiently. They work across any AI agent that supports the [open Agent Skills standard](https://agentskills.io).

## Available Skills
<!-- START:Available-Skills -->
| Skill | Description |
| ----- | ----------- |
| [basecamp](./packages/skills/basecamp) | \| |
| [code-review-and-quality](./packages/skills/code-review-and-quality) | Conducts multi-axis code review. Use before merging any change. Use when revi... |
| [e2e-test-design](./packages/skills/e2e-test-design) | Design end-to-end (e2e) test scenarios by exploring a live, running app with ... |
| [frontend-refactoring](./packages/skills/frontend-refactoring) | Use when the user wants to migrate templates to the new design system convent... |
| [html-to-scss-boilerplate](./packages/skills/html-to-scss-boilerplate) | Generate blank SCSS scaffold from HTML structure. Keywords: scss boilerplate,... |
| [implementation-plan](./packages/skills/implementation-plan) | Generate a structured implementation plan for any feature, integration, or re... |
| [mcp-cli](./packages/skills/mcp-cli) | Interface for MCP (Model Context Protocol) servers via CLI. Use when you need... |
| [php-pro](./packages/skills/wordpress/php-pro) | Use when building PHP applications with modern PHP 8.3+ features, Laravel, or... |
| [playwright-cli](./packages/skills/playwright-cli) | Automates browser interactions for web testing, form filling, screenshots, an... |
| [refine-prose](./packages/skills/refine-prose) | Refine writing to plain spoken English and strip AI-trace marks such as em da... |
| [repo-overview](./packages/skills/repo-overview) | Quickly understand an unfamiliar repository, monorepo, or microservice codeba... |
| [rfc-creator](./packages/skills/rfc-creator) | Pick and fill the right proposal or decision doc such as RFC, ADR, Design Doc... |
| [tech-explain](./packages/skills/tech-explain) | Explain unfamiliar technologies with a concise framework. Use when the user a... |
| [wireframe-excalidraw](./packages/skills/wireframe-excalidraw) | Turn a markdown brief, screen description, or feature spec into a hand-drawn-... |
| [wireframe-wire-dsl](./packages/skills/wireframe-wire-dsl) | Turn a markdown brief, screen description, or feature spec into a wire-dsl `.... |
| [wordpress-elementor](./packages/skills/wordpress/wordpress-elementor) | > |
| [wordpress-pro](./packages/skills/wordpress/wordpress-pro) | Develops custom WordPress themes and plugins, creates and registers Gutenberg... |
| [wordpress-router](./packages/skills/wordpress/wordpress-router) | Use when the user asks about WordPress codebases (plugins, themes, block them... |
| [wp-abilities-api](./packages/skills/wordpress/wp-abilities-api) | Use when working with the WordPress Abilities API (wp_register_ability, wp_re... |
| [wp-block-development](./packages/skills/wordpress/wp-block-development) | Use when developing WordPress (Gutenberg) blocks: block.json metadata, regist... |
| [wp-block-themes](./packages/skills/wordpress/wp-block-themes) | Use when developing WordPress block themes: theme.json (global settings/style... |
| [wp-interactivity-api](./packages/skills/wordpress/wp-interactivity-api) | Use when building or debugging WordPress Interactivity API features (data-wp-... |
| [wp-performance](./packages/skills/wordpress/wp-performance) | Use when investigating or improving WordPress performance (backend-only agent... |
| [wp-phpstan](./packages/skills/wordpress/wp-phpstan) | Use when configuring, running, or fixing PHPStan static analysis in WordPress... |
| [wp-playground](./packages/skills/wordpress/wp-playground) | Use for WordPress Playground workflows: fast disposable WP instances in the b... |
| [wp-plugin-development](./packages/skills/wordpress/wp-plugin-development) | Use when developing WordPress plugins: architecture and hooks, activation/dea... |
| [wp-project-triage](./packages/skills/wordpress/wp-project-triage) | Use when you need a deterministic inspection of a WordPress repository (plugi... |
| [wp-rest-api](./packages/skills/wordpress/wp-rest-api) | Use when building, extending, or debugging WordPress REST API endpoints/route... |
| [wp-wpcli-and-ops](./packages/skills/wordpress/wp-wpcli-and-ops) | Use when working with WP-CLI (wp) for WordPress operations: safe search-repla... |
| [wpds](./packages/skills/wordpress/wpds) | Use when building UIs leveraging the WordPress Design System (WPDS) and its c... |
<!-- END:Available-Skills -->

## Installation

### Skills

Use [skills](https://skills.sh/) to install skills directly:

```bash
# Install all skills
npx skills add ekotek/agent-skills

# Install specific skills
npx skills add ekotek/agent-skills --skill test-gen-automation

# List available skills
npx skills add ekotek/agent-skills --list
```

### Claude Code Plugin

Install via Claude Code's plugin system:

```bash
# Add the plugin (includes all skills)
/plugin add ekotek/agent-skills
```

> Claude Code plugins are also supported in Factory's [Droid](https://docs.factory.ai/cli/configuration/plugins#claude-code-compatibility).

### Other Installation Methods

Agent skills can also be installed by using the below commands from [Playbooks](https://playbooks.com/skills) or [Context7](https://context7.com/docs/skills):

```bash
# Playbooks
npx playbooks add skill ekotek/agent-skills

# Context7
npx ctx7 skills install /ekotek/agent-skills
```

## Adding New Skills

Use the included script to add new skills:

```bash
node scripts/add-skill.js <skill-name> "<description>"
```

Example:

```bash
node scripts/add-skill.js test-gen-automation "Add new automation test case to current test set, following project convention"
```

This will create the skill structure and automatically update manifest.json, platform plugin files, packages/skills/index.json, and this README.

## Scripts

| Script | Description |
| ------ | ----------- |
| `node scripts/add-skill.js` | Add a new skill to the repository |
| `node scripts/sync-skills.js` | Sync manifest.json, platform plugin files, packages/skills/index.json, and README with the packages/skills directory |

## Resources

- [Agent Skills Specification](https://agentskills.io/specification)
- [npx skills](https://skills.sh/)
- [Validate Agent Skill](https://github.com/marketplace/actions/validate-skill)
- [Playbooks](https://playbooks.com/skills)
- [Context7 Skills](https://context7.com/docs/skills)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](.github/CONTRIBUTING.md) for more information.

## License

MIT
