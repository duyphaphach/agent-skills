# implementation-plan — Test Cases

Test inputs for evaluating whether the skill produces a coherent, complete plan. Each case names a feature scenario, the sections that should be present, the sections that should be omitted, and concrete pass/fail criteria.

Evaluators should read [`../SKILL.md`](../SKILL.md), pick a case, simulate or generate the plan, and report against the criteria.

---

## Case 1 — UI-only refactor (server unchanged)

**Scenario.** A SaaS team is renaming the "Settings" page to "Workspace settings", reorganizing three existing fields into two grouped fieldsets, and adding inline validation hints. No new endpoints. No schema change.

**Expected sections present.**
- §1 Scope (Objectives, Flow Overview, **§1.3 UX Changes — Before & After**)
- §2 Current State
- §6 Implementation Phases (markup + SCSS + JS phases)
- §7 Testing Strategy (regression-heavy)

**Expected sections omitted.**
- §1.2 sequenceDiagram (single-system change)
- §3 Per-item Reference (no new providers/flags)
- §5 Special Cases (none apply)
- §8.1 Pre-flight items table (write *"No pre-flight requirements."*)

**Pass criteria.**
1. §1.3.1 includes wireframe DSL Before/After snippets, **not** a prose table.
2. §1.3.2 vertical-stack rule is honored — no side-by-side panes, no horizontal `split` layouts inside a pane.
3. Panes are step-numbered and the heading number matches the frame ID inside each block.
4. Both a Before user-flow diagram and an After user-flow diagram are present.
5. Self-check checklist resolves all items relevant to a UI-only change (no false-positive checks for §1.2 sequenceDiagram or §3).

---

## Case 2 — Multi-system integration (3rd-party auth provider)

**Scenario.** Add Signicat as an OIDC authentication provider for BankID (Norway + Sweden). Browser → app → Signicat → app callback → session. Requires a client cert, an agreement with the provider, and a new `auth_provider` field on `users`.

**Expected sections present.**
- §1 Scope (all three subsections including §1.2 sequenceDiagram)
- §2 Current State
- §3 Per-item Reference (Signicat NO + Signicat SE = two items)
- §4 Concerns & Open Questions (schema gap, pre-flight cert, contract divergence likely)
- §5 Special Cases (External credential, possibly Schema change)
- §6 Implementation Phases
- §7 Testing Strategy
- §8 Verification Gates (all three subsections populated)

**Pass criteria.**
1. §1.2 has a `sequenceDiagram` labelling participants by role (Browser, Auth Provider, App), not implementation class.
2. §4 concerns each name which §6 phase(s) they block (uses field structure from Step 2).
3. §3 has two `###` entries (one per BankID country) with the field table from the template.
4. §6 phases follow the dependency principle — schema/config phases precede consumer phases; "Requires: Phase N complete" is stated where applicable.
5. §8.1 is a real table (not "No pre-flight requirements") and includes the certificate item with status.
6. Cross-reference works both ways: at least one §4 concern points to an §8.1 row, and at least one §6 phase cites the §3 item it implements.
7. No tool-invocation syntax, no `gitnexus_*` references, no first-person "we will".

---

## Case 3 — Pure server refactor (no UI)

**Scenario.** Extract a 600-line `OrderService::process` method into a strategy-pattern hierarchy (`StandardOrderProcessor`, `SubscriptionOrderProcessor`, `BulkOrderProcessor`). Behavior unchanged — pure refactor for testability.

**Expected sections present.**
- §1.1 Objectives, §1.2 Flow Overview (probably no diagram — single subsystem)
- §2 Current State
- §6 Implementation Phases
- §7 Testing Strategy (regression-dominant)

**Expected sections omitted.**
- §1.3 UX Changes (server-only, no user-visible output change — the rule explicitly calls this out)
- §1.2 sequenceDiagram (single-file domain)
- §3 Per-item Reference
- §5 Special Cases
- §8.1 Pre-flight (likely "No pre-flight requirements")

**Pass criteria.**
1. §1.3 is correctly **omitted** — the omit rule for server-only features is honored.
2. §7.3 Regression is the dominant test category, with named existing flows to re-test.
3. §6 phases extract → adapt callers → delete old method, in that dependency order.
4. Self-check does not flag a missing §1.3 wireframe.

---

## Case 4 — Schema migration with downstream UI change

**Scenario.** Add a `gdpr_consent_version` column to `users`, backfill existing rows, expose a banner on the user dashboard if the version is stale, and require re-consent. The banner replaces the existing "Welcome back" hero card on first login of the day.

**Expected sections present.**
- All sections — this case exercises the full template.

**Pass criteria.**
1. §5 Special Cases includes both **Schema change** and **Legal gate** entries.
2. §6 phases place the migration before the UI phase ("Requires: Phase 1 complete" annotation visible).
3. §1.3 wireframes show the dashboard Before (hero card) and After (consent banner) as two step-numbered panes.
4. §4 surfaces at least one concern about backfill ordering or stale-row handling.
5. §8.1 includes the legal-approval row marked as a Blocker.
6. §3 Per-item Reference has at least one row for `gdpr_consent_version` describing key/selector/use case.
7. Self-check confirms all renumbered cross-refs (§2/§3/§4) are coherent — no stale "§2 Concerns" references anywhere.

---

## Cross-cutting checks (all cases)

These apply regardless of which case is run:

- **Path consistency.** The plan saves to `docs/plans/<feature-name>-plan.md`; the path is declared once in Step 3 and referenced (not restated) in Deliver.
- **No duplication of guidance.** Concern fields defined once (Step 2), referenced from §4. Wireframe rules defined in §1.3.2, not restated in self-check.
- **No orphan references.** Every `§N.M` mentioned in body or self-check resolves to an existing heading.
- **Self-contained.** No "see related doc" links in the document header.
- **Tool-trace hygiene.** No `tool_name({...})`, no MCP tool names, no first-person, no "the assistant".
