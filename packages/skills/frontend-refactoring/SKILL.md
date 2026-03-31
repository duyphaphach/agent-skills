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
- **Keep style blocks in a fixed order.** Inside each selector block: `@extend`/`@include` first, nested selectors next, raw CSS declarations last. Raw declarations must be ordered: layout → spacing → typography → decoration.

---

## Workflow

```
0. Remove all !important — fix selector scope, nesting, or import order before touching anything else
1. Identify one repeating UI pattern (run `scan-partials.mjs` first)
2. Assess: can dynamic rendering reduce duplication? (hardcoded list → loop over data array)
3. Find all connected SCSS files referencing the old class names
4. Determine the correct replacement (native element → Bootstrap → semantic → new shared class)
5. Rename HTML classes and update SCSS selectors together
6. Gather required mixins, then apply mixins, tokens, and conventions (layout mixins → spacing mixins → token variables)
7. Write the final SCSS as properly nested structure with `@include` and `@extend` at the top of each block, raw CSS ALWAYS at the bottom
8. Run `verify-conventions.mjs` — fix all FAIL lines before continuing
9. Verify: visual, layout, and behavior are unchanged
10. Repeat for the next pattern
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

### Step 1 — Identify repeating UI patterns

```bash
node skills/frontend-refactoring/scripts/scan-partials.mjs views/
```

Scan for:

- The same HTML block appearing more than once
- Component-scoped class names (`aml-*`, `kyc-*`, `client-*`)
- Inline styles matching something already in the design system

Pick **one pattern**. Do not attempt multiple in the same pass.

### Step 2 — Assess: dynamic rendering

Convert repeated blocks to a loop when:

- Same HTML structure copy-pasted 2+ times with only data values changing
- Items are already in a PHP/JS array, or adding one requires duplicating HTML

**How:**

1. Extract varying values into a data array (`$items = [...]`)
2. Replace repeated blocks with a single loop over one item template
3. Parameterize only what varies

**Skip when:** blocks differ structurally, or the items are semantically distinct (e.g. a 3-tab nav with unique behavior per tab).

### Step 3 — Find the connected SCSS

```bash
grep -r "old-class-name" web/scss/
```

A class may appear in multiple files — list them all before editing anything.

### Step 4 — Determine the correct replacement

1. Can a **native HTML element** express the role? (`<button>`, `<nav>`, `<table>`, `<ul>`) → use it
2. Does **Bootstrap** name this pattern? (`btn`, `badge`, `table`, `form-control`) → use it
3. Does a **generic semantic class** exist? (`item`, `label`, `control`) → reuse it
4. Pattern in **3+ views**? → create a shared semantic class in `/web/scss/overrides/`
5. Otherwise → new class named by role, not appearance

### Step 5 — Rename HTML classes and update SCSS selectors together

1. Replace old class names in the template
2. Update matching selectors in the SCSS files
3. Bootstrap overrides → inside `.facelift-layout` in `/web/scss/overrides/_fl-*.scss`
4. Shared semantic classes → globally included file, not a single view's stylesheet

### Step 6 — Apply mixins, tokens, and conventions (MUST)

Before writing declarations for a selector block:

1. List every mixin and shared selector the block needs (`flex-row`, `px`, `py`, `transition`, placeholders for `@extend`, etc.)
2. Add all required `@extend` and `@include` lines first
3. Write nested selectors and states after the block's own directives
4. Keep the block's raw CSS declarations at the bottom, ordered layout → spacing → typography → decoration

Within a block, `@extend` and `@include` lines should be grouped at the top. Do not scatter them between nested selectors or raw properties.

**Priority order:**

| Priority    | Use                                                              | Instead of                                                                   |
| ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1st         | Layout mixin (`@include flex-row(8px)`, `@include transition()`) | `display: flex; flex-direction: row; gap: 8px` / `transition: all 0.2s ease` |
| 2nd         | Spacing mixin (`@include px(16px)`, `@include py(8px)`)          | `padding-inline: 16px; padding-block: 8px`                                   |
| 3rd         | Token variable (`var(--stone-500)`, `var(--text-sm)`)            | `color: #6b7280; font-size: 0.875rem`                                        |
| Last resort | Raw px on the 4px scale                                          | Only when no token or mixin exists                                           |

**Available abstracts:**

| File                                  | What it provides                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `web/scss/abstracts/_layout.scss`     | `flex-row(gap?)`, `flex-col(gap?)`, `grid-cols(cols, gap?)`, `flex-center`, `flex-between`, `transition(props?, duration?, easing?)` |
| `web/scss/abstracts/_spacing.scss`    | `p`, `m`, `px`, `py`, `mx`, `my`, `pt`, `pb`, `pl`, `pr`, `mt`, `mb`, `ml`, `mr`, `gap`, `gap-x`, `gap-y`, `size`                    |
| `web/scss/abstracts/_variables.scss`  | Colors, brand tokens, z-index, breakpoints                                                                                           |
| `web/scss/abstracts/_typography.scss` | Font sizes, weights, line heights                                                                                                    |
| `web/scss/abstracts/_radius.scss`     | Border-radius values                                                                                                                 |
| `web/scss/abstracts/_shadow.scss`     | Box-shadow values                                                                                                                    |

