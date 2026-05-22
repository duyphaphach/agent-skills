#!/usr/bin/env node
// Publish a file to one channel: wordpress, facebook, or linkedin.
// Credentials come from environment variables, or from the saved file
// ~/marketing-pipeline/.credentials. See references/publishing.md.
// Exit 0 on success, 1 on credential/API error, 2 on bad arguments.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

// Load saved credentials into the environment. An env var already set wins;
// the file only fills the gaps.
function loadStoredCredentials() {
  const file = path.join(os.homedir(), "marketing-pipeline", ".credentials");
  if (!fs.existsSync(file)) return;
  if (fs.statSync(file).mode & 0o077) {
    console.error(`Warning: ${file} is readable by others. Run: chmod 600 "${file}"`);
  }
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    if (process.env[key] === undefined) process.env[key] = t.slice(eq + 1);
  }
}
loadStoredCredentials();

const CHANNELS = ["wordpress", "facebook", "linkedin"];
const USAGE = `Usage: publish.mjs <${CHANNELS.join("|")}> <file> [--title T] [--status draft|publish] [--link URL] [--dry-run]`;

const args = process.argv.slice(2);
const channel = args[0];
const file = args[1];
const opts = { status: "draft", dryRun: false };
for (let i = 2; i < args.length; i++) {
  const a = args[i];
  if (a === "--dry-run") opts.dryRun = true;
  else if (a === "--title") opts.title = args[++i];
  else if (a === "--status") opts.status = args[++i];
  else if (a === "--link") opts.link = args[++i];
  else die(2, `Unknown option: ${a}\n${USAGE}`);
}

if (!CHANNELS.includes(channel)) die(2, USAGE);
if (!file || !fs.existsSync(file)) die(2, `File not found: ${file}\n${USAGE}`);

const content = fs.readFileSync(file, "utf8").trim();
if (!content) die(2, `File is empty: ${file}`);

function need(...vars) {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length) die(1, `Missing environment variable(s): ${missing.join(", ")}`);
}

// Hide credentials that ride in a request body or URL before anything is printed.
function redact(s) {
  return String(s || "").replace(/(access_token=)[^&\s]+/gi, "$1***");
}

async function send(label, url, init) {
  if (opts.dryRun) {
    console.log(`[dry-run] ${label}`);
    console.log(`  ${init.method} ${redact(url)}`);
    console.log(`  body: ${redact(init.body).slice(0, 300)}`);
    return;
  }
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) die(1, `${label} failed (${res.status}): ${text.slice(0, 400)}`);
  console.log(`${label} OK`);
  console.log(text.slice(0, 300));
}

async function wordpress() {
  need("WP_BASE_URL", "WP_USERNAME", "WP_APP_PASSWORD");
  if (!opts.title) die(2, "--title is required for WordPress");
  const auth = Buffer.from(
    `${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`,
  ).toString("base64");
  const url = `${process.env.WP_BASE_URL.replace(/\/$/, "")}/wp-json/wp/v2/posts`;
  await send("WordPress post", url, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title: opts.title, content, status: opts.status }),
  });
}

async function facebook() {
  need("FB_PAGE_ID", "FB_PAGE_TOKEN");
  const message = opts.link ? `${content}\n\n${opts.link}` : content;
  const url = `https://graph.facebook.com/v21.0/${process.env.FB_PAGE_ID}/feed`;
  await send("Facebook post", url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ message, access_token: process.env.FB_PAGE_TOKEN }).toString(),
  });
}

async function linkedin() {
  need("LI_ACCESS_TOKEN", "LI_AUTHOR_URN");
  const text = opts.link ? `${content}\n\n${opts.link}` : content;
  const url = "https://api.linkedin.com/v2/ugcPosts";
  const payload = {
    author: process.env.LI_AUTHOR_URN,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  await send("LinkedIn post", url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LI_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
  });
}

const run = { wordpress, facebook, linkedin }[channel];
run().catch((err) => die(1, `Error: ${err.message}`));
