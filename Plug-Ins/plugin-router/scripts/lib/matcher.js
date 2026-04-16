/**
 * matcher.js — heuristic profile matcher.
 *
 * Given a user prompt and working directory, score each known profile
 * by keyword overlap + cwd-pattern bonuses. Returns a ranked list.
 *
 * This is cheap (zero LLM calls). The cli.js `analyze` subcommand uses it
 * first and only falls back to a Haiku subagent on ambiguous ties.
 *
 * The keyword map is hand-maintained below. Profile names here should
 * match the filenames in profiles/. Missing profile files will be filtered
 * out by the cli.js analyze command, so the matcher doesn't need to care.
 */
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Profile keyword map. Keys are profile names, values are keyword arrays.
 * Multi-word phrases are matched as substrings of the normalized prompt.
 */
const KEYWORDS = {
  frontend: [
    'react', 'vue', 'svelte', 'angular', 'next.js', 'nuxt',
    'css', 'tailwind', 'scss', 'sass',
    'html', 'dom', 'browser', 'chrome', 'safari', 'firefox',
    'ui', 'component', 'button', 'modal', 'form',
    'tsx', 'jsx', 'responsive', 'layout', 'flexbox', 'grid',
    'accessibility', 'a11y', 'aria',
  ],
  'plugin-dev': [
    'plugin', 'hook', 'skill', 'mcp', 'claude-plugin',
    'marketplace', 'agent', 'sdk', 'agent sdk',
    'slash command', 'subagent', 'hooks.json', 'skill.md',
  ],
  'backend-aws': [
    'lambda', 'api gateway', 'dynamodb', 'sam', 'cdk',
    'cloudformation', 'serverless', 's3', 'sqs', 'sns',
    'iam', 'cloudwatch', 'eventbridge', 'step functions',
    'ecs', 'fargate', 'rds',
  ],
  'browser-automation': [
    'playwright', 'selenium', 'scrape', 'scraping', 'e2e',
    'end-to-end', 'chromedriver', 'headless', 'puppeteer',
    'automate browser', 'crawl',
  ],
  writing: [
    'write a blog', 'blog post', 'essay', 'article',
    'documentation', 'readme', 'tutorial', 'write documentation',
    'proofread', 'summarize', 'draft', 'outline',
  ],
  research: [
    'compare', 'evaluate', 'benchmark', 'study',
    'framework', 'score', 'rank', 'prioritize', 'rice',
    'ice', 'research', 'investigate', 'survey',
  ],
  'dev-general': [], // fallback — always scores 0.3
  minimal: [],        // recommended only when nothing else fits
};

// Ordered list so dev-general appears consistently as the fallback
const PROFILE_ORDER = [
  'frontend',
  'plugin-dev',
  'backend-aws',
  'browser-automation',
  'writing',
  'research',
  'dev-general',
  'minimal',
];

/**
 * Normalize a prompt for matching: lowercase, collapse whitespace, strip
 * most punctuation. Keep dots and hyphens so tokens like "node.js" and
 * "api-gateway" survive.
 */
function normalize(prompt) {
  if (typeof prompt !== 'string') return '';
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9.\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Count keyword occurrences in a normalized prompt. Multi-word keywords
 * match as substrings.
 */
function countMatches(normalized, keywords) {
  const matched = [];
  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    if (normalized.includes(lower)) matched.push(kw);
  }
  return matched;
}

/**
 * Walk upward from cwd up to `levels` directories looking for marker files.
 * Returns an object { [marker]: true } for each marker that was found.
 */
