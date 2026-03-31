import fs from "node:fs";
import path from "node:path";

import { collectClassAttributes, isDirectory, listFilesRecursive } from "./_shared.mjs";

function countLines(contents) {
  if (contents === "") return 0;
  return contents.endsWith("\n") ? contents.split(/\r?\n/).length - 1 : contents.split(/\r?\n/).length;
}

const targetDir = process.argv[2] ?? "views";

if (!isDirectory(targetDir)) {
  process.stdout.write("Usage: scan-partials.mjs <views-directory>\n");
  process.exit(2);
}

const phpFiles = listFilesRecursive(targetDir, (filePath) => filePath.endsWith(".php"));
const nonPartialPhpFiles = phpFiles.filter((filePath) => !path.basename(filePath).startsWith("_"));
const classCounts = new Map();

process.stdout.write(`Scanning: ${targetDir}\n\n`);
process.stdout.write("[ large templates (>150 lines) ]\n");

let foundLargeTemplate = false;

for (const filePath of nonPartialPhpFiles) {
  const contents = fs.readFileSync(filePath, "utf8");
  const lineCount = countLines(contents);
  if (lineCount <= 150) continue;

  process.stdout.write(`  ${lineCount} lines  ${filePath}\n`);
  foundLargeTemplate = true;
}

if (!foundLargeTemplate) process.stdout.write("  none\n");

for (const filePath of phpFiles) {
  const contents = fs.readFileSync(filePath, "utf8");
  const uniqueClassAttributes = new Set(collectClassAttributes(contents));

  for (const classAttribute of uniqueClassAttributes) {
    classCounts.set(classAttribute, (classCounts.get(classAttribute) ?? 0) + 1);
  }
}

process.stdout.write("\n[ class names appearing in 3+ files ]\n");

const repeatedClasses = [...classCounts.entries()]
  .filter(([, count]) => count >= 3)
  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
  .slice(0, 20);

if (repeatedClasses.length === 0) {
  process.stdout.write("  none\n");
} else {
  for (const [classAttribute, count] of repeatedClasses) {
    process.stdout.write(`  ${count}x  ${classAttribute}\n`);
  }
}

process.stdout.write("\n[ component-scoped class remnants ]\n");

let foundScopedClasses = false;

for (const filePath of phpFiles) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/class="[^"]*(aml-|kyc-|client-)[^"]*"/.test(line)) continue;

    process.stdout.write(`  ${filePath}:${index + 1}:${line}\n`);
    foundScopedClasses = true;
  }
}

if (!foundScopedClasses) process.stdout.write("  none\n");

process.stdout.write("\nDone.\n");
