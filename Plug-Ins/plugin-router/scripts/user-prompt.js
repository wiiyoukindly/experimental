#!/usr/bin/env node
/**
 * user-prompt.js — UserPromptSubmit hook for plugin-router.
 *
 * Fires on EVERY user message. We want to run only once per session (the
 * first message), so we use a per-session flag file to short-circuit later
 * invocations.
 *
 * Jobs:
 *   1. Detect "first message of this session" via flag file
 *   2. Run the keyword matcher against the prompt + cwd
 *   3. If the best-fit profile is meaningfully smaller than what's currently
 *      loaded, inject a tiny suggestion into Claude's context
 *   4. Always exit 0
 *
 * Suppression rules (avoid being a nag):
 *   - Skip if not the first message of this session
 *   - Skip if the prompt is very short (< 10 chars) or starts with "/"
 *   - Skip if a router profile is already active AND it matches the top pick
 *   - Skip if the top pick has low confidence (< 0.3)
 *   - Skip if the currently-loaded plugin count is already small (<= 6)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { STATE, ensurePluginData } = require('./lib/paths');
const { readSettings, enabledPluginIds } = require('./lib/settings-io');
const { score: matcherScore } = require('./lib/matcher');
const { list: listProfiles } = require('./lib/profiles');

function logError(msg) {
  try {
    process.stderr.write(`[plugin-router] ${msg}\n`);
  } catch (_) {
    /* swallow */
  }
}

function readStdinJson() {
  return new Promise((resolve) => {
    let buf = '';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        resolve(buf.trim() ? JSON.parse(buf) : {});
      } catch (_) {
        resolve({});
      }
    };
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => {
        buf += chunk;
      });
      process.stdin.on('end', finish);
      process.stdin.on('error', finish);
      // Safety: don't hang the session forever
      setTimeout(finish, 1000);
    } catch (_) {
      finish();
    }
  });
}

/**
 * Mark this session as "first prompt already processed". Returns true if
 * this is the first call for the session, false otherwise. Uses an atomic
 * O_EXCL create on the flag file to avoid races.
 */
function markFirstPromptSeen(sessionId) {
  if (!sessionId) return true; // No id → always process
  ensurePluginData();
  const flagPath = path.join(STATE.sessionSeen, String(sessionId));
  try {
    const fd = fs.openSync(flagPath, 'wx');
    fs.closeSync(fd);
    return true; // newly created → first time
  } catch (err) {
    if (err.code === 'EEXIST') return false;
    logError(`failed to create session-seen flag: ${err.message}`);
    return true; // fail-open so the hook still runs once
  }
}

function readActiveProfile() {
  try {
    const text = fs.readFileSync(STATE.activeProfile, 'utf8').trim();
    return text === '' ? null : text;
  } catch (_) {
    return null;
  }
}

function buildSuggestion(prompt, cwd, currentCount, activeProfile) {
  // Run the matcher
  const ranked = matcherScore(prompt, cwd);
  const existing = new Set(listProfiles().map((p) => p.name));
  const available = ranked.filter((r) => existing.has(r.profile));
  if (available.length === 0) return null;

  const top = available[0];
  // Suppression: low confidence
  if (top.score < 0.3) return null;
  // Suppression: already on the recommended profile
  if (activeProfile === top.profile) return null;
  // Suppression: already loaded a small set
  if (currentCount <= 6) return null;

  // Look up how many plugins the recommended profile would load.
  // We don't need to fully parse the profile — listProfiles already has counts.
  const entry = listProfiles().find((p) => p.name === top.profile);
  const wouldLoad = entry ? entry.enableCount : null;

  // Suppression: recommended profile isn't actually smaller
  if (wouldLoad !== null && wouldLoad >= currentCount) return null;

  const lines = [];
  lines.push('=== plugin-router suggestion ===');
  lines.push(
    `Your task looks like a fit for the "${top.profile}" profile (score ${top.score}).`
  );
  if (wouldLoad !== null) {
    lines.push(
      `You currently have ${currentCount} plugins loaded; "${top.profile}" needs only ${wouldLoad}.`
    );
  } else {
    lines.push(`You currently have ${currentCount} plugins loaded.`);
  }
  lines.push(`Match reasons: ${top.reasons.join(' | ')}`);
  lines.push('');
  lines.push(
    `To apply for your NEXT session: run /router pending ${top.profile}`
  );
  lines.push(
    `To apply immediately + restart:   run /router switch ${top.profile}`
  );
  return lines.join('\n');
}

async function main() {
  const input = await readStdinJson();
  const prompt = typeof input.prompt === 'string' ? input.prompt : '';
  const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
  const sessionId = input.session_id || input.sessionId || null;

  // Suppression: short or slash-command prompts
  const trimmed = prompt.trim();
  if (trimmed.length < 10) return;
  if (trimmed.startsWith('/')) return;

  // Only run for the first prompt of the session
  const isFirst = markFirstPromptSeen(sessionId);
  if (!isFirst) return;

  // Read currently-loaded plugin count
  let currentCount = 0;
  try {
    const settings = readSettings();
    currentCount = enabledPluginIds(settings).length;
  } catch (_) {
    // If settings is unreadable, skip the suggestion entirely
    return;
  }

  const active = readActiveProfile();
  const suggestion = buildSuggestion(prompt, cwd, currentCount, active);
  if (!suggestion) return;

  try {
    process.stdout.write(suggestion + '\n');
  } catch (_) {
    /* swallow */
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logError(`top-level error: ${err && err.message ? err.message : err}`);
    process.exit(0);
  });