function cwdMarkers(cwd, levels = 2) {
  const markers = {};
  if (!cwd || typeof cwd !== 'string') return markers;
  const checkList = [
    'package.json',
    'tsconfig.json',
    'node_modules',
    'template.yaml',
    'template.yml',
    'samconfig.toml',
    'serverless.yml',
    '.claude-plugin',
    'cdk.json',
    'Cargo.toml',
    'pyproject.toml',
    'go.mod',
  ];
  let dir = cwd;
  for (let i = 0; i <= levels; i++) {
    for (const name of checkList) {
      try {
        if (!markers[name] && fs.existsSync(path.join(dir, name))) {
          markers[name] = true;
        }
      } catch (_) {
        /* ignore */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return markers;
}

// Maximum total cwd-based bonus per profile. Prevents stacking
// multiple markers from drowning out specific keyword matches.
const MAX_CWD_BONUS = 0.25;

/**
 * Apply cwd bonuses to a score, returning the new score and a list of
 * reasons that were added. Total bonus is capped at MAX_CWD_BONUS.
 */
function applyCwdBonus(profile, score, markers) {
  let bonus = 0;
  const reasons = [];

  // JS/TS ecosystem markers boost all web/dev profiles
  const hasJs = markers['package.json'] || markers['tsconfig.json'] || markers['node_modules'];
  if (hasJs && ['frontend', 'plugin-dev', 'browser-automation', 'dev-general'].includes(profile)) {
    bonus += 0.15;
    reasons.push('cwd: JS/TS project (+0.15)');
  }

  // AWS markers
  const hasAws = markers['template.yaml'] || markers['template.yml'] ||
    markers['samconfig.toml'] || markers['serverless.yml'] || markers['cdk.json'];
  if (hasAws && profile === 'backend-aws') {
    bonus += 0.25;
    reasons.push('cwd: AWS/SAM/CDK markers (+0.25)');
  }

  // Plugin dev markers
  if (markers['.claude-plugin'] && profile === 'plugin-dev') {
    bonus += 0.2;
    reasons.push('cwd: .claude-plugin present (+0.2)');
  }

  // Cap total bonus to keep keyword signal meaningful
  const cappedBonus = Math.min(bonus, MAX_CWD_BONUS);
  if (cappedBonus < bonus) {
    reasons.push(`(cwd bonus capped at +${MAX_CWD_BONUS})`);
  }

  return { score: score + cappedBonus, reasons };
}

/**
 * Main scoring function. Returns an array of { profile, score, reasons }
 * sorted by score descending.
 *
 * Options:
 *   cwd — working directory to scan for marker files (default: process.cwd())
 */
function score(prompt, cwd = process.cwd()) {
  const normalized = normalize(prompt);
  const markers = cwdMarkers(cwd);
  const results = [];

  for (const profileName of PROFILE_ORDER) {
    const keywords = KEYWORDS[profileName];
    const reasons = [];
    let rawScore;

    if (profileName === 'dev-general') {
      rawScore = 0.2;
      reasons.push('fallback baseline (0.2)');
    } else if (profileName === 'minimal') {
      rawScore = 0.0;
    } else {
      const matched = countMatches(normalized, keywords);
      // Score = matches × 0.15, capped at 1.0.
      // Rationale: 2 specific matches (0.30) just beat the dev-general
      // baseline; 3 matches (0.45) is a clear win; 5+ saturates. Tuned
      // for the size of our current keyword lists (~20-30 keywords).
      rawScore = Math.min(1.0, matched.length * 0.15);
      if (matched.length > 0) {
        reasons.push(
          `matched: ${matched.slice(0, 5).join(', ')}${matched.length > 5 ? ', …' : ''} (${matched.length}×0.15)`
        );
      }
    }

    const { score: finalScore, reasons: cwdReasons } = applyCwdBonus(
      profileName,
      rawScore,
      markers
    );
    reasons.push(...cwdReasons);

    results.push({
      profile: profileName,
      score: Number(finalScore.toFixed(3)),
      reasons,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Short helper: return just the top N profile names for convenience.
 */
function topProfiles(prompt, cwd, n = 3) {
  return score(prompt, cwd)
    .slice(0, n)
    .map((r) => r.profile);
}

module.exports = {
  KEYWORDS,
  PROFILE_ORDER,
  normalize,
  cwdMarkers,
  score,
  topProfiles,
};
