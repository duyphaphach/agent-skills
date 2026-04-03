import { createReporter, isFile, readLines } from "./_shared.mjs";
import { runRule, scssRules, templateRules } from "./conventions.mjs";

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

for (const rule of scssRules) {
  runRule(rule, scssLines, reporter);
}

if (phpFile && isFile(phpFile)) {
  const phpLines = readLines(phpFile);

  process.stdout.write("\n═══════════════════════════════════════\n");
  process.stdout.write(`Template: ${phpFile}\n`);
  process.stdout.write("═══════════════════════════════════════\n");

  for (const rule of templateRules) {
    runRule(rule, phpLines, reporter);
  }
}

process.stdout.write("\n═══════════════════════════════════════\n");

if (reporter.violations === 0) {
  process.stdout.write("✓ All conventions pass\n");
  process.exit(0);
}

process.stdout.write(`✗ ${reporter.violations} violation(s) — fix before marking done\n`);
process.exit(1);
