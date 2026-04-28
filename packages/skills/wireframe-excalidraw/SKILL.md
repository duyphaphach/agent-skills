---
name: wireframe-excalidraw
description: Turn a markdown brief, screen description, or feature spec into a hand-drawn-looking wireframe by generating an `.excalidraw` scene file via a small Node.js script. Use when the user wants a low-fi sketchy wireframe they can open and edit in Excalidraw (excalidraw.com or the desktop app), or asks for a "sketch", "hand-drawn mockup", or "Excalidraw wireframe". For a deterministic DSL with SVG/PDF export instead, see the sibling skill `wireframe-wire-dsl`.
allowed-tools: Bash(node:*), Bash(mkdir:*), Bash(ls:*), Bash(open:*), Read, Write, Edit
---

# Wireframe with Excalidraw

Generate a wireframe by writing a small Node.js script that emits an `.excalidraw` scene JSON file. The output opens in Excalidraw (web or desktop) where the user can refine, restyle, or export.

> No external dependencies. Pure Node, no npm install. Excalidraw scene format is a JSON document with an `elements` array.

## When to use this skill

Trigger phrases: *Excalidraw wireframe*, *sketchy wireframe*, *hand-drawn mockup*, *low-fi sketch I can edit in the browser*, *open in Excalidraw*. Also use when the user wants to share a wireframe as a single editable file rather than an SVG/PDF.

Do **not** use when the user wants:
- Production HTML/React → wrong tool, they want code.
- Multi-format batch export (SVG/PDF/PNG) → use `wireframe-wire-dsl` instead.
- A live-editable design with components → Figma; out of scope here.

## Workflow

```
markdown brief / spec               input
        ↓
  draft generator script            you write
        ↓
  node generator.mjs                produces .excalidraw
        ↓
  open in Excalidraw                user reviews & edits
```

### 1. Read the brief

Identify per screen:
- **Frame size** (default 1200×900 desktop; 390×844 for mobile)
- **Sections** (header, sidebar, content, footer)
- **Components** (buttons, inputs, tables, cards)
- **Flow arrows** between screens (optional but useful)

### 2. Draft the generator script

