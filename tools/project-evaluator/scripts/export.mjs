#!/usr/bin/env node
// export.mjs
// Converts an aggregated report JSON into csv, json, or Notion-flavored markdown.
//
// Usage: node export.mjs <aggregated.json> --format csv|json|notion [--out file]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function toCsv(aggregated) {
  const rows = [];
  const header = [
    'id', 'title', 'group_letter', 'group_name',
    'demand_evidence', 'build_effort', 'technical_fit', 'distribution_clarity',
    'asset_leverage', 'time_to_first_revenue', 'tam', 'competition_density',
    'moat', 'pricing_power', 'differentiator', 'operational_burden',
    'balanced_score', 'cashflow_score', 'learning_score', 'moat_score',
    'red_flags', 'justification',
  ];
  rows.push(header.join(','));
  for (const idea of aggregated.ideas_with_scores) {
    const fs = idea.factor_scores;
    const ms = idea.mode_scores;
    const row = [
      idea.id,
      csvEscape(idea.title),
      csvEscape(idea.group_letter || ''),
      csvEscape(idea.group_name || ''),
      fs.demand_evidence, fs.build_effort, fs.technical_fit, fs.distribution_clarity,
      fs.asset_leverage, fs.time_to_first_revenue, fs.tam, fs.competition_density,
      fs.moat, fs.pricing_power, fs.differentiator, fs.operational_burden,
      ms.balanced, ms.cashflow, ms.learning, ms.moat,
      csvEscape((idea.red_flags || []).join(';')),
      csvEscape(idea.justification || ''),
    ];
    rows.push(row.join(','));
  }
  return rows.join('\n');
}

function csvEscape(s) {
  if (s === null || s === undefined) return '';
  const str = String(s);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toNotion(aggregated) {
  // Notion-flavored markdown differs slightly from standard MD in how it renders tables
  // and how properties are declared. This emits a simple Notion-friendly layout.
  const lines = [];
  lines.push('# Project Evaluation (Notion import)');
  lines.push('');
  lines.push(`> ${aggregated.total_ideas} ideas · framework v${aggregated.framework_version}`);
  lines.push('');
  for (const idea of aggregated.ideas_with_scores) {
    lines.push(`## #${idea.id} ${idea.title}`);
    lines.push('');
    lines.push(`**Group:** ${idea.group_letter} — ${idea.group_name}`);
    lines.push('');
    lines.push(`**Balanced:** ${idea.mode_scores.balanced}%  |  **Cashflow:** ${idea.mode_scores.cashflow}%  |  **Learning:** ${idea.mode_scores.learning}%  |  **Moat:** ${idea.mode_scores.moat}%`);
    lines.push('');
    if (idea.red_flags && idea.red_flags.length > 0) {
      lines.push(`⚠️ **Red flags:** ${idea.red_flags.join(', ')}`);
      lines.push('');
    }
    lines.push(`**Justification:** ${idea.justification || ''}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'json';
  const outPath = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;

  if (!inputPath) {
    console.error('Usage: node export.mjs <aggregated.json> --format csv|json|notion [--out file]');
    process.exit(1);
  }
  const aggregated = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  let output;
  if (format === 'csv') output = toCsv(aggregated);
  else if (format === 'notion') output = toNotion(aggregated);
  else if (format === 'json') output = JSON.stringify(aggregated, null, 2);
  else {
    console.error(`Unknown format: ${format}. Use csv | json | notion`);
    process.exit(1);
  }

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output);
    process.stderr.write(`Wrote ${format} → ${outPath}\n`);
  } else {
    process.stdout.write(output + '\n');
  }
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { toCsv, toNotion };
