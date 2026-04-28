# wire-dsl cheatsheet

Compact reference for drafting `.wire` files. For the canonical spec see `docs/DSL-SYNTAX.md` in the wire-dsl repo.

## File skeleton

```wire
project "Name" {
  style { ... }
  colors { ... }      // optional
  screen ScreenA { layout ... { ... } }
  screen ScreenB { layout ... { ... } }
}
```

One root layout per screen. Multiple screens are rendered as separate pages/files.

## Style block

```wire
style {
  density: "compact" | "normal" | "comfortable"
  spacing: "xs" | "sm" | "md" | "lg" | "xl"
  radius:  "none" | "sm" | "md" | "lg"
  stroke:  "thin" | "normal" | "thick"
  font:    "sm" | "base" | "lg"
}
```

## Colors block (optional)

**Hex values are bare tokens — no quotes.** Quoting hex (`primary: "#334155"`) parses through `wire validate` but fails at render with `Expecting [HexColor] or [Identifier] but found '"#..."'`.

```wire
colors {
  primary:   #1d4ed8     // blue-700 — strong primary action
  secondary: #64748b     // slate-500 — neutral mid-tone
  success:   #0d9488     // teal-600 — cool, distinct from primary
  warning:   #b45309     // amber-700 — restrained warm
  danger:    #b91c1c     // red-700 — recognizable destructive
  info:      #0284c7     // sky-600 — informational accent
  accent:    primary
}
```

Variant names that resolve against this block: `default | primary | secondary | success | warning | danger | info`.

**Default palette for this skill — cool-anchored with contextual state hues.** Primary lives in the blue/cool family (the eye-catching half of the spectrum); danger and warning use restrained warm tones because users expect those state colors visually. Use unless the user specifies a different palette. See [SKILL.md → Default style](../SKILL.md) for the rationale.

## Layout primitives

| Layout | Required props | Optional props | Notes |
|--------|---------------|----------------|-------|
| `stack(direction, gap, padding)` | `direction: vertical\|horizontal` | `gap`, `padding`, `justify`, `align` | Flex-like |
| `grid(columns, gap)` | `columns: 12` | `gap`, `padding` | 12-col; children are `cell span: N { ... }` |
| `split(left: <px>)` or `split(right: <px>)` | one of `left`/`right` | `border`, `background` | **Exactly 2 children** |
| `card(padding, gap)` | — | `radius`, `border` | Self-padded container |
| `panel(padding)` | — | `background`, `radius`, `border` | Styled box |
| `modal(...)` | — | `body { ... }`, `footer { ... }` | Overlay |
| `tabs(...)` | — | `tab { ... }` blocks (no label) | ⚠ See "Tabs caveat" below |

`stack` `justify` values: `stretch | start | center | end | spaceBetween | spaceAround`.
`stack` `align` values: `start | center | end | stretch` (cross-axis).

### Tabs caveat (wire-dsl 0.0.1)

Tabs in the current renderer are unreliable:

- Only `tab { ... }` (no label) parses — `tab "Label" { }` passes `wire validate` but fails `wire render`.
- Even with bare `tab { }`, the renderer hardcodes pill labels as `Tab 1/2/3` and ignores `component Tabs tabs: "..."`.
- Only the **first** `tab { }` body is drawn; bodies 2..N are silently dropped.

**Workaround for multi-tab views**: render only the active tab's content inline (use `component Tabs` for the strip + a `panel` for the active body). For multi-body views, use separate screens linked by `navigate(...)`. See patterns.md §5.

**Layouts have 0 padding by default.** Always set `padding:` unless you want flush edges.

## Event syntax

```wire
component Button text: "Save" onClick: navigate(Confirmation)
component Button text: "Open" onClick: show(modal_settings)
component Button text: "Close" onClick: hide(self)
component List items: "A,B,C" onItemsClick: "ScreenA,ScreenB,ScreenC"
```

Actions: `navigate(Screen)`, `show(id)`, `hide(id)`, `toggle(id)`, `setTab(tabsId, index)`, `self`.
Chain with `&`: `onClick: show(m1) & hide(p2) & navigate(Next)`.

## Custom definitions

Reusable component:

```wire
define Component "MenuBar" {
  component SidebarMenu items: prop_items active: prop_active
}
```

Reusable layout (use `component Children` as the slot):

```wire
define Layout "AppShell" {
  layout split(left: prop_width) {
    component SidebarMenu items: prop_items active: prop_active
    component Children
  }
}
```

`prop_*` is reserved for binding inside `define` blocks.

**Invocation syntax** — call the defined layout from inside a screen exactly as you would a built-in layout primitive, passing props as parens args:

```wire
screen UsersList {
  layout AppShell(width: 240, items: "Users,Roles,Settings", active: "Users") {
    layout stack(direction: vertical, gap: md, padding: lg) {
      component Topbar title: "Users"
      component Table columns: "Name,Email,Role" rows: 8
    }
  }
}
```

The screen's content goes where `component Children` was declared. **The slot accepts exactly one child** — wrap multi-element bodies in a single `layout stack(...)` (or other root layout). Passing multiple direct children produces `[layout-children-arity] Layout "X" expects exactly one child` at render time even though `wire validate` accepts it. Reuse the same `AppShell` across many screens, varying `active` per screen so the sidebar highlights correctly.

## Comments

```wire
// line comment
/* block */
/** doc-style block */
```

All stripped at compile time.

## Naming

- Screen names: CamelCase, must match `[a-zA-Z_][a-zA-Z0-9_]*`.
- IDs (for `show`/`hide`/`toggle` targets): same pattern.
- No circular `define` references.
- No absolute positioning — layouts only.
