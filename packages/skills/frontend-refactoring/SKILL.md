---
name: frontend-refactoring
description: 'Use when the user wants to migrate templates to the new design system convention without breaking behavior or visuals. Examples: "Refactor this template", "Migrate this view to the new convention", "Clean up these class names", "Extract this pattern to a partial", "Replace repeated HTML with a loop"'
allowed-tools: Read Grep Glob Edit
metadata:
  tags: frontend, refactoring, scss, html, design-system, templates, php
---

# Frontend Refactoring

## Principles

- **One snippet at a time.** Isolate one pattern, migrate it fully, verify, then move on.
- **No functional changes.** Only class names, element types, and SCSS selectors change. Behavior and visuals must be identical before and after.
- **Always pair HTML and SCSS.** Treat them as a unit — renaming one without the other silently breaks styles.
- **No `!important`.** Fix selector scope, nesting, or cascade order instead. If a rule only works with `!important`, the refactor is not finished.
- **Treat SB Admin 2 as the vendor baseline.** Before replacing a class or selector, confirm whether SB Admin 2 or Bootstrap already owns the pattern, its states, or its coupled JS hooks.
- **Decouple from vendor deliberately, not halfway.** If you replace a vendor selector with an app semantic class, update the template, JS hooks, and SCSS together and remove the overlapping legacy selector so only one source of truth remains.
- **Use one fixed style order in every block.** Write the block in this exact sequence: `@extend` and `@include` first; then raw CSS declarations ordered by purpose: layout → sizing → spacing → typography → visual styling → motion and interaction; put nested selectors such as `&:hover`, `&.is-active`, and child elements last. If a declaration is unusual, place it in the closest matching group instead of inventing a one-off order.

---

## Workflow

Gates are marked **[GATE]** — do not advance to the next step until the gate passes with zero failures.

```
0. Remove all !important — fix selector scope, nesting, or import order before touching anything else
   [GATE] grep -rn '!important' must return no matches before continuing
1. Identify one repeating UI pattern (run `scan-partials.mjs` first)
2. Assess: can dynamic rendering reduce duplication? (hardcoded list → loop over data array)
3. Find all connected SCSS, JS, and vendor selectors referencing the old class names
4. Determine the correct replacement (native element → Bootstrap → semantic → new shared class)
5. Rename HTML classes and update SCSS selectors together
6. Remove legacy overlap so only one active source of truth remains
7. Safely merge equivalent CSS declarations when behavior will not change
8. Exhaust existing `@extend` and `@include` options first, then apply token variables and any remaining raw declarations
9. Run `prettify-scss.mjs` to automatically re-organize block order (directives → raw CSS → nested selectors)
10. Run `verify-conventions.mjs` to check structural and naming conventions
    [GATE] verify-conventions.mjs must exit 0 before continuing — fix all FAIL lines first
11. Verify: visual, layout, and behavior are unchanged
12. Repeat for the next pattern
```

---

## Step-by-Step

### Step 0 — Remove all `!important`

Before any refactoring begins, strip every `!important` from the SCSS files in scope.

```bash
grep -rn '!important' web/scss/overrides/
```

For each occurrence, fix the cascade instead:

- Move the rule into the correct layer (`base/`, `overrides/_fl-*`, or `pages/`)
- Increase selector depth by nesting under the real parent structure
- Adjust import order if the override belongs later in `web/scss/main.scss`
- Remove duplicate legacy selectors that are still competing

`!important` is not an allowed escape hatch in this repo.

**Checklist:**

- [ ] No `!important` in any SCSS file in scope

> **[GATE]** `grep -rn '!important' web/scss/overrides/` must return no matches. Do not proceed to Step 1 until it is clean.

### Step 1 — Identify repeating UI patterns

```bash
node skills/frontend-refactoring/scripts/scan-partials.mjs views/
```

Scan for:

- The same HTML block appearing more than once
- Component-scoped class names (`aml-*`, `kyc-*`, `client-*`)
- Inline styles matching something already in the design system

Pick **one pattern**. Do not attempt multiple in the same pass.

**Checklist:**

- [ ] One pattern identified and isolated — not multiple at once

