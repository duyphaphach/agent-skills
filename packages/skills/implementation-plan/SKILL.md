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

Before drafting phases, surface gaps between what the plan assumes and what the code actually shows. Each concern goes into **§2 Concerns & Open Questions** in the output.

For each concern state:

- What the plan assumes
- What the code actually shows
- Whether it is a **Blocker** (must resolve first) or a **Design decision** (can be deferred)
- Which phase(s) this concern blocks or affects — e.g. "Blocks: Phase 3" or "Affects: Phase 2, Phase 4"

Common concern categories:

| Category | What to look for |
|----------|-----------------|
| Missing abstraction | Plan names a "layer" or "service" that does not exist yet |
| Schema gap | New data must be stored but no column, field, or table exists |
| No unique identifier | The new integration returns no unique key — deduplication logic will always create new records |
| Legal / compliance | Data fields that may require approval before storage (PII, financial data, etc.) |
| Pre-flight dependency | An out-of-band credential, agreement, or registration must be obtained before the code can be tested |
| Wiring mechanism | Integration requires a specific parameter or URL construction detail that is undocumented |
| Ordering conflict | Two blockers are independent but both must clear before a later phase can run |
| Contract divergence | Existing interface or callback format will change in a way that affects callers |

---

## Step 3 — Write the plan

