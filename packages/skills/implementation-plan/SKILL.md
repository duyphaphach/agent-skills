---
name: implementation-plan
description: Generate a structured implementation plan for any feature, integration, or refactor. Produces a phased plan with scope, flow diagram, per-phase file targets, and a testing strategy. Language and framework agnostic.
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

Search for related symbols by concept:

```
Grep: "<feature keyword>" across relevant file types
Glob: "<relevant path pattern>"
```

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

Before drafting phases, surface gaps between what the plan assumes and what the code actually shows. Each concern goes into **§4 Concerns & Open Questions** in the output.

For each concern capture:

- **Assumption vs. reality** — what the plan needs vs. what the code shows
- **Severity** — Blocker (must resolve first) or Design decision (can be deferred)
- **Blocks** — which phase(s) cannot proceed until this is resolved (e.g. "Blocks: Phase 3" or "Affects: Phase 2, Phase 4")

Common concern categories:

| Category | What to look for |
|----------|-----------------|
| Missing abstraction | Plan names a "layer" or "service" that does not exist yet |
| Schema gap | New data must be stored but no column, field, or table exists |
| Data migration / backfill | New column or field requires populating existing rows; ordering, defaults, or downtime windows constrain the rollout |
| No unique identifier | The new integration returns no unique key — deduplication logic will always create new records |
| Legal / compliance | Data fields that may require approval before storage (PII, financial data, etc.) |
| Pre-flight dependency | An out-of-band credential, agreement, or registration must be obtained before the code can be tested |
| Wiring mechanism | Integration requires a specific parameter or URL construction detail that is undocumented |
| Ordering conflict | Two blockers are independent but both must clear before a later phase can run |
| Contract divergence | Existing interface or callback format will change in a way that affects callers |

---

## Step 3 — Write the plan

