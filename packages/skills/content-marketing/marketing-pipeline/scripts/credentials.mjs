#!/usr/bin/env node
// Store and inspect publishing credentials for marketing-pipeline.
//
// Credentials live in ~/marketing-pipeline/.credentials as KEY=value lines.
// The directory is created mode 0700 and the file mode 0600 (owner only).
// publish.mjs loads this file automatically, so credentials are entered once.
//
// Usage:
//   credentials.mjs set     read KEY=VALUE lines from stdin, store them
//   credentials.mjs list    show stored keys, values masked
//   credentials.mjs path    print the credentials file path
//
// `set` reads stdin, not arguments, so secret values stay out of the process
// list. Exit 0 on success, 2 on bad input.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DIR = path.join(os.homedir(), "marketing-pipeline");
const FILE = path.join(DIR, ".credentials");

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

function readStore() {
  const store = new Map();
  if (!fs.existsSync(FILE)) return store;
  for (const line of fs.readFileSync(FILE, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq > 0) store.set(t.slice(0, eq).trim(), t.slice(eq + 1));
  }
  return store;
}

function writeStore(store) {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
  fs.chmodSync(DIR, 0o700);
  const body = [...store.entries()].map(([k, v]) => `${k}=${v}`).join("\n");
  fs.writeFileSync(FILE, `${body}\n`, { mode: 0o600 });
  fs.chmodSync(FILE, 0o600);
}

function mask(v) {
  return v.length <= 4 ? "****" : `${v.slice(0, 2)}***${v.slice(-2)} (${v.length} chars)`;
}

const action = process.argv[2];

if (action === "set") {
  const pairs = [];
  for (const line of fs.readFileSync(0, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) die(2, `Not a KEY=VALUE line: ${line}`);
    pairs.push([t.slice(0, eq).trim(), t.slice(eq + 1)]);
  }
  if (pairs.length === 0) die(2, "No KEY=VALUE lines on stdin.");
  const store = readStore();
  for (const [k, v] of pairs) store.set(k, v);
  writeStore(store);
  console.log(`Saved ${pairs.length} credential(s) to ${FILE}`);
  process.exit(0);
}

if (action === "list") {
  const store = readStore();
  if (store.size === 0) {
    console.log(`No credentials stored yet. File: ${FILE}`);
    process.exit(0);
  }
  console.log(`Stored credentials (${FILE}):`);
  for (const [k, v] of store) console.log(`  ${k} = ${mask(v)}`);
  process.exit(0);
}

if (action === "path") {
  console.log(FILE);
  process.exit(0);
}

die(2, "Usage: credentials.mjs <set|list|path>   (set reads KEY=VALUE lines from stdin)");
