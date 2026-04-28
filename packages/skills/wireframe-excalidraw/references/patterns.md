# Screen patterns

Each pattern is a complete screen builder you can drop into a generator script. Assumes the helpers from `references/helpers.mjs` are already imported / inlined.

## 1. Login form

```js
function loginScreen(ox, oy) {
  const els = [];
  const cw = 400, cx = ox + (1200 - cw) / 2, cy = oy + 200;

  els.push(text("Welcome back", cx, cy, { fontSize: 28, width: cw, textAlign: "center" }));
  els.push(text("Sign in to your account", cx, cy + 44, {
    fontSize: 14, strokeColor: C.muted, width: cw, textAlign: "center",
  }));

  els.push(card(cx, cy + 90, cw, 280));
  els.push(...inputField(cx + 20, cy + 110, cw - 40, "Email", "you@example.com"));
  els.push(...inputField(cx + 20, cy + 190, cw - 40, "Password", "••••••••"));
  els.push(...checkbox(cx + 20, cy + 270, "Remember me", false));
  els.push(...button(cx + 20, cy + 300, cw - 40, 44, "Sign in", { variant: "primary" }));

  return els;
}
```

## 2. Dashboard with KPI cards + chart placeholder + table

```js
function dashboardScreen(ox, oy) {
  const els = [];
  els.push(text("Analytics", ox + 40, oy + 36, { fontSize: 28 }));
  els.push(text("Last 30 days", ox + 40, oy + 76, { fontSize: 14, strokeColor: C.muted }));

  // KPI row
  const kpiW = 360, gap = 20;
  const kpis = [["Users", "12,438", "+4.2%"], ["MRR", "$48.1K", "+8.1%"], ["Churn", "1.6%", "-0.3%"]];
  kpis.forEach(([title, value, delta], i) => {
    const kx = ox + 40 + i * (kpiW + gap), ky = oy + 110;
    els.push(card(kx, ky, kpiW, 120));
    els.push(...stat(kx + 20, ky + 20, title, value, true));
    els.push(text(delta, kx + 20, ky + 88, { fontSize: 12, strokeColor: C.muted }));
  });

  // Chart placeholder
  els.push(card(ox + 40, oy + 260, 1120, 280));
  els.push(text("Signups (last 30 days)", ox + 60, oy + 280, { fontSize: 16 }));
  els.push(...imagePlaceholder(ox + 60, oy + 320, 1080, 200, "Bar chart placeholder"));

  // Recent activity table
  els.push(card(ox + 40, oy + 570, 1120, 280));
  els.push(text("Recent activity", ox + 60, oy + 590, { fontSize: 16 }));
  els.push(...tableEl(ox + 60, oy + 620, 1080, 220, ["Date", "User", "Event", "Status"], 5));

  return els;
}
```

## 3. Sidebar app shell + content

```js
function appShellScreen(ox, oy, mainBuilder) {
  const els = [];
  // Sidebar
  els.push(rect(ox, oy, 240, 900, {
    fillStyle: "solid", backgroundColor: C.hatch, strokeColor: C.border, roundness: null,
  }));
  els.push(text("My App", ox + 24, oy + 24, { fontSize: 18 }));
  ["Dashboard", "Users", "Reports", "Settings"].forEach((label, i) => {
    const ly = oy + 80 + i * 44;
    if (i === 1) {
      els.push(rect(ox + 12, ly - 6, 216, 36, {
        fillStyle: "solid", backgroundColor: C.panel, strokeColor: C.border, roundness: { type: 3 },
      }));
    }
    els.push(text(label, ox + 24, ly, { fontSize: 14, strokeColor: i === 1 ? C.ink : C.muted }));
  });

  // Topbar
  els.push(line(ox + 240, oy + 60, ox + 1200, oy + 60, { strokeColor: C.border }));
  els.push(text("Users", ox + 264, oy + 22, { fontSize: 22 }));

  // Content area delegated to caller
  els.push(...mainBuilder(ox + 240, oy + 60));

  return els;
}

// Usage:
function usersListMain(ox, oy) {
  const els = [];
  els.push(...inputField(ox + 24, oy + 24, 400, "", "Search users…"));
  els.push(...button(ox + 800, oy + 36, 140, 36, "New user", { variant: "primary" }));
  els.push(...tableEl(ox + 24, oy + 100, 916, 700, ["Name", "Email", "Role", "Status"], 8));
  return els;
}
```

## 4. Mobile signup (narrow frame)

