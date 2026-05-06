---
name: code-review-and-quality
description: Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enters the main branch.
---

# Code Review and Quality

## Overview

Multi-dimensional code review with quality gates. Every change gets reviewed before merge — no exceptions. Review covers seven axes: correctness, readability, architecture, security, performance, duplication & extractability, and regression & blast radius.

**The approval standard:** Approve a change when it definitely improves overall code health, even if it isn't perfect. Perfect code doesn't exist — the goal is continuous improvement. Don't block a change because it isn't exactly how you would have written it. If it improves the codebase and follows the project's conventions, approve it.

## When to Use

- Before merging any PR or change
- After completing a feature implementation
- When another agent or model produced code you need to evaluate
- When refactoring existing code
- After any bug fix (review both the fix and the regression test)

## The Review Axes

Every review evaluates code across these dimensions. The first five apply to every change; axes 6 and 7 carry the most weight on diffs that touch shared code or exceed ~300 LOC.

### 1. Correctness

Does the code do what it claims to do?

- Does it match the spec or task requirements?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths handled (not just the happy path)?
- Does it pass all tests? Are the tests actually testing the right things?
- Are there off-by-one errors, race conditions, or state inconsistencies?

### 2. Readability & Simplicity

Can another engineer (or agent) understand this code without the author explaining it?

