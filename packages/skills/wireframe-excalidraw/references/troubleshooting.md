# Troubleshooting

## "Excalidraw refuses to load my file"

Almost always invalid JSON or a missing required field on an element.

Checklist:

```bash
# Is the file even valid JSON?
node -e 'JSON.parse(require("fs").readFileSync("out.excalidraw","utf8"))'

# Inspect the first element — every required field present?
node -e 'const d=JSON.parse(require("fs").readFileSync("out.excalidraw","utf8")); console.log(Object.keys(d.elements[0]))'
```

You should see at minimum: `id index type x y width height angle strokeColor backgroundColor fillStyle strokeWidth strokeStyle roughness opacity groupIds frameId roundness seed version versionNonce isDeleted boundElements updated link locked`. If any are missing, check that you used `make()` from `helpers.mjs` to construct the element instead of building a raw object.

## "Elements show up but are misaligned / overlapping"

- Frame coordinates are absolute, not relative. If you have multiple frames, space them apart on the canvas (e.g., `frame(0, 0, ...)`, `frame(1300, 0, ...)`).
- Screen builders take `(ox, oy)` and treat all positions as `ox + something`. Double-check that you're passing the frame's top-left as `(ox, oy)`.

## "Text is the wrong size or wrapping weirdly"

- `text()` auto-computes `width` from the longest line if you don't pass one. For multi-line or centered text, pass `{ width: ..., textAlign: "center" }` explicitly.
- `fontFamily` is a number (1/2/3), not a string. Use the `FONT` constant.

## "Arrow goes to the wrong place"

`arrow(x1, y1, x2, y2)` uses `(x1, y1)` as origin and `points` are **relative** offsets. If you provide custom `points`:

```js
arrow(100, 100, 300, 200, {
  points: [[0, 0], [50, 0], [50, 100], [200, 100]],   // ⊥ shape from (100,100) → (300,200)
})
```

The first point should be `[0, 0]` and subsequent points are deltas from `(x1, y1)`, not from the previous point.

## "Element is inside the frame visually but doesn't move with it"

You forgot `frameId`. The element is just floating on the canvas at the same coordinates. Use `tagAndPush(frame, els, elements)` so each element gets `frameId = frame.id` before being added.

## "The output is huge"

Element counts in the low hundreds are normal. If you're past 1000 elements, you're probably:

- Drawing per-character text (don't — Excalidraw renders strings natively)
- Generating dense placeholder content (use a single `imagePlaceholder` per visual, not 50 lines of hatch)
- Including multiple flow-arrow waypoints unnecessarily

Aim for under 500 elements per screen, under 2000 total for a multi-screen flow.

## "I want to import this back into Excalidraw and edit"

Open `out.excalidraw` in:

- excalidraw.com → File → Open
- The Excalidraw desktop app
- VS Code with the Excalidraw extension

The format round-trips: any edits you make in the GUI and re-export will produce a valid file you can re-load.

## "I want a PNG or SVG"

Open in Excalidraw → File → Export → choose PNG or SVG. There's no headless CLI export (Excalidraw is browser-based for rendering). For headless export, use `wireframe-wire-dsl` instead.
