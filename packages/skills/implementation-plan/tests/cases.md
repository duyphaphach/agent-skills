# implementation-plan — Test Cases

Test inputs for evaluating whether the skill produces a coherent, complete plan. Each case names a feature scenario, the sections that should be present, the sections that should be omitted, and concrete pass/fail criteria.

Evaluators should read [`../SKILL.md`](../SKILL.md), pick a case, simulate or generate the plan, and report against the criteria.

---

## Case 1 — UI-only refactor (server unchanged)

**Scenario.** A SaaS team is renaming the "Settings" page to "Workspace settings", reorganizing three existing fields into two grouped fieldsets, and adding inline validation hints. No new endpoints. No schema change.

**Expected sections present.**
- §1 Scope (Objectives, Flow Overview, **§1.3 UX Changes**, §1.4 Status per work item)
- §4 Implementation Phases (markup + SCSS + JS phases)
- §5 Testing Strategy (regression-heavy)

**Expected sections omitted.**
- §1.2 sequenceDiagram (single-system change)
- §1.5 Special Cases (none apply)
- §2 Per-item Reference (no new providers/flags)
- §6.1 Pre-flight items table (write *"No pre-flight requirements."*)

**Pass criteria.**
1. §1.3 includes one mermaid `sequenceDiagram` with at least one colored `rect rgb(...)` region marking the renamed page, regrouped fields, or new validation hints.
2. Unchanged steps are collapsed to a `Note over … (unchanged)` rather than redrawn.
3. A color legend appears under the diagram when more than one color is used.
4. A numbered key-deltas list under the diagram references each colored region in the order it appears.
5. §1.4 lists each renamed/regrouped field as `🟡 Partial` (existing field, modified) and the new validation hints as `⬜ Not built`.
6. Self-check checklist resolves all items relevant to a UI-only change (no false-positive checks for §1.2 sequenceDiagram or §2).

---

## Case 2 — Multi-system integration (3rd-party auth provider)

**Scenario.** Add Signicat as an OIDC authentication provider for BankID (Norway + Sweden). Browser → app → Signicat → app callback → session. Requires a client cert, an agreement with the provider, and a new `auth_provider` field on `users`.

**Expected sections present.**
- §1 Scope (all five subsections — §1.2 sequenceDiagram, §1.4 Status per work item, §1.5 Special Cases with External credential and possibly Schema change)
- §2 Per-item Reference (Signicat NO + Signicat SE = two items)
- §3 Concerns & Open Questions (schema gap, pre-flight cert, contract divergence likely)
- §4 Implementation Phases
- §5 Testing Strategy
- §6 Verification Gates (all three subsections populated)

**Pass criteria.**
1. §1.2 has a `sequenceDiagram` labelling participants by role (Browser, Auth Provider, App), not implementation class.
2. §1.4 lists each Signicat country adapter and the new `auth_provider` field as `⬜ Not built`; the existing OIDC base layer (if reused) is marked `✅ In place` or `🟡 Partial`.
3. §3 concerns each name which §4 phase(s) they block (uses field structure from Step 2).
4. §2 has two `###` entries (one per BankID country) with the field table from the template.
5. §4 phases follow the dependency principle — schema/config phases precede consumer phases; "Requires: Phase N complete" is stated where applicable.
6. §6.1 is a real table (not "No pre-flight requirements") and includes the certificate item with status.
7. Cross-reference works both ways: at least one §3 concern points to a §6.1 row, and at least one §4 phase cites the §2 item it implements.
8. No tool-invocation syntax, no `gitnexus_*` references, no first-person "we will".

---

## Case 3 — Pure server refactor (no UI)

**Scenario.** Extract a 600-line `OrderService::process` method into a strategy-pattern hierarchy (`StandardOrderProcessor`, `SubscriptionOrderProcessor`, `BulkOrderProcessor`). Behavior unchanged — pure refactor for testability.

**Expected sections present.**
- §1.1 Objectives, §1.2 Flow Overview (probably no diagram — single subsystem), §1.4 Status per work item
- §4 Implementation Phases
- §5 Testing Strategy (regression-dominant)

**Expected sections omitted.**
- §1.3 UX Changes (server-only, no user-visible output change — the rule explicitly calls this out)
- §1.2 sequenceDiagram (single-file domain)
- §1.5 Special Cases
- §2 Per-item Reference
- §6.1 Pre-flight (likely "No pre-flight requirements")

**Pass criteria.**
1. §1.3 is correctly **omitted** — the omit rule for server-only features is honored.
2. §1.4 marks `OrderService::process` as `🟡 Partial` (exists, being restructured) and each new `*OrderProcessor` as `⬜ Not built`.
3. §5.3 Regression is the dominant test category, with named existing flows to re-test.
4. §4 phases extract → adapt callers → delete old method, in that dependency order.
5. Self-check does not flag a missing §1.3 sequence diagram.

---

## Case 4 — Schema migration with downstream UI change

**Scenario.** Add a `gdpr_consent_version` column to `users`, backfill existing rows, expose a banner on the user dashboard if the version is stale, and require re-consent. The banner replaces the existing "Welcome back" hero card on first login of the day.

**Expected sections present.**
- All sections — this case exercises the full template.

**Pass criteria.**
1. §1.5 Special Cases includes both **Schema change** and **Legal gate** entries.
2. §1.4 marks `gdpr_consent_version` column as `⬜ Not built`, the consent banner as `⬜ Not built`, and the existing welcome hero card as `🟡 Partial` (being replaced).
3. §4 phases place the migration before the UI phase ("Requires: Phase 1 complete" annotation visible).
4. §1.3 sequence diagram highlights the consent-banner step as added (green `rect rgb(220, 245, 220)`) and the welcome hero-card step as removed (red `rect rgb(255, 220, 220)` with the label wrapped in `~~ ~~`); unchanged auth/session steps are collapsed to `Note over … (unchanged)`.
5. §3 surfaces at least one concern about backfill ordering or stale-row handling.
6. §6.1 includes the legal-approval row marked as a Blocker.
7. §2 Per-item Reference has at least one row for `gdpr_consent_version` describing key/selector/use case.
8. Every `§N.M` reference in the body and self-check resolves to an existing heading — no orphans, no stale numbering.

---

## Cross-cutting checks (all cases)

These apply regardless of which case is run:

- **Path consistency.** The plan saves to `docs/plans/<feature-name>-plan.md`; the path is declared once in Step 3 and referenced (not restated) in Deliver.
- **No duplication of guidance.** Concern fields defined once (Step 2), referenced from §3. Diagram rules defined in §1.3.2, not restated in self-check.
- **§1.4 Status per work item exists** in every plan; every §1.1 deliverable appears at least once in the **Big Item** column, broken into component rows each tagged ✅ In place / 🟡 Partial / ⬜ Not built — no other status values, no missing deliverables.
- **No orphan references.** Every `§N.M` mentioned in body or self-check resolves to an existing heading.
- **Self-contained.** No "see related doc" links in the document header.
- **Tool-trace hygiene.** No `tool_name({...})`, no MCP tool names, no first-person, no "the assistant".
