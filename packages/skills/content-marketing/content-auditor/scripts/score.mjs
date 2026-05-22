#!/usr/bin/env node
// Deterministic scoring + quality gate for content-auditor.
//
// Every "auto" criterion in barem.json is computed exactly from the text —
// counts, lengths, substring presence. The same input always yields the same
// auto score. Only the few "judgment" criteria depend on the model, and they
// are restricted to fixed levels, so total variance stays low.
//
// Usage:
//   score.mjs <file> --type <outline|article> --keyword "<kw>" [--judgment <file>] [--barem <file>]
//
// Without --judgment: prints the auto scores; judgment criteria show as pending. Exit 0.
// With --judgment:    merges the supplied judgment scores, prints the full report,
//                     and gates — exit 0 if total >= pass_threshold, else 1.
// Exit 2 on bad input.

import fs from "node:fs";

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

// --- arguments ---
const args = process.argv.slice(2);
const file = args[0];
const opts = {};
for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === "--type") opts.type = args[++i];
  else if (a === "--keyword") opts.keyword = args[++i];
  else if (a === "--judgment") opts.judgment = args[++i];
  else if (a === "--barem") opts.barem = args[++i];
  else die(2, `Unknown option: ${a}`);
}

const USAGE = 'Usage: score.mjs <file> --type <outline|article> --keyword "<kw>" [--judgment <file>]';
if (!file || !fs.existsSync(file)) die(2, `File not found.\n${USAGE}`);
if (!["outline", "article"].includes(opts.type)) die(2, `--type must be 'outline' or 'article'.\n${USAGE}`);
if (!opts.keyword) die(2, `--keyword is required.\n${USAGE}`);

const baremPath = opts.barem || new URL("../references/barem.json", import.meta.url);
let barem;
try {
  barem = JSON.parse(fs.readFileSync(baremPath, "utf8"));
} catch (e) {
  die(2, `Cannot read barem.json: ${e.message}`);
}
const rubric = barem.rubrics[opts.type];
if (!rubric) die(2, `barem.json has no rubric for '${opts.type}'`);

// --- parse the document ---
const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const sentences = (s) => s.split(/[.!?]+(?:\s|$)/).map((x) => x.trim()).filter(Boolean);

