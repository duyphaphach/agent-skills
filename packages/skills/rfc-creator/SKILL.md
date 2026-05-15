---
name: rfc-creator
description: Pick and fill the right proposal/decision doc — RFC, ADR, Design Doc, 1-pager. Keywords: rfc, adr, design doc, decision record, proposal, propose, capture decision, architecture decision.
license: MIT
metadata:
  author: "alexpham"
  repository: "git@github.com:duyphaphach/agent-skills.git"
  version: "1.0.0"
  keywords: "ai, agent, skill, rfc, adr, design-doc, proposal, decision-record"
allowed-tools:
  - "*"
---

# RFC Creator

Pick the right document format for a proposal or decision, then write it. Covers the ladder: 1-pager, ADR, Design Doc, RFC. Pairs with [`implementation-plan`](../implementation-plan/SKILL.md) when the build sequence also needs to be captured.

## When to use

- "Write an RFC for X", "draft an ADR", "design doc for Y"
- "We need to capture this decision", "let's document why we picked X over Y"
- "Propose a change to the API/architecture/process"
- Any request that boils down to: align stakeholders before code is written, or record a decision after it is made

## When not to use

- The user wants a build sequence (phases, file targets, test gates). Use [`implementation-plan`](../implementation-plan/SKILL.md) instead.
- The change fits in one PR with an obvious commit message. Skip the ladder.
- The user is exploring an idea conversationally and has not asked for a document. Refine the idea first ([`idea-refine`](../../skills/idea-refine/SKILL.md) if available) before drafting.

---

## Step 1, classify the request and pick a format

Walk this in order. Stop at the first match. State the pick and the trace back to the user before writing anything.

### Signals to gather

Ask the user only if a signal is missing AND it changes the format pick. Do not interrogate.

| Signal | Why it matters |
| --- | --- |
| Decision status | Already made (ADR) vs. still open (RFC / Design Doc / 1-Pager) |
| Audience | One team (Design Doc), cross-team (RFC), future engineers (ADR) |
| Reversibility | Hard to reverse pushes toward RFC; easy pushes toward 1-Pager |
| Scope | One file (commit msg), one feature (Design Doc), one initiative (RFC), multi-quarter (RFC suite) |
| Alternatives weighed | If real options exist, format must record them (ADR, RFC) |

### Format ladder

| Tier | Format | Best when |
| --- | --- | --- |
| 0 | Commit message / inline comment | Self-explanatory; the why fits in a sentence |
| 1 | 1-Pager / Tech Note | Small idea, single team, no real alternatives |
| 2 | Spike doc | Time-boxed exploration; reports findings, not a decision |
| 3 | ADR (Architecture Decision Record) | One decision, trade-offs worth recording for the future |
| 4 | Design Doc | Single team, feature-scale, needs alignment but not formal vote |
| 5 | RFC | Cross-team or hard-to-reverse; alternatives matter; needs explicit approval |
| 6 | Implementation Plan | Phased build sequence (delegates to [`implementation-plan`](../implementation-plan/SKILL.md)) |
| 7 | RFC + Implementation Plan, paired | Big feature: one for what/why, one for how/when |
| 8 | Multi-RFC suite | Multi-quarter initiative; sub-RFCs per component plus umbrella |

### Decision shortcut

1. Self-explanatory in code? Tier 0.
2. Time-boxed exploration with no decision yet? Tier 2 (Spike).
3. One decision worth recording? Tier 3 (ADR).
4. Single team, feature design, no real disagreement? Tier 4 (Design Doc).
5. Cross-team or hard-to-reverse, alternatives exist? Tier 5 (RFC).
6. Multi-phase build with sequencing? Tier 6 (delegate to `implementation-plan`).
7. Multi-quarter, multiple components? Tier 7 or 8.

### Suggest, then confirm

Output the pick in this shape:

```text
Suggested format: <Tier N — Name>
Why: <one sentence trace through the signals>
Alternatives considered: <one or two adjacent tiers and why they were rejected>
Proceed? (y / pick another)
```

If the user picks differently, switch and continue. Do not argue past one back-and-forth.

---

## Step 2, research before writing

Skip for Tier 0 and Tier 1. For everything else, ground the document in real code, real constraints, real prior art. Use GitNexus MCP tools when available; otherwise Grep / Glob / Read.

### 2a. Locate the surface area

Identify the files, modules, services, or schemas the proposal touches. For a new system, identify the closest existing analogue and the integration points.

### 2b. Find prior decisions

Search for existing ADRs, RFCs, design docs in `docs/`, `rfcs/`, `adr/`, `decisions/`. A new proposal that contradicts a prior one MUST cite and address the prior decision.

### 2c. Trace the affected flows

For changes that touch a code path, map entry → transforms → exits. Note which existing abstractions the proposal reuses, extends, or bypasses (and why).

### 2d. Identify constraints

External constraints that bound the proposal: SLAs, compliance (PII, GDPR), cost ceilings, deadlines, deprecations, vendor lock-in, on-call coverage. Each becomes a line in the relevant section (Drawbacks, Security, Privacy, Rollout).

### 2e. Surface the real alternatives

For Tier 3 and above, list the alternatives the team would actually consider, not strawmen. "Do nothing" is always one of them. Each gets a one-line rejection rationale in the document.

---

## Step 3, write the document

Save to the project's standard location (search `docs/`, `rfcs/`, `adr/` for the pattern; default to `docs/rfcs/<NNNN>-<slug>.md` for RFCs, `docs/adr/<NNNN>-<slug>.md` for ADRs, `docs/design/<slug>.md` for design docs).

### Writing style

These rules apply to every format below.

