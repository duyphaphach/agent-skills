# wire-dsl troubleshooting

Run `wire validate <file>` first. Most errors fall into one of these buckets.

## "Unexpected token" / parse errors

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Error at a property with quotes around a variant | `variant: "primary"` | Variants are bare: `variant: primary` |
| Error at a list value with brackets | `items: ["A","B"]` | Use a string: `items: "A,B"` |
| Error at a numeric prop | `rows: "4"` | Numbers are bare: `rows: 4` |
| Error at end of layout | Missing closing `}` | Match opening/closing braces |
| Error before `screen` | Missing `style { }` block in `project` | Add a `style` block |

## "Unknown component" / "Unknown variant"

You used a name the parser doesn't know. Check `references/components.md`. Common slip-ups:

- `Card` is a **layout** (`layout card(...)`), not a component.
- `Form` doesn't exist — wrap inputs in `layout panel` or `layout stack`.
- `Modal` is a **layout**, not a component (`layout modal(...) { body { } footer { } }`).

## "split layout requires exactly 2 children"

`split` is strictly two children. If you need three regions, nest:

```wire
layout split(left: 240) {
  component SidebarMenu ...
  layout stack(direction: vertical, gap: md, padding: md) {
    component Topbar title: "..."
    // main content here
  }
}
```

## Padding looks wrong / everything is flush

Layouts default to **0 padding**. Set it explicitly on every layout that needs breathing room:

```wire
layout stack(direction: vertical, gap: md, padding: lg) { ... }
```

## "Circular definition reference"

A `define Component` or `define Layout` references itself transitively. Break the cycle.

## `[layout-children-arity] Layout "X" expects exactly one child`

You invoked a `define Layout` (e.g. `AppShell`) and passed multiple direct children into the `component Children` slot. The slot accepts **exactly one** node. `wire validate` accepts multi-child invocations; `wire render` rejects them.

Wrong:

```wire
layout AppShell(width: 240, ...) {
  component Topbar title: "Users"
  component Table columns: "..." rows: 8     // ← 2 children → render fails
}
```

Right — wrap in a single root layout:

```wire
layout AppShell(width: 240, ...) {
  layout stack(direction: vertical, gap: md, padding: lg) {
    component Topbar title: "Users"
    component Table columns: "..." rows: 8
  }
}
```

See [patterns.md §6](patterns.md) for the canonical `define Layout` reuse pattern.

## Render produces empty pages

Each screen needs at least one component inside its root layout. Empty layouts render as blank rectangles.

## CLI flag confusion

- `-o`/`--out` auto-detects format from extension (`.svg` `.pdf` `.png`).
- Use `--svg` / `--pdf` / `--png` to force.
- For PNG with multiple screens, pass a **directory**, not a file.
- `-s <Screen>` renders one screen by name (CamelCase, exact match).

## "Command not found: wire"

Engine isn't installed globally. Either:

```bash
npm install -g @wire-dsl/cli
```

…or invoke without installing:

```bash
npx @wire-dsl/cli render file.wire --svg out.svg
```

## Verifying versions

```bash
wire --version
node --version    # needs 20+
```
