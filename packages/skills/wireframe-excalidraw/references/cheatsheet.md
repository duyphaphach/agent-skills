# Excalidraw element schema cheatsheet

Excalidraw scenes are JSON documents with this shape:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "your-script.mjs",
  "elements": [ /* array of element objects */ ],
  "appState": { "viewBackgroundColor": "#ffffff", "gridSize": null },
  "files": {}
}
```

## Required fields on every element

Every element produced by `make()` in `helpers.mjs` carries these:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique within the scene |
| `index` | string | Z-order — Excalidraw uses fractional-index strings |
| `type` | string | `rectangle | ellipse | line | arrow | text | frame` |
| `x`, `y` | number | Top-left corner in scene coords |
| `width`, `height` | number | Bounding box |
| `angle` | number | Radians, default 0 |
| `strokeColor` | hex string | Border / line color |
| `backgroundColor` | hex string or `"transparent"` | Fill color |
| `fillStyle` | enum | `solid | hachure | cross-hatch` |
| `strokeWidth` | number | 1 default, 2 for emphasis |
| `strokeStyle` | enum | `solid | dashed | dotted` |
| `roughness` | 0/1/2 | 0 = clean, 1 = default sketchy, 2 = very sketchy |
| `opacity` | 0–100 | |
| `groupIds` | string[] | Empty array OK |
| `frameId` | string \| null | Set to a frame's id to nest the element inside it |
| `roundness` | `{type:2}` / `{type:3}` / null | type 3 = rounded corner; null = sharp |
| `seed` | int | Excalidraw uses for hand-drawn variation |
| `version` | int | 1 |
| `versionNonce` | int | Random; helpers use `seed()` |
| `isDeleted` | bool | false |
| `boundElements` | null \| array | Used for arrow bindings |
| `updated` | int | 1 |
| `link` | null \| string | URL link |
| `locked` | bool | false |

## Type-specific extras

**rectangle / ellipse** — no extras beyond the base.

**line / arrow:**
```js
{
  ...base,
  type: "line" | "arrow",
  points: [[0,0], [dx,dy], ...],   // relative to x,y
  lastCommittedPoint: null,
  startBinding: null, endBinding: null,
  startArrowhead: null, endArrowhead: "arrow" | null,
  roundness: { type: 2 },
}
```

**text:**
```js
{
  ...base,
  type: "text",
  text: "...",
  originalText: "...",   // same as text
  fontSize: 14,
  fontFamily: 1,         // 1=Virgil, 2=Helvetica, 3=Cascadia
  textAlign: "left" | "center" | "right",
  verticalAlign: "top" | "middle" | "bottom",
  baseline: round(fontSize * 0.85),
  containerId: null,     // null unless bound to a shape
  lineHeight: 1.25,
  autoResize: true,
}
```

**frame:**
```js
{
  ...base,
  type: "frame",
  name: "ScreenName",
  customData: null,
  strokeColor: "#94a3b8",   // muted border
  backgroundColor: "transparent",
  roundness: null,
}
```

To put an element "inside" a frame: set `element.frameId = frame.id` after creating both. The `tagAndPush` helper does this.

## fillStyle visual cheat

| `fillStyle` | Effect |
|-------------|--------|
| `solid` | Solid fill (with `backgroundColor`) |
| `hachure` | Diagonal lines — good for image placeholders |
| `cross-hatch` | Crossed diagonals — good for table headers, "todo" zones |
| `zigzag` | Wavy fill |

## Coordinate system

- `(0, 0)` is upper-left of the canvas.
- Positive Y goes down.
- Frames are containers — children render relative to canvas, not relative to the frame.

## Common gotchas

- **`frameId` must be set AFTER both elements exist.** The frame's id is generated during `frame(...)` call. Use `tagAndPush(frame, els, elements)` so children are tagged correctly.
- **`fontFamily` is a number, not a string.** Use the `FONT` constant.
- **`points` for `line`/`arrow` is relative to the element's `x,y`.** First point is usually `[0, 0]`.
- **`backgroundColor: "transparent"` keeps fills empty.** A literal hex with `fillStyle: "solid"` fills the shape.
- **Don't omit any base field.** Excalidraw is permissive but missing `seed`, `versionNonce`, or `index` can cause render glitches. The `make()` factory ensures all are present.