Output a Markdown document with the sections below, in order. Save it to `docs/plans/<feature-name>-plan.md` (or the project's standard docs location).

### Writing style — plans are read by humans

Plans are reviewed by engineers, product managers, and operators. Write them as a team document, not as a prompt or transcript from an AI tool.

- **Name actions by their outcome, not by the tool that performs them.** Write "Identify upstream callers of `X`" — not "run `gitnexus_impact(...)`". Write "Review staged changes before commit" — not "run `gitnexus_detect_changes(...)`".
- **No tool-invocation syntax.** No `tool_name({args})` calls, no MCP tool names, no skill IDs, no slash commands in the plan body. If a step needs a concrete command, use a shell command (`git diff --staged`, `grep -r "X"`) or describe the intent ("map direct dependents before editing").
- **No references to "the agent", "the assistant", "Claude", "the LLM", or first-person "I" / "we will".** Use the imperative: "Add a checkbox to…", "Extend the payload with…".
- **Link to code, not to prior conversations or tool outputs.** Use relative links to files with `#L<line>` anchors when citing specific code.
- **If AI assistance was used to author the plan, that belongs in the commit message or PR description — not inside the plan document.**

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

#### §1.2 Flow Overview

One paragraph describing how the feature works end to end. Then include a **mermaid sequence diagram** when the feature involves:

- Multiple systems or services communicating
- User-visible redirects or multi-step interactions
- Branching logic based on input (e.g., different providers, different user types)

Always use a `sequenceDiagram` for this section — it captures request/response order between participants. Label participants by role, not implementation detail (e.g., "Browser", "Auth Provider", not "CurlHelper").

Skip the diagram when the feature is a single-file change or a config update with no multi-system interaction.

#### §1.3 UX Changes — Before & After

Include this subsection when the feature changes any user-facing surface (URL routes, UI components, modal contents, form layouts, screens, emails). Omit when the feature is server-only with no user-visible output change (internal refactor, background job, data-format migration with no UI surface).

Compare the state **before** to the state **after**, in that order.

Terms used below:

- **Surface** — any user-visible artefact (page, modal, email, route, config key, error message)
- **Pane** — one fenced wireframe block representing one surface in one state (Before or After)
- **Frame** — Excalidraw's term for a containing rectangle on its canvas; in Wire DSL the equivalent is a top-level `screen`

##### §1.3.1 Required contents

- **Screen-level surfaces use a wireframe DSL** — for any modal, form, page, screen, or email whose layout or content changes, depict Before and After with a wireframe DSL block (one fenced block per state). DSL is preferred over prose tables because it renders as an actual visual mockup, so reviewers see the change instead of reconstructing it from descriptions. Keep snippets focused on the diffed region — a full screen is fine for a small page, but for a large dashboard show only the affected section.
  - **Default tool: Wire DSL** (` ```wire ` blocks). Use it unless the user explicitly asks for the alternative.
  - **Alternative: Excalidraw** (` ```excalidraw ` blocks or linked `.excalidraw` files). Pick this when the user requests it or when the change is sketch-like (annotations, arrows, free-form callouts) rather than a structured component layout.
  - **Syntax lives in a sibling skill.** This plan only declares the choice and embeds the snippet — the chosen wireframing skill (Wire DSL or Excalidraw) owns the grammar. Before drafting §1.3, confirm one such skill is available in the project; if neither is, fall back to the table form below for that surface and note the gap.
- **Narrow comparisons stay as tables** — for surfaces that have no spatial layout (URL route renames, config keys, email subject lines, API field renames), use a two-column `Before` / `After` table. Don't force these into a wireframe DSL.
- **Hybrid surfaces — split between the two formats.** When a single surface has both spatial and non-spatial deltas (e.g., an email whose subject line *and* body layout both change), use a wireframe block for the spatial part (the body) and a table immediately below it for the layoutless part (subject, sender, headers). Don't force one tool to cover both.
- **Before user flow diagram** — a mermaid user flow diagram depicting today's actual user journey (operator action → user action → completion). Use `subgraph` to group steps by actor so the diagram reads left-to-right as a timeline. The Before flow must reflect verified current behavior, not an idealized version. Required whenever §1.3 is included, even when §1.2's `sequenceDiagram` is skipped.
- **After user flow diagram** — a mermaid user flow diagram depicting the new user journey. Mirror the same actor groupings as the Before diagram so readers can visually diff the two.
- **Key deltas** — a numbered list summarizing what actually changed between Before and After. One line per delta (URL rename, new form field, new email block, etc.). Reference each delta by its step number from §1.3.2 below.

##### §1.3.2 Wireframe authoring rules

A4-portrait constraints — apply to whichever tool is chosen.

- **Vertical layout, top-to-bottom only.** The plan renders inside a document column (≈A4 portrait, ~600px usable). Both the §1.3 layout itself (panes stacked top-to-bottom, never side-by-side) and the contents of each pane (stacked sections, no sidebar+main horizontal split) flow vertically. Use a horizontal split inside a pane only when the horizontal relationship *is* the change being documented, and even then keep the secondary pane narrow. In Wire DSL the outer container is `layout stack(direction: vertical, gap: …, padding: …)`; in Excalidraw, frames stack inside a portrait-aspect canvas.
- **Step-numbered panes.** Every pane gets its own step number in the order a reader walks through it. For a single surface this is two panes: `### 1. Before — <surface>`, `### 2. After — <surface>`. For a multi-screen flow (operator modal → email → user form → completion), every screen is its own numbered pane in flow order — Before set first, After set second. The pane's step number must appear in three places so they round-trip cleanly: (a) the markdown heading (`### 2. After — DocumentRequired`), (b) the frame/screen identifier inside the wireframe block (`screen Step2_DocumentRequiredAfter { … }` — `Step<N>_` prefix is mandatory, not illustrative), and (c) the §1.3.1 key-deltas list (each delta cites the step it belongs to, e.g., *"Step 2: response textarea added"*).
- **Grids stay narrow.** At most two columns on narrow surfaces (a stat-card row uses one-up or two-up cells, not four-up). Anything wider becomes unreadable in print.
- **Vocabulary parity across Before and After.** Don't render the same field as a single-line input in one and a multi-line textarea in the other unless the type itself is the change.
- **Mark new items inline.** Add a trailing `// new` comment on the component so the delta is scannable without reading both blocks.
- **Optional: save renderable wireframes** to `docs/wireframes/<feature-name>/<surface>.<ext>` (`.wire` for Wire DSL, `.excalidraw` for Excalidraw) and link them from the plan. Inline blocks are still required in the plan body — links are additive, for stakeholders who want to open the file in the native tool.

---

### §2 Current State

*Snapshot as of <date>.*

#### §2.1 What is already in place

| Component | Status |
|-----------|--------|
| `<ClassName / function / file>` | Done / Exists / Partial |

#### §2.2 Status per work item

| # | Item | Key / Selector | Status |
|---|------|----------------|--------|
| 1 | ... | `key` | ✅ Done |
| 2 | ... | `key` | ⬜ Not started |

---

### §3 Per-item Reference

One `###` per new item (provider, endpoint, feature flag, etc.) with a quick-reference table:

```markdown
### <Item Name>

| Field | Value |
|-------|-------|
| Key / Selector | `value` |
| Adapter / Class | `ClassName` |
| Key data fields | `field1`, `field2` |
| Unique identifier returned | Yes / No — describe |
| Special requirements | None / describe |
| Use case | One sentence |
```

Omit this section when the feature adds only one item *and* §6 phases already name that item by its key/selector — duplicating the fields here adds no information.

---

### §4 Concerns & Open Questions

> Reviewed <date>. These must be resolved before or during implementation.

One `###` per concern, labelled `C1`, `C2`, etc. Use the field structure from Step 2 above (Assumption vs. reality, Severity, Blocks).

If none found: *"No concerns identified."*

---

### §5 Special Cases

One `###` per special case that does not fit neatly into a phase:

- **Schema change** — a migration is required before data can be stored
- **UI gate** — a UI component must exist before the flow can be wired
- **Legal gate** — approval must be obtained before the feature can go live
- **External credential** — a certificate, key, or agreement must be in place
- **Protocol quirk** — a non-standard flow step required by the integration

**Legal gate** and **External credential** entries here typically require a corresponding row in §8.1 Pre-flight; cross-reference both sides so the gate appears exactly once on each.

Omit this section if there are no special cases.

---

### §6 Implementation Phases

#### Phase ordering principles

Order phases by dependency, not by perceived importance:

1. **Config and schema first** — later phases depend on these being in place
2. **Core logic before consumers** — build the engine before wiring it to entry points
3. **Integration before polish** — get the end-to-end flow working before docs, admin, or observability
4. **Independent phases can be parallelized** — note this explicitly when two phases have no dependency
5. **Refactors split into extract → adapt callers → delete old**, in that order. Combining "extract new" and "delete old" into one phase removes the rollback point.

State ordering dependencies explicitly at the top of any phase that depends on a prior one: *"Requires: Phase 1 complete."*

Each phase must name the actual files and methods/functions it changes. Vague descriptions ("extend the X layer", "update the auth service") are not acceptable — the **Files** list and the **Details** bullets together must identify exactly *which symbol* in *which file* is being changed.

#### Phase template

One `###` per phase:

```markdown
### Phase N — <Title>

> Requires: Phase M complete. (omit if no dependency)

**Files**

- [`path/to/file`](../path/to/file)

**Objective**

One sentence.

**Details**

- Bullet list of what changes and why

**Cross-refs** (omit if none apply)

- Implements §3 item: `<item-name>`
- Closes §4 concern: `C<n>`

**Example** (include when the change is non-obvious — see rule below)

\`\`\`<language>
// Concrete example — not pseudocode
\`\`\`

**Checklist**

- [ ] Task 1
- [ ] Task 2
```

**Example block — include when** the change introduces a new pattern, data shape, or API contract; involves non-trivial logic (branching, normalization, deduplication); or the reviewer would otherwise need external docs to understand the intent. **Omit when** the change is a trivial config addition, doc-only, or mirrors an existing pattern already visible in the codebase.

---

### §7 Testing Strategy

Define how the implementation will be verified. Organize tests from narrowest scope to widest.

#### §7.1 Unit / adapter-level (optional)

What to test in isolation — individual functions, helpers, adapters, or service methods. Specify:

- Inputs and expected outputs for the happy path
- Edge cases (empty input, missing fields, malformed data)
- Error conditions (network failure, invalid credentials, timeout)

#### §7.2 Integration / flow-level (optional)

End-to-end verification of the feature flow. Specify:

- The exact steps to trigger the flow (which endpoint, what payload, what user action)
- What to observe at each step (redirects, stored data, returned values)
- How to verify the final output matches the contract

#### §7.3 Regression

Existing behavior that must not break. Specify:

- Which existing flows to re-test after the change
- What "still works" looks like for each

#### §7.4 Failure and edge cases

Abnormal conditions to test explicitly:

- Missing or invalid input
- External service unavailable or returning errors
- Partial completion (e.g., user abandons mid-flow)
- Duplicate submissions

For each, state the expected behavior (error message, graceful fallback, safe redirect — not a crash or data corruption).

---

### §8 Verification Gates

Three gates ordered by timing — before code starts (§8.1), during QA (§8.2), before release (§8.3).

#### §8.1 Pre-flight

Out-of-band requirements independent of code changes (credentials, agreements, registrations, legal approvals). Items here block §6 phases from starting; cross-reference any concern in §4 that names the same blocker.

| Item | Requirement | Status |
|------|------------|--------|
| `<name>` | `<what must happen>` | ⬜ / ✅ / Blocker |

Mark ✅ for items already satisfied. Mark **Blocker** for items that must complete before implementation can proceed. If nothing is required, write: *"No pre-flight requirements."*

#### §8.2 Test-environment run-through

Numbered list: how to run a complete flow in the test/staging environment. Should exercise the integration path validated in §7.2.

#### §8.3 Production gate

Bulleted list: what must pass before the feature goes live (final §7 results, §4 concerns closed, §8.1 items ✅).

---

## Step 4 — Self-check before delivering

Mark each item ✅ if satisfied, ⬜ if not yet, **N/A** if the item's conditional doesn't apply (e.g., §1.3 box on a server-only feature, §1.2 box on a single-file refactor). N/A items pass; only ⬜ items block delivery.

- [ ] §4 addresses every gap found in Step 2 (even if the answer is "no concerns")
- [ ] Every concern in §4 names which phase(s) it blocks
- [ ] Every phase names the exact files and methods it touches, with relative links (per §6 — no vague "extend the X layer")
- [ ] Phase ordering dependencies are stated explicitly
- [ ] Each §6 phase that implements a §3 item or closes a §4 concern records it under **Cross-refs** in the phase template
- [ ] Example blocks follow the include/omit rule at the bottom of §6
- [ ] §7 Testing Strategy covers unit, integration, regression, and failure cases
- [ ] §8.1 Pre-flight table marks already-completed items as ✅ (not all ⬜); every §5 Legal-gate / External-credential entry has a matching §8.1 row
- [ ] §1.2 uses a `sequenceDiagram` if the feature spans multiple systems; **N/A** if single-file
- [ ] §1.3 UX Changes is included when user-facing surfaces change, and complies with §1.3.1 / §1.3.2; **N/A** for server-only features
- [ ] Every `§N.M` reference in the body resolves to an existing heading (no orphan refs from the renumber)
- [ ] Save path declared once at the start of Step 3 and referenced — not restated — at Deliver
- [ ] No agent/tool traces in the plan (per Step 3 "Writing style")

---

## Deliver

1. Save the plan to the path defined at the start of Step 3.
2. Give the user: the file path, a summary of concerns found (C-count and severity, per §4), and the phase count (per §6).
3. Ask the user to confirm the concern list before implementation begins.
