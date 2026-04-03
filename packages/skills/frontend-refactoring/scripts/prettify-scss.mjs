/**
 * prettify-scss.mjs
 *
 * Applies all available auto-fixes to a SCSS file, then reports only what
 * cannot be fixed automatically. Exits 0 when every fixable issue was resolved.
 *
 * Fix pipeline:
 *   1. prettier --write          — whitespace, indentation, trailing commas
 *   2. stylelint --fix           — block-order: @extend/@include → declarations → nested rules
 *                                  declaration order: layout → sizing → spacing → typography → visual → motion
 *   3. prettier --write (again)  — re-format after stylelint mutations
 *   4. stylelint (lint-only)     — detect genuinely unfixable violations
 *   5. structural checks         — nesting depth > 3 (cannot be auto-fixed)
 *
 * Only step 4 and 5 failures cause a non-zero exit. Having had fixes to apply
 * is not a failure — the script's job is to apply them.
 *
 * Usage:
 *   node skills/frontend-refactoring/scripts/prettify-scss.mjs web/scss/overrides/_fl-component.scss
 *
 * Requires globally installed:
 *   npm install -g prettier stylelint stylelint-order
 */

import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createReporter, isFile, readLines, runSection } from "./_shared.mjs";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const filePath = process.argv[2] ?? "";

if (!filePath || !isFile(filePath)) {
  process.stdout.write("Usage: prettify-scss.mjs <path/to/file.scss>\n");
  process.exit(2);
}

const absPath = path.resolve(filePath);

// ─── Dependency checks ────────────────────────────────────────────────────────

function requireTool(cmd, hint) {
  try {
    execSync(`which ${cmd}`, { stdio: "pipe" });
  } catch {
    process.stderr.write(`ERROR: '${cmd}' not found. ${hint}\n`);
    process.exit(1);
  }
}

requireTool("prettier", "Run: npm install -g prettier");
requireTool("stylelint", "Run: npm install -g stylelint stylelint-order");

// Resolve stylelint-order from the global node_modules so the temp config can
// reference it regardless of the current working directory.
const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
const stylelintOrderPath = path.join(globalRoot, "stylelint-order");

if (!fs.existsSync(stylelintOrderPath)) {
  process.stderr.write("ERROR: 'stylelint-order' not found in global modules.\n");
  process.stderr.write("Run: npm install -g stylelint-order\n");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function runPrettier() {
  const result = spawnSync("prettier", ["--write", absPath], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || "prettier failed\n");
    process.exit(1);
  }
}

// ─── Step 1: prettier (first pass) ───────────────────────────────────────────

process.stdout.write(`\nAuto-fixing: ${filePath}\n`);
runPrettier();
process.stdout.write("  prettier (pass 1) ✓\n");

// ─── Step 2: stylelint --fix with order rules ─────────────────────────────────

