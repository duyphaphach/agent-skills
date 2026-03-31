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
- **No `!important`.** Fix specificity instead. Move the rule inside `.facelift-layout`, increase selector depth, or restructure the cascade. `!important` is a sign the selector isn't winning cleanly.

---

## Workflow

```
0. Remove all !important — fix specificity before touching anything else
1. Identify one repeating UI pattern (run scan-partials.sh first)
2. Assess: can dynamic rendering reduce duplication? (hardcoded list → loop over data array)
3. Find all connected SCSS files referencing the old class names
4. Determine the correct replacement (native element → Bootstrap → semantic → new shared class)
5. Rename HTML classes and update SCSS selectors together
6. Apply mixins, tokens, and conventions (layout mixins → spacing mixins → token variables)
7. Write the final SCSS as properly nested structure
8. Run verify-conventions.sh — fix all FAIL lines before continuing
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

For each occurrence, fix specificity instead:
- Move the rule inside `.facelift-layout` if it isn't already
- Increase selector depth by nesting under a more specific parent
- Restructure the cascade so the rule wins without forcing it

`!important` is a sign that a selector isn't winning cleanly — the underlying conflict must be resolved, not suppressed.

### Step 1 — Identify repeating UI patterns

```bash
bash .agents/skills/frontend-refactoring/scripts/scan-partials.sh views/
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

**Priority order:**

| Priority    | Use                                                     | Instead of                                     |
| ----------- | ------------------------------------------------------- | ---------------------------------------------- |
| 1st         | Layout mixin (`@include flex-row(8px)`, `@include transition()`) | `display: flex; flex-direction: row; gap: 8px` / `transition: all 0.2s ease` |
| 2nd         | Spacing mixin (`@include px(16px)`, `@include py(8px)`) | `padding-inline: 16px; padding-block: 8px`     |
| 3rd         | Token variable (`var(--stone-500)`, `var(--text-sm)`)   | `color: #6b7280; font-size: 0.875rem`          |
| Last resort | Raw px on the 4px scale                                 | Only when no token or mixin exists             |

**Available abstracts:**

| File | What it provides |
| ---- | ---------------- |
| `web/scss/abstracts/_layout.scss`     | `flex-row(gap?)`, `flex-col(gap?)`, `grid-cols(cols, gap?)`, `flex-center`, `flex-between`, `transition(props?, duration?, easing?)` |
| `web/scss/abstracts/_spacing.scss`    | `p`, `m`, `px`, `py`, `mx`, `my`, `pt`, `pb`, `pl`, `pr`, `mt`, `mb`, `ml`, `mr`, `gap`, `gap-x`, `gap-y`, `size` |
| `web/scss/abstracts/_variables.scss`  | Colors, brand tokens, z-index, breakpoints |
| `web/scss/abstracts/_typography.scss` | Font sizes, weights, line heights |
| `web/scss/abstracts/_radius.scss`     | Border-radius values |
| `web/scss/abstracts/_shadow.scss`     | Box-shadow values |

**Gap scale:** 4px, 8px, 10px, 12px, 16px, 20px, 24px, 32px, 40px, 48px — normalize odd values to nearest step. 10px is the only non-4x value.

### Step 7 — Write nested SCSS

All rules live inside their parent selector. Use `&` for pseudo-classes, states, and modifiers. Max 3 levels deep.

**Wrong:**
```scss
.nav-item { padding: 8px; }
.nav-item:hover { background: var(--stone-100); }
.nav-item .nav-link { color: var(--stone-700); }
```

**Correct:**
```scss
.facelift-layout {
  .nav-item {
    @include p(8px);

    &:hover { background: var(--stone-100); }

    .nav-link { color: var(--stone-700); }
  }
}
```

**Merge selectors that share declarations:**
```scss
// Wrong
.status-badge { @include flex-row(4px); font-size: var(--text-sm); }
.risk-label   { @include flex-row(4px); font-size: var(--text-sm); }

// Correct
.status-badge, .risk-label { @include flex-row(4px); font-size: var(--text-sm); }
.status-badge { color: var(--green-600); }
.risk-label   { color: var(--rose-600); }
```

### Step 8 — Run convention scripts

```bash
# SCSS only
bash .agents/skills/frontend-refactoring/scripts/lint-scss.sh web/scss/overrides/_fl-component.scss

# SCSS + template
bash .agents/skills/frontend-refactoring/scripts/verify-conventions.sh \
  web/scss/overrides/_fl-component.scss views/path/to/template.php
```

`verify-conventions.sh` additionally checks: `.facelift-layout` wrapper, flat selectors, nesting depth, component-scoped class remnants, inline styles, appearance-based class names.

Fix all **FAIL** lines. **WARN** lines are advisory.

### Step 9 — Verify: behavior, layout, and visual

| Check | How |
| ----- | --- |
| **Visual** | Load the page — identical spacing, colors, typography, borders? |
| **Layout** | Resize viewport — responsive behavior holds? |
| **Behavior** | Clicks, hovers, form submissions, JS states work? |

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
- It exceeds **~40 lines** in one template

**Process:** Extract to a partial (e.g. `_status-badge.php`) → parameterize only what varies → replace inline copies → verify each call site.

---

## Checklist

- [ ] No `!important` in any new or updated SCSS — fix specificity instead
- [ ] No `aml-*`, `kyc-*`, `client-*`, `text-align-*` class names in HTML
- [ ] No dead SCSS selectors left behind
- [ ] New classes: Bootstrap first, then semantic, never appearance-based
- [ ] All SCSS nested — `&` for pseudo-classes, states, modifiers
- [ ] Layout mixins for flex/grid (`@include flex-row`, `flex-col`, `grid-cols`)
- [ ] Spacing mixins for padding/margin (`@include p`, `px`, `py`)
- [ ] Shared selectors merged with comma grouping
- [ ] No hardcoded values — tokens from `web/scss/abstracts/`
- [ ] `verify-conventions.sh` passes (zero FAIL lines)
- [ ] Visual, layout, and behavior verified unchanged
- [ ] Blocks in 3+ views or >40 lines → extracted to a partial
- [ ] Repeated data-only blocks → dynamic rendering (loop)