```js
// Use frame size 390 × 844 for these
function welcomeScreen(ox, oy) {
  const els = [];
  els.push(...imagePlaceholder(ox + 24, oy + 60, 342, 240, "App hero"));
  els.push(text("Welcome to Acme", ox + 24, oy + 340, { fontSize: 22, width: 342, textAlign: "center" }));
  els.push(text("The fastest way to ship.", ox + 24, oy + 380, {
    fontSize: 14, strokeColor: C.muted, width: 342, textAlign: "center",
  }));
  els.push(...button(ox + 24, oy + 440, 342, 48, "Sign up", { variant: "primary", fontSize: 16 }));
  els.push(...button(ox + 24, oy + 500, 342, 48, "Log in", { variant: "secondary", fontSize: 16 }));
  els.push(text("Continue as guest", ox + 24, oy + 580, {
    fontSize: 13, strokeColor: C.muted, width: 342, textAlign: "center",
  }));
  return els;
}
```

## 5. Multi-frame canvas with flow arrows

```js
const elements = [];

// Two frames side-by-side
const f1 = frame(0, 0, 1200, 900, "ProductList");
const f2 = frame(1300, 0, 1200, 900, "ProductDetail");
elements.push(f1, f2);

tagAndPush(f1, productListScreen(0, 0), elements);
tagAndPush(f2, productDetailScreen(1300, 0), elements);

// Arrow between them, with label
elements.push(arrow(1210, 450, 1290, 450, { strokeColor: C.muted }));
elements.push(text("click product card", 1215, 425, { fontSize: 11, strokeColor: C.muted }));

// Title above the canvas
elements.push(text("E-Commerce Wireframe", 600, -100, { fontSize: 32 }));

emit(elements, "out.excalidraw");
```

## 6. Tabs (faked — Excalidraw doesn't have a tab primitive)

Render the "active tab" body and indicate the tab strip visually:

```js
function settingsScreen(ox, oy) {
  const els = [];
  els.push(text("Settings", ox + 40, oy + 36, { fontSize: 26 }));

  // Tab strip
  const tabs = ["Profile", "Security", "Billing"];
  tabs.forEach((label, i) => {
    const tx = ox + 40 + i * 120, ty = oy + 90;
    els.push(text(label, tx, ty, { fontSize: 14, strokeColor: i === 0 ? C.ink : C.muted }));
    if (i === 0) els.push(line(tx - 4, ty + 24, tx + label.length * 9, ty + 24, {
      strokeColor: C.ink, strokeWidth: 2,
    }));
  });
  els.push(line(ox + 40, oy + 116, ox + 1160, oy + 116, { strokeColor: C.border }));

  // Active tab body (Profile)
  els.push(...inputField(ox + 40, oy + 150, 400, "Display name", "Jane Doe"));
  els.push(...inputField(ox + 40, oy + 230, 400, "Email", "jane@example.com"));
  els.push(...button(ox + 40, oy + 310, 120, 40, "Save", { variant: "primary" }));

  return els;
}
```

For multi-tab views, render each tab as its own frame and link with arrows. Use `tabStrip(x, y, labels, active)` from helpers — pass the same `labels` for every frame, varying `active` so each frame highlights its own tab.

## 7. State matrix (default / loading / empty / error)

Render the same screen in 4 frames showing 4 states. Parameterize the screen builder with a `state` arg and swap content based on it. The shell (sidebar, topbar, KPI card frames) is shared; only the content slots change.

