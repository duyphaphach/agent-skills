---
name: frontend-refactoring
description: "Use when the user wants to migrate templates to the new design system convention without breaking behavior or visuals. Examples: \"Refactor this template\", \"Migrate this view to the new convention\", \"Clean up these class names\", \"Extract this pattern to a partial\", \"Replace repeated HTML with a loop\""
allowed-tools: Read Grep Glob Edit
metadata:
  tags: frontend, refactoring, scss, html, design-system, templates, php
  platforms: Claude
---

# Frontend Refactoring

## When to Use

- "Refactor this template to the new convention"
- "Migrate these class names to Bootstrap / semantic classes"
- "Clean up `aml-*`, `kyc-*`, `client-*` prefixed class names"
- "Extract this repeated UI pattern to a partial"
- "Remove div soup and replace with native HTML elements"
- "Replace repeated hardcoded blocks with a loop over data"
- Any task involving migrating existing templates without changing behavior or visuals

## Principles

- **One snippet at a time.** Never refactor an entire view in one pass. Isolate one repeating UI pattern, migrate it fully, verify, then move to the next.
- **No functional changes during a refactor.** A refactor only changes class names, element types, and SCSS selectors. Behavior, layout, and visual output must be identical before and after each step.
- **Always pair HTML and SCSS together.** Renaming a class in HTML without updating its SCSS selector (or vice versa) will silently break styles. Treat them as a unit.

---

## Workflow

```
1. Identify one repeating UI pattern in the template
2. Assess: can dynamic rendering reduce duplication? (hardcoded list → loop over data array)
3. Find all connected SCSS files referencing the old class names
4. Determine the correct replacement (native element → Bootstrap → semantic → new shared class)
5. Rename HTML classes and update SCSS selectors together
6. Verify: visual, layout, and behavior are unchanged
7. Repeat for the next pattern
```

---

## Step-by-Step Process

### Step 1 — Identify repeating UI patterns in the template

Before touching any code, scan the view for repetition:

- The same block of HTML appearing more than once (status badges, action buttons, row layouts)
- Inline styles or one-off classes that visually match something already in the design system
- Component-scoped class names (`aml-*`, `kyc-*`, `client-*`) that map to a generic role

Pick **one pattern** to migrate. Do not attempt multiple patterns in the same pass.

### Step 2 — Assess: dynamic rendering from state

Before renaming classes, ask whether the repeated block is driven by data that could be looped:

**Signals that a block should become dynamic:**

- The same HTML structure is copy-pasted 2+ times with only data values changing (labels, hrefs, status strings)
- The set of items is already available as a PHP array, JS array, or API response
- Adding a new item currently requires duplicating HTML manually

**How to convert:**

1. Extract the varying values into a data array (PHP `$items = [...]`, JS `const items = [...]`)
2. Replace the repeated blocks with a single loop that renders one item template
3. Keep the item template identical in structure to the original block — class names, element types, attributes
4. Parameterize only what varies; hardcode what is always the same

**When NOT to convert:**

- Each "repeated" block has meaningfully different structure, not just different data
- The number of items is always fixed and semantically distinct (e.g. a 3-tab nav where each tab has unique behavior)
- Converting would require passing state that isn't cleanly available at render time

> Dynamic rendering reduces line count and ensures future items automatically get the correct markup. Only apply it when the data is genuinely uniform.

### Step 3 — Find the connected SCSS

Locate every CSS rule that targets the old class names:

```bash
grep -r "old-class-name" web/scss/
```

List them all. A class may be styled in multiple files — you need the full picture before editing anything.

**Before writing any new SCSS values, always check the design token files for existing tokens to use:**

| File | Contains |
| ---- | -------- |
| `web/scss/abstracts/_spacing.scss` | Spacing scale (margins, paddings, gaps) |
| `web/scss/abstracts/_typography.scss` | Font sizes, weights, line heights, font families |
| `web/scss/abstracts/_variables.scss` | Colors, brand tokens, z-index, breakpoints |
| `web/scss/abstracts/_radius.scss` | Border-radius values |
| `web/scss/abstracts/_shadow.scss` | Box-shadow values |

