import { ALLOWED_PX_VALUES, collectMatches, createReporter, firstPixelValue, isFile, readLines, runSection } from "./_shared.mjs";

const scssFile = process.argv[2] ?? "";
const phpFile = process.argv[3] ?? "";

if (!scssFile || !isFile(scssFile)) {
  process.stdout.write("Usage: verify-conventions.mjs <file.scss> [template.php]\n");
  process.exit(2);
}

const reporter = createReporter();
const scssLines = readLines(scssFile);

process.stdout.write("═══════════════════════════════════════\n");
process.stdout.write(`SCSS: ${scssFile}\n`);
process.stdout.write("═══════════════════════════════════════\n");

runSection(reporter, ".facelift-layout wrapper", () => {
  const hasWrapper = scssLines.some((line) => line.includes(".facelift-layout"));
  if (!hasWrapper) reporter.fail("No .facelift-layout wrapper found — overrides must live inside it");
});

runSection(reporter, "flat selectors", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    return /^\s+\.[a-z].*\.[a-z]/.test(code) && !code.includes("@") ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "!important", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    return code.includes("!important") ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "display: flex without @include", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    return /display:\s*flex\b/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "transition: without @include", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    return /^\s*transition\s*:/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "raw spacing properties (non-zero)", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    if (!/^\s*(padding|margin|padding-block|padding-inline|margin-block|margin-inline|padding-block-start|padding-block-end|padding-inline-start|padding-inline-end|margin-block-start|margin-block-end|margin-inline-start|margin-inline-end)\s*:/.test(code)) {
      return null;
    }

    return /:\s*0\s*;?\s*$/.test(code) ? null : `${lineNumber}:${line}`;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "physical direction properties", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    return /(padding|margin)-(left|right|top|bottom)\s*:/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "raw hex colors", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    return /#[0-9a-fA-F]{3,8}\b/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "raw rem/em values", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    if (!/\b\d*\.?\d+(rem|em)\b/.test(code)) return null;
    if (/^\s*\$[\w-]+\s*:/.test(code)) return null;
    return `${lineNumber}:${line}`;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "off-scale px values", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    if (!/\b\d+px\b/.test(code)) return null;
    if (code.includes("@media")) return null;
    if (/^\s*\$[\w-]+\s*:/.test(code)) return null;

    const pxValue = firstPixelValue(code);
    if (!pxValue || ALLOWED_PX_VALUES.has(pxValue)) return null;
    return `${lineNumber}:${line}`;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "nesting depth > 3", () => {
  const matches = collectMatches(scssLines, ({ line, code, lineNumber }) => {
    return /^(\s{16}|\t{4})[^/]/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.warn(`${match}  ← consider flattening HTML or splitting component`);
});

if (phpFile && isFile(phpFile)) {
  const phpLines = readLines(phpFile);

  process.stdout.write("\n═══════════════════════════════════════\n");
  process.stdout.write(`Template: ${phpFile}\n`);
  process.stdout.write("═══════════════════════════════════════\n");

  runSection(reporter, "component-scoped class remnants (aml-*, kyc-*, client-*)", () => {
    const matches = collectMatches(phpLines, ({ line, code, lineNumber }) => {
      return /(aml-|kyc-|client-)[a-z]/.test(code) ? `${lineNumber}:${line}` : null;
    });

    for (const match of matches) reporter.fail(match);
  });

  runSection(reporter, "inline style attributes", () => {
    const matches = collectMatches(phpLines, ({ line, code, lineNumber }) => {
      return code.includes('style="') ? `${lineNumber}:${line}` : null;
    });

    for (const match of matches) reporter.fail(match);
  });

  runSection(reporter, "appearance-based class names", () => {
    const matches = collectMatches(phpLines, ({ line, code, lineNumber }) => {
      return /class="[^"]*(text-align-|pb-\d|pt-\d|ml-\d|mr-\d)[^"]*"/.test(code) ? `${lineNumber}:${line}` : null;
    });

    for (const match of matches) reporter.warn(`${match}  ← class name describes appearance, not role`);
  });
}

process.stdout.write("\n═══════════════════════════════════════\n");

if (reporter.violations === 0) {
  process.stdout.write("✓ All conventions pass\n");
  process.exit(0);
}

process.stdout.write(`✗ ${reporter.violations} violation(s) — fix before marking done\n`);
process.exit(1);
