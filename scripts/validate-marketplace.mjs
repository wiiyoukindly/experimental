#!/usr/bin/env node
/**
 * validate-marketplace.mjs — sanity-check the root marketplace manifest.
 *
 * Checks performed:
 *   1. .claude-plugin/marketplace.json exists and is valid JSON.
 *   2. marketplace manifest has required top-level fields (name, plugins[]).
 *   3. Every plugin entry has: name, description, source.
 *   4. Every source path resolves to a directory under the repo root.
 *   5. That directory contains a valid .claude-plugin/plugin.json.
 *   6. plugin.json.name matches marketplace entry name.
 *   7. Plugin entries in marketplace.json are sorted alphabetically by name
 *      (stable-diff guard).
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — at least one check failed (details printed to stderr)
 *
 * Run from the repo root: `node scripts/validate-marketplace.mjs`
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

// ───── 1. manifest exists and parses ────────────────────────────────────────
if (!fs.existsSync(MANIFEST_PATH)) {
  err(`Missing marketplace manifest: ${MANIFEST_PATH}`);
  report();
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
} catch (e) {
  err(`marketplace.json is not valid JSON: ${e.message}`);
  report();
  process.exit(1);
}

// ───── 2. top-level fields ──────────────────────────────────────────────────
if (!manifest.name) err('marketplace.json missing required field: name');
if (!Array.isArray(manifest.plugins)) {
  err('marketplace.json missing or non-array field: plugins');
  report();
  process.exit(1);
}
if (manifest.plugins.length === 0) {
  warn('marketplace has zero plugins (plugins[] is empty)');
}

// ───── 3-6. per-plugin checks ───────────────────────────────────────────────
for (const p of manifest.plugins) {
  const label = p.name || '<unnamed>';

  if (!p.name) err(`plugin entry missing field "name"`);
  if (!p.description) err(`plugin "${label}" missing field "description"`);
  if (!p.source) {
    err(`plugin "${label}" missing field "source"`);
    continue;
  }

  // Resolve source path (marketplace.json uses "./tools/..." convention)
  const sourcePath = path.resolve(REPO_ROOT, p.source);
  if (!fs.existsSync(sourcePath)) {
    err(`plugin "${label}" source directory does not exist: ${p.source}`);
    continue;
  }
  if (!fs.statSync(sourcePath).isDirectory()) {
    err(`plugin "${label}" source is not a directory: ${p.source}`);
    continue;
  }

  const pluginJsonPath = path.join(sourcePath, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(pluginJsonPath)) {
    err(
      `plugin "${label}" is missing ${path.relative(REPO_ROOT, pluginJsonPath)}`
    );
    continue;
  }

  let pluginJson;
  try {
    pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
  } catch (e) {
    err(`plugin "${label}" has invalid plugin.json: ${e.message}`);
    continue;
  }

  if (pluginJson.name !== p.name) {
    err(
      `plugin "${label}" name mismatch: marketplace.json says "${p.name}" but plugin.json says "${pluginJson.name}"`
    );
  }
  if (!pluginJson.version) {
    err(`plugin "${label}" plugin.json missing required field "version"`);
  }
  if (!pluginJson.description) {
    warn(`plugin "${label}" plugin.json missing field "description"`);
  }
}

// ───── 7. alphabetical-sort guard ───────────────────────────────────────────
const names = manifest.plugins.map((p) => p.name).filter(Boolean);
const sorted = [...names].sort();
const misordered = names.findIndex((n, i) => n !== sorted[i]);
if (misordered !== -1) {
  warn(
    `plugin entries are not sorted alphabetically by name (first mismatch: "${names[misordered]}" should be "${sorted[misordered]}")`
  );
}

// ───── report ───────────────────────────────────────────────────────────────
function report() {
  for (const w of warnings) console.warn(`WARN  ${w}`);
  for (const e of errors) console.error(`FAIL  ${e}`);
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`PASS  marketplace "${manifest?.name}" — ${manifest?.plugins?.length ?? 0} plugin(s)`);
    for (const p of manifest?.plugins ?? []) {
      console.log(`      - ${p.name}  (${p.source})`);
    }
  }
}

report();
process.exit(errors.length > 0 ? 1 : 0);
