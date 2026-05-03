---
name: implementation-plan
description: Generate a structured implementation plan for any feature, integration, or refactor. Produces a phased plan with scope, diagrams, per-phase file targets, and a testing strategy. Also produces a compact stakeholder variant on request (PM / tech-lead share-out — no concerns section, no agent-facing checklists). Language and framework agnostic.
allowed-tools:
  - "*"
---

# Implementation Plan Generator

Produce a structured implementation plan document. Language, framework, and project agnostic.

## When to use

- Starting a new integration (API, provider, service, etc.)
- Introducing a new data flow across multiple files or layers
- Refactoring that touches routing, config, or shared models
- Any work where phases, file-level targets, and a test strategy need to be agreed on before coding starts

## Inputs

Accept the feature description from any of:

- The user's message
- A related doc, ticket, or spec the user references
- A currently open file in the IDE

Ask the user if the intent is ambiguous.

---

## Step 1 — Research the codebase

Before writing the plan, explore the codebase to ground every phase in real files and real code. Adapt the tools used to the project (GitNexus MCP if available, otherwise Grep/Glob/Read).

### 1a. Locate the entry point and core files

Find the primary entry point for the feature area (controller action, route handler, CLI command, etc.) and read it.

### 1b. Trace the data flow

Map how data moves through the system for the feature area. Identify:

- Entry points (HTTP handlers, CLI commands, queue consumers, event listeners)
- Intermediate transforms (services, helpers, middleware, mappers)
- Storage destinations (database writes, cache updates, file outputs, API calls)
- Exit points (responses, callbacks, redirects, published events)

### 1c. Identify existing abstractions

Find existing patterns the codebase already uses for similar work — interfaces, base classes, service layers, adapters. Note whether the plan should reuse, extend, or intentionally bypass each one, and why.

### 1d. Check the persistence surface

Read the relevant model, schema, or migration files to understand what data is already persisted and whether new columns, fields, tables, or indices are needed.

### 1e. Check the test harness

Find existing test files, fixtures, or harness views. Note what can be reused vs. what must be added.

---

## Step 2 — Identify concerns before writing the plan

Before drafting phases, surface gaps between what the plan assumes and what the code actually shows. Each concern goes into **§2 Concerns & Open Questions** in the output.

