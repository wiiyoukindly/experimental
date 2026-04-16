#!/usr/bin/env node
/**
 * tests/smoke.mjs — smoke-tests the plugin-router CLI.
 *
 * These run in a temporary CLAUDE_PLUGIN_DATA directory so they can't touch
 * the user's real plugin state. They exercise the subcommands that don't
 * require a writable ~/.claude/settings.json:
 *
 *   - help
 *   - list
 *
 * Each subcommand must:
 *   1. Exit with code 0
 *   2. Produce output whose first line starts with "OK "
 *
 * Run from the plugin root:
 *   node tests/smoke.mjs
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const CLI = path.join(PLUGIN_ROOT, 'scripts', 'cli.js');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-router-smoke-'));
const env = {
  ...process.env,
  CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
  CLAUDE_PLUGIN_DATA: tmpDir,
};

const cases = [
  { name: 'help', args: ['help'], expectFirstLine: /^OK /, expectContains: 'Usage:' },
  { name: 'list', args: ['list'], expectFirstLine: /^OK /, expectContains: 'core' },
  // `help` with no args should behave like help
  { name: 'no-args', args: [], expectFirstLine: /^OK /, expectContains: 'Usage:' },
];

let passed = 0;
const failures = [];

for (const tc of cases) {
  const r = spawnSync('node', [CLI, ...tc.args], {
    env,
    encoding: 'utf8',
  });

  const firstLine = (r.stdout || '').split('\n', 2)[0];
  const problems = [];

  if (r.status !== 0) {
    problems.push(`exit=${r.status} (expected 0)`);
  }
  if (!tc.expectFirstLine.test(firstLine)) {
    problems.push(`first line "${firstLine}" does not match ${tc.expectFirstLine}`);
  }
  if (tc.expectContains && !(r.stdout || '').includes(tc.expectContains)) {
    problems.push(`stdout missing expected substring "${tc.expectContains}"`);
  }

  if (problems.length === 0) {
    passed++;
    console.log(`  PASS  ${tc.name}`);
  } else {
    failures.push({ name: tc.name, problems, stderr: r.stderr, stdout: r.stdout });
    console.log(`  FAIL  ${tc.name}`);
    for (const p of problems) console.log(`         - ${p}`);
  }
}

// Cleanup tmpdir
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('');
if (failures.length === 0) {
  console.log(`PASS smoke: ${passed}/${cases.length} subcommands respond with expected markers`);
  process.exit(0);
} else {
  console.log(`FAIL smoke: ${passed}/${cases.length} passed, ${failures.length} failed`);
  for (const f of failures) {
    console.log(`--- ${f.name} stderr ---`);
    console.log(f.stderr || '(empty)');
  }
  process.exit(1);
}