- **Plain English over jargon.** Industry terms ("blast radius", "bounded context", "outbox", "strangler-fig") still count as jargon. Try the plain version first; keep the term only if it is clearly the best fit, and gloss it inline once.
- **Glossary table** for any document that uses three or more technical terms a stakeholder might not know. Place it near the bottom.
- **No AI-trace marks.** No em-dashes (use commas, colons, parentheses, or " - "). No smart quotes, no curly punctuation, no odd unicode spaces.
- **No tool-invocation syntax.** No `tool_name({args})` calls, no MCP tool names, no skill IDs in the document body. Use shell commands or describe intent.
- **No first-person.** No "I propose", "we will", "the agent". Use the imperative or the passive ("This RFC proposes…", "The system stores…").
- **Link to code, not to chat.** Use relative links to files, with `#L<line>` anchors when citing a specific spot.
- **No paraphrasing diagrams.** If a sequence diagram or table carries the facts, the prose carries the rationale only.
- **Self-contained.** Do not link out to "related docs" from the header. If outside context is load-bearing, restate it inline.

A reader picking up the document six months from now should not be able to tell whether a human or an AI wrote it.

### Document header (all formats)

```markdown
# <Format>: <Title>

> **Status:** Draft | Under Review | Accepted | Rejected | Superseded
> **Author(s):** <names>
> **Created:** <YYYY-MM-DD>
> **Updated:** <YYYY-MM-DD>
> **Related:** <prior ADR/RFC numbers, tickets, or "none">
```

Add `Number:` for ADRs and RFCs that use sequential IDs. Omit `Related:` if there are no relations (do not write "none, n/a"; just leave the line out).

---

### Format templates

Pick the section block that matches the format chosen in Step 1. Each block is the full structure to write; do not invent extra sections.

#### Tier 1, 1-Pager

```markdown
## Problem
<2-4 sentences. What is broken or missing today.>

## Proposal
<3-6 sentences. What to do, in concrete terms.>

## Why this approach
<2-3 bullets. The reasoning that beats the obvious alternative.>

## Risks
<Bulleted list. One line per risk.>

## Ask
<What you need from the reader: approval, review, a decision by date X.>
```

#### Tier 3, ADR (Michael Nygard format)

```markdown
## Context
<What is the situation that forced a decision? Constraints, prior decisions, observed pain.>

## Decision
<The choice made, in one paragraph. Active voice.>

## Consequences
### Positive
- <…>
### Negative
- <…>
### Neutral
- <…>

## Alternatives Considered
### <Alternative A>
<One paragraph. Why rejected.>
### <Alternative B>
<One paragraph. Why rejected.>
```

#### Tier 4, Design Doc

```markdown
## Summary
## Goals
## Non-Goals
## Background
## Proposed Design
### Overview
### Detailed Design
### Data Model
### API / Interface
## Alternatives Considered
## Risks and Mitigations
## Testing Approach
## Open Questions
```

#### Tier 5, RFC (full)

```markdown
## Summary
## Motivation
## Goals
## Non-Goals
## Proposal
## Detailed Design
## Alternatives Considered
## Drawbacks
## Security Considerations
## Privacy Considerations
## Backwards Compatibility
## Rollout Plan
## Testing Strategy
## Open Questions
## References
```

Trim sections that genuinely do not apply. Mark each trimmed section with `_Not applicable: <one-line reason>_` rather than deleting it; this proves the section was considered, not forgotten.

---

## Step 4, link to siblings when warranted

- **RFC + Implementation Plan pair (Tier 7).** After delivering the RFC, ask the user if they want the matching plan generated via `implementation-plan`. State that the RFC captures what/why, the plan captures how/when, and the two will cross-link.
- **Supersedes / superseded by.** If the new document replaces an existing decision, update both: the old document gets `Status: Superseded by <new doc>`, the new gets `Related: Supersedes <old doc>`.

---

## Step 5, self-check before delivering

Mark each item ✅ if satisfied, ⬜ if not, **N/A** if the item's conditional does not apply. N/A passes; only ⬜ blocks delivery.

- [ ] Format pick was stated to the user with the trace, and the user did not ask for a different one
- [ ] All sections of the chosen template are present, or marked `_Not applicable: <reason>_`
- [ ] At least two real alternatives are listed and rejected with a one-line rationale (Tier 3 and above)
- [ ] Every claim about the codebase has a relative file link, with `#L<line>` when citing a spot
- [ ] No em-dashes, no smart quotes, no first-person, no tool-invocation syntax
- [ ] Glossary table present if the document uses three or more terms a stakeholder might not know
- [ ] Header carries Status, Author(s), Created, Updated, Related (if any)
- [ ] Save path follows the project convention found in Step 2 (or the documented default)
- [ ] If this document supersedes a prior one, the prior one was updated in the same response
- [ ] Document is self-contained; no "see related doc" pointers in the header

---

## Deliver

1. Save the document to the path chosen in Step 3.
2. Report to the user: the format picked, the file path, the count of open questions / alternatives recorded, and any superseded documents updated.
3. If the format has a natural sibling (Implementation Plan), ask whether to generate it next.

---

## Glossary

| Term | Meaning |
| --- | --- |
| ADR | Architecture Decision Record. Short note: context, decision, consequences. |
| RFC | Request for Comments. Proposal circulated for feedback and approval. |
| Design Doc | Single-team feature design, lighter than an RFC. |
| Implementation Plan | Phased build sequence with file targets, tests, and gates. |
| Spike | Time-boxed investigation to reduce uncertainty before committing. |
| Supersedes | A new document replaces a prior one; both are updated to point at each other. |
