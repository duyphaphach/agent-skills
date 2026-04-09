---
name: repo-overview
description: Quickly understand an unfamiliar repository, monorepo, or microservice codebase at a high level. Use when the user asks things like "explain repo", "overview repo", "understand this repo", "map this codebase",...
---

# Repo High Level

Use this skill to orient on a new codebase fast and return a compact summary.

## Goal

Produce a short, high-signal summary of the repo shape.

Default output is a short table, but the table format should adapt to the repo type.

- For a single repo or monolith, a table like `repo-name | main purpose | tech stack brief` is often enough.
- For a monorepo, a table like `package/service | role | stack` may be better.
- For a folder of sibling repos, `repo-name | purpose | stack` is usually best.
- For microservices, `service | responsibility | stack` may be better.

Let the agent decide:

- what unit to summarize
- which columns are most useful
- how much repo traversal is needed
- whether shared libraries deserve rows

## Working Style

- Start by identifying the repo shape from the strongest available signals.
- Prefer manifests, workspace config, deploy config, and top-level README before deeper code reads.
- Read just enough code to confirm purpose when filenames and docs are not sufficient.
- Choose the smallest useful granularity:
  - whole app for monoliths
  - deployable apps/services for monorepos
  - sibling repos for a repo folder
  - shared libs only when they materially improve the summary
- Prefer certainty over completeness. If unclear, use `Unknown` instead of guessing.

## Output Rules

- Output a short table first.
- Keep cells short, max 50 characters.
- Use names exactly as found in the filesystem or manifest when possible.
- Keep stack labels compact, for example: `Node.js, NestJS`, `Python, Flask`, `Java, Spring Boot`.
- Add a brief note after the table only when needed to explain missing pieces or uncertainty.