§2 holds two related kinds of items, both written with the same template: **open questions** the plan needs answered, and **resolved design decisions** that are non-obvious or counter-intuitive enough to warrant recording (so a future reader doesn't re-litigate them). For each, capture:

- **Assumption vs. reality** — what the plan needs vs. what the code shows
- **Why it matters** — the consequence of leaving the gap unresolved (broken contract, data loss, blocked rollout, compliance exposure, etc.). Without this, reviewers can't tell if the item is load-bearing or cosmetic.
- **Code references** — relative links with `#L<line>` anchors to the files that ground this concern (the symbol, schema, route, or call site under discussion). Anchor every claim in real code; if no code exists yet, link the closest neighbor and say so.
- **Options to consider** — a short bulleted list of the paths the team could take, each with its trade-off (cost, risk, reversibility) so the decision is auditable. For resolved items, mark the chosen option `→ chosen` and note in one line why the others were rejected.
- **Severity** — Blocker (must resolve first), Design decision (can be deferred), or Design decision _(resolved)_ with the chosen path inline
- **Blocks** — which phase(s) cannot proceed until this is resolved (e.g. "Blocks: Phase 3" or "Affects: Phase 2, Phase 4"); use "None — recorded for future reference" for already-resolved items

Common concern categories:

| Category                 | What to look for                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Missing abstraction      | Plan names a "layer" or "service" that does not exist yet                                                                      |
| Schema gap / migration   | New data must be stored but no column, field, or table exists; or new column needs backfill with ordering/downtime constraints |
| No unique identifier     | The new integration returns no unique key — deduplication logic will always create new records                                 |
| Legal / compliance gate  | Data fields require approval before storage (PII, financial data); legal sign-off needed before going live                     |
| External credential      | An out-of-band cert, API key, agreement, or registration must be obtained before the code can be tested                        |
| UI gate                  | A UI component or partial must exist before the flow can be wired, or must render correctly under more than one layout         |
| Wiring / protocol detail | Integration requires a specific parameter, URL construction, non-standard flow step, or signature scheme that is undocumented  |
| Ordering conflict        | Two blockers are independent but both must clear before a later phase can run                                                  |
| Contract divergence      | Existing interface, callback shape, event taxonomy, or webhook payload will change in a way that affects callers               |

---

## Step 3 — Write the plan

Output a Markdown document with the sections below, in order. Save it to `docs/plans/<feature-name>-plan.md` (or the project's standard docs location).

### Writing style — plans are read by humans

Plans are reviewed by engineers, product managers, and operators. Write them as a team document, not as a prompt or transcript from an AI tool.

- **Name actions by their outcome, not by the tool that performs them.** Write "Identify upstream callers of `X`" — not "run `gitnexus_impact(...)`". Write "Review staged changes before commit" — not "run `gitnexus_detect_changes(...)`".
- **No tool-invocation syntax.** No `tool_name({args})` calls, no MCP tool names, no skill IDs, no slash commands in the plan body. If a step needs a concrete command, use a shell command (`git diff --staged`, `grep -r "X"`) or describe the intent ("map direct dependents before editing").
- **No references to "the agent", "the assistant", "Claude", "the LLM", or first-person "I" / "we will".** Use the imperative: "Add a checkbox to…", "Extend the payload with…".
- **Link to code, not to prior conversations or tool outputs.** Use relative links to files with `#L<line>` anchors when citing specific code.
- **Don't paraphrase what a diagram, table, or code sample already shows.** If §1.2 or §1.3 carries a sequence diagram, don't transcribe its steps in prose underneath. Captions and key-deltas lists call out _what changed and why_ — they aren't a line-by-line restatement of every arrow. Same rule applies to per-task code samples in §3: the artefact carries the facts, the prose carries the rationale.

A reader picking up the plan six months from now should not be able to tell whether a human or a tool wrote it.

---

### Document header

```markdown
# <Feature Name> — <Short Description>

> **Tracker:** <issue/ticket link or ID>

---
```

Omit tracker line if no ticket exists. The plan must be self-contained — do not link out to "related docs" or sibling plans from the header. If context from another doc is load-bearing, restate it inline in §1 or §2 instead of pointing the reader off-page.

---

### §1 Scope of Work

Three subsections.

#### §1.1 Objectives

Numbered list of concrete deliverables. Each item should be verifiable — not "improve auth" but "add Signicat as an authentication provider for BankID Norway and Sweden."

#### §1.2 Implementation Overview

A mermaid `sequenceDiagram` showing where in the code each step of the flow happens — controllers, services, models, external systems. Label participants by **implementation class or service** (`IndividualController`, `DocumentController`, `AmlSelfDeclarationService`, `ClientAnswers`, `Webhook receiver`) so engineers can map each arrow to a concrete file. This is the implementer's reference; the role-level abstracted view belongs in §1.3.

Show post-completion side-effects (compliance log writes, webhook delivery, operator email) as their own arrows to distinct participants — not collapsed into a single arrow back to the operator.

This diagram is a **delta view at the implementation level** — color-highlight only the code paths that change, and abstract the rest. §1.3 reuses the same conventions at the role level; the rules below apply to both diagrams.

- **Color regions** with `rect rgb(...)` blocks:
  - Added — `rect rgb(220, 245, 220)` (green tint)
  - Modified — `rect rgb(255, 245, 200)` (yellow tint)
  - Removed — `rect rgb(255, 220, 220)` (red tint), with the message label wrapped in `~~ ~~`
- **Color legend** — one line directly under the diagram when more than one color is used: `> 🟢 added · 🟡 modified · 🔴 removed`.
- **Collapse unchanged steps** into a single `Note over <participant>: <summary> (unchanged)`. Don't redraw stable behavior — name it once and move on.
- **Key deltas** — a numbered list under the diagram summarizing each highlighted region in the order it appears (one line per delta: new call, changed signature, removed step, etc.).
- **One diagram, not two.** No Before/After side-by-side — colors carry the delta inside a single timeline.
- **Keep it printable.** Plans render inside a document column (≈A4 portrait, ~600px usable). If the diagram needs horizontal scrolling, split it into two scoped diagrams (one per surface) rather than going wide.

If the feature is purely additive (no existing flow being modified), the whole diagram is implicitly "added" — omit the rects and the legend.

Skip for single-file or config-only changes.

#### §1.3 UX Changes

Include this subsection when the feature changes any user-facing interaction (URL routes, UI components, modal contents, form layouts, screens, emails, sent messages, notifications). Omit when the feature is server-only with no user-visible output change (internal refactor, background job, data-format migration with no UI surface).

Reuse the diagram conventions from §1.2 (palette, legend, collapse, key deltas, one-diagram-only, printable). The rules below add only what's specific to UX-level diagrams.

- **One mermaid `sequenceDiagram`** covering the user-facing flow end-to-end.
- **Label participants by role**, not implementation detail (`User`, `Browser`, `Auth Provider`, `Server` — not `CurlHelper`). Where §1.2 names the actual classes, §1.3 abstracts to roles so reviewers focus on what's different from the user's perspective, not the call graph.
- **Non-interaction renames stay as tables** — for URL route renames, config keys, email subject lines, or API field renames that have no interaction component, add a two-column `Before` / `After` table below the diagram instead of stretching the diagram to cover them.
- **No spatial mockups in this section.** Pixel-level layouts belong in design tooling, not in the implementation plan.

### §2 Concerns & Open Questions

> Reviewed <date>. Open items must be resolved before or during implementation; resolved design decisions are recorded so future readers don't re-open them.

One `###` per item, labelled `C1`, `C2`, etc. Use the field structure defined in Step 2 above. This section holds both open questions and **resolved design decisions** that are non-obvious — protocol quirks the plan keeps as-is, contract divergences the plan accepts, schema migrations the plan requires, legal/credential gates the plan depends on. If a resolved decision later affects review (a reviewer asks "why isn't X unified with Y?" or "does this need legal sign-off?"), it should be findable here. Note which phase each item gates.

If none found: _"No concerns identified."_

---

### §3 Implementation Phases

#### Phase ordering principles

Order phases by dependency, not by perceived importance:

1. **Config and schema first** — later phases depend on these being in place
2. **Core logic before consumers** — build the engine before wiring it to entry points
3. **Integration before polish** — get the end-to-end flow working before docs, admin, or observability
4. **Independent phases can be parallelized** — note this explicitly when two phases have no dependency
5. **Refactors split into extract → adapt callers → delete old**, in that order. Combining "extract new" and "delete old" into one phase removes the rollback point.

State ordering dependencies explicitly at the top of any phase that depends on a prior one: _"Requires: Phase 1 complete."_

Each phase must name the actual files and methods/functions it changes. Vague descriptions ("extend the X layer", "update the auth service") are not acceptable — the **Files** list and the **Details** items together must identify exactly _which symbol_ in _which file_ is being changed.

#### Phase template

One `###` per phase:

````markdown
### Phase N — <Title>

> Requires: Phase M complete. (omit if no dependency)

#### Files

- [`path/to/file`](../path/to/file)

#### Objective

One sentence. If the phase has multiple distinct objectives, use a numbered list — one objective per line, in the order they apply:

1. First objective.
2. Second objective.

#### Details

A numbered checklist of the work in this phase. Each task names what changes and why and carries a stable per-phase ID via the `**N.**` prefix so concerns, code reviews, and PR descriptions can cite tasks as `Phase <P>, task <N>`. Most tasks stand alone as a checkbox line — add a fenced code sample only when the task pins down an interface or structure that multiple call sites must agree on.

- [ ] **1.** <Task 1 — what changes and why>
- [ ] **2.** <Task 2 — what changes and why>
- [ ] **3.** <Task 3 — defines a new interface or shared structure that downstream tasks depend on>

  ```<language>
  // path/to/file — <function or section>
  // ... existing code ...
  <new or modified lines that callers must match>
  // ... existing code ...
  ```

- [ ] **4.** <Task 4 — what changes and why>
````

**Per-task code sample — include only when** the task pins down an interface, contract, or shared structure that multiple call sites must agree on (a new function signature, a callback shape, a payload schema, a base class). The sample exists to lock the contract so reviewers and downstream task implementers don't drift. **Omit by default** — for routine edits, single-call-site changes, trivial config, or anything where reading the resulting code makes the intent obvious. No sample is the norm; a sample is the exception.

---

### §4 Testing Strategy

Define how the implementation will be verified. Organize tests from narrowest scope to widest.

#### §4.1 Unit / adapter-level (optional)

What to test in isolation — individual functions, helpers, adapters, or service methods. Specify:

- Inputs and expected outputs for the happy path
- Edge cases (empty input, missing fields, malformed data)
- Error conditions (network failure, invalid credentials, timeout)

#### §4.2 Integration / flow-level (optional)

End-to-end verification of the feature flow. Specify:

- The exact steps to trigger the flow (which endpoint, what payload, what user action)
- What to observe at each step (redirects, stored data, returned values)
- How to verify the final output matches the contract

#### §4.3 Regression

Existing behavior that must not break. Specify:

- Which existing flows to re-test after the change
- What "still works" looks like for each

#### §4.4 Failure and edge cases

Abnormal conditions to test explicitly:

- Missing or invalid input
- External service unavailable or returning errors
- Partial completion (e.g., user abandons mid-flow)
- Duplicate submissions

For each, state the expected behavior (error message, graceful fallback, safe redirect — not a crash or data corruption).

---

## Step 4 — Self-check before delivering

Mark each item ✅ if satisfied, ⬜ if not yet, **N/A** if the item's conditional doesn't apply (e.g., §1.3 box on a server-only feature, §1.2 box on a single-file refactor). N/A items pass; only ⬜ items block delivery.

- [ ] §2 addresses every gap found in Step 2 (even if the answer is "no concerns")
- [ ] Every concern in §2 carries the full field set from Step 2 — including **Why it matters**, **Code references** (with `#L<line>` anchors), and **Options to consider** with trade-offs
- [ ] Every concern in §2 names which phase(s) it blocks
- [ ] Every phase names the exact files and methods it touches, with relative links (per §3 — no vague "extend the X layer")
- [ ] Phase ordering dependencies are stated explicitly
- [ ] Per-task code samples in §3 follow the include/omit rule at the bottom of §3
- [ ] §4 Testing Strategy covers unit, integration, regression, and failure cases
- [ ] §1.2 uses a `sequenceDiagram` if the feature spans multiple systems, and color-highlights the changed code paths using the palette defined in §1.2; **N/A** if single-file or purely additive
- [ ] §1.3 UX Changes is included when user-facing surfaces change and reuses §1.2's diagram conventions (palette, legend, collapse, key deltas, one-diagram-only, printable); **N/A** for server-only features
- [ ] Every `§N.M` reference in the body resolves to an existing heading (no orphan refs)
- [ ] Save path declared once at the start of Step 3 and referenced — not restated — at Deliver
- [ ] No agent/tool traces in the plan (per Step 3 "Writing style")

---

## Step 5 — Compact variant for stakeholders (on request)

Trigger when the user asks for a "compact plan", "PM version", "tech-lead summary", "share-out version", or similar. Audience is **project managers and tech leads** — the document reads as a project artifact, not an execution checklist.

Steps 1 and 2 are unchanged: research the codebase and surface concerns. The difference is that **concerns are resolved in conversation with the user and folded into the relevant §1 narrative or phase summary** — the compact document itself has no §2 section.

### Compact output structure

Reuse Step 3's heading template, writing-style rules, and diagram conventions. Only the differences below apply:

| Section in full plan | Compact treatment |
| --- | --- |
| §1.1 / §1.2 / §1.3 | Unchanged. Diagrams and key deltas serve both PMs (UX) and tech leads (sequence). |
| §2 Concerns | **Omit.** Resolutions live inline in §1 or the affected phase summary. |
| §3 Implementation Phases → §2 in compact | Renumber. Keep the per-phase template intact — title, `Requires:` line, **Files**, **Objective**, **Details** — but raise the granularity:<br>• **Files** may group by directory or module (`src/auth/providers/` — 3 files) rather than listing every path, when the count is high enough that a flat list adds noise.<br>• **Details** is a short bulleted list of 3–7 headline work items per phase, each one line. **Drop** the `- [ ]` checkboxes, the `**N.**` task IDs, and all per-task code samples — those are execution-tracking artifacts, not stakeholder content. |
| §4 Testing Strategy → §3 in compact | Renumber. **Content unchanged** — render identically to the full plan, including all four sub-headings and their specific test cases. Testing Strategy is the verification contract; both audiences need it at the same fidelity. |

Phase numbers (`Phase 1`, `Phase 2`, …) stay stable so cross-references survive between the full and compact documents.

### Save path

Save to `docs/plans/<feature-name>-plan-compact.md` alongside the full plan when one exists. Both files coexist — engineers reference the full plan, stakeholders reference the compact one.

### Compact self-check

Use Step 4's checks for the sections that do appear, plus:

- [ ] No §2 Concerns section in the document
- [ ] Per-phase template is intact (Files, Objective, Details) but Details is a short bulleted list — no checkboxes, no `**N.**` task IDs, no per-task code samples
- [ ] §3 Testing Strategy renders identically to §4 of the full plan (same sub-headings, same specific test cases) when both files exist
- [ ] Section numbering reflects the dropped §2 (§2 = Phases, §3 = Testing); phase numbers unchanged

---

## Editing an existing plan

Applies whenever the user asks for changes to a plan that already exists on disk (full, compact, or both). Read the file before editing — don't regenerate from memory.

### Sync the compact with the full plan

If both `<feature-name>-plan.md` and `<feature-name>-plan-compact.md` exist, treat them as one document with two views. Any edit that changes scope (objectives, diagrams, phase order/dependencies, files, testing approach, headline phase work) MUST be propagated to both files in the same response. Edits that only touch full-plan-only detail — per-task `**N.**` items, per-task code samples, §2 concern entries — don't need a compact update.

At Deliver, state which files were touched, e.g. _"Updated `…-plan.md` only — per-task detail; compact view unchanged."_ vs. _"Updated both files in lockstep."_

### Double-check for stale references and structural harmony

Before declaring an edit done:

- Re-run Step 4's `§N.M` reference check — renumbering, merging, or splitting sections during an edit is the usual breakage source. Walk every `Requires: Phase M` line and every "Phase N, task K" pointer too.
- New prose matches the document's existing voice and bullet/table conventions; no new heading style, bullet style, or table format introduced just for the added content.
- New rules don't restate ones already defined elsewhere in the document — reference the existing source instead of duplicating.

`grep -nE "§|Phase |Requires:" <plan-file>` catches most stale refs in one pass.

---

## Deliver

1. Save the plan(s) to the path(s) defined in Step 3 — and Step 5 if a compact variant was requested.
2. Give the user: the file path(s), a summary of concerns found (C-count and severity, per §2), and the phase count.
3. Ask the user to confirm the concern list before implementation begins. Skip if the output is compact-only — those concerns were resolved in conversation per Step 5.