- Are names descriptive and consistent with project conventions? (No `temp`, `data`, `result` without context)
- Is the control flow straightforward (avoid nested ternaries, deep callbacks)?
- Is the code organized logically (related code grouped, clear module boundaries)?
- Are there any "clever" tricks that should be simplified?
- **Could this be done in fewer lines?** (1000 lines where 100 suffice is a failure)
- **Are abstractions earning their complexity?** (Don't generalize until the third use case)
- Would comments help clarify non-obvious intent? (But don't comment obvious code.)
- Are there dead code artifacts: no-op variables (`_unused`), backwards-compat shims, or `// removed` comments?

### 3. Architecture

Does the change fit the system's design?

- Does it follow existing patterns or introduce a new one? If new, is it justified?
- Does it maintain clean module boundaries?
- Is there code duplication that should be shared?
- Are dependencies flowing in the right direction (no circular dependencies)?
- Is the abstraction level appropriate (not over-engineered, not too coupled)?

### 4. Security

For detailed security guidance, see `security-and-hardening`. Does the change introduce vulnerabilities?

- Is user input validated and sanitized?
- Are secrets kept out of code, logs, and version control?
- Is authentication/authorization checked where needed?
- Are SQL queries parameterized (no string concatenation)?
- Are outputs encoded to prevent XSS?
- Are dependencies from trusted sources with no known vulnerabilities?
- Is data from external sources (APIs, logs, user content, config files) treated as untrusted?
- Are external data flows validated at system boundaries before use in logic or rendering?

### 5. Performance

For detailed profiling and optimization, see `performance-optimization`. Does the change introduce performance problems?

- Any N+1 query patterns?
- Any unbounded loops or unconstrained data fetching?
- Any synchronous operations that should be async?
- Any unnecessary re-renders in UI components?
- Any missing pagination on list endpoints?
- Any large objects created in hot paths?

### 6. Duplication & Extractability

Is repeated code worth extracting? Look beyond within-file DRY:

- **Cross-file duplication** — does this block already exist in a sibling partial / mixin / component / helper? Grep the relevant tree before flagging "looks duplicated."
- **Near-clone files** — when a new file is ~90% copy of an existing one, parameterize the original instead of shipping a fork. Forks drift.
- **Repeating render blocks** that could become a config-driven loop (e.g. 6 form fields built from 6 near-identical blocks → one `foreach` over a config array).
- **Style series** that could become `@each` / a loop over a token map (icon variants, badge color states, size modifiers).
- **Hardcoded values** where the project has design tokens (colors, spacing, typography) — replace with the token.
- **`!important` / specificity workarounds** signal a deeper specificity bug, not a styling choice — find the root cause.

For each finding, **estimate LOC saved** so the author can prioritize. "Extracting this saves ~95 LOC and prevents drift" is more actionable than "consider DRY."

Don't generalize until the third use case — but when the third use case lands inside the same diff, take it.

### 7. Regression & Blast Radius

What might this change break that isn't in the diff?

- **Who else consumes each modified shared file?** Grep callers of touched models, layouts, assets, helpers, JS modules.
- **What behavior was REMOVED?** Removed function args, dropped filter UI, deleted CSS classes, route changes — every removal is a potential regression for code that still depended on it.
- **Signature / attribute additions** that change mass-assignment exposure, `formName()` behavior, scenario coverage, or serialization output.
- **Shared layout / asset edits** that affect every consumer page, not just the page named in the PR title.
- **Behavior-changing config edits** (env vars, error_reporting, log levels, feature flags) — confirm scope (dev only? all envs?).
- **JS event handler swaps** (e.g. native `.submit()` vs jQuery `.trigger('submit')`) that bypass listeners attached elsewhere.

For each finding, name the most likely affected caller / consumer so the author can verify directly instead of guessing.

## Change Sizing

Small, focused changes are easier to review, faster to merge, and safer to deploy. Target these sizes:

```
~100 lines changed   → Good. Reviewable in one sitting.
~300 lines changed   → Acceptable if it's a single logical change.
~1000 lines changed  → Too large. Split it.
```

**What counts as "one change":** A single self-contained modification that addresses one thing, includes related tests, and keeps the system functional after submission. One part of a feature — not the whole feature.

**Splitting strategies when a change is too large:**

| Strategy | How | When |
|----------|-----|------|
| **Stack** | Submit a small change, start the next one based on it | Sequential dependencies |
| **By file group** | Separate changes for groups needing different reviewers | Cross-cutting concerns |
| **Horizontal** | Create shared code/stubs first, then consumers | Layered architecture |
| **Vertical** | Break into smaller full-stack slices of the feature | Feature work |

**When large changes are acceptable:** Complete file deletions and automated refactoring where the reviewer only needs to verify intent, not every line.

**Separate refactoring from feature work.** A change that refactors existing code and adds new behavior is two changes — submit them separately. Small cleanups (variable renaming) can be included at reviewer discretion.

## Change Descriptions

Every change needs a description that stands alone in version control history.

**First line:** Short, imperative, standalone. "Delete the FizzBuzz RPC" not "Deleting the FizzBuzz RPC." Must be informative enough that someone searching history can understand the change without reading the diff.

**Body:** What is changing and why. Include context, decisions, and reasoning not visible in the code itself. Link to bug numbers, benchmark results, or design docs where relevant. Acknowledge approach shortcomings when they exist.

**Anti-patterns:** "Fix bug," "Fix build," "Add patch," "Moving code from A to B," "Phase 1," "Add convenience functions."

## Review Process

### Step 0: Load Project Conventions

Before reading the diff, surface project-specific rules that won't appear in any generic checklist:

- Read `CLAUDE.md` and any nested `**/CLAUDE.md` for hard rules and forbidden patterns.
- Read memory / agent rules for past corrections (e.g. "no utility classes in views", "no AI co-author trailer in commits").
- Skim shared partials, mixins, design tokens, helper modules — so you can flag duplication of existing utilities instead of suggesting inventions of them.
- Note framework idioms (e.g. Yii2 `Html::tag` over string concat, Rails `link_to` over raw `<a>`, Django `{% url %}` over hardcoded paths) the diff should follow.

Without this step, the review misses project-specific violations that no global checklist catches.

### Step 1: Understand the Context

Before looking at code, understand the intent:

```
- What is this change trying to accomplish?
- What spec or task does it implement?
- What is the expected behavior change?
```

### Step 2: Review the Tests First

Tests reveal intent and coverage:

```
- Do tests exist for the change?
- Do they test behavior (not implementation details)?
- Are edge cases covered?
- Do tests have descriptive names?
- Would the tests catch a regression if the code changed?
```

### Step 3: Review the Implementation

Walk through the code with the seven axes in mind:

```
For each file changed:
1. Correctness:                  Does this code do what the test says it should?
2. Readability:                  Can I understand this without help?
3. Architecture:                 Does this fit the system?
4. Security:                     Any vulnerabilities?
5. Performance:                  Any bottlenecks?
6. Duplication & Extractability: Is anything copy-pasted across files, or repeated in a shape that wants a loop / partial / mixin?
7. Regression & Blast Radius:    Who else consumes the touched files? What behavior was removed?
```

### Step 4: Categorize Findings

Label every comment with its severity so the author knows what's required vs optional:

| Prefix | Meaning | Author Action |
|--------|---------|---------------|
| *(no prefix)* | Required change | Must address before merge |
| **Critical:** | Blocks merge | Security vulnerability, data loss, broken functionality |
| **Nit:** | Minor, optional | Author may ignore — formatting, style preferences |
| **Optional:** / **Consider:** | Suggestion | Worth considering but not required |
| **FYI** | Informational only | No action needed — context for future reference |

This prevents authors from treating all feedback as mandatory and wasting time on optional suggestions.

### Step 5: Verify the Verification

Check the author's verification story:

```
- What tests were run?
- Did the build pass?
- Was the change tested manually?
- Are there screenshots for UI changes?
- Is there a before/after comparison?
```

### Multi-Pass Review for Large Diffs

For diffs over ~300 LOC or touching >5 files, a single pass produces a noisy report the author can't act on. Split into focused passes:

| Pass | Focus | Output |
|---|---|---|
| 1 | Correctness, security, project-rule violations | Bugs, vulnerabilities, hard-rule breaks |
| 2 | Duplication, regression, conventions | Cross-file dup, blast radius, framework idioms |
| 3 | Repeating patterns → extractions | Config loops, partials, mixins, parameterization (with LOC saved) |

Each pass cites prior-pass findings instead of restating them. The author can address one pass at a time without drowning.

Skip multi-pass on small focused diffs — overhead exceeds benefit there.

## Multi-Model Review Pattern

Use different models for different review perspectives:

```
Model A writes the code
    │
    ▼
Model B reviews for correctness and architecture
    │
    ▼
Model A addresses the feedback
    │
    ▼
Human makes the final call
```

This catches issues that a single model might miss — different models have different blind spots.

**Example prompt for a review agent:**
```
Review this code change for correctness, security, and adherence to
our project conventions. The spec says [X]. The change should [Y].
Flag any issues as Critical, Important, or Suggestion.
```

## Dead Code Hygiene

After any refactoring or implementation change, check for orphaned code:

1. Identify code that is now unreachable or unused
2. List it explicitly
3. **Ask before deleting:** "Should I remove these now-unused elements: [list]?"

Don't leave dead code lying around — it confuses future readers and agents. But don't silently delete things you're not sure about. When in doubt, ask.

```
DEAD CODE IDENTIFIED:
- formatLegacyDate() in src/utils/date.ts — replaced by formatDate()
- OldTaskCard component in src/components/ — replaced by TaskCard
- LEGACY_API_URL constant in src/config.ts — no remaining references
→ Safe to remove these?
```

## Review Speed

Slow reviews block entire teams. The cost of context-switching to review is less than the waiting cost imposed on others.

- **Respond within one business day** — this is the maximum, not the target
- **Ideal cadence:** Respond shortly after a review request arrives, unless deep in focused coding. A typical change should complete multiple review rounds in a single day
- **Prioritize fast individual responses** over quick final approval. Quick feedback reduces frustration even if multiple rounds are needed
- **Large changes:** Ask the author to split them rather than reviewing one massive changeset

## Handling Disagreements

When resolving review disputes, apply this hierarchy:

1. **Technical facts and data** override opinions and preferences
2. **Style guides** are the absolute authority on style matters
3. **Software design** must be evaluated on engineering principles, not personal preference
4. **Codebase consistency** is acceptable if it doesn't degrade overall health

**Don't accept "I'll clean it up later."** Experience shows deferred cleanup rarely happens. Require cleanup before submission unless it's a genuine emergency. If surrounding issues can't be addressed in this change, require filing a bug with self-assignment.

## Feedback Style

**Be specific, not vague.**

- Bad: "Performance issues here."
- Good: "Line 45 — this query causes N+1. Use `.select_related('author')` to fetch related rows in one query (saves ~50ms per item)."

**Show the alternative; don't just point at the problem.**

- Bad: "This is wrong. Rewrite it."
- Good: "Extract validation into its own function for testability: `def validate_email(email: str) -> bool: ...`"

**Name common anti-patterns explicitly when you spot them:**

- *God class* — one class doing user mgmt + email + payment + reports. Suggest splitting by responsibility.
- *Deep nesting* — 4+ levels of `if`. Suggest early returns:
  ```
  if not condition1: return
  if not condition2: return
  # flat code
  ```
- *Magic numbers* — `if user.age > 18:` → `if user.age > MINIMUM_AGE:` with the constant defined.

Adapt the syntax to the diff's stack — the patterns are language-agnostic.

## Honesty in Review

When reviewing code — whether written by you, another agent, or a human:

- **Don't rubber-stamp.** "LGTM" without evidence of review helps no one.
- **Don't soften real issues.** "This might be a minor concern" when it's a bug that will hit production is dishonest.
- **Quantify problems when possible.** "This N+1 query will add ~50ms per item in the list" is better than "this could be slow."
- **Push back on approaches with clear problems.** Sycophancy is a failure mode in reviews. If the implementation has issues, say so directly and propose alternatives.
- **Accept override gracefully.** If the author has full context and disagrees, defer to their judgment. Comment on code, not people — reframe personal critiques to focus on the code itself.

## Dependency Discipline

Part of code review is dependency review:

**Before adding any dependency:**
1. Does the existing stack solve this? (Often it does.)
2. How large is the dependency? (Check bundle impact.)
3. Is it actively maintained? (Check last commit, open issues.)
4. Does it have known vulnerabilities? (`npm audit`)
5. What's the license? (Must be compatible with the project.)

**Rule:** Prefer standard library and existing utilities over new dependencies. Every dependency is a liability.

## The Review Checklist

```markdown
## Review: [PR/Change title]

### Context
- [ ] I understand what this change does and why

### Correctness
- [ ] Change matches spec/task requirements
- [ ] Edge cases handled
- [ ] Error paths handled
- [ ] Tests cover the change adequately

### Readability
- [ ] Names are clear and consistent
- [ ] Logic is straightforward
- [ ] No unnecessary complexity

### Architecture
- [ ] Follows existing patterns
- [ ] No unnecessary coupling or dependencies
- [ ] Appropriate abstraction level

### Security
- [ ] No secrets in code
- [ ] Input validated at boundaries
- [ ] No injection vulnerabilities
- [ ] Auth checks in place
- [ ] External data sources treated as untrusted

### Performance
- [ ] No N+1 patterns
- [ ] No unbounded operations
- [ ] Pagination on list endpoints

### Duplication & Extractability
- [ ] No copy-paste of code that already lives in a shared partial / mixin / helper
- [ ] No near-clone files (parameterize the original instead)
- [ ] Repeating render blocks extracted into a config loop
- [ ] SCSS/style series collapsed via `@each` / a token map
- [ ] Hardcoded values replaced with project design tokens
- [ ] No `!important` or specificity hacks masking a deeper bug

### Regression & Blast Radius
- [ ] Callers of every modified shared file checked
- [ ] Removed behavior (args, UI elements, classes, routes) confirmed safe to drop
- [ ] New attributes don't expand mass-assignment / `formName()` exposure
- [ ] Shared layout / asset / config edits scoped correctly (right env, right pages)
- [ ] JS handler swaps don't bypass listeners attached elsewhere

### Verification
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Manual verification done (if applicable)

### Verdict
- [ ] **Approve** — Ready to merge
- [ ] **Request changes** — Issues must be addressed
```
## See Also

- For detailed security review guidance, see `references/security-checklist.md`
- For performance review checks, see `references/performance-checklist.md`

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It works, that's good enough" | Working code that's unreadable, insecure, or architecturally wrong creates debt that compounds. |
| "I wrote it, so I know it's correct" | Authors are blind to their own assumptions. Every change benefits from another set of eyes. |
| "We'll clean it up later" | Later never comes. The review is the quality gate — use it. Require cleanup before merge, not after. |
| "AI-generated code is probably fine" | AI code needs more scrutiny, not less. It's confident and plausible, even when wrong. |
| "The tests pass, so it's good" | Tests are necessary but not sufficient. They don't catch architecture problems, security issues, or readability concerns. |

## Red Flags

- PRs merged without any review
- Review that only checks if tests pass (ignoring other axes)
- "LGTM" without evidence of actual review
- Security-sensitive changes without security-focused review
- Large PRs that are "too big to review properly" (split them)
- No regression tests with bug fix PRs
- Review comments without severity labels — makes it unclear what's required vs optional
- Accepting "I'll fix it later" — it never happens

## Verification

After review is complete:

- [ ] All Critical issues are resolved
- [ ] All Important issues are resolved or explicitly deferred with justification
- [ ] Tests pass
- [ ] Build succeeds
- [ ] The verification story is documented (what changed, how it was verified)
