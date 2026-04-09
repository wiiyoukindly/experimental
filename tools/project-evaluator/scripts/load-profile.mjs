#!/usr/bin/env node
// load-profile.mjs
// Reads a profile.yaml file, validates the basic shape, and emits a normalized JSON.
// Also supports auto-parsing a profile from a markdown file that contains a
// "ΤΙ ΥΠΑΡΧΕΙ ΗΔΗ ΣΤΟ ΟΠΛΟΣΤΑΣΙΟ ΣΟΥ" section (used for the user's creative-base-menu.md).
//
// Usage:
//   node load-profile.mjs <profile.yaml>                 → validates + prints JSON
//   node load-profile.mjs --from-markdown <file.md>      → auto-parses from markdown
//
// Zero external deps: uses a small inline YAML parser sufficient for the profile schema.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- tiny YAML parser (subset: nested maps, lists, scalars) ----------

function parseYamlSubset(text) {
  const lines = text.split('\n').filter(l => !/^\s*#/.test(l) && l.trim() !== '');
  const root = {};
  const stack = [{ indent: -1, value: root, key: null }];

  const parseScalar = (raw) => {
    const s = raw.trim();
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === 'null' || s === '~') return null;
    if (/^-?\d+$/.test(s)) return Number(s);
    if (/^-?\d*\.\d+$/.test(s)) return Number(s);
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    if (s.startsWith('[') && s.endsWith(']')) {
      return s.slice(1, -1).split(',').map(x => parseScalar(x)).filter(x => x !== '');
    }
    return s;
  };

  for (const raw of lines) {
    const indent = raw.match(/^(\s*)/)[1].length;
    const content = raw.slice(indent);

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1].value;

    if (content.startsWith('- ')) {
      const rest = content.slice(2);
      if (!Array.isArray(parent)) {
        const parentKey = stack[stack.length - 1].key;
        const grandparent = stack[stack.length - 2].value;
        if (parentKey !== null && !Array.isArray(grandparent[parentKey])) {
          grandparent[parentKey] = [];
          stack[stack.length - 1].value = grandparent[parentKey];
        }
      }
      const arr = stack[stack.length - 1].value;
      if (rest.includes(':')) {
        const obj = {};
        arr.push(obj);
        const [k, ...rv] = rest.split(':');
        const v = rv.join(':').trim();
        if (v) obj[k.trim()] = parseScalar(v);
        stack.push({ indent, value: obj, key: null });
      } else {
        arr.push(parseScalar(rest));
      }
      continue;
    }

    if (content.includes(':')) {
      const idx = content.indexOf(':');
      const key = content.slice(0, idx).trim();
      const value = content.slice(idx + 1).trim();
      if (value === '') {
        parent[key] = {};
        stack.push({ indent, value: parent[key], key });
      } else {
        parent[key] = parseScalar(value);
      }
    }
  }

  return root;
}

// ---------- profile validation ----------

function validateProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object') errors.push('profile must be an object');
  if (!profile.identity) errors.push('missing identity block');
  if (!profile.stack) errors.push('missing stack block');
  if (!profile.time) errors.push('missing time block');
  if (errors.length) throw new Error('Profile validation failed:\n  - ' + errors.join('\n  - '));
  return profile;
}

// ---------- auto-parse from creative-base-menu.md style markdown ----------

