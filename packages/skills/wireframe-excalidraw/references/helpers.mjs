// wireframe-excalidraw helpers — copy this block verbatim into the top of your generator script
// (strip the `export` keywords when inlining), or `import` from this file directly.
// Self-contained: pure Node, no dependencies.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const __dirname_for = (importMetaUrl) => path.dirname(fileURLToPath(importMetaUrl));

// ---------- palette ----------
// Cool-anchored, contextually rich. Surfaces are subtly tinted (not stark white)
// so wireframes don't read as blank. Primary stays in the blue/cool family;
// warning/danger use restrained warm tones because users expect those state
// colors visually. Success uses teal so it's distinguishable from primary
// while staying on the cool side of the spectrum.
export const C = {
  ink:        "#0f172a",  // slate-950 — punchy text, stronger than pure black
  muted:      "#475569",  // slate-600 — readable secondary text
  faint:      "#94a3b8",  // slate-400 — labels, frame borders
  border:     "#cbd5e1",  // slate-300 — input/card borders
  panel:      "#f8fafc",  // slate-50 — surfaces, NOT pure white (subtle cool tint)
  hatch:      "#e2e8f0",  // slate-200 — table rows, image placeholders
  hatchInk:   "#94a3b8",
  primary:    "#1d4ed8",  // blue-700 — strong primary action, draws the eye
  primaryDk:  "#1e3a8a",  // blue-900 — primary border / pressed state
  primaryFg:  "#ffffff",
  danger:     "#b91c1c",  // red-700 — recognizable destructive action
  dangerDk:   "#7f1d1d",  // red-900
  success:    "#0d9488",  // teal-600 — cool green, distinct from primary
  warning:    "#b45309",  // amber-700 — restrained warm warning
  info:       "#0284c7",  // sky-600 — informational accent
};

export const FONT = { virgil: 1, helvetica: 2, cascadia: 3 };

// ---------- deterministic id / seed helpers ----------
let _id = 0;
export const id = () => "el" + (++_id).toString(36).padStart(5, "0");
let _idx = 0;
export const idx = () => "a" + (_idx++).toString(36).padStart(4, "0");
let _seed = 1_000_000;
export const seed = () => ++_seed;

// ---------- base element factory ----------
export const make = (over) => ({
  id: id(),
  index: idx(),
  x: 0, y: 0, width: 0, height: 0,
  angle: 0,
  strokeColor: C.ink,
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 1,
  strokeStyle: "solid",
  roughness: 1,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: null,
  seed: seed(),
  version: 1,
  versionNonce: seed(),
  isDeleted: false,
  boundElements: null,
  updated: 1,
  link: null,
  locked: false,
  ...over,
});

// ---------- primitives ----------
export const rect = (x, y, w, h, opts = {}) => make({
  type: "rectangle",
  x, y, width: w, height: h,
  roundness: opts.roundness !== undefined ? opts.roundness : { type: 3 },
  ...opts,
});

export const sharp = (x, y, w, h, opts = {}) => make({
  type: "rectangle",
  x, y, width: w, height: h,
  roundness: null,
  ...opts,
});

export const ellipse = (x, y, w, h, opts = {}) => make({
  type: "ellipse",
  x, y, width: w, height: h,
  roundness: null,
  ...opts,
});

export const text = (s, x, y, opts = {}) => {
  const fontSize = opts.fontSize ?? 18;
  const fontFamily = opts.fontFamily ?? FONT.virgil;
  const lines = String(s).split("\n");
  const longest = lines.reduce((a, b) => a.length >= b.length ? a : b, "");
  const charW = fontFamily === FONT.cascadia ? 0.6 : 0.55;
  const width = opts.width ?? Math.max(8, Math.ceil(longest.length * fontSize * charW));
  const height = opts.height ?? Math.ceil(fontSize * 1.25 * lines.length);
  return make({
    type: "text",
    x, y, width, height,
    text: String(s),
    originalText: String(s),
    fontSize,
    fontFamily,
    textAlign: opts.textAlign || "left",
    verticalAlign: opts.verticalAlign || "top",
    baseline: Math.round(fontSize * 0.85),
    containerId: opts.containerId || null,
    lineHeight: 1.25,
    autoResize: true,
    strokeColor: opts.strokeColor || C.ink,
    ...opts,
  });
};

