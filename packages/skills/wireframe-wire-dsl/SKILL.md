---
name: wireframe-wire-dsl
description: Turn a markdown brief, screen description, or feature spec into a wire-dsl `.wire` wireframe and render it to SVG/PDF/PNG via the local `wire` CLI. Use when the user asks for a wire-dsl wireframe specifically, OR when they want a deterministic text-based wireframe DSL with multi-format export (SVG/PDF/PNG). For a hand-drawn-looking, edit-in-browser alternative, see the sibling skill `wireframe-excalidraw`.
allowed-tools: Bash(wire:*), Bash(npx:*), Bash(mkdir:*), Bash(ls:*), Bash(open:*), Read, Write, Edit
---

# Wireframe with wire-dsl

Generate **wireframes-as-code** from a markdown brief or freeform description. The skill produces a `.wire` file in [WireDSL](https://github.com/Wire-DSL/wire-dsl) syntax and renders it locally via the `wire` CLI.

> Engine assumed installed. Verify with `wire --version`. If missing: `npm install -g @wire-dsl/cli`.

## When to use this skill

Trigger on phrases like: *wireframe*, *mockup*, *mock up*, *sketch*, *prototype*, *low-fi design*, *screen flow*, *draw the UI for…*, *what would the screen look like for…*. Also use when the user pastes a feature spec / PRD / markdown brief and asks for visuals.

Do **not** use when the user wants production code (HTML/React) — wire-dsl outputs static wireframes, not implementations.

## Workflow

```
markdown brief / spec          input
        ↓
  draft .wire file              you write
        ↓
  wire validate <file>          syntax check
        ↓
  wire render <file> -o <path>  SVG / PDF / PNG
        ↓
  show artifact path + summary  deliver
```

### 1. Read the brief

Pull the input from the IDE-open file, a path the user gave, or the conversation. Identify per screen:

- **Purpose** (what user task it serves)
- **Sections** (header, sidebar, content panels, footer)
- **Components** (forms, tables, cards, charts, buttons)
- **Actions** (navigation between screens, modal triggers)

If the brief is too thin to wireframe meaningfully, ask one focused question — e.g. *"Is this a single screen or a flow? Any sidebar nav?"* — before drafting.

### 2. Draft the `.wire` file

Follow the rules in [references/dsl-cheatsheet.md](references/dsl-cheatsheet.md). Minimum viable file:

```wire
project "ProjectName" {
  style {
    density: "normal"
    spacing: "md"
    radius: "md"
    stroke: "normal"
    font: "base"
  }

  colors {
    primary:   #1d4ed8
    secondary: #64748b
    success:   #0d9488
    warning:   #b45309
    danger:    #b91c1c
    info:      #0284c7
    accent:    primary
  }

  screen Home {
    layout stack(direction: vertical, gap: md, padding: lg) {
      component Heading text: "Welcome"
      component Button text: "Get Started" variant: primary
    }
  }
}
```

#### Default style — cool-anchored, contextually rich

Wireframes still need to be low-fi, but pure-grey monochrome leaves the renderer producing visually-flat output that reads as "just white" — primary, secondary, success and warning buttons all look the same. Default to the palette above instead: a cool blue primary anchors the scheme, and state hues (success teal, warning amber, danger red) provide enough contrast that semantic intent is visible at a glance.

- Strong actions: `variant: primary` (blue-700) — draws the eye
- Secondary actions: `variant: secondary` (slate-500) — neutral
- Success states: `variant: success` (teal-600) — cool green, distinct from primary
- Destructive actions: `variant: danger` (red-700) — recognizable
- Cautions: `variant: warning` (amber-700) — restrained warm
- Informational: `variant: info` (sky-600)

The two warm tones (warning + danger) are the only departures from strict cool — they're there because state semantics outweigh aesthetic purity. If the user wants strict monochrome (no warm hues), tell them and only swap `warning` and `danger` to slate-600 and slate-800.

If the user wants brand color, swap `primary` to their hex (bare, no quotes) and keep the rest of the palette as-is.

**Hex syntax reminder:** values inside `colors { }` are bare tokens (`#334155`), not strings (`"#334155"`). Quoted hex passes `wire validate` but fails `wire render`.

**Hard rules** (from the wire-dsl LLM-prompting guide):

- Every file needs `project { style { ... } screen X { ... } }`. One root layout per screen.
- Strings in double quotes. Numbers and booleans bare: `12`, `true`.
- **Layouts have 0 padding by default — set it explicitly.**
- Use design tokens for spacing/gap/padding: `xs sm md lg xl`.
- Screen names are CamelCase and case-sensitive.
- `split` requires exactly 2 children; `grid` is 12-column.
- Don't invent components/variants — see the catalog in [references/components.md](references/components.md).

### 3. Validate

```bash
wire validate path/to/file.wire
```

Fix any errors before rendering. Common ones are listed in [references/troubleshooting.md](references/troubleshooting.md).

### 4. Render

Default output directory: `./wireframes/` (create if missing). Choose format by intent:

```bash
# Single screen → SVG (sharp, scales, good for review)
wire render brief.wire --svg ./wireframes/brief.svg

# Multi-screen flow → PDF (one file, page per screen)
wire render brief.wire --pdf ./wireframes/brief.pdf

# Pasteable raster → PNG (directory, one per screen)
wire render brief.wire --png ./wireframes/png/

# Render only one screen
wire render brief.wire -s Dashboard --svg ./wireframes/dashboard.svg

# Mobile viewport (390 wide, height auto-extends to fit content)
wire render brief.wire --width 390 --height 844 --svg ./wireframes/mobile.svg

# Sketch-style "hand-drawn" look (great for early-stage low-fi)
wire render brief.wire --renderer sketch --svg ./wireframes/sketch.svg

# Dark theme
wire render brief.wire --theme dark --svg ./wireframes/dark.svg
```

- `--renderer` accepts `standard | skeleton | sketch`. `--theme` accepts `light | dark`.
- `--width N` sets the page width exactly. `--height N` sets a **minimum** — content taller than `N` causes the renderer to auto-extend the viewport vertically. To preview a true mobile crop, use `--width 390` and accept that pages may exceed 844px.
- `Image type: landscape` ignores viewport width and emits an internal rect ≈1228px wide; it overflows narrow viewports. Use `type: square` or `type: avatar` on mobile.

### 5. Deliver

Reply with:

1. The `.wire` source in a fenced ```wire code block (so it's reviewable inline in markdown).
2. The path(s) of the rendered artifact(s).
3. A 2-3 line summary of the screens and any assumptions you made.

If the user is on macOS and asked to preview, offer `open <path>` — don't run it without consent.

## Markdown ↔ wire-dsl

`.wire` files are plain text and embed cleanly in markdown via ```wire fences. When the user wants the wireframe **inline in a markdown doc** (e.g. a spec or PRD), produce both:

- the fenced ```wire block in the doc, and
- the rendered SVG saved alongside, referenced as `![...](./wireframes/x.svg)`.

## Reference files

| File | When to read |
|------|-------------|
| [references/dsl-cheatsheet.md](references/dsl-cheatsheet.md) | Layout primitives, style tokens, event syntax, `define Layout` invocation |
| [references/components.md](references/components.md) | Full component catalog with props |
| [references/patterns.md](references/patterns.md) | Ready-to-adapt snippets: form, dashboard, sidebar app, modal, tabs workaround, `define Layout` reuse, branching wizard |
| [references/troubleshooting.md](references/troubleshooting.md) | Common parser/render errors and fixes |

## Test cases

Scenario briefs live in [cases/](cases/) — pick one when you need a benchmark of what this skill should be able to handle:

- [01-ecommerce-checkout.md](cases/01-ecommerce-checkout.md) — 4-screen linear flow (medium)
- [02-saas-admin.md](cases/02-saas-admin.md) — 8-screen admin with `define Layout` reuse (very-complex)
- [03-branching-wizard.md](cases/03-branching-wizard.md) — 10-screen onboarding with conditional branches (very-complex)

Cases describe the brief; agents generate output to `/tmp/` (artifacts don't ship with the skill).

## Self-check before delivering

- [ ] `wire validate` passes
- [ ] Every layout has explicit `padding`
- [ ] No invented components or variants
- [ ] Screen names are CamelCase
- [ ] Rendered file actually exists at the path you cite
- [ ] Source `.wire` is shown in the reply so the user can edit it
