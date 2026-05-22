#!/usr/bin/env node
// Verify a content-producer run folder holds all six required outputs.
// A run is not complete until every file below exists and is non-empty.
// Exit 0 if all present, 1 if any missing or empty, 2 on bad input.

import fs from "node:fs";
import path from "node:path";

const REQUIRED = [
  "01-research-result.md",
  "02-research-picks.md",
  "03-outlines.md",
  "04-picked-outline.md",
  "05-audit-rounds.md",
  "06-final-products.md",
];

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: check-outputs.mjs <run-folder>");
  process.exit(2);
}
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`Not a directory: ${dir}`);
  process.exit(2);
}

let ok = true;
console.log(`Required outputs in ${dir}`);
for (const name of REQUIRED) {
  const p = path.join(dir, name);
  let status;
  if (!fs.existsSync(p)) {
    status = "MISSING";
    ok = false;
  } else if (fs.readFileSync(p, "utf8").trim().length === 0) {
    status = "EMPTY";
    ok = false;
  } else {
    status = "OK";
  }
  console.log(`  ${status.padEnd(8)} ${name}`);
}
console.log("");
console.log(ok ? "ALL SIX OUTPUTS PRESENT" : "RUN INCOMPLETE - required outputs missing");
process.exit(ok ? 0 : 1);
