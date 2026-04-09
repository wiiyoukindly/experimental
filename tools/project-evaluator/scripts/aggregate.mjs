#!/usr/bin/env node
// aggregate.mjs
// Takes raw per-idea factor scores and produces weighted rankings under all 4 modes,
// attaches red flag demotion, and builds portfolio combo suggestions.
//
// Input: JSON file containing an array of scored idea objects:
//   [{ id, title, group_letter, group_name, factor_scores: {...12}, red_flags: [...], justification }]
//
// Output: JSON with { ideas_with_scores, rankings: { balanced, cashflow, learning, moat }, combos }
//
// Usage: node aggregate.mjs <scored-ideas.json> [--framework framework/] [--pretty]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FRAMEWORK_DIR = path.join(HERE, '..', 'framework');

function loadFramework(dir) {
  const factors = JSON.parse(fs.readFileSync(path.join(dir, 'factors.json'), 'utf8'));
  const modes = JSON.parse(fs.readFileSync(path.join(dir, 'modes.json'), 'utf8'));
  const redFlags = JSON.parse(fs.readFileSync(path.join(dir, 'red-flags.json'), 'utf8'));
  return { factors, modes, redFlags };
}

function invertIfNeeded(factorId, score) {
  // For inverted factors (build_effort and operational_burden), a high score is already "good"
  // per the rubric direction 'down', so no recomputation needed at aggregate time — the rubric
  // already encodes the inversion. The "_inverted" suffix in learning mode weights triggers
  // explicit inversion on factors that are normally "up".
  return score;
}

