# Case 01 — Multi-screen flow with arrows

**Tier**: complex (4 frames + flow arrows + canvas title)

## Brief

Build a single self-contained generator script that emits an `.excalidraw` scene with 4 frames laid out in a 2×2 grid, modelling an e-commerce checkout flow. Add flow arrows between frames and a floating canvas title.

Frames (each 1200×900):

1. **ProductList** at (0, 0) — topbar (logo, cart icon + badge "3"), 3-column grid of 6 product cards (image, name, price, "Add to cart" button).
2. **ProductDetail** at (1300, 0) — breadcrumbs, large image left (~480×480), right side stacked: title, price, qty Input, color radioGroup (Black/Silver/Navy), size selectField, "Add to cart" primary button, "Buy now" secondary button.
3. **Cart** at (0, 1000) — title, line-items tableEl (Product/Qty/Price/Subtotal, 3 rows), order summary card with stat for subtotal/tax/total, "Checkout" primary button.
4. **Checkout** at (1300, 1000) — breadcrumbs, shipping form (left card), payment form (right card), order-summary card spanning bottom with 3-row table, "Place order" primary button.

Flow arrows:
- ProductList → ProductDetail (straight, right-edge to left-edge of next frame)
- ProductDetail → Cart (curved, multi-segment via `points`)
- Cart → Checkout (straight)
- Checkout → ProductList (long curved/dashed loop labelled "order placed")

Floating canvas title above all frames: "E-Commerce Checkout Flow" at fontSize 32.

Use the documented cool monochrome palette and helpers from `references/helpers.mjs`. Inline the helpers verbatim into the script (strip `export` keywords).

## Acceptance criteria

- `node <script>.mjs` exits 0.
- Output JSON parses (`JSON.parse(fs.readFileSync(...))` doesn't throw).
- Element count ≥ 150 (frames + topbar + 6 products × ~10 elements + detail + cart + checkout + arrows ≈ 200+).
- All 4 frames present with correct names.
- At least 4 `arrow`-type elements present.
- Each non-frame element belongs to a frame (`frameId` set), except the canvas title and arrow labels (which float).

## What this case tests

- Multi-frame layout with `tagAndPush`.
- Flow arrows with both straight and multi-segment `points`.
- All composite helpers used in concert (button, inputField, selectField, radioGroup, checkbox, breadcrumbs, card, tableEl, imagePlaceholder, stat).
- Floating canvas-level text (no `frameId`).
