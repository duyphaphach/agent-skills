import { createReporter, isFile, readLines } from "./_shared.mjs";
import { runRule, scssRules } from "./conventions.mjs";

const filePath = process.argv[2] ?? "";

if (!filePath || !isFile(filePath)) {
  process.stdout.write("Usage: lint-scss.mjs <path/to/file.scss>\n");
  process.exit(2);
}

const reporter = createReporter();
const lines = readLines(filePath);

process.stdout.write(`Linting: ${filePath}\n`);

for (const rule of scssRules) {
  if (rule.structural) continue;
  runRule(rule, lines, reporter);
}

process.stdout.write("\n");

if (reporter.violations === 0) {
  process.stdout.write("✓ No violations found\n");
  process.exit(0);
}

process.stdout.write(`✗ ${reporter.violations} violation(s) — fix before committing\n`);
process.exit(1);