### Step 2 — Assess: dynamic rendering

Convert repeated blocks to a loop when:

- Same HTML structure copy-pasted 2+ times with only data values changing
- Items are already in a PHP/JS array, or adding one requires duplicating HTML

**How:**

1. Extract varying values into a data array (`$items = [...]`)
2. Replace repeated blocks with a single loop over one item template
3. Parameterize only what varies

**Skip when:** blocks differ structurally, or the items are semantically distinct (e.g. a 3-tab nav with unique behavior per tab).

**Checklist:**

- [ ] Repeated data-only blocks converted to a loop, or skip documented

### Step 3 — Find the connected SCSS, JS, and vendor ownership

```bash
grep -r "old-class-name" web/scss/
grep -r "old-class-name" web/js/
grep -n "\.vendor-selector" web/scss/vendor/_sb-admin-2.scss
```

A class may appear in multiple files, and a vendor-owned pattern may also have JS hooks tied to it. List them all before editing anything.

**Checklist:**

- [ ] All SCSS files referencing the old class name found
- [ ] All JS files referencing the old class name found
- [ ] Vendor selector ownership in SB Admin 2 checked

### Step 4 — Determine the correct replacement

1. Can a **native HTML element** express the role? (`<button>`, `<nav>`, `<table>`, `<ul>`) → use it
2. Does **Bootstrap** name this pattern? (`btn`, `badge`, `table`, `form-control`) → use it
3. Does a **generic semantic class** exist? (`item`, `label`, `control`) → reuse it
4. Pattern in **3+ views**? → create a shared semantic class in `/web/scss/overrides/`
5. Otherwise → new class named by role, not appearance

If SB Admin 2 already owns the pattern:

- Keep the vendor selector when its state model still matches the feature and the refactor only changes appearance
- Replace it with an app semantic class only when the vendor selector cannot meet repo conventions without `!important`, brittle specificity, or broad coupled behavior

**Checklist:**

- [ ] SB Admin 2 / Bootstrap ownership confirmed before replacing any class or selector
- [ ] Replacement class follows: native element → Bootstrap → generic semantic → new role-named class (never appearance-based)

### Step 5 — Rename HTML classes and update SCSS selectors together

1. Replace old class names in the template
2. Update matching selectors in all SCSS files
3. Update any coupled JS selectors in the same pass
4. Bootstrap overrides → inside `.facelift-layout` in `/web/scss/overrides/_fl-*.scss`
5. Shared semantic classes → globally included file, not a single view's stylesheet

If the refactor intentionally replaces a vendor selector, remove the vendor class from the template instead of leaving both classes side by side.

**Checklist:**

- [ ] `aml-*`, `kyc-*`, `client-*` class names used sparingly — prefer semantic names; `text-align-*` removed
- [ ] Coupled JS selectors updated alongside template class changes
- [ ] Vendor class removed from template when replaced by a semantic class (not left side-by-side)

### Step 6 — Remove legacy overlap

Before simplifying declarations, remove the old competing selectors.

Check these locations explicitly:

- `web/scss/overrides/_additional.scss`
- old `base/_fl-*.scss` files
- page-level SCSS that still styles the same pattern
- vendor override selectors that no longer apply after a semantic-class replacement

The goal is one source of truth per pattern. If both a vendor selector and a new semantic selector still style the same element, the refactor is not finished.

**Checklist:**

- [ ] No dead SCSS selectors left behind
- [ ] No overlapping legacy selectors in `_additional.scss`, old base files, or page-level SCSS
- [ ] Only one active source of truth remains for the pattern

### Step 7 — Safely merge equivalent CSS declarations

After renaming selectors, simplify declarations only when the computed result stays the same.

Safe merges include cases like:

```scss
padding-top: 4px;
padding-right: 4px;
padding-bottom: 4px;
padding-left: 4px;
```

becoming:

```scss
padding: 4px;
```

Also merge other equivalent longhand sets into shorthand when all values and sides line up cleanly.

Do this only when:

1. The shorthand produces the same result in all states and breakpoints
2. No side is intentionally different
3. The merge does not override a later declaration that relies on longhand specificity or ordering
4. Readability improves or stays the same