Drop a single self-contained `.mjs` file. Copy the **boilerplate** verbatim from [references/helpers.mjs](references/helpers.mjs) at the top of your script (strip the `export` keywords if you're inlining), or import from the helpers file directly. Either way you get the palette, ID/seed helpers, base element factory, all primitives (`rect`, `ellipse`, `text`, `line`, `arrow`, `frame`), and composites (`button`, `inputField`, `selectField`, `checkbox`, `radio`, `radioGroup`, `breadcrumbs`, `card`, `tableEl`, `imagePlaceholder`, `stat`).

Then add **screen builder functions** that return arrays of elements, a **frame layout** that positions each screen on the canvas, and an **emit** block that writes the `.excalidraw` JSON.

Minimum viable script:

```js
#!/usr/bin/env node
// {paste contents of references/helpers.mjs here, removing `export` keywords}

function welcomeScreen(ox, oy) {
  const els = [];
  els.push(text("Welcome", ox + 40, oy + 40, { fontSize: 28 }));
  els.push(text("Sign in to continue", ox + 40, oy + 80, { fontSize: 14, strokeColor: C.muted }));
  els.push(...inputField(ox + 40, oy + 120, 320, "Email", "you@example.com"));
  els.push(...inputField(ox + 40, oy + 200, 320, "Password", "••••••••"));
  els.push(...button(ox + 40, oy + 280, 320, 44, "Sign in", { variant: "primary" }));
  return els;
}

const f1 = frame(0, 0, 1200, 900, "Welcome");
const elements = [f1];
const tagAndPush = (frameEl, els) => { for (const e of els) { e.frameId = frameEl.id; elements.push(e); } };
tagAndPush(f1, welcomeScreen(0, 0));

import fs from "node:fs";
fs.writeFileSync("out.excalidraw", JSON.stringify({
  type: "excalidraw", version: 2, source: "wireframe-excalidraw",
  elements, appState: { viewBackgroundColor: "#ffffff", gridSize: null }, files: {}
}, null, 2));
console.log(`Wrote ${elements.length} elements → out.excalidraw`);
```

### 3. Run it

```bash
node generator.mjs
# → out.excalidraw written
```

### 4. Validate

Open `out.excalidraw` in Excalidraw to confirm it loads:
- excalidraw.com → File → Open → select the file
- Or `open out.excalidraw` on macOS if the desktop app is installed

If JSON is malformed Excalidraw will refuse to load. The most common cause is a missing field in an element — every element needs the keys produced by `make()` in the helpers.

### 5. Deliver

Reply with:

1. The path to the generated `.excalidraw` file.
2. Optionally the source `.mjs` script alongside (so the user can re-run / modify).
3. A 2-3 line summary of the screens and any assumptions you made.

## Default style — cool-anchored, contextually rich

Match the wire-dsl skill's defaults: low-fi but visually differentiated. Pure grey-on-white reads as blank; the palette in `references/helpers.mjs` anchors on cool blue/slate but uses state hues (teal, amber, red) so semantic intent is visible at a glance.

- `C.ink` (#0f172a) — text, crisp borders (deeper than pure black)
- `C.muted` (#475569) — secondary text
- `C.faint` (#94a3b8) — labels, frames
- `C.border` (#cbd5e1) — input/card borders
- `C.panel` (#f8fafc) — surfaces, **subtly tinted** (not stark white)
- `C.hatch` (#e2e8f0) — table rows, image placeholders
- `C.primary` (#1d4ed8) — primary actions (blue-700, draws the eye)
- `C.success` (#0d9488) — teal, distinct from primary
- `C.warning` (#b45309) — restrained amber
- `C.danger` (#b91c1c) — recognizable red
- `C.info` (#0284c7) — sky-600 accent

The two warm tones (`warning` + `danger`) are the only departures from strict cool — they're there because state semantics outweigh aesthetic purity. If the user wants strict monochrome (no warm hues), point them at swapping `C.warning` and `C.danger` to slate-600/-800.

If the user wants brand color, swap `C.primary` to their hex and keep the rest as-is.

## Reference files

| File | When to read |
|------|-------------|
| [references/helpers.mjs](references/helpers.mjs) | Boilerplate to copy into every generator script |
| [references/cheatsheet.md](references/cheatsheet.md) | Excalidraw element schema (rectangle, ellipse, text, line, arrow, frame) and required fields |
| [references/components.md](references/components.md) | Composite component catalog, intrinsic heights, `line()` 2-point caveat |
| [references/patterns.md](references/patterns.md) | Login, dashboard, sidebar shell, mobile, multi-frame, faked tabs, state matrix, responsive triptych, branching wizard |
| [references/troubleshooting.md](references/troubleshooting.md) | Common errors when Excalidraw fails to load the file |

## Test cases

Scenario briefs live in [cases/](cases/) — pick one when you need a benchmark of what this skill should be able to handle:

- [01-multi-screen-flow.md](cases/01-multi-screen-flow.md) — 4-frame e-commerce flow with arrows (complex)
- [02-state-matrix.md](cases/02-state-matrix.md) — 4-frame default/loading/empty/error dashboard (very-complex)
- [03-responsive-comparison.md](cases/03-responsive-comparison.md) — same product page at 3 viewport widths with `assertFits` (very-complex)

Cases describe the brief; agents generate output to `/tmp/` (artifacts don't ship with the skill).

## Self-check before delivering

- [ ] `node <script>.mjs` runs to completion (no syntax/runtime errors)
- [ ] The `.excalidraw` file is valid JSON (`node -e 'JSON.parse(fs.readFileSync("out.excalidraw"))'`)
- [ ] Element count is reasonable (~50-300 for a typical multi-screen wireframe)
- [ ] Each screen lives inside a `frame` so it's groupable in Excalidraw
- [ ] Frames are far enough apart (gap of ≥100px) that overlap doesn't happen
- [ ] No invented helpers — only used what's in references/helpers.mjs