Never hardcode a raw value (e.g. `8px`, `#3a3a3a`, `0.875rem`) if a token already exists for it. Reference the token instead.

### Step 4 — Determine the correct replacement

For each HTML element and class, apply this decision order:

1. Can a **native HTML element** express the role? (`<button>`, `<nav>`, `<table>`, `<ul>`) → use it, remove the wrapper div
2. Does **Bootstrap** already name this pattern? (`btn`, `badge`, `table`, `form-control`) → use the Bootstrap class directly
3. Does a **generic semantic class** already exist in the codebase? (`item`, `label`, `control`) → reuse it
4. Does the same pattern appear in **more than one view**? → create a new shared semantic class, add its SCSS to `/web/scss/overrides/`
5. Only if none of the above — create a new class, named by role not appearance

### Step 5 — Rename HTML classes and update SCSS selectors together

1. In the template, replace old class names with the new ones
2. In the SCSS files found in Step 2, update selectors to match
3. If the new class is a Bootstrap class being overridden, move its styles inside `.facelift-layout` in the appropriate `/web/scss/overrides/_fl-*.scss` file
4. If the new class is a shared semantic class, ensure it lives in a file that is included globally — not scoped to one view's stylesheet

### Step 6 — Verify: behavior, layout, and visual are unchanged

After each renamed pattern, check all three:

| Check | How |
| ----- | --- |
| **Visual** | Load the page — does it look identical? Compare spacing, colors, typography, borders |
| **Layout** | Resize the viewport — does responsive behavior hold? |
| **Behavior** | Interact — do clicks, hovers, form submissions, JS-driven states still work? |

If anything changed, **stop and revert** before continuing. Do not proceed to the next pattern with a known regression.

### Step 7 — Repeat for the next pattern

Once a pattern is verified clean, move to the next one. Work through patterns in this priority order:

1. **Custom utility classes** that duplicate Bootstrap (`text-align-center` → `text-center`, `pb-35rem` → `pb-4`)
2. **Div soup** — replace structural divs with native elements (`<nav>`, `<ul>`, `<table>`, `<button>`)
3. **Component-scoped class names** — strip the prefix, rename to generic semantic class
4. **One-off custom classes** with no shared SCSS — either map to Bootstrap or extract to a shared semantic class

---

## Reducing Template Code with Partials

When a UI pattern appears in **3 or more views**, it should become a reusable partial or widget instead of copied HTML.

**Process:**

1. Extract the repeated HTML into a partial (e.g. `_status-badge.php`, `_action-buttons.php`)
2. Parameterize only what varies (status value, label text, href) — keep the structure fixed
3. Replace all inline copies with the partial call
4. Verify each call site renders identically

**Signals that a pattern is ready to extract:**

- Identical or near-identical block appears in 3+ views
- The block uses only semantic classes (no component-scoped names) — extraction is safe
- Any future visual change to the pattern should propagate everywhere automatically

---

## Refactor Checklist

Before marking a snippet as done:

- [ ] Old class names removed from HTML (no `aml-*`, `kyc-*`, `client-*`, `text-align-*` remnants)
- [ ] Old SCSS selectors removed or renamed — no dead CSS left behind
- [ ] New classes follow the convention: Bootstrap first, then semantic, no appearance-based names
- [ ] SCSS overrides are inside `.facelift-layout` in `/web/scss/overrides/`
- [ ] No hard-coded values — spacing, typography, color, radius, and shadow all reference tokens from `web/scss/abstracts/` (`_spacing`, `_typography`, `_variables`, `_radius`, `_shadow`)
- [ ] Visual, layout, and behavior verified unchanged
- [ ] If the pattern appears 3+ times — extracted to a shared partial
- [ ] If repeated blocks differ only in data — converted to dynamic rendering from a data array (loop)
