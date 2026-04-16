#!/usr/bin/env node
/**
 * session-start.js — SessionStart hook handler for plugin-router.
 *
 * Runs AFTER plugins are loaded (Claude Code limitation), so it cannot
 * affect the current session's plugin set. Its jobs are:
 *
 *   1. Read any queued pending-profile.json and apply it to settings.json
 *      (for the NEXT session start — this acts as insurance in case the
 *      user forgot to restart after /router switch)
 *   2. Emit a banner to stdout showing current profile, load count, and
 *      component breakdown. stdout is injected into session context.
 *   3. Never crash or exit non-zero: hooks must not block session startup.
 *
 * Input (via stdin JSON, per Claude Code hook protocol):
 *   { session_id, cwd, ... }
 * We ignore most of the input — we only need to know that a session
 * is starting.
 *
 * Output (stdout): free-form text that Claude sees as session context.
 * Output (stderr): diagnostic logging visible in `claude --debug`.
 */
'use strict';

const fs = require('fs');

const {
  SETTINGS,
  PLUGIN_DATA,
  STATE,
  ensurePluginData,
} = require('./lib/paths');
const {
  readSettings,
  enabledPluginIds,
  withSettingsLock,
  applyProfileToSettings,
  SettingsError,
} = require('./lib/settings-io');
const { inventoryAll, aggregate } = require('./lib/plugin-inventory');
const { resolve: resolveProfile, ProfileError } = require('./lib/profiles');

function logError(msg) {
  try {
    process.stderr.write(`[plugin-router] ${msg}\n`);
  } catch (_) {
    /* swallow — never block session start */
  }
}

function readActiveProfile() {
  try {
    const text = fs.readFileSync(STATE.activeProfile, 'utf8').trim();
    return text === '' ? null : text;
  } catch (err) {
    if (err.code !== 'ENOENT') logError(`active-profile unreadable: ${err.message}`);
    return null;
  }
}

function writeActiveProfile(name) {
  try {
    ensurePluginData();
    const tmp = STATE.activeProfile + '.tmp';
    fs.writeFileSync(tmp, `${name}\n`);
    fs.renameSync(tmp, STATE.activeProfile);
  } catch (err) {
    logError(`failed to write active-profile: ${err.message}`);
  }
}

function readPendingProfile() {
  try {
    const raw = fs.readFileSync(STATE.pendingProfile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') logError(`pending-profile unreadable: ${err.message}`);
    return null;
  }
}

function clearPendingProfile() {
  try {
    fs.unlinkSync(STATE.pendingProfile);
  } catch (err) {
    if (err.code !== 'ENOENT') logError(`failed to clear pending-profile: ${err.message}`);
  }
}

/**
 * Drain stdin until EOF. Hooks receive JSON on stdin even when we don't need
 * any of the fields; reading and discarding prevents the parent from blocking
 * on a full pipe buffer.
 */
function drainStdin() {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    try {
      process.stdin.on('data', () => {});
      process.stdin.on('end', finish);
      process.stdin.on('error', finish);
      // Belt-and-suspenders: if stdin never closes, don't hang forever.
      setTimeout(finish, 500);
    } catch (_) {
      finish();
    }
  });
}

/**
 * If a pending-profile.json is queued, apply it to settings.json and clear it.
 * Returns { applied: boolean, profileName: string|null, error: string|null }
 */
async function applyPendingProfile() {
  const pending = readPendingProfile();
  if (!pending || !pending.profile) return { applied: false, profileName: null, error: null };

  let profile;
  try {
    profile = resolveProfile(pending.profile);
  } catch (err) {
    const msg =
      err instanceof ProfileError
        ? err.message
        : `unexpected error resolving pending profile: ${err.message}`;
    logError(`pending profile "${pending.profile}" unresolvable: ${msg}`);
    // Clear the pending file so we don't keep trying every session
    clearPendingProfile();
    return { applied: false, profileName: pending.profile, error: msg };
  }

  try {
    await withSettingsLock((settings) => applyProfileToSettings(profile, settings));
    writeActiveProfile(pending.profile);
    clearPendingProfile();
    return { applied: true, profileName: pending.profile, error: null };
  } catch (err) {
    const msg = err instanceof SettingsError ? err.message : err.message;
    logError(`failed to apply pending profile: ${msg}`);
    // Don't clear pending on write failure — user may want to retry next session
    return { applied: false, profileName: pending.profile, error: msg };
  }
}

/**
 * Build the banner text that will be emitted to stdout (session context).
 */
function buildBanner(applyResult) {
  const lines = [];
  lines.push('=== plugin-router ===');

  // Report on pending-profile application
  if (applyResult.applied) {
    lines.push(`✓ Applied pending profile "${applyResult.profileName}" to settings.json`);
    lines.push('  (This took effect for the NEXT session, not this one. Components loaded');
    lines.push('   in THIS session still reflect settings.json as of process start.)');
    lines.push('');
  } else if (applyResult.error) {
    lines.push(`⚠️  Failed to apply pending profile "${applyResult.profileName}": ${applyResult.error}`);
    lines.push('');
  }

  // Current-session inventory
  let settings;
  try {
    settings = readSettings();
  } catch (err) {
    lines.push(`⚠️  Cannot read settings.json: ${err.message}`);
    lines.push('   Router cannot report load cost. Run /router status after you fix this.');
    return lines.join('\n');
  }
  const enabled = enabledPluginIds(settings);
  const inventory = inventoryAll();
  const { totals, mcpHeavy } = aggregate(inventory, enabled);

  const active = readActiveProfile();
  const profileLabel = active ? `"${active}"` : '(none)';
  lines.push(`Profile: ${profileLabel}  |  ${totals.plugins} plugins loaded`);
  lines.push(
    `Components: ${totals.skills} skills, ${totals.agents} agents, ` +
      `${totals.mcpServers} MCP servers, ${totals.commands} commands, ${totals.hooks} hooks`
  );

  if (totals.skillDescChars > 8000) {
    lines.push(
      `⚠️  Skill descriptions ~${totals.skillDescChars} chars (over ~8000 budget, auto-truncated)`
    );
  }

  if (mcpHeavy.length > 0) {
    const names = mcpHeavy.map((m) => m.id.split('@')[0]).join(', ');
    lines.push(`MCP-heavy plugins loaded: ${names}`);
  }

  if (!active && totals.plugins > 8) {
    lines.push('');
    lines.push('💡 No router profile is active. Run `/router analyze` after your first prompt');
    lines.push('   to see what you actually need, or `/router list` to browse profiles.');
  }

  return lines.join('\n');
}

async function main() {
  await drainStdin();

  let applyResult = { applied: false, profileName: null, error: null };
  try {
    applyResult = await applyPendingProfile();
  } catch (err) {
    logError(`applyPendingProfile threw: ${err.message}`);
  }

  let banner = '';
  try {
    banner = buildBanner(applyResult);
  } catch (err) {
    logError(`buildBanner threw: ${err.message}`);
    banner = '=== plugin-router ===\n(error building banner — see claude --debug)';
  }

  try {
    process.stdout.write(banner + '\n');
  } catch (_) {
    /* swallow */
  }
}

// Top-level: swallow ALL errors so the session never fails to start.
main()
  .then(() => process.exit(0))
  .catch((err) => {
    logError(`top-level error: ${err && err.message ? err.message : err}`);
    process.exit(0);
  });