Do not merge declarations when the shorthand could hide meaningful differences or change override behavior.

**Checklist:**

- [ ] Equivalent longhand declarations merged only when shorthand produces identical output in all states and breakpoints

### Step 8 — Exhaust mixins first, then apply token variables and conventions (MUST)

Before writing declarations for a selector block:

1. List every mixin and shared selector the block needs (`flex-row`, `px`, `py`, `transition`, placeholders for `@extend`, etc.)
2. Add all required `@extend` and `@include` lines first
3. Before writing any raw CSS, check whether an existing mixin or shared-class directive can express the same behavior
4. Finish the remaining raw CSS declarations in the required order
5. Write nested selectors and states last

Mixins and shared-class directives outrank raw CSS. If a rule can be expressed with an existing `@extend` or `@include`, use that first.

Prefer patterns like:

- `@include flex-row(8px)` instead of raw `display`, `flex-direction`, and `gap`
- `@include px(16px)` / `@include py(8px)` instead of raw padding declarations
- `@include size(16px)` instead of matching raw `width` and `height`
- existing shared-class `@extend` instead of repeating a known base pattern

Pass raw px values on the allowed scale to spacing mixins (e.g. `@include px(16px)`). Do not use spacing variables (`var(--spacing-*)`).

Only leave a raw declaration in place when no existing `@extend` or `@include` expresses the same behavior cleanly.

Within a block, `@extend` and `@include` lines should be grouped at the top. Remaining raw CSS declarations come after them. Nested selectors must stay at the bottom of the block.

**Priority order:**

| Priority    | Use                                                                                   | Instead of                                                                   |
| ----------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1st         | Shared-class directive (`@extend ...`)                                                | Repeating an existing base pattern in raw declarations                       |
| 2nd         | Layout / behavior mixin (`@include flex-row(8px)`, `@include transition()`)           | `display: flex; flex-direction: row; gap: 8px` / `transition: all 0.2s ease` |
| 3rd         | Spacing / size mixin (`@include px(16px)`, `@include py(8px)`, `@include size(16px)`) | Raw padding / margin / width / height declarations                           |
| 4th         | Token variable (`var(--stone-500)`, `var(--text-sm)`)                                 | `color: #6b7280; font-size: 0.875rem`                                        |
| Last resort | Raw px on the 4px scale                                                               | Only when no token or mixin exists                                           |

Spacing values inside mixins should use raw px on the allowed scale (e.g. `@include px(16px)`, not `@include px(var(--spacing-4))`). Spacing variables (`var(--spacing-*)`) are not required.

**Available abstracts:**

| File                                  | What it provides                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `web/scss/abstracts/_layout.scss`     | `flex-row(gap?)`, `flex-col(gap?)`, `grid-cols(cols, gap?)`, `flex-center`, `flex-between`, `transition(props?, duration?, easing?)` |
| `web/scss/abstracts/_spacing.scss`    | `p`, `m`, `px`, `py`, `mx`, `my`, `pt`, `pb`, `pl`, `pr`, `mt`, `mb`, `ml`, `mr`, `gap`, `gap-x`, `gap-y`, `size`                    |
| `web/scss/abstracts/_variables.scss`  | Colors, brand tokens, shadows, radius, typography tokens                                                                             |
| `web/scss/abstracts/_typography.scss` | Font sizes, weights, line heights                                                                                                    |
| `web/scss/abstracts/_radius.scss`     | Border-radius values                                                                                                                 |
| `web/scss/abstracts/_shadow.scss`     | Box-shadow values                                                                                                                    |

**Gap scale:** 4px, 8px, 10px, 12px, 16px, 20px, 24px, 32px, 40px, 48px. Normalize to the nearest step only when the difference is `1px` or less; otherwise keep the original value. 10px is the only non-4x value.

**Checklist:**

- [ ] Every block's `@extend` and `@include` options exhausted before writing raw CSS
- [ ] Layout mixins used for flex/grid (`@include flex-row`, `flex-col`, `grid-cols`)
- [ ] Spacing mixins used for padding/margin (`@include px`, `py`, `p`, etc.) with raw px values on the allowed scale
- [ ] No hardcoded hex colors or rem/em values — use token variables for colors and typography
- [ ] All SCSS properly nested — `&` for pseudo-classes, states, and modifiers

