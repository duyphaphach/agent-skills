# Case 03 — Responsive comparison triptych

**Tier**: very-complex (3 frames, content repacking per breakpoint, must use `assertFits`)

## Brief

Build a single self-contained generator script that emits an `.excalidraw` scene with 3 frames in a horizontal row, all showing the same product page at different viewport widths. Parameterize a `productPage(ox, oy, w)` function that adapts layout based on `w`. Run `assertFits` on each frame after building it; if `assertFits` reports overflow, the script must adjust layout (e.g., shrink hero image, reduce paddings) before emitting — overflow at emit time is a fail.

Frames in a horizontal row (≥100px gap):

- **Desktop** (1440×1024 at x=0): topbar (logo, search, cart icon+badge), breadcrumbs, image-left + details-right split (image ~560×560), related-products row (4 cards) at the bottom.
- **Tablet** (768×1024 at x=1640): same content repacked — image-on-top + details-below (image ~320×320), related-products row reduces to 3 cards.
- **Mobile** (390×844 at x=2508): fully stacked — small hero (~342×220), details below, primary + secondary buttons stacked vertically (not side-by-side), related-products as a 2-card row.

Same logical content across all 3 frames: title "Wireless Headphones", price "$129.00", quantity input, color radio set (3 options), size select, "Add to cart" + "Buy now" buttons.

Add a label text above each frame ("Desktop 1440" / "Tablet 768" / "Mobile 390") at fontSize 18, muted.

Use the documented cool monochrome palette and helpers. Inline the helpers verbatim. **The script must call `assertFits(frame, frameElements, { name })` for each frame.** If any returns `ok: false` AT EMIT TIME, the case fails.

For the mobile breakpoint, do NOT use `radioGroup` for the color options — it auto-overflows narrow frames. Use vertical `radio` calls instead.

## Acceptance criteria

- `node <script>.mjs` exits 0.
- Output JSON parses without error.
- Element count between 120 and 280.
- All 3 frames present at the specified positions.
- `productPage(ox, oy, w)` is defined exactly once and called 3 times.
- `assertFits(...)` is called for each frame; all 3 return `{ ok: true }`.
- No `radioGroup` call inside the mobile (390-wide) branch.

## What this case tests

- Responsive parameterization across 3 widths.
- Layout overflow detection via `assertFits`.
- Awareness of intrinsic component heights (mobile budget tightness).
- Knowing not to use `radioGroup` on narrow frames.