function parseDoc(raw, type) {
  const structure = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const paragraphs = [];
  let inFence = false;
  let buf = [];
  const flush = () => {
    if (buf.length) {
      paragraphs.push(buf.join(" ").trim());
      buf = [];
    }
  };
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (/^```/.test(t)) {
      inFence = !inFence;
      flush();
      continue;
    }
    if (inFence) continue;
    // outline label: "H2: section" or "- H2: section"
    const label = t.match(/^[-*+]?\s*H([1-6])\s*:\s*(.+)$/i);
    // markdown heading: "## section"
    const md = t.match(/^(#{1,6})\s+(.+)$/);
    if (type === "outline") {
      if (label) {
        flush();
        structure[Number(label[1])].push(label[2].trim());
        continue;
      }
      if (md) {
        flush();
        continue; // a markdown heading is the outline's own header, not structure
      }
    } else if (md) {
      flush();
      structure[md[1].length].push(md[2].trim());
      continue;
    }
    if (t === "") {
      flush();
      continue;
    }
    if (/^\|/.test(t) || /^[-*+]\s/.test(t) || /^\d+\.\s/.test(t) || /^>/.test(t)) {
      continue; // skip table rows, list items, blockquotes for prose metrics
    }
    buf.push(t);
  }
  flush();
  return {
    raw,
    structure,
    paragraphs,
    bodyText: paragraphs.join(" "),
    links: raw.match(/\[[^\]]*\]\([^)]+\)/g) || [],
  };
}

function nodeCount(doc, node) {
  if (node === "word") return words(doc.bodyText).length;
  if (node === "paragraph") return doc.paragraphs.length;
  const m = node.match(/^h([1-6])$/i);
  return m ? (doc.structure[Number(m[1])] || []).length : 0;
}

const CHECKS = {
  keywordInHeading: (doc, p, kw) => (doc.structure[p.level] || []).some((h) => h.toLowerCase().includes(kw)),
  keywordInAnyHeading: (doc, p, kw) => (doc.structure[p.level] || []).some((h) => h.toLowerCase().includes(kw)),
  keywordInBody: (doc, p, kw) =>
    words(doc.bodyText).slice(0, p.firstWords).join(" ").toLowerCase().includes(kw),
  countInRange: (doc, p) => {
    const n = nodeCount(doc, p.node);
    return n >= p.min && n <= p.max;
  },
  avgWords: (doc, p) => {
    const units = p.unit === "sentence" ? doc.paragraphs.flatMap(sentences) : doc.paragraphs;
    if (units.length === 0) return false;
    const avg = units.reduce((s, u) => s + words(u).length, 0) / units.length;
    return avg <= p.max;
  },
  maxWords: (doc, p) => {
    const units = p.unit === "sentence" ? doc.paragraphs.flatMap(sentences) : doc.paragraphs;
    if (units.length === 0) return false;
    return units.every((u) => words(u).length <= p.max);
  },
  sectionExists: (doc, p) => new RegExp(p.pattern, "i").test(doc.raw),
  linkCount: (doc, p) => doc.links.length >= p.min,
};

const kw = opts.keyword.toLowerCase();
const doc = parseDoc(fs.readFileSync(file, "utf8"), opts.type);

// --- score the auto criteria ---
let autoEarned = 0;
let autoMax = 0;
let judgeMax = 0;
const rows = [];
for (const c of rubric.criteria) {
  if (c.type === "auto") {
    const fn = CHECKS[c.check];
    if (!fn) die(2, `barem.json uses an unknown check: ${c.check}`);
    const pass = fn(doc, c.params || {}, kw);
    const earned = pass ? c.points : 0;
    autoEarned += earned;
    autoMax += c.points;
    rows.push({ ...c, earned, pass });
  } else {
    judgeMax += c.points;
    rows.push({ ...c, earned: null });
  }
}

// --- merge judgment scores if supplied ---
let judgeEarned = 0;
let gated = false;
if (opts.judgment) {
  let j;
  try {
    j = JSON.parse(fs.readFileSync(opts.judgment, "utf8"));
  } catch (e) {
    die(2, `Cannot read judgment file: ${e.message}`);
  }
  for (const row of rows) {
    if (row.type !== "judgment") continue;
    if (!(row.id in j)) die(2, `Judgment file is missing criterion '${row.id}'`);
    const v = Number(j[row.id]);
    if (!row.levels.includes(v)) {
      die(2, `Criterion '${row.id}' = ${j[row.id]} is not an allowed level [${row.levels.join(", ")}]`);
    }
    row.earned = v;
    judgeEarned += v;
  }
  gated = true;
}

// --- report ---
console.log("");
console.log(`Scoring [${opts.type}]  keyword: "${opts.keyword}"`);
console.log("-".repeat(64));
for (const r of rows) {
  const score = r.earned === null ? "  pending" : `${String(r.earned).padStart(3)}/${String(r.points).padEnd(3)}`;
  const mark = r.type === "auto" ? (r.pass ? "OK  " : "MISS") : "JUDG";
  console.log(`${mark}  ${score}  ${r.label}`);
}
console.log("-".repeat(64));
const total = autoEarned + judgeEarned;

if (gated) {
  console.log(`Auto ${autoEarned}/${autoMax}   Judgment ${judgeEarned}/${judgeMax}   TOTAL ${total}/100`);
  const pass = total >= barem.pass_threshold;
  console.log("");
  console.log(pass
    ? `GATE PASSED  (${total} >= ${barem.pass_threshold})`
    : `GATE FAILED  (${total} < ${barem.pass_threshold})`);
  process.exit(pass ? 0 : 1);
}

console.log(`Auto subtotal ${autoEarned}/${autoMax}.  Judgment pending: ${judgeMax} pts.`);
console.log("");
console.log("Score the judgment criteria, write {id: points} to a JSON file,");
console.log("then re-run with --judgment <file> for the final score and gate.");
process.exit(0);