```js
function dashboardShell(ox, oy, { state }) {
  const els = [];
  // Topbar + sidebar + page heading (shared chrome)
  els.push(rect(ox, oy, 240, 900, {
    fillStyle: "solid", backgroundColor: C.hatch, strokeColor: C.border, roundness: null,
  }));
  els.push(text("My App", ox + 24, oy + 24, { fontSize: 18 }));
  els.push(text("Dashboard", ox + 264, oy + 24, { fontSize: 22 }));
  els.push(line(ox + 240, oy + 60, ox + 1200, oy + 60, { strokeColor: C.border }));

  let cy = oy + 90;
  if (state === "error") {
    els.push(...alertBanner(ox + 264, cy, 900, "Couldn't load metrics. Retry?", { variant: "danger" }));
    cy += 76;
  }

  // KPI row — switches per state
  const kpiW = 280, gap = 20;
  for (let i = 0; i < 3; i++) {
    const kx = ox + 264 + i * (kpiW + gap);
    els.push(card(kx, cy, kpiW, 110));
    if (state === "default") {
      els.push(...stat(kx + 16, cy + 16, ["Users","Revenue","Churn"][i],
        ["12,438","$48.1K","1.6%"][i], true));
    } else if (state === "loading") {
      els.push(skeleton(kx + 16, cy + 18, kpiW - 32, 14));
      els.push(skeleton(kx + 16, cy + 44, kpiW - 64, 30));
    } else {
      els.push(...stat(kx + 16, cy + 16, ["Users","Revenue","Churn"][i], "—", true));
    }
  }
  cy += 130;

  // Chart area
  els.push(card(ox + 264, cy, 900, 240));
  if (state === "default") {
    els.push(...imagePlaceholder(ox + 284, cy + 20, 860, 200, "Bar chart"));
  } else if (state === "loading") {
    els.push(skeleton(ox + 284, cy + 20, 860, 200));
    els.push(text("Loading…", ox + 264, cy + 110, { fontSize: 14, strokeColor: C.muted, width: 900, textAlign: "center" }));
  } else if (state === "empty") {
    els.push(...emptyState(ox + 284, cy + 40, 860, "No data yet", "Import your first dataset to see metrics.", "Import data"));
  } else {
    els.push(...emptyState(ox + 284, cy + 40, 860, "Couldn't load metrics", "Try again or check the status page.", "Retry"));
  }

  return els;
}

// Lay out 2x2 grid of states, with labels above each frame
const elements = [];
const states = [
  { name: "Default", state: "default", x: 0,    y: 0    },
  { name: "Loading", state: "loading", x: 1300, y: 0    },
  { name: "Empty",   state: "empty",   x: 0,    y: 1000 },
  { name: "Error",   state: "error",   x: 1300, y: 1000 },
];
for (const s of states) {
  elements.push(text(s.name, s.x, s.y - 40, { fontSize: 18, strokeColor: C.muted }));
  const f = frame(s.x, s.y, 1200, 900, s.name);
  elements.push(f);
  tagAndPush(f, dashboardShell(s.x, s.y, { state: s.state }), elements);
}
emit(elements, "out.excalidraw");
```

## 8. Responsive comparison (same screen at 3 viewport widths)

Show the same screen at desktop / tablet / mobile side-by-side. Parameterize the screen builder with the viewport width, repack content per breakpoint. Always run `assertFits` on each frame to catch silent overflow.

```js
function productPage(ox, oy, w) {
  const els = [];
  const inner = w - 48;
  const isMobile = w < 500;
  const isTablet = w >= 500 && w < 1000;

  // Topbar
  els.push(text("Acme Store", ox + 24, oy + 24, { fontSize: 18 }));
  els.push(text(isMobile ? "🛒 3" : "Cart 3", ox + w - 80, oy + 24, { fontSize: 13, strokeColor: C.muted }));
  els.push(line(ox + 24, oy + 60, ox + w - 24, oy + 60, { strokeColor: C.border }));

  let cy = oy + 84;

  if (!isMobile) {
    // Desktop/tablet: image left, details right
    const imgW = isTablet ? 320 : 460;
    els.push(...imagePlaceholder(ox + 24, cy, imgW, imgW, "Product image"));
    const dx = ox + 48 + imgW;
    const dw = w - imgW - 72;
    els.push(text("Wireless Headphones", dx, cy, { fontSize: 22, width: dw }));
    els.push(text("$129.00", dx, cy + 36, { fontSize: 16, strokeColor: C.muted }));
    els.push(...inputField(dx, cy + 72, Math.min(160, dw), "Quantity", "1"));
    els.push(...selectField(dx, cy + 144, Math.min(220, dw), "Size", "Medium"));
    els.push(...button(dx, cy + 220, Math.min(200, dw), 44, "Add to cart", { variant: "primary" }));
    els.push(...button(dx, cy + 274, Math.min(200, dw), 44, "Buy now", { variant: "secondary" }));
  } else {
    // Mobile: stacked
    els.push(...imagePlaceholder(ox + 24, cy, inner, 220, "Product"));
    cy += 240;
    els.push(text("Wireless Headphones", ox + 24, cy, { fontSize: 18, width: inner }));
    cy += 26;
    els.push(text("$129.00", ox + 24, cy, { fontSize: 14, strokeColor: C.muted }));
    cy += 28;
    els.push(...inputField(ox + 24, cy, inner, "Quantity", "1"));
    cy += 64;
    els.push(...selectField(ox + 24, cy, inner, "Size", "Medium"));
    cy += 70;
    els.push(...button(ox + 24, cy, inner, 44, "Add to cart", { variant: "primary" }));
    cy += 56;
    els.push(...button(ox + 24, cy, inner, 44, "Buy now", { variant: "secondary" }));
  }
  return els;
}

const elements = [];
const breakpoints = [
  { name: "Desktop 1440", w: 1440, h: 900, x: 0 },
  { name: "Tablet 768",   w: 768,  h: 1024, x: 1640 },
  { name: "Mobile 390",   w: 390,  h: 844, x: 2508 },
];
for (const b of breakpoints) {
  elements.push(text(b.name, b.x, -40, { fontSize: 18, strokeColor: C.muted }));
  const f = frame(b.x, 0, b.w, b.h, b.name.split(" ")[0]);
  elements.push(f);
  const screen = productPage(b.x, 0, b.w);
  tagAndPush(f, screen, elements);
  // Catch overflow before emitting
  const r = assertFits(f, screen, { name: b.name });
  if (!r.ok) console.warn(`${b.name} overflows:`, r.overflows.length);
}
emit(elements, "out.excalidraw");
```

