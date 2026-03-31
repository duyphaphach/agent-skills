import { ALLOWED_PX_VALUES, collectMatches, createReporter, firstPixelValue, isFile, readLines, runSection } from "./_shared.mjs";

const filePath = process.argv[2] ?? "";

if (!filePath || !isFile(filePath)) {
  process.stdout.write("Usage: lint-scss.mjs <path/to/file.scss>\n");
  process.exit(2);
}

const reporter = createReporter();
const lines = readLines(filePath);

process.stdout.write(`Linting: ${filePath}\n`);

runSection(reporter, "colors", () => {
  const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
    return /#[0-9a-fA-F]{3,8}\b/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "!important", () => {
  const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
    return code.includes("!important") ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "rem/em values in properties", () => {
  const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
    if (!/\b\d*\.?\d+(rem|em)\b/.test(code)) return null;
    if (/^\s*\$[\w-]+\s*:/.test(code)) return null;
    return `${lineNumber}:${line}`;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "display: flex without mixin", () => {
  const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
    return /display:\s*flex\b/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "transition: without mixin", () => {
  const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
    return /^\s*transition\s*:/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "raw spacing properties", () => {
  const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
    if (!/^\s*(padding|margin|padding-block|padding-inline|margin-block|margin-inline|padding-block-start|padding-block-end|padding-inline-start|padding-inline-end|margin-block-start|margin-block-end|margin-inline-start|margin-inline-end)\s*:/.test(code)) {
      return null;
    }

    return /:\s*0\s*;?\s*$/.test(code) ? null : `${lineNumber}:${line}`;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "physical direction properties", () => {
  const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
    return /(padding|margin)-(left|right|top|bottom)\s*:/.test(code) ? `${lineNumber}:${line}` : null;
  });

  for (const match of matches) reporter.fail(match);
});

runSection(reporter, "off-scale px values", () => {
  const matches = collectMatches(lines, ({ line, code, lineNumber }) => {
    if (!/\b\d+px\b/.test(code)) return null;
    if (code.includes("@media")) return null;
    if (/^\s*\$[\w-]+\s*:/.test(code)) return null;

    const pxValue = firstPixelValue(code);
    if (!pxValue || ALLOWED_PX_VALUES.has(pxValue)) return null;
    return `${lineNumber}:${line}`;
  });

  for (const match of matches) reporter.fail(match);
});

process.stdout.write("\n");

if (reporter.violations === 0) {
  process.stdout.write("✓ No violations found\n");
  process.exit(0);
}

process.stdout.write(`✗ ${reporter.violations} violation(s) — fix before committing\n`);
process.exit(1);
