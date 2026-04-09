#!/usr/bin/env node
// parse-ideas.mjs
// Reads a markdown ideas file and extracts structured idea objects.
//
// Supported format: each idea is an H4 or H3 heading ("**N.**" style or "#### N." or "### #N")
// followed by a description paragraph. Recognizes inline metadata lines starting with
// "*Traction:*", "*Effort · Revenue:*", "*Source:*".
//
// Usage: node parse-ideas.mjs <input.md> [--json|--pretty]
// Output: JSON array on stdout.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseIdeasMarkdown(content) {
  const lines = content.split('\n');
  const ideas = [];
  let currentGroup = null;
  let currentIdea = null;
  let pendingDescription = [];

  const flush = () => {
    if (currentIdea) {
      currentIdea.description = pendingDescription.join(' ').trim();
      ideas.push(currentIdea);
    }
    currentIdea = null;
    pendingDescription = [];
  };

  const groupHeadingRe = /^###\s+(.+)$/;
  const ideaBoldRe = /^\*\*(\d+)\.\s+(.+?)\*\*\s*[—\-–]?\s*(.*)$/;
  const tractionRe = /^\*Traction:\*\s*(.+)$/;
  const effortRe = /^\*Effort\s*·\s*Revenue:\*\s*(.+)$/;
  const sourceRe = /^\*Source:\*\s*\[(.+?)\]\((.+?)\)/;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');

    const groupMatch = line.match(groupHeadingRe);
    if (groupMatch) {
      flush();
      const heading = groupMatch[1].trim();
      const parts = heading.split('—').map(s => s.trim());
      currentGroup = {
        letter: parts[0] || heading,
        name: parts[1] || heading,
      };
      continue;
    }

    const ideaMatch = line.match(ideaBoldRe);
    if (ideaMatch) {
      flush();
      const [, num, title, rest] = ideaMatch;
      currentIdea = {
        id: Number(num),
        title: title.trim(),
        group_letter: currentGroup?.letter ?? null,
        group_name: currentGroup?.name ?? null,
        description: '',
        traction: null,
        effort: null,
        revenue: null,
        source: null,
      };
      if (rest && rest.trim()) pendingDescription.push(rest.trim());
      continue;
    }

    if (!currentIdea) continue;

    const tractionMatch = line.match(tractionRe);
    if (tractionMatch) {
      currentIdea.traction = tractionMatch[1].trim();
      continue;
    }

    const effortMatch = line.match(effortRe);
    if (effortMatch) {
      const value = effortMatch[1].trim();
      const [effort, revenue] = value.split('·').map(s => s?.trim() ?? null);
      currentIdea.effort = effort;
      currentIdea.revenue = revenue;
      continue;
    }

    const sourceMatch = line.match(sourceRe);
    if (sourceMatch) {
      currentIdea.source = { title: sourceMatch[1], url: sourceMatch[2] };
      continue;
    }

    if (line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
      pendingDescription.push(line.trim());
    }
  }
  flush();

  return ideas;
}

function main() {
  const [, , inputPath, ...flags] = process.argv;
  if (!inputPath) {
    console.error('Usage: node parse-ideas.mjs <input.md> [--pretty]');
    process.exit(1);
  }
  const absPath = path.resolve(inputPath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(absPath, 'utf8');
  const ideas = parseIdeasMarkdown(content);
  const pretty = flags.includes('--pretty');
  const output = pretty ? JSON.stringify(ideas, null, 2) : JSON.stringify(ideas);
  process.stdout.write(output + '\n');
  process.stderr.write(`Parsed ${ideas.length} ideas from ${path.basename(absPath)}\n`);
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { parseIdeasMarkdown };