export const line = (x1, y1, x2, y2, opts = {}) => {
  // Normalize bbox to min corner so assertFits sees the true bounding box,
  // even for reverse diagonals (e.g. imagePlaceholder's second cross stroke).
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return make({
    type: "line",
    x, y,
    width: Math.abs(x2 - x1), height: Math.abs(y2 - y1),
    points: [[x1 - x, y1 - y], [x2 - x, y2 - y]],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
    roundness: { type: 2 },
    ...opts,
  });
};

export const arrow = (x1, y1, x2, y2, opts = {}) => {
  // Normalize bbox to min corner — supports custom multi-segment `points`.
  const points = opts.points ?? [[0, 0], [x2 - x1, y2 - y1]];
  const xs = points.map(p => p[0]); const ys = points.map(p => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  // Shift origin if any point is "left of" or "above" (x1, y1)
  const shifted = (minX < 0 || minY < 0) ? points.map(([px, py]) => [px - minX, py - minY]) : points;
  return make({
    type: "arrow",
    x: x1 + (minX < 0 ? minX : 0),
    y: y1 + (minY < 0 ? minY : 0),
    width: w, height: h,
    points: shifted,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow",
    strokeColor: C.muted,
    strokeWidth: 2,
    roundness: { type: 2 },
    ...opts,
  });
};

// Multi-point line. `line()` only does 2 endpoints; use this for icons / sad-faces / polylines.
// Pass `points` as relative offsets from (x, y); the bounding box is inferred.
export const polyline = (x, y, points, opts = {}) => {
  const xs = points.map(p => p[0]); const ys = points.map(p => p[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  return make({
    type: "line",
    x, y,
    width: w, height: h,
    points,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
    roundness: { type: 2 },
    ...opts,
  });
};

export const frame = (x, y, w, h, name) => make({
  type: "frame",
  x, y, width: w, height: h,
  name,
  customData: null,
  strokeColor: C.faint,
  backgroundColor: "transparent",
  roundness: null,
});

// ---------- composite components ----------
export const button = (x, y, w, h, label, opts = {}) => {
  const v = opts.variant || "primary";
  const styles = {
    primary:   { bg: C.primary,     st: C.primaryDk, fg: C.primaryFg },
    secondary: { bg: C.panel,       st: C.ink,       fg: C.ink },
    success:   { bg: C.success,     st: C.success,   fg: "#ffffff" },
    warning:   { bg: C.warning,     st: C.warning,   fg: "#ffffff" },
    danger:    { bg: C.danger,      st: C.dangerDk,  fg: "#ffffff" },
    info:      { bg: C.info,        st: C.info,      fg: "#ffffff" },
    ghost:     { bg: "transparent", st: C.ink,       fg: C.ink },
  }[v];
  const r = rect(x, y, w, h, {
    fillStyle: "solid",
    backgroundColor: styles.bg,
    strokeColor: styles.st,
    roundness: { type: 3 },
  });
  const fontSize = opts.fontSize || 14;
  const t = text(label, x, y + (h - fontSize * 1.25) / 2, {
    fontSize, fontFamily: FONT.virgil,
    strokeColor: styles.fg, width: w, textAlign: "center",
  });
  return [r, t];
};

export const imagePlaceholder = (x, y, w, h, alt) => [
  rect(x, y, w, h, {
    fillStyle: "hachure",
    backgroundColor: C.hatch,
    strokeColor: C.hatchInk,
    roundness: { type: 3 },
  }),
  line(x, y, x + w, y + h, { strokeColor: C.border }),
  line(x + w, y, x, y + h, { strokeColor: C.border }),
  alt && text(alt, x + 10, y + h - 22, { fontSize: 11, strokeColor: C.muted }),
].filter(Boolean);

export const inputField = (x, y, w, label, placeholder = "") => {
  const els = [];
  if (label) els.push(text(label, x, y, { fontSize: 12, strokeColor: C.muted }));
  const top = label ? y + 18 : y;
  els.push(rect(x, top, w, 36, {
    fillStyle: "solid", backgroundColor: C.panel,
    strokeColor: C.border, roundness: { type: 3 },
  }));
  if (placeholder) {
    els.push(text(placeholder, x + 12, top + 10, {
      fontSize: 14, strokeColor: C.faint,
    }));
  }
  return els;
};

export const selectField = (x, y, w, label, value = "") => {
  const els = [];
  if (label) els.push(text(label, x, y, { fontSize: 12, strokeColor: C.muted }));
  const top = label ? y + 18 : y;
  els.push(rect(x, top, w, 36, {
    fillStyle: "solid", backgroundColor: C.panel,
    strokeColor: C.border, roundness: { type: 3 },
  }));
  if (value) els.push(text(value, x + 12, top + 10, { fontSize: 14, strokeColor: C.ink }));
  els.push(make({
    type: "line",
    x: x + w - 22, y: top + 14,
    width: 10, height: 6,
    points: [[0, 0], [5, 6], [10, 0]],
    lastCommittedPoint: null,
    startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: null,
    roundness: { type: 2 },
    strokeColor: C.muted,
  }));
  return els;
};

export const checkbox = (x, y, label, checked = false) => {
  const els = [sharp(x, y, 16, 16, {
    strokeColor: C.ink, fillStyle: "solid", backgroundColor: C.panel,
  })];
  if (checked) {
    els.push(line(x + 3, y + 8, x + 7, y + 12, { strokeColor: C.success, strokeWidth: 2 }));
    els.push(line(x + 7, y + 12, x + 13, y + 4, { strokeColor: C.success, strokeWidth: 2 }));
  }
  els.push(text(label, x + 24, y, { fontSize: 14 }));
  return els;
};

export const radio = (x, y, label, checked = false) => {
  const els = [ellipse(x, y, 16, 16, {
    strokeColor: C.ink, fillStyle: "solid", backgroundColor: C.panel,
  })];
  if (checked) els.push(ellipse(x + 4, y + 4, 8, 8, {
    fillStyle: "solid", backgroundColor: C.primary, strokeColor: C.primary,
  }));
  els.push(text(label, x + 24, y, { fontSize: 14 }));
  return els;
};

export const radioGroup = (x, y, label, options, selected) => {
  const els = [text(label, x, y, { fontSize: 12, strokeColor: C.muted })];
  let cx = x;
  for (const opt of options) {
    els.push(...radio(cx, y + 22, opt, opt === selected));
    cx += 28 + opt.length * 9;
  }
  return els;
};

export const breadcrumbs = (x, y, items) => [
  text(items.join("  ›  "), x, y, { fontSize: 13, strokeColor: C.muted }),
];

export const card = (x, y, w, h, opts = {}) => rect(x, y, w, h, {
  fillStyle: "solid",
  backgroundColor: C.panel,
  strokeColor: C.border,
  roundness: { type: 3 },
  ...opts,
});

export const stat = (x, y, title, value, big = false) => [
  text(title, x, y, { fontSize: 12, strokeColor: C.muted }),
  text(value, x, y + 18, { fontSize: big ? 26 : 22 }),
];

export const tableEl = (x, y, w, h, columns, rows = 3) => {
  const els = [];
  els.push(card(x, y, w, h, { backgroundColor: C.panel }));
  els.push(rect(x, y, w, 36, {
    fillStyle: "cross-hatch",
    backgroundColor: C.hatch,
    strokeColor: C.border,
    roundness: { type: 3 },
  }));
  const colW = w / columns.length;
  columns.forEach((c, i) => {
    els.push(text(c, x + 14 + i * colW, y + 9, { fontSize: 12 }));
  });
  for (let i = 1; i < columns.length; i++) {
    els.push(line(x + i * colW, y, x + i * colW, y + h, {
      strokeColor: C.border, opacity: 60,
    }));
  }
  const rowH = (h - 36) / rows;
  for (let r = 0; r < rows; r++) {
    const yy = y + 36 + r * rowH;
    els.push(line(x, yy, x + w, yy, { strokeColor: C.border, opacity: 60 }));
    columns.forEach((_, ci) => {
      els.push(rect(x + ci * colW + 14, yy + rowH / 2 - 6, colW - 28, 12, {
        fillStyle: "solid",
        backgroundColor: C.hatch,
        strokeColor: C.border,
        opacity: 60,
        roundness: { type: 3 },
      }));
    });
  }
  return els;
};

// Skeleton/shimmer rect — for "loading" states. Use a size matching the eventual content.
export const skeleton = (x, y, w, h, opts = {}) => rect(x, y, w, h, {
  fillStyle: "hachure",
  backgroundColor: C.hatch,
  strokeColor: C.border,
  opacity: 70,
  roundness: { type: 3 },
  ...opts,
});

// Alert/banner — full-width strip with semantic background and short message.
// variant: "info" | "warning" | "danger" | "success"
export const alertBanner = (x, y, w, message, opts = {}) => {
  const variant = opts.variant || "info";
  const styles = {
    info:    { bg: C.hatch,  st: C.border,    fg: C.ink },
    warning: { bg: C.hatch,  st: C.warning,   fg: C.ink },
    danger:  { bg: C.hatch,  st: C.danger,    fg: C.danger },
    success: { bg: C.hatch,  st: C.success,   fg: C.success },
  }[variant];
  const els = [];
  els.push(rect(x, y, w, 56, {
    fillStyle: "solid",
    backgroundColor: styles.bg,
    strokeColor: styles.st,
    strokeWidth: 2,
    roundness: { type: 3 },
  }));
  // Marker ellipse (acts as the "icon" slot)
  els.push(ellipse(x + 16, y + 18, 20, 20, {
    fillStyle: "solid",
    backgroundColor: styles.st,
    strokeColor: styles.st,
  }));
  els.push(text(message, x + 48, y + 18, {
    fontSize: 14,
    strokeColor: styles.fg,
    width: w - 64,
  }));
  return els;
};

// Tab strip — header pills with one active. Body content is up to the caller.
// `labels` is an array of strings; `active` is the active label (matched by string).
export const tabStrip = (x, y, labels, active, opts = {}) => {
  const els = [];
  let cx = x;
  const fontSize = opts.fontSize || 14;
  for (const label of labels) {
    const pillW = Math.max(60, label.length * 9 + 24);
    const isActive = label === active;
    els.push(text(label, cx, y, {
      fontSize,
      strokeColor: isActive ? C.ink : C.muted,
      width: pillW,
      textAlign: "center",
    }));
    if (isActive) {
      els.push(line(cx - 2, y + fontSize * 1.4, cx + pillW + 2, y + fontSize * 1.4, {
        strokeColor: C.ink,
        strokeWidth: 2,
      }));
    }
    cx += pillW + 12;
  }
  // Underline strip beneath the row
  els.push(line(x, y + fontSize * 1.5 + 2, cx + 200, y + fontSize * 1.5 + 2, {
    strokeColor: C.border,
  }));
  return els;
};

// Empty-state recipe — illustration placeholder + headline + sub + optional CTA.
export const emptyState = (x, y, w, headline, sub, ctaLabel) => {
  const els = [];
  // Centered illustration: stacked circle + line marks
  const icx = x + w / 2 - 24;
  els.push(ellipse(icx, y, 48, 48, {
    fillStyle: "hachure",
    backgroundColor: C.hatch,
    strokeColor: C.faint,
  }));
  els.push(text(headline, x, y + 70, {
    fontSize: 18,
    width: w,
    textAlign: "center",
  }));
  els.push(text(sub, x, y + 100, {
    fontSize: 13,
    strokeColor: C.muted,
    width: w,
    textAlign: "center",
  }));
  if (ctaLabel) {
    const bw = 180, bx = x + (w - bw) / 2;
    els.push(...button(bx, y + 140, bw, 40, ctaLabel, { variant: "primary" }));
  }
  return els;
};

// Layout-overflow guard. Returns `{ ok, overflows }` listing any element whose bbox
// exits the frame's rectangle. Intended for use in dev: log warnings before emit.
export const assertFits = (frameEl, els, { name } = {}) => {
  const fx = frameEl.x, fy = frameEl.y;
  const fr = fx + frameEl.width, fb = fy + frameEl.height;
  const overflows = [];
  for (const e of els) {
    if (e.type === "frame") continue;
    const ex = e.x, ey = e.y;
    const er = ex + (e.width || 0), eb = ey + (e.height || 0);
    if (ex < fx || ey < fy || er > fr || eb > fb) {
      overflows.push({
        type: e.type,
        text: e.text?.slice(0, 40),
        bbox: [ex, ey, er, eb],
        frame: [fx, fy, fr, fb],
      });
    }
  }
  if (overflows.length && process.env.WIREFRAME_STRICT) {
    console.warn(`[assertFits${name ? " " + name : ""}] ${overflows.length} overflow(s):`,
      overflows.slice(0, 5));
  }
  return { ok: overflows.length === 0, overflows };
};

// ---------- emit helper ----------
export const emit = (elements, outPath, source = "wireframe-excalidraw") => {
  const doc = {
    type: "excalidraw",
    version: 2,
    source,
    elements,
    appState: { viewBackgroundColor: "#ffffff", gridSize: null },
    files: {},
  };
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2));
  console.log(`Wrote ${elements.length} elements → ${outPath}`);
};

// ---------- frame layout helper ----------
export const tagAndPush = (frameEl, els, into) => {
  for (const e of els) { e.frameId = frameEl.id; into.push(e); }
};