function scoreUnderMode(factorScores, modeWeights) {
  let totalScore = 0;
  let totalWeight = 0;
  for (const [weightKey, weight] of Object.entries(modeWeights)) {
    if (weight === 0) continue;
    const inverted = weightKey.endsWith('_inverted');
    const factorId = inverted ? weightKey.replace('_inverted', '') : weightKey;
    const rawScore = factorScores[factorId];
    if (rawScore === undefined || rawScore === null) continue;
    const effectiveScore = inverted ? (6 - rawScore) : rawScore;
    totalScore += effectiveScore * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  const avg = totalScore / totalWeight; // 1-5 scale
  return Math.round(((avg - 1) / 4) * 100); // rescale to 0-100 percent
}

function applyRedFlagDemotion(rankedList, redFlagsByIdea, threshold) {
  // Any idea with >= threshold red flags moves to the bottom third of the list.
  const demoted = [];
  const kept = [];
  for (const entry of rankedList) {
    const flags = redFlagsByIdea[entry.id] || [];
    if (flags.length >= threshold) {
      demoted.push({ ...entry, _demoted: true, _flags: flags });
    } else {
      kept.push({ ...entry, _flags: flags });
    }
  }
  return [...kept, ...demoted];
}

function aggregate(scoredIdeas, framework) {
  const { factors, modes, redFlags } = framework;
  const demotionThreshold = redFlags.demotion_rule?.threshold ?? 2;

  const redFlagsByIdea = {};
  for (const idea of scoredIdeas) {
    redFlagsByIdea[idea.id] = idea.red_flags || [];
  }

  const ideasWithScores = scoredIdeas.map(idea => {
    const modeScores = {};
    for (const [modeId, mode] of Object.entries(modes.modes)) {
      modeScores[modeId] = scoreUnderMode(idea.factor_scores, mode.weights);
    }
    return { ...idea, mode_scores: modeScores };
  });

  const rankings = {};
  for (const modeId of Object.keys(modes.modes)) {
    const sorted = [...ideasWithScores].sort(
      (a, b) => b.mode_scores[modeId] - a.mode_scores[modeId]
    ).map(idea => ({
      id: idea.id,
      title: idea.title,
      group_letter: idea.group_letter,
      group_name: idea.group_name,
      score: idea.mode_scores[modeId],
      justification: idea.justification,
    }));
    rankings[modeId] = applyRedFlagDemotion(sorted, redFlagsByIdea, demotionThreshold);
  }

  const combos = buildPortfolioCombos(ideasWithScores, rankings);

  return {
    framework_version: factors.version,
    total_ideas: scoredIdeas.length,
    ideas_with_scores: ideasWithScores,
    rankings,
    combos,
  };
}

function buildPortfolioCombos(ideas, rankings) {
  // Combo A — quick-validate → cashflow: 1 fastest-ship + 1 cashflow winner + 1 highest-demand
  // Combo B — leverage existing: 3 highest asset_leverage
  // Combo C — creator-stack: 3 top ideas in ΙΒ (Creator) group
  // Combo D — balanced top-3 non-overlapping
  const idMap = Object.fromEntries(ideas.map(i => [i.id, i]));

  const sortBy = (key, asc = false) => [...ideas].sort((a, b) => {
    const av = a.factor_scores?.[key] ?? 0;
    const bv = b.factor_scores?.[key] ?? 0;
    return asc ? av - bv : bv - av;
  });

  const comboA = [
    pickFirstMatching(ideas, i => i.factor_scores.build_effort >= 4 && i.factor_scores.time_to_first_revenue >= 4),
    rankings.cashflow?.find(x => !x._demoted),
    sortBy('demand_evidence')[0],
  ].filter(Boolean).slice(0, 3);

  const comboB = sortBy('asset_leverage').slice(0, 3);

  const comboC = ideas.filter(i => (i.group_letter || '').includes('ΙΒ'))
    .sort((a, b) => (b.mode_scores.balanced || 0) - (a.mode_scores.balanced || 0))
    .slice(0, 3);

  const comboD = [];
  const seen = new Set();
  for (const entry of rankings.balanced || []) {
    if (entry._demoted) continue;
    if (seen.has(entry.group_letter)) continue;
    seen.add(entry.group_letter);
    comboD.push(entry);
    if (comboD.length === 3) break;
  }

  return {
    A_quick_validate: {
      name: 'Quick validate → cashflow',
      rationale: 'One fastest-ship warmup + one cashflow-mode winner + one highest-demand-evidence anchor',
      picks: comboA.map(summarize),
    },
    B_leverage_existing: {
      name: 'Leverage existing Replit apps',
      rationale: 'Three projects that extend existing apps, minimizing cold-start time',
      picks: comboB.map(summarize),
    },
    C_creator_stack: {
      name: 'Creator stack (cross-sell natural)',
      rationale: 'Three creator-focused tools that serve the same audience and can cross-sell',
      picks: comboC.map(summarize),
    },
    D_balanced_diverse: {
      name: 'Balanced diverse (one per domain)',
      rationale: 'Top balanced-mode pick from three different domain groups — portfolio diversification',
      picks: comboD,
    },
  };
}

function pickFirstMatching(arr, predicate) {
  return arr.find(predicate);
}

function summarize(idea) {
  if (!idea) return null;
  if (idea.mode_scores) {
    return {
      id: idea.id,
      title: idea.title,
      group_letter: idea.group_letter,
      group_name: idea.group_name,
      balanced_score: idea.mode_scores.balanced,
      justification: idea.justification,
    };
  }
  return idea;
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const frameworkDir = args.includes('--framework')
    ? args[args.indexOf('--framework') + 1]
    : DEFAULT_FRAMEWORK_DIR;
  const pretty = args.includes('--pretty');

  if (!inputPath) {
    console.error('Usage: node aggregate.mjs <scored-ideas.json> [--framework <dir>] [--pretty]');
    process.exit(1);
  }
  const scoredIdeas = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const framework = loadFramework(frameworkDir);
  const result = aggregate(scoredIdeas, framework);
  process.stdout.write((pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result)) + '\n');
  process.stderr.write(`Aggregated ${result.total_ideas} ideas under ${Object.keys(result.rankings).length} modes\n`);
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { aggregate, scoreUnderMode, loadFramework, buildPortfolioCombos };
