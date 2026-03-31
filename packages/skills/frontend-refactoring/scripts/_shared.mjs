import fs from "node:fs";
import path from "node:path";

export const ALLOWED_PX_VALUES = new Set(["0", "1", "2", "4", "8", "10", "12", "16", "20", "24", "32", "40", "48", "56", "64", "80", "96"]);

export function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function isDirectory(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

export function readLines(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
}

export function formatLineMatch(lineNumber, line) {
  return `${lineNumber}:${line}`;
}

export function stripInlineComment(line) {
  const trimmed = line.trimStart();
  if (trimmed.startsWith("//")) return "";
  const commentIndex = line.indexOf("//");
  if (commentIndex === -1) return line;
  return line.slice(0, commentIndex);
}

export function createReporter() {
  return {
    violations: 0,
    fail(message) {
      process.stdout.write(`  FAIL  ${message}\n`);
      this.violations += 1;
    },
    warn(message) {
      process.stdout.write(`  WARN  ${message}\n`);
    },
    ok() {
      process.stdout.write("  ok\n");
    },
  };
}

export function runSection(reporter, title, callback) {
  process.stdout.write(`\n[ ${title} ]\n`);
  const before = reporter.violations;
  callback();
  if (reporter.violations === before) reporter.ok();
}

export function collectMatches(lines, predicate) {
  const matches = [];

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index];
    const code = stripInlineComment(line);
    if (!code.trim()) continue;

    const result = predicate({ line, code, lineNumber });
    if (!result) continue;

    if (result === true) {
      matches.push(formatLineMatch(lineNumber, line));
      continue;
    }

    if (typeof result === "string") {
      matches.push(result);
      continue;
    }

    if (Array.isArray(result)) {
      matches.push(...result);
    }
  }

  return matches;
}

export function listFilesRecursive(rootDir, predicate) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    let entries = [];

    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (predicate(fullPath)) files.push(fullPath);
    }
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

export function collectClassAttributes(contents) {
  return contents.match(/class="[^"]*"/g) ?? [];
}

export function firstPixelValue(line) {
  const match = line.match(/\b(\d+)px\b/);
  return match ? match[1] : null;
}