Output a Markdown document with the sections below, in order. Save it to `docs/<feature-name>-plan.md` (or the project's standard docs location).

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

> **Related docs:**
> - [<related-doc>](<path>) — <one-line summary>
>
> **Tracker:** <issue/ticket link or ID>

---
```

Omit tracker line if no ticket exists.

---

### §1 Scope of Work

Three subsections:

#### §1.1 Objectives

Numbered list of concrete deliverables. Each item should be verifiable — not "improve auth" but "add Signicat as an authentication provider for BankID Norway and Sweden."

#### §1.2 Flow Overview

One paragraph describing how the feature works end to end. Then include a **flow diagram** when the feature involves:

- Multiple systems or services communicating
- User-visible redirects or multi-step interactions
- Branching logic based on input (e.g., different providers, different user types)

Use mermaid sequence diagrams for request/response flows between systems. Use flowcharts for internal decision logic. Label the participants by role, not implementation detail (e.g., "Browser", "Auth Provider", not "CurlHelper").

Skip the diagram when the feature is a single-file change or a config update with no multi-system interaction.

#### §1.3 What does NOT change

One paragraph or bullet list stating what existing behavior is explicitly preserved. This gives reviewers confidence about blast radius.

#### §1.4 UX Changes — Before & After

Include this subsection when the feature changes any user-facing surface: URL routes, UI components, modal contents, form layouts, screens, emails, or any other output a human sees. Compare the state **before** to the state **after**, in that order.

Required contents when included:

- **Per-surface comparison** — one table per affected surface (URL route, operator modal, end-user page, email, etc.) with `Before` and `After` columns. Keep rows short and scannable; mark any newly-introduced items explicitly.
- **Before flow diagram** — a mermaid flowchart depicting today's actual user journey (operator action → user action → completion). Use `subgraph` to group steps by actor so the diagram reads left-to-right as a timeline. The Before flow must reflect verified current behavior, not an idealized version.
- **After flow diagram** — a mermaid flowchart depicting the new user journey. Mirror the same actor groupings as the Before diagram so readers can visually diff the two.
- **Key deltas** — a numbered list summarizing what actually changed between Before and After. One line per delta (URL rename, new form field, new email block, etc.).

Omit this subsection when the feature is server-only with no user-visible output change (internal refactor, background job, data-format migration with no UI surface).

---

### §2 Concerns & Open Questions

> Reviewed <date>. These must be resolved before or during implementation.

One `###` per concern, labelled `C1`, `C2`, etc. Each must include:

- **Assumption vs. reality** — what the plan needs vs. what the code shows
- **Severity** — Blocker or Design decision
- **Blocks** — which phase(s) cannot proceed until this is resolved

If none found: *"No concerns identified."*

---

### §3 Current State

*Snapshot as of <date>.*

#### §3.1 What is already in place

| Component | Status |
|-----------|--------|
| `<ClassName / function / file>` | Done / Exists / Partial |

#### §3.2 Status per work item

| # | Item | Key / Selector | Status |
|---|------|----------------|--------|
| 1 | ... | `key` | ✅ Done |
| 2 | ... | `key` | ⬜ Not started |

---

### §4 Special Cases

One `###` per special case that does not fit neatly into a phase:

- **Schema change** — a migration is required before data can be stored
- **UI gate** — a UI component must exist before the flow can be wired
- **Legal gate** — approval must be obtained before the feature can go live
- **External credential** — a certificate, key, or agreement must be in place
- **Protocol quirk** — a non-standard flow step required by the integration

Omit this section if there are no special cases.

---

### §5 Implementation Phases

#### Phase ordering principles

Order phases by dependency, not by perceived importance:

1. **Config and schema first** — later phases depend on these being in place
2. **Core logic before consumers** — build the engine before wiring it to entry points
3. **Integration before polish** — get the end-to-end flow working before docs, admin, or observability
4. **Independent phases can be parallelized** — note this explicitly when two phases have no dependency

State ordering dependencies explicitly at the top of any phase that depends on a prior one: *"Requires: Phase 1 complete."*

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

**Example** (include when the change is non-obvious)

\`\`\`<language>
// Concrete example — not pseudocode
\`\`\`

**Checklist**

- [ ] Task 1
- [ ] Task 2
```

**When to include an Example block:**

- The change introduces a new pattern, data shape, or API contract
- The change involves non-trivial logic (branching, normalization, deduplication)
- The reviewer would otherwise need to read external docs to understand the intent

**When to omit:**

- The change is a straightforward config addition or string replacement
- The change is documentation-only
- The change mirrors an existing pattern already visible in the codebase

---

### §6 Testing Strategy

Define how the implementation will be verified. Organize tests from narrowest scope to widest.

#### §6.1 Unit / adapter-level (optional)

What to test in isolation — individual functions, helpers, adapters, or service methods. Specify:

- Inputs and expected outputs for the happy path
- Edge cases (empty input, missing fields, malformed data)
- Error conditions (network failure, invalid credentials, timeout)

#### §6.2 Integration / flow-level (optional)

End-to-end verification of the feature flow. Specify:

- The exact steps to trigger the flow (which endpoint, what payload, what user action)
- What to observe at each step (redirects, stored data, returned values)
- How to verify the final output matches the contract

#### §6.3 Regression

Existing behavior that must not break. Specify:

- Which existing flows to re-test after the change
- What "still works" looks like for each

#### §6.4 Failure and edge cases

Abnormal conditions to test explicitly:

- Missing or invalid input
- External service unavailable or returning errors
- Partial completion (e.g., user abandons mid-flow)
- Duplicate submissions

For each, state the expected behavior (error message, graceful fallback, safe redirect — not a crash or data corruption).

---

### §7 Per-item Reference

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

Omit this section if the feature has only one item and §5 already covers it fully.

---

### §8 Pre-flight Checklist

Out-of-band requirements independent of code changes (credentials, agreements, registrations, legal approvals).

| Item | Requirement | Status |
|------|------------|--------|
| `<name>` | `<what must happen>` | ⬜ / ✅ |

Rules:

- Mark ✅ for items already satisfied.
- Mark **Blocker** for items that must complete before implementation can proceed.
- If nothing is required, write: *"No pre-flight requirements."*

#### Test environment steps

Numbered list: how to run a complete flow in the test/staging environment.

#### Production gate items

Bulleted list: what must pass before the feature goes live.

---

## Step 4 — Self-check before delivering

- [ ] §2 addresses every gap found in Step 2 (even if the answer is "no concerns")
- [ ] Every concern in §2 names which phase(s) it blocks
- [ ] Every phase names the exact files it touches, with relative links
- [ ] Phase ordering dependencies are stated explicitly
- [ ] Example code is concrete where included — no pseudocode, no `// TODO: implement`
- [ ] Example code is omitted where the change is trivial or mirrors existing patterns
- [ ] §6 Testing Strategy covers unit, integration, regression, and failure cases
- [ ] Pre-flight table marks already-completed items as ✅ (not all ⬜)
- [ ] No phase refers to "extend the X layer" without naming the actual file and method
- [ ] Flow diagram is included if the feature spans multiple systems, omitted if single-file
- [ ] §1.4 UX Changes is included if the feature changes any user-facing surface; when included, it has a per-surface comparison **plus** a Before flow diagram **and** an After flow diagram (both present, not one)
- [ ] No agent/tool traces in the plan — no `tool_name({args})` syntax, no MCP tool names, no references to "the agent" / "the assistant" / "Claude" / "the LLM", no first-person "I" / "we will"
- [ ] Verification steps use human-readable commands (`git diff`, `grep`) or outcome descriptions ("map upstream callers"), never AI-tool invocations

---

## Deliver

1. Save the plan to `docs/<kebab-case-feature-name>-plan.md`
2. Give the user: the file path, a summary of concerns found (C-count and severity), and the phase count
3. Ask the user to confirm the concern list before implementation begins