### Step 9 — Run the prettify script to re-organize SCSS

Do not manually reorder declarations. Run the script and let it enforce block order automatically:

```bash
node skills/frontend-refactoring/scripts/prettify-scss.mjs web/scss/overrides/_fl-component.scss
```

The script re-organizes every selector block in-place to the required order:

1. `@extend` and `@include` lines first
2. Raw CSS properties ordered: layout → sizing → spacing → typography → visual styling → motion and interaction
3. Nested selectors, pseudo-classes, states, and modifiers last

It also reports any structural issues it cannot fix automatically (e.g. flat selectors that must be nested, declarations exceeding max depth). Fix all reported **FAIL** lines before moving on.

After the script runs, review the diff to confirm no declarations were dropped or reordered in a way that changes computed output.

**Checklist:**

- [ ] `prettify-scss.mjs` exits 0 — zero FAIL lines reported
- [ ] Diff reviewed — no declarations dropped or reordered in a way that changes computed output
- [ ] Every selector block follows the internal style order: `@extend`/`@include` → raw CSS → nested selectors
- [ ] Shared selectors with identical declarations merged into comma-grouped rules

> **[GATE]** `prettify-scss.mjs` must exit 0 before running Step 10.

### Step 10 — Run convention scripts

```bash
# SCSS only
node skills/frontend-refactoring/scripts/lint-scss.mjs web/scss/overrides/_fl-component.scss

# SCSS + template
node skills/frontend-refactoring/scripts/verify-conventions.mjs \
  web/scss/overrides/_fl-component.scss views/path/to/template.php
```

`verify-conventions.mjs` additionally checks: `.facelift-layout` wrapper, flat selectors, nesting depth, component-scoped class remnants, inline styles, appearance-based class names.

Both `lint-scss.mjs` and `verify-conventions.mjs` fail on any `!important`. Do not waive that check.

Fix all **FAIL** lines. **WARN** lines are advisory.

**Checklist:**

- [ ] `verify-conventions.mjs` exits 0 — zero FAIL lines

> **[GATE]** `verify-conventions.mjs` must exit 0 before proceeding to Step 11.

### Step 11 — Verify: behavior, layout, and visual

| Check        | How                                                             |
| ------------ | --------------------------------------------------------------- |
| **Visual**   | Load the page — identical spacing, colors, typography, borders? |
| **Layout**   | Resize viewport — responsive behavior holds?                    |
| **Behavior** | Clicks, hovers, form submissions, JS states work?               |

Stop and revert if anything changed.

**Checklist:**

- [ ] Visual: spacing, colors, typography, borders identical to before
- [ ] Layout: responsive behavior holds at all relevant viewports
- [ ] Behavior: clicks, hovers, form submissions, JS states all work

### Step 12 — Repeat

Priority order for next pattern:

1. Custom utility classes duplicating Bootstrap (`text-align-center` → `text-center`)
2. Div soup → native elements (`<nav>`, `<ul>`, `<table>`, `<button>`)
3. Component-scoped class names → generic semantic class
4. One-off custom classes → Bootstrap or shared semantic class

**Checklist:**

- [ ] Blocks appearing in 3+ views or exceeding ~150 lines extracted to a partial

---

## Partials

Extract a block when:

- It appears in **3+ views**, or
- It exceeds **~150 lines** in one template

**Process:** Extract to a partial (e.g. `_status-badge.php`) → parameterize only what varies → replace inline copies → verify each call site.

---

## Checklist

Each step has its own checklist inline above. The two hard gates that block further progress are:

| Gate          | Script                   | Required outcome         |
| ------------- | ------------------------ | ------------------------ |
| After Step 9  | `prettify-scss.mjs`      | exit 0 — zero FAIL lines |
| After Step 10 | `verify-conventions.mjs` | exit 0 — zero FAIL lines |

Do not mark a pattern done unless all per-step checklists are ticked and both gate scripts exit 0.
