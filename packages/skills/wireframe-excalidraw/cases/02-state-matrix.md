# Case 02 — Dashboard state matrix

**Tier**: very-complex (4 frames, parameterized shell, alertBanner + skeleton + emptyState helpers)

## Brief

Build a single self-contained generator script that emits an `.excalidraw` scene with 4 frames showing the same dashboard in 4 UI states. Reuse a single `dashboardShell(ox, oy, { state })` function across all 4 frames; only the content slots change per state.

Frames (each 1200×900) in a 2×2 grid:

- **Default** at (0, 0): topbar, sidebar (Dashboard/Reports/Settings), 3 KPI cards with real values (Users 12,438 / MRR $48.1K / Churn 1.6%), bar Chart placeholder (height 240), recent-activity tableEl with 5 rows.
- **Loading** at (1300, 0): same layout, but KPI values replaced with `skeleton` rects, chart area replaced with skeleton + "Loading…" centered text, table rows shown as skeleton rows.
- **Empty** at (0, 1000): same layout, KPI cards show "—" for value, chart area replaced by `emptyState(headline, sub, ctaLabel)` with "No data yet" / "Import your first dataset to see metrics." / "Import data".
- **Error** at (1300, 1000): same layout, but a danger-variant `alertBanner` at the top of the content area with message "Couldn't load metrics. Retry?". KPI cards show "—". Chart area replaced by `emptyState` with "Couldn't load metrics" / "Try again or check the status page." / "Retry".

Add a label text above each frame (one of "Default" / "Loading" / "Empty" / "Error") at fontSize 18, muted color.

Use the documented cool monochrome palette and helpers. Inline the helpers verbatim into the script.

## Acceptance criteria

- `node <script>.mjs` exits 0.
- Output JSON parses without error.
- Element count between 120 and 250.
- All 4 frames present.
- Exactly one `dashboardShell` function defined; called 4 times with different `state` arg.
- Each non-frame element (except the 4 floating labels) has `frameId` set.
- Use of `skeleton`, `alertBanner`, `emptyState` helpers verifiable by inspecting the script.

## What this case tests

- Parameterized screen builder (shell-with-slot composition).
- New helpers: `skeleton`, `alertBanner`, `emptyState`.
- Same chrome rendered 4× with content variation.
- 4-frame 2×2 layout.
