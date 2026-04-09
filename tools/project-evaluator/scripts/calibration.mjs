#!/usr/bin/env node
// calibration.mjs
// Runs the 5 golden-set ideas through aggregation logic (with mocked factor scores
// matching the expected bands) and verifies the ranking produces results within the
// expected bands. This is a regression test for the framework weights and aggregation
// math, NOT for the LLM scoring itself.
//
// Usage: node calibration.mjs [--framework framework/]
//   Exits 0 on pass, 1 on fail.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregate, loadFramework } from './aggregate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FRAMEWORK_DIR = path.join(HERE, '..', 'framework');
const GOLDEN_PATH = path.join(HERE, '..', 'tests', 'golden.json');

function main() {
  const args = process.argv.slice(2);
  const frameworkDir = args.includes('--framework')
    ? args[args.indexOf('--framework') + 1]
    : DEFAULT_FRAMEWORK_DIR;

  if (!fs.existsSync(GOLDEN_PATH)) {
    console.error(`Golden set not found at ${GOLDEN_PATH}`);
    process.exit(1);
  }

  const golden = JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8'));
  const framework = loadFramework(frameworkDir);

  // Transform golden entries into the shape aggregate.mjs expects
  const scoredIdeas = golden.ideas.map(g => ({
    id: g.id,
    title: g.title,
    group_letter: g.group_letter || 'TEST',
    group_name: g.group_name || 'calibration',
    factor_scores: g.expected_factor_scores,
    red_flags: g.expected_red_flags || [],
    justification: g.description,
  }));

  const result = aggregate(scoredIdeas, framework);

  let passes = 0;
  let failures = 0;
  const errors = [];

  for (const g of golden.ideas) {
    const scored = result.ideas_with_scores.find(s => s.id === g.id);
    const balanced = scored.mode_scores.balanced;
    const [low, high] = g.expected_balanced_band;
    const pass = balanced >= low && balanced <= high;
    if (pass) {
      passes++;
      console.log(`  PASS  #${g.id} ${g.title} → balanced ${balanced}% (expected ${low}-${high})`);
    } else {
      failures++;
      errors.push(`#${g.id} ${g.title} → balanced ${balanced}% OUT OF BAND (expected ${low}-${high})`);
      console.log(`  FAIL  #${g.id} ${g.title} → balanced ${balanced}% (expected ${low}-${high})`);
    }
  }

  console.log('');
  console.log(`Calibration: ${passes} passed, ${failures} failed`);
  if (failures > 0) {
    console.error('\nErrors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  process.exit(0);
}

main();