// Block-order: at-rules (@extend first, then @include) → declarations → rules
// Declaration order groups match SKILL.md convention.
const stylelintConfig = {
  plugins: [stylelintOrderPath],
  rules: {
    "order/order": [
      { type: "at-rule", name: "extend" },
      { type: "at-rule", name: "include" },
      "declarations",
      "rules",
    ],
    "order/properties-order": [
      // 1. Layout
      {
        properties: [
          "display",
          "position",
          "top",
          "right",
          "bottom",
          "left",
          "z-index",
          "float",
          "clear",
          "overflow",
          "overflow-x",
          "overflow-y",
          "flex",
          "flex-direction",
          "flex-wrap",
          "flex-flow",
          "flex-grow",
          "flex-shrink",
          "flex-basis",
          "align-items",
          "align-self",
          "align-content",
          "justify-content",
          "justify-items",
          "justify-self",
          "order",
          "grid",
          "grid-area",
          "grid-template",
          "grid-template-areas",
          "grid-template-columns",
          "grid-template-rows",
          "grid-column",
          "grid-row",
          "grid-auto-columns",
          "grid-auto-rows",
          "grid-auto-flow",
          "visibility",
          "clip",
          "clip-path",
        ],
      },
      // 2. Sizing
      {
        properties: [
          "box-sizing",
          "width",
          "min-width",
          "max-width",
          "height",
          "min-height",
          "max-height",
          "aspect-ratio",
          "object-fit",
          "object-position",
        ],
      },
      // 3. Spacing
      {
        properties: [
          "gap",
          "row-gap",
          "column-gap",
          "padding",
          "padding-top",
          "padding-right",
          "padding-bottom",
          "padding-left",
          "padding-block",
          "padding-block-start",
          "padding-block-end",
          "padding-inline",
          "padding-inline-start",
          "padding-inline-end",
          "margin",
          "margin-top",
          "margin-right",
          "margin-bottom",
          "margin-left",
          "margin-block",
          "margin-block-start",
          "margin-block-end",
          "margin-inline",
          "margin-inline-start",
          "margin-inline-end",
        ],
      },
      // 4. Typography
      {
        properties: [
          "font",
          "font-family",
          "font-size",
          "font-weight",
          "font-style",
          "font-variant",
          "font-stretch",
          "line-height",
          "letter-spacing",
          "text-align",
          "text-decoration",
          "text-decoration-line",
          "text-decoration-style",
          "text-decoration-color",
          "text-transform",
          "text-overflow",
          "text-shadow",
          "text-indent",
          "white-space",
          "word-break",
          "word-wrap",
          "overflow-wrap",
          "vertical-align",
          "list-style",
          "list-style-type",
          "list-style-position",
          "list-style-image",
          "counter-reset",
          "counter-increment",
          "content",
        ],
      },
      // 5. Visual styling
      {
        properties: [
          "color",
          "background",
          "background-color",
          "background-image",
          "background-repeat",
          "background-position",
          "background-size",
          "background-attachment",
          "background-clip",
          "border",
          "border-width",
          "border-style",
          "border-color",
          "border-top",
          "border-right",
          "border-bottom",
          "border-left",
          "border-radius",
          "border-top-left-radius",
          "border-top-right-radius",
          "border-bottom-right-radius",
          "border-bottom-left-radius",
          "border-collapse",
          "border-spacing",
          "outline",
          "outline-width",
          "outline-style",
          "outline-color",
          "outline-offset",
          "box-shadow",
          "opacity",
          "filter",
          "backdrop-filter",
          "mix-blend-mode",
          "isolation",
          "fill",
          "stroke",
          "stroke-width",
          "table-layout",
        ],
      },
      // 6. Motion and interaction
      {
        properties: [
          "transition",
          "transition-property",
          "transition-duration",
          "transition-timing-function",
          "transition-delay",
          "animation",
          "animation-name",
          "animation-duration",
          "animation-timing-function",
          "animation-delay",
          "animation-fill-mode",
          "animation-iteration-count",
          "animation-direction",
          "animation-play-state",
          "transform",
          "transform-origin",
          "transform-style",
          "perspective",
          "cursor",
          "pointer-events",
          "user-select",
          "touch-action",
          "will-change",
          "scroll-behavior",
          "scroll-snap-type",
          "scroll-snap-align",
          "resize",
        ],
      },
    ],
  },
};

const configPath = path.join(os.tmpdir(), `prettify-scss-${process.pid}.json`);
fs.writeFileSync(configPath, JSON.stringify(stylelintConfig, null, 2));

const stylelintArgs = [`--config=${configPath}`, "--allow-empty-input", absPath];

function runStylelint(fix) {
  const args = fix ? ["--fix", ...stylelintArgs] : stylelintArgs;
  const result = spawnSync("stylelint", args, { encoding: "utf8" });
  // exit 1 = system/config error (bad config, missing plugin, etc.)
  if ((result.status ?? 0) === 1) {
    process.stderr.write(result.stderr || "stylelint system error\n");
    fs.unlinkSync(configPath);
    process.exit(1);
  }
  return { output: (result.stdout ?? "").trim(), exitCode: result.status ?? 0 };
}

try {
  // Pass A — apply all auto-fixable order violations (exit code ignored; output
  // from --fix reflects violations encountered, not what remains after fixing).
  runStylelint(true);
  process.stdout.write("  stylelint --fix ✓\n");

  // Step 3: prettier (second pass) — re-format after stylelint mutations ────────
  runPrettier();
  process.stdout.write("  prettier (pass 2) ✓\n");

  // Pass B — lint-only to find genuinely unfixable violations ───────────────────
  const { output: lintOutput, exitCode: lintExit } = runStylelint(false);

  if (lintExit === 0) {
    process.stdout.write("  stylelint (lint check) ✓\n");
  } else {
    process.stdout.write(`\nUnfixable violations (require manual correction):\n${lintOutput}\n`);
  }

  // ─── Step 4: Structural checks (not auto-fixable) ───────────────────────────

  const reporter = createReporter();
  const lines = readLines(absPath);

  runSection(reporter, "nesting depth > 3", () => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^(\s{16}|\t{4})[^\s/]/.test(line)) {
        reporter.fail(`${i + 1}:${line}  ← flatten HTML structure or split into a separate component`);
      }
    }
  });

  // ─── Summary ────────────────────────────────────────────────────────────────

  process.stdout.write("\n");

  if (lintExit === 0 && reporter.violations === 0) {
    process.stdout.write(`✓ ${filePath} — all fixes applied, no remaining issues\n`);
    process.exit(0);
  }

  const total = reporter.violations + (lintExit !== 0 ? 1 : 0);
  process.stdout.write(`✗ ${total} issue(s) cannot be auto-fixed — resolve manually before running verify-conventions.mjs\n`);
  process.exit(1);
} finally {
  if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
}
