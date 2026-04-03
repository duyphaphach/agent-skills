/**
 * conventions.mjs
 *
 * Single source of truth for all SCSS and template convention rules.
 *
 * Adding a rule:  push one object into scssRules or templateRules.
 * Removing a rule: delete the object.
 * Both lint-scss.mjs and verify-conventions.mjs pick up changes automatically.
 *
 * Rule shapes:
 *
 *   Pattern rule (per-line):
 *     { name, severity, pattern, exclude?, skip?, suffix? }
 *     - pattern:  regex — line must match to be a candidate
 *     - exclude:  regex — if candidate also matches, skip it (e.g. `: 0`)
 *     - skip:     regex — skip lines before testing pattern (e.g. variable defs)
 *     - suffix:   string appended to the violation message
 *
 *   Custom test rule (per-line):
 *     { name, severity, test: ({ line, code, lineNumber }) => boolean }
 *
 *   Structural rule (whole-file):
 *     { name, severity, structural: true, check: (lines) => string[] }
 *     - check receives all lines, returns array of violation messages
 */

import { collectMatches, runSection, shouldNormalizePixelValue } from "./_shared.mjs";

// ─── Shared patterns ─────────────────────────────────────────────────────────

const SPACING_PROPS = /^\s*(padding|margin|gap|row-gap|column-gap|padding-block|padding-inline|margin-block|margin-inline|padding-block-start|padding-block-end|padding-inline-start|padding-inline-end|margin-block-start|margin-block-end|margin-inline-start|margin-inline-end)\s*:/;

// ─── SCSS rules ───────────────────────────────────────────────────────────────

export const scssRules = [
  // Structural (whole-file) — skipped by lint-scss, used by verify-conventions
  {
    name: ".facelift-layout wrapper",
    severity: "fail",
    structural: true,
    check: (lines) => {
      const found = lines.some((l) => l.includes(".facelift-layout"));
      return found ? [] : ["No .facelift-layout wrapper found — overrides must live inside it"];
    },
  },
  {
    name: "flat selectors",
    severity: "fail",
    structural: true,
    pattern: /^\s+\.[a-z].*\.[a-z]/,
    exclude: /@/,
  },

  // Per-line checks
  {
    name: "!important",
    severity: "fail",
    pattern: /!important/,
  },
  {
    name: "display: flex / inline-flex without @include",
    severity: "fail",
    pattern: /display:\s*(inline-)?flex\b/,
  },
  {
    name: "transition: without @include",
    severity: "fail",
    pattern: /^\s*transition\s*:/,
  },
  {
    name: "raw spacing properties (non-zero)",
    severity: "fail",
    pattern: SPACING_PROPS,
    exclude: /:\s*0\s*;?\s*$/,
  },
  {
    name: "physical direction properties",
    severity: "fail",
    pattern: /(padding|margin)-(left|right|top|bottom)\s*:/,
  },
  {
    name: "hex colors",
    severity: "fail",
    pattern: /#[0-9a-fA-F]{3,8}\b/,
  },
  {
    name: "rem/em values in properties",
    severity: "fail",
    pattern: /\b\d*\.?\d+(rem|em)\b/,
    skip: /^\s*\$[\w-]+\s*:/,
  },
  {
    name: "px values that should be normalized",
    severity: "fail",
    test: ({ code }) => {
      if (!/\b\d+px\b/.test(code)) return false;
      if (code.includes("@media")) return false;
      if (/^\s*\$[\w-]+\s*:/.test(code)) return false;
      return shouldNormalizePixelValue(code);
    },
  },

  // Structural — advisory
  {
    name: "nesting depth > 3",
    severity: "warn",
    structural: true,
    pattern: /^(\s{16}|\t{4})[^/\s]/,
    suffix: "  ← consider flattening HTML or splitting component",
  },
];

// ─── Template rules ───────────────────────────────────────────────────────────

export const templateRules = [
  {
    name: "component-scoped class remnants (aml-*, kyc-*, client-*)",
    severity: "warn",
    pattern: /(aml-|kyc-|client-)[a-z]/,
    suffix: "  ← use sparingly; prefer semantic class names",
  },
  {
    name: "inline style attributes",
    severity: "fail",
    pattern: /style="/,
  },
  {
    name: "appearance-based class names",
    severity: "warn",
    pattern: /class="[^"]*(text-align-|pb-\d|pt-\d|ml-\d|mr-\d)[^"]*"/,
    suffix: "  ← class name describes appearance, not role",
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

export function runRule(rule, lines, reporter) {
  runSection(reporter, rule.name, () => {
    // Whole-file structural check
    if (rule.check) {
      const violations = rule.check(lines);
      for (const v of violations) {
        if (rule.severity === "warn") reporter.warn(v);
        else reporter.fail(v);
      }
      return;
    }

    // Per-line check
    const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
      if (rule.skip && rule.skip.test(code)) return null;

      if (rule.test) {
        if (!rule.test({ line, code, lineNumber })) return null;
      } else if (rule.pattern) {
        if (!rule.pattern.test(code)) return null;
        if (rule.exclude && rule.exclude.test(code)) return null;
      }

      const suffix = rule.suffix ?? "";
      return `${lineNumber}:${line}${suffix}`;
    });

    for (const match of matches) {
      if (rule.severity === "warn") reporter.warn(match);
      else reporter.fail(match);
    }
  });
}