function parseProfileFromMarkdown(md) {
  const identityName = extractFirstMatch(md, /GitHub.*?`([^`]+)`/);
  const hasBookKDP = /Seven_Echoes.*KDP/i.test(md);
  const hasNevar = /Nevar.*React.*noir/i.test(md) || /Nevar.*playable MVP/i.test(md);
  const hasThesPlan = /ThesPlan/i.test(md);
  const hasAniRec = /AniRec/i.test(md);
  const hasWeightGame = /weight-game/i.test(md);
  const hasPacingAnalyzer = /pacing-analyzer/i.test(md);
  const stackSection = extractSection(md, /Stack comfort/i, /\|/);
  const bilingual = /bilingual/i.test(md) || /(GR \+ EN)/i.test(md);
  const hoursMatch = md.match(/(\d+)\+?\s*ώρες?\s*\/?\s*εβδ?/i) || md.match(/(\d+)\+?\s*h(ours?)?\s*\/\s*week/i);

  const assets = [];
  if (hasBookKDP) assets.push({ name: 'Seven Echoes novel', type: 'publish-ready ebook', reusable: true });
  if (hasNevar) assets.push({ name: 'Nevar', type: 'playable game MVP (React noir)', reusable: true });
  if (hasThesPlan) assets.push({ name: 'ThesPlan', type: 'Replit app (productivity/planning)', reusable: true });
  if (hasAniRec) assets.push({ name: 'AniRec', type: 'Replit app (anime recommender)', reusable: true });
  if (hasWeightGame) assets.push({ name: 'weight-game', type: 'Replit app (gamified fitness)', reusable: true });
  if (hasPacingAnalyzer) assets.push({ name: 'pacing-analyzer', type: 'Replit project (writing analysis)', reusable: true });

  const profile = {
    identity: {
      name: identityName || 'unknown',
      bilingual: bilingual ? ['en', 'el'] : ['en'],
      role: 'solo builder / creative + technical'
    },
    stack: {
      languages: ['typescript', 'javascript'],
      frameworks: ['react', 'vite', 'tailwind', 'framer-motion', 'zustand'],
      runtimes: ['node'],
      db: ['drizzle'],
      comfort: { react: 5, typescript: 5, node: 4, python: 2, swift: 1, kotlin: 1 },
      proven_on: ['ThesPlan', 'Nevar', 'Seven Echoes tooling']
    },
    assets,
    time: {
      hours_per_week: hoursMatch ? Number(hoursMatch[1]) : 20,
      availability: 'part-time, flexible'
    },
    goals: {
      primary: 'monetize creative work + build portfolio of shippable tools',
      cashflow_pressure: 'low',
      life_stage: 'exploring directions, choosing next project'
    },
    constraints: {
      target_market: 'global / EN',
      not_targeting: ['greek-only niches'],
      no_b2b_enterprise: true,
      no_regulatory_domains: true
    },
    framework_version: '1.0.0'
  };
  return profile;
}

function extractFirstMatch(md, re) {
  const m = md.match(re);
  return m ? m[1] : null;
}

function extractSection(md, headingRe, rowRe) {
  const lines = md.split('\n');
  const start = lines.findIndex(l => headingRe.test(l));
  if (start === -1) return '';
  const rows = [];
  for (let i = start; i < Math.min(start + 20, lines.length); i++) {
    if (rowRe.test(lines[i])) rows.push(lines[i]);
  }
  return rows.join('\n');
}

// ---------- YAML serializer for profile output ----------

function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  const parts = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      parts.push(`${pad}${key}: null`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) { parts.push(`${pad}${key}: []`); continue; }
      parts.push(`${pad}${key}:`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          const inner = toYaml(item, indent + 1).split('\n');
          parts.push(`${pad}  - ${inner[0].trim()}`);
          for (let i = 1; i < inner.length; i++) parts.push(`${pad}    ${inner[i].trim()}`);
        } else {
          parts.push(`${pad}  - ${formatScalar(item)}`);
        }
      }
    } else if (typeof value === 'object') {
      parts.push(`${pad}${key}:`);
      parts.push(toYaml(value, indent + 1));
    } else {
      parts.push(`${pad}${key}: ${formatScalar(value)}`);
    }
  }
  return parts.join('\n');
}

function formatScalar(v) {
  if (typeof v === 'string') {
    if (v.match(/[:#\[\]{}]/) || v.includes('\n')) return `"${v.replace(/"/g, '\\"')}"`;
    return v;
  }
  return String(v);
}

// ---------- main ----------

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node load-profile.mjs <profile.yaml>');
    console.error('       node load-profile.mjs --from-markdown <file.md>');
    process.exit(1);
  }

  if (args[0] === '--from-markdown') {
    const mdPath = args[1];
    if (!mdPath || !fs.existsSync(mdPath)) {
      console.error(`Markdown file not found: ${mdPath}`);
      process.exit(1);
    }
    const md = fs.readFileSync(mdPath, 'utf8');
    const profile = parseProfileFromMarkdown(md);
    process.stdout.write(toYaml(profile) + '\n');
    process.stderr.write(`Auto-parsed profile from ${path.basename(mdPath)}\n`);
    return;
  }

  const profilePath = args[0];
  if (!fs.existsSync(profilePath)) {
    console.error(`Profile file not found: ${profilePath}`);
    process.exit(1);
  }
  const yamlText = fs.readFileSync(profilePath, 'utf8');
  const profile = parseYamlSubset(yamlText);
  validateProfile(profile);
  process.stdout.write(JSON.stringify(profile, null, 2) + '\n');
  process.stderr.write(`Loaded + validated profile from ${path.basename(profilePath)}\n`);
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { parseYamlSubset, validateProfile, parseProfileFromMarkdown, toYaml };