## 9. Branching wizard (multi-step flow with arrows between frames)

Model each step as its own frame; use arrows to show navigation. For branching, fan arrows out from the decision step.

```js
function step(label, body, ox, oy) {
  const els = [];
  els.push(text(label, ox + 24, oy + 16, { fontSize: 12, strokeColor: C.muted }));
  els.push(...body(ox, oy + 40));
  return els;
}

const elements = [];
const f1 = frame(0,    0, 600, 500, "Welcome");
const f2 = frame(700,  0, 600, 500, "AccountType");
const f3 = frame(1400, -300, 600, 500, "ProfilePersonal");
const f4 = frame(1400,  300, 600, 500, "ProfileBusiness");
const f5 = frame(2100, 0, 600, 500, "Confirm");
elements.push(f1, f2, f3, f4, f5);

tagAndPush(f1, step("Welcome", (x,y) => [
  text("Welcome", x + 24, y, { fontSize: 24 }),
  ...button(x + 24, y + 60, 200, 44, "Get started", { variant: "primary" }),
], 0, 0), elements);

tagAndPush(f2, step("Step 1 of 3 — Choose account type", (x,y) => [
  ...button(x + 24, y + 40,  200, 60, "Personal", { variant: "secondary" }),
  ...button(x + 24, y + 120, 200, 60, "Business", { variant: "primary" }),
], 700, 0), elements);

tagAndPush(f3, step("Step 2A — Personal profile", (x,y) => [
  ...inputField(x + 24, y, 320, "Display name", "Jane Doe"),
  ...inputField(x + 24, y + 80, 320, "Date of birth", "MM/DD/YYYY"),
  ...button(x + 24, y + 200, 200, 44, "Continue", { variant: "primary" }),
], 1400, -300), elements);

tagAndPush(f4, step("Step 2B — Business profile", (x,y) => [
  ...inputField(x + 24, y, 320, "Company name", "Acme Inc."),
  ...selectField(x + 24, y + 80, 320, "Team size", "11-50"),
  ...button(x + 24, y + 200, 200, 44, "Continue", { variant: "primary" }),
], 1400, 300), elements);

tagAndPush(f5, step("Step 3 — Review & confirm", (x,y) => [
  card(x + 24, y, 540, 280),
  text("Looks good?", x + 40, y + 20, { fontSize: 14 }),
  ...button(x + 24, y + 320, 200, 44, "Confirm", { variant: "primary" }),
], 2100, 0), elements);

// Arrows between frames
elements.push(arrow(610, 250, 690, 250));                     // Welcome → AccountType
elements.push(arrow(1310, 250, 1390, -50,                     // AccountType → Personal (up branch)
  { points: [[0, 0], [40, 0], [40, -300], [80, -300]] }));
elements.push(arrow(1310, 250, 1390, 550,                     // AccountType → Business (down branch)
  { points: [[0, 0], [40, 0], [40, 300], [80, 300]] }));
elements.push(arrow(2010, -50, 2090, 250,                     // Personal → Confirm (down)
  { points: [[0, 0], [40, 0], [40, 300], [80, 300]] }));
elements.push(arrow(2010, 550, 2090, 250,                     // Business → Confirm (up)
  { points: [[0, 0], [40, 0], [40, -300], [80, -300]] }));

emit(elements, "out.excalidraw");
```
