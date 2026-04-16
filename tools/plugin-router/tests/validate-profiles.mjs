#!/usr/bin/env node
/**
 * tests/validate-profiles.mjs — schema-validate every built-in profile JSON.
 *
 * For each file under profiles/:
 *   1. File is valid JSON
 *   2. Has required field: description (non-empty string)
 *   3. Has required field: enable (non-empty array of strings)
 *   4. Each enable[] entry is a well-formed `<plugin-name>@<marketplace-name>`
 *      (lowercase kebab-case or snake_case name, @, kebab-case marketplace)
 *   5. Optional field: note (string if present)
 *   6. No duplicates within enable[]
 *
 * Run from the plugin root:
 *   node tests/validate-profiles.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.resolve(__dirname, '..', 'profiles');

const PLUGIN_ID_REGEX = /^[a-z0-9][a-z0-9_-]*@[a-z0-9][a-z0-9_-]*$/;

if (!fs.existsSync(PROFILES_DIR)) {
  console.error(`FAIL  profiles directory missing: ${PROFILES_DIR}`);
  process.exit(1);
}

const files = fs
  .readdirSync(PROFILES_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

if (files.length === 0) {
  console.error('FAIL  no profile JSON files found');
  process.exit(1);
}

let passed = 0;
const failures = [];

for (const file of files) {
  const full = path.join(PROFILES_DIR, file);
  const profileName = path.basename(file, '.json');
  const problems = [];

  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    problems.push(`invalid JSON: ${e.message}`);
    failures.push({ file, problems });
    console.log(`  FAIL  ${profileName}`);
    for (const p of problems) console.log(`         - ${p}`);
    continue;
  }

  if (typeof data.description !== 'string' || data.description.length === 0) {
    problems.push('missing or empty "description" (string required)');
  } else if (data.description.length > 120) {
    problems.push(`"description" is ${data.description.length} chars (keep under 120 for /router list)`);
  }

  if (!Array.isArray(data.enable)) {
    problems.push('missing or non-array "enable"');
  } else {
    if (data.enable.length === 0) {
      problems.push('"enable" is empty — a profile must enable at least one plugin');
    }

    const seen = new Set();
    for (const [i, id] of data.enable.entries()) {
      if (typeof id !== 'string') {
        problems.push(`enable[${i}] is not a string`);
        continue;
      }
      if (!PLUGIN_ID_REGEX.test(id)) {
        problems.push(`enable[${i}] "${id}" is not a valid <name>@<marketplace> plugin id`);
      }
      if (seen.has(id)) {
        problems.push(`enable[] contains duplicate "${id}"`);
      }
      seen.add(id);
    }
  }

  if (data.note !== undefined && typeof data.note !== 'string') {
    problems.push('"note" must be a string if present');
  }

  const allowed = new Set(['description', 'enable', 'note']);
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) {
      problems.push(`unknown top-level field "${key}" (allowed: description, enable, note)`);
    }
  }

  if (problems.length === 0) {
    passed++;
    console.log(`  PASS  ${profileName}  (${data.enable.length} plugins)`);
  } else {
    failures.push({ file, problems });
    console.log(`  FAIL  ${profileName}`);
    for (const p of problems) console.log(`         - ${p}`);
  }
}

console.log('');
if (failures.length === 0) {
  console.log(`PASS validate-profiles: ${passed}/${files.length} profiles valid`);
  process.exit(0);
} else {
  console.log(`FAIL validate-profiles: ${passed}/${files.length} passed, ${failures.length} failed`);
  process.exit(1);
}
