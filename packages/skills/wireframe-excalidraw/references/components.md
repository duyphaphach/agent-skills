# Composite component catalog

These all live in `references/helpers.mjs`. Use them — don't reinvent them.

## Buttons

```js
button(x, y, w, h, label, { variant, fontSize })
```

| Variant | Fill | Use |
|---------|------|-----|
| `primary` | blue-700 | strong call-to-action |
| `secondary` | panel + dark border | neutral action |
| `success` | teal-600 | "saved", "complete", confirmation |
| `warning` | amber-700 | caution, non-destructive risk |
| `danger` | red-700 | destructive (delete, revoke, etc.) |
| `info` | sky-600 | informational accent |
| `ghost` | transparent | tertiary / link-like |

`fontSize` defaults to 14. Returns 2 elements (rect + text).

## Inputs

```js
inputField(x, y, w, label, placeholder)
selectField(x, y, w, label, value)
checkbox(x, y, label, checked)
radio(x, y, label, checked)
radioGroup(x, y, groupLabel, [options], selectedOption)
```

`inputField` / `selectField` height is fixed at 36px + 18px label band → ~54px total.
`checkbox` / `radio` are 16px squares with label to the right.
`radioGroup` lays radios horizontally, auto-spaced by label length.

## Containers

```js
card(x, y, w, h, { backgroundColor, ... })
imagePlaceholder(x, y, w, h, altText)   // hachure-filled rect with X marks
breadcrumbs(x, y, ["Home", "Section", "Page"])
stat(x, y, title, value, big = false)   // label + number, big=true for hero stats
```

## Tables

```js
tableEl(x, y, w, h, ["Col1", "Col2", "Col3"], rowCount)
```

Hatched header strip + hatched cell placeholders to suggest content. `rowCount` defaults to 3.

## State indicators

```js
skeleton(x, y, w, h)                        // hachure-filled rect, opacity 70 — "loading" placeholder
alertBanner(x, y, w, message, { variant }) // info | warning | danger | success
emptyState(x, y, w, headline, sub, ctaLabel)  // illustration + headline + sub + optional CTA button
tabStrip(x, y, [labels], active, { fontSize })  // header pills with one active; underline beneath
```

`alertBanner` returns 3 elements (background rect + icon ellipse + message text).
`tabStrip` doesn't render bodies — it's only the strip. Render the active tab's body inline below it.

## Layout overflow guard (dev-only)

```js
const r = assertFits(frameEl, els, { name: "Mobile" });
// r.ok === false ? r.overflows lists which elements escape the frame
// Set WIREFRAME_STRICT=1 in env to log warnings.
```

Use during development to catch silent overflow on narrow viewports. Doesn't mutate the scene.

## Intrinsic heights (budget your vertical space)

These component heights are fixed by `helpers.mjs`. Account for them when packing dense screens — especially mobile (390×844 has only ~720px of usable content area):

| Helper | Vertical footprint |
|--------|-------------------|
| `inputField` (with label) | 54px (18 label + 36 field) |
| `inputField` (no label) | 36px |
| `selectField` | same as `inputField` |
| `checkbox` / `radio` | 16px (label is right-aligned, no extra height) |
| `radioGroup` | ~60px (label + radios row) |
| `button` (default) | given `h` (typical 40-48px) |
| `breadcrumbs` | ~16px (single line) |
| `stat` | 18 + fontSize (≈40-44 default; ≈44-50 with `big: true`) |
| `tableEl` | as given by `h` (header is fixed 36px; rows split remainder evenly) |
| `imagePlaceholder` | as given |
| `alertBanner` | 56px |

`radioGroup` lays out **horizontally** with no wrap. Total width grows as `Σ (28 + label.length × 9)`. On a 342px-wide mobile inner area, three labels of >8 chars overflow silently. Use vertical `radio` calls instead.

## Frames (per-screen container)

```js
const f = frame(x, y, w, h, "ScreenName")
const elements = [f]
tagAndPush(f, screenBuilder(x, y), elements)
```

Standard frame sizes:

| Size | w × h | Use |
|------|-------|-----|
| Desktop | 1200 × 900 | Default |
| Wide desktop | 1440 × 1024 | Dashboards with sidebars |
| Tablet | 1024 × 768 | Tablet apps |
| Mobile | 390 × 844 | Phone screens |

Place frames on a grid with **≥100px gap** between them so flow arrows have room.

## Flow arrows between screens

```js
arrow(x1, y1, x2, y2, { strokeColor, strokeStyle, points })
```

For straight arrow: omit `points`.
For multi-segment: provide `points` as relative offsets from `(x1, y1)`:

```js
arrow(1900, 905, 600, 1000, {
  points: [[0, 0], [0, 55], [-1300, 55], [-1300, 95]],
})
```

Arrow color defaults to `C.muted` (slate-500) — change to `C.danger` for emphasis.

## What you DO NOT have helpers for (write inline)

The helpers cover the 80% case. For these, write small inline blocks using primitives:

- **Avatars**: `ellipse(x, y, 32, 32, { fillStyle: "solid", backgroundColor: C.hatch })` + initials text on top.
- **Badges**: small `rect` with `roundness: {type: 3}` + `text` centered.
- **Icons**: 1-3 `line`s arranged into a shape, OR `polyline(x, y, points)` for a single multi-segment stroke.
- **Custom illustrations**: combine primitives.

### `line()` is 2-point only — use `polyline()` for multi-segment

`line(x1, y1, x2, y2)` only draws one segment. For sad-faces, zigzags, custom icons, use `polyline(x, y, points)` where `points` is an array of `[dx, dy]` pairs relative to `(x, y)`:

```js
// Sad-mouth curve as 5 points
polyline(40, 100, [[0, 0], [10, -8], [20, -10], [30, -8], [40, 0]], { strokeColor: C.muted });
```

Don't reach for image embeds — Excalidraw can include base64 images via the `files` map but it bloats the output and isn't worth it for a wireframe.

## Naming rule

When writing a screen builder:

```js
function loginScreen(ox, oy) {
  const els = []
  // ... ox/oy is the frame's top-left
  return els
}
```

`ox`/`oy` makes positioning relative to the frame — keeps screen builders portable when you re-arrange the canvas.
