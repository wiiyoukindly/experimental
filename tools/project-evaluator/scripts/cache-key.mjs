#!/usr/bin/env node
// cache-key.mjs
// Computes a deterministic cache key for a (framework_version + profile + idea + model) tuple.
// The cache key solves the LLM reproducibility problem: temperature=0 does NOT guarantee
// determinism on parallel hardware, but serving cached responses for identical inputs does.
//
// Usage (as CLI):
//   node cache-key.mjs --profile profile.json --idea idea.json --framework-version 1.0.0 --model haiku
// Usage (as module):
//   import { computeCacheKey } from './cache-key.mjs';

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function computeCacheKey({ frameworkVersion, profile, idea, model, mode }) {
  if (!frameworkVersion) throw new Error('frameworkVersion is required');
  if (!profile) throw new Error('profile is required');
  if (!idea) throw new Error('idea is required');
  if (!model) throw new Error('model is required');

  const profileHash = sha256(stableStringify(profile));
  const ideaHash = sha256(stableStringify(idea));
  const combined = `${frameworkVersion}|${profileHash}|${ideaHash}|${model}|${mode ?? 'none'}`;
  return sha256(combined);
}

function cachePathFor(cacheDir, key) {
  return path.join(cacheDir, `${key}.json`);
}

function readCache(cacheDir, key) {
  const p = cachePathFor(cacheDir, key);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(cacheDir, key, value) {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePathFor(cacheDir, key), JSON.stringify(value, null, 2));
}

function main() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i === -1 ? null : args[i + 1];
  };

  const profilePath = get('--profile');
  const ideaPath = get('--idea');
  const frameworkVersion = get('--framework-version') || '1.0.0';
  const model = get('--model') || 'haiku';
  const mode = get('--mode');

  if (!profilePath || !ideaPath) {
    console.error('Usage: node cache-key.mjs --profile P.json --idea I.json [--framework-version V] [--model M] [--mode M]');
    process.exit(1);
  }
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  const idea = JSON.parse(fs.readFileSync(ideaPath, 'utf8'));
  const key = computeCacheKey({ frameworkVersion, profile, idea, model, mode });
  process.stdout.write(key + '\n');
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { computeCacheKey, cachePathFor, readCache, writeCache, stableStringify, sha256 };