**Gap scale:** 4px, 8px, 10px, 12px, 16px, 20px, 24px, 32px, 40px, 48px — normalize odd values to nearest step. 10px is the only non-4x value.

### Step 7 — Write nested SCSS

All rules live inside their parent selector. Use `&` for pseudo-classes, states, and modifiers. Max 3 levels deep.

**Style order rule:** every selector block must follow one consistent internal order. Do not reorder declarations ad hoc from block to block.

Block order:

1. `@extend` and `@include` lines
2. Nested selectors, pseudo-classes, states, and modifiers
3. Raw CSS properties ordered: layout → spacing → typography → decoration

For raw CSS declarations, use this internal order:

1. Layout: `display`, `position`, `inset`, `width`, `height`, `flex`, `grid`, `overflow`
2. Spacing: `margin`, `padding`, `gap`
3. Typography: `font`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-*`
4. Decoration: `color`, `background`, `border`, `border-radius`, `box-shadow`, `opacity`

**Wrong:**

```scss
.nav-item {
  color: var(--stone-700);
  @include p(8px);
}
.nav-item:hover {
  background: var(--stone-100);
}
.nav-item .nav-link {
  color: var(--stone-700);
}
```

**Correct:**

```scss
.facelift-layout {
  .nav-item {
    @include p(8px);

    &:hover {
      background: var(--stone-100);
    }

    .nav-link {
      color: var(--stone-700);
    }

    display: flex;
    gap: 8px;
    font-size: var(--text-sm);
    color: var(--stone-700);
  }
}
```

**Merge selectors that share declarations:**

```scss
// Wrong
.status-badge {
  font-size: var(--text-sm);
  @include flex-row(4px);
}
.risk-label {
  font-size: var(--text-sm);
  @include flex-row(4px);
}

// Correct
.status-badge,
.risk-label {
  @include flex-row(4px);
  font-size: var(--text-sm);
}
.status-badge {
  color: var(--green-600);
}
.risk-label {
  color: var(--rose-600);
}
```

### Step 8 — Run convention scripts

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

### Step 9 — Verify: behavior, layout, and visual

| Check        | How                                                             |
| ------------ | --------------------------------------------------------------- |
| **Visual**   | Load the page — identical spacing, colors, typography, borders? |
| **Layout**   | Resize viewport — responsive behavior holds?                    |
| **Behavior** | Clicks, hovers, form submissions, JS states work?               |

Stop and revert if anything changed.

### Step 10 — Repeat

Priority order for next pattern:

1. Custom utility classes duplicating Bootstrap (`text-align-center` → `text-center`)
2. Div soup → native elements (`<nav>`, `<ul>`, `<table>`, `<button>`)
3. Component-scoped class names → generic semantic class
4. One-off custom classes → Bootstrap or shared semantic class

---

## Partials

Extract a block when:

- It appears in **3+ views**, or
- It exceeds **~150 lines** in one template

**Process:** Extract to a partial (e.g. `_status-badge.php`) → parameterize only what varies → replace inline copies → verify each call site.

---

## Checklist

- [ ] No `!important` in any new or updated SCSS — fix specificity instead
- [ ] No `aml-*`, `kyc-*`, `client-*`, `text-align-*` class names in HTML
- [ ] No dead SCSS selectors left behind
- [ ] New classes: Bootstrap first, then semantic, never appearance-based
- [ ] All SCSS nested — `&` for pseudo-classes, states, modifiers
- [ ] Gather each block's mixins before writing declarations
- [ ] Layout mixins for flex/grid (`@include flex-row`, `flex-col`, `grid-cols`)
- [ ] Spacing mixins for padding/margin (`@include p`, `px`, `py`)
- [ ] Every selector block follows the same internal style order
- [ ] `@extend` and `@include` lines grouped at the top of each block
- [ ] Raw CSS declarations kept at the bottom of each block
- [ ] Raw CSS declaration order is layout → spacing → typography → decoration
- [ ] Shared selectors merged with comma grouping
- [ ] No hardcoded values — tokens from `web/scss/abstracts/`
- [ ] `verify-conventions.mjs` passes (zero FAIL lines)
- [ ] Visual, layout, and behavior verified unchanged
- [ ] Blocks in 3+ views or >150 lines → extracted to a partial
- [ ] Repeated data-only blocks → dynamic rendering (loop)
