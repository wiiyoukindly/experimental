/**
 * settings-io.js — defensive read/write for ~/.claude/settings.json.
 *
 * Step 1 provides the read path only. Step 3 will add the write path
 * (withSettingsLock + atomic tmp+rename + snapshot to lastgood).
 *
 * Why read is its own module even at Step 1:
 *   - Separating parse/validate from I/O makes unit testing trivial
 *   - Multiple subcommands need to read settings.json; one place to fix bugs
 *   - The defensive error handling (missing file, malformed JSON, missing
 *     enabledPlugins) should live in exactly one place
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { SETTINGS, STATE, ensurePluginData } = require('./paths');

// Lock retry tuning — 10 × 100ms = 1s max wait before giving up.
const LOCK_RETRY_COUNT = 10;
const LOCK_RETRY_DELAY_MS = 100;
// Lockfiles older than this are treated as stale and silently reclaimed.
// 30s is enough for any legitimate write to complete.
const LOCK_STALE_MS = 30_000;

/**
 * Structured error class so callers can pattern-match on reason.
 */
class SettingsError extends Error {
  constructor(kind, message, cause) {
    super(message);
    this.name = 'SettingsError';
    this.kind = kind; // 'missing' | 'malformed' | 'shape' | 'io'
    if (cause) this.cause = cause;
  }
}

/**
 * Read and parse ~/.claude/settings.json with full defensive handling.
 *
 * Returns the parsed object, with `enabledPlugins` guaranteed to be present
 * (an empty object is created in memory if it was missing — this is NOT
 * written back to disk).
 *
 * Throws SettingsError with kind:
 *   - 'missing'   — the file doesn't exist
 *   - 'malformed' — JSON parse failed
 *   - 'io'        — unexpected fs error
 */
function readSettings(settingsPath = SETTINGS) {
  let raw;
  try {
    raw = fs.readFileSync(settingsPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new SettingsError(
        'missing',
        `settings.json not found at ${settingsPath}`,
        err
      );
    }
    throw new SettingsError(
      'io',
      `Failed to read settings.json: ${err.message}`,
      err
    );
  }

  if (raw.trim() === '') {
    // Empty file: treat as "no settings yet" rather than malformed JSON.
    return { enabledPlugins: {}, __empty: true };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new SettingsError(
      'malformed',
      `settings.json is not valid JSON: ${err.message}. ` +
        `Refusing to modify. Restore manually or from ~/.claude/backups/.`,
      err
    );
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SettingsError(
      'malformed',
      'settings.json must be a JSON object at the root.'
    );
  }

  if (
    parsed.enabledPlugins === undefined ||
    parsed.enabledPlugins === null ||
    typeof parsed.enabledPlugins !== 'object' ||
    Array.isArray(parsed.enabledPlugins)
  ) {
    // Not throwing — an empty/missing enabledPlugins is valid, we just
    // default it to an empty object in memory. The caller decides whether
    // to write that back.
    parsed.enabledPlugins = {};
  }

  return parsed;
}

/**
 * Return an array of plugin IDs ("name@marketplace") that are currently
 * enabled in settings.json. Order-preserving.
 */
function enabledPluginIds(settings) {
  return Object.entries(settings.enabledPlugins || {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);
}

/**
 * Return an array of plugin IDs that are present in settings.json but
 * explicitly set to false.
 */
function disabledPluginIds(settings) {
  return Object.entries(settings.enabledPlugins || {})
    .filter(([, v]) => v === false)
    .map(([k]) => k);
}

// ──────────────────────────────────────────────────────────────────────────
// Write path (Step 3)
// ──────────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try once to create the lockfile exclusively. Returns true on success.
 * If the lockfile exists but is stale (older than LOCK_STALE_MS), reclaim it
 * by deleting and retrying once.
 */
function tryAcquireLock(lockPath) {
  try {
    const fd = fs.openSync(lockPath, 'wx'); // O_CREAT | O_EXCL
    fs.writeSync(fd, `${process.pid}\n${new Date().toISOString()}\n`);
    fs.closeSync(fd);
    return true;
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    // Check for staleness
    try {
      const stat = fs.statSync(lockPath);
      if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
        fs.unlinkSync(lockPath);
        // Retry once after reclaim
        try {
          const fd = fs.openSync(lockPath, 'wx');
          fs.writeSync(fd, `${process.pid}\n${new Date().toISOString()}\n(reclaimed stale)\n`);
          fs.closeSync(fd);
          return true;
        } catch (_) {
          return false;
        }
      }
    } catch (_) {
      // stat failed (race) — treat as not acquired
    }
    return false;
  }
}

function releaseLock(lockPath) {
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`[settings-io] warning: failed to release lock: ${err.message}`);
    }
  }
}

/**
 * Acquire an exclusive lock on settings.json writes, run the mutator, write
 * the result atomically, release the lock.
 *
 * The mutator receives the parsed settings object and mutates it in place.
 * It may return metadata (any object) which is returned from withSettingsLock.
 *
 * Safety guarantees:
 *   - Concurrent sessions never corrupt settings.json (lockfile).
 *   - settings.json is either the original or the new contents (atomic rename).
 *   - A snapshot of the original is saved to STATE.lastGood before mutation.
 *   - Malformed existing settings.json → refuse to write, clear error to stderr.
 */
async function withSettingsLock(mutator, options = {}) {
  const settingsPath = options.settingsPath || SETTINGS;
  ensurePluginData();
  const lockPath = STATE.lock;

  // 1. Acquire lock with retry + backoff
  let acquired = false;
  for (let attempt = 0; attempt < LOCK_RETRY_COUNT; attempt++) {
    if (tryAcquireLock(lockPath)) {
      acquired = true;
      break;
    }
    await sleep(LOCK_RETRY_DELAY_MS);
  }
  if (!acquired) {
    throw new SettingsError(
      'io',
      'Another Claude Code session is modifying plugins. Retry in a moment.'
    );
  }

  try {
    // 2. Read + parse existing settings (may throw SettingsError)
    const settings = readSettings(settingsPath);

    // 3. Snapshot to lastGood BEFORE mutation — if anything fails after this,
    //    the user can restore by copying lastGood back over settings.json.
    try {
      const original = fs.readFileSync(settingsPath, 'utf8');
      fs.writeFileSync(STATE.lastGood, original);
    } catch (err) {
      // If settings.json was empty (__empty flag), original may not be writable
      // as a snapshot. Skip snapshot in that edge case — there's nothing to lose.
      if (!settings.__empty) {
        console.error(`[settings-io] warning: lastGood snapshot failed: ${err.message}`);
      }
    }

    // 4. Run the mutator (may mutate settings in place, may return metadata).
    // Await handles both sync and async mutators (await on non-promise is a
    // no-op), so callers can pass either.
    delete settings.__empty;
    const metadata = (await mutator(settings)) || {};

    // 5. Serialize
    const newContent = JSON.stringify(settings, null, 2) + '\n';

    // 6. Atomic write: tmp + rename
    const tmpPath = settingsPath + '.tmp';
    fs.writeFileSync(tmpPath, newContent);
    fs.renameSync(tmpPath, settingsPath);

    return metadata;
  } finally {
    // 7. Always release lock, even on error.
    releaseLock(lockPath);
  }
}

/**
 * Apply a profile to a settings object (in place). Returns metadata:
 *   { enabled: number, disabled: number, added: string[], removed: string[] }
 *
 * Strategy: for every plugin id in settings.enabledPlugins, set it to true
 * iff it's in profile.enable. For every plugin id in profile.enable that's
 * NOT in settings.enabledPlugins, add it as true (lets profiles "enable"
 * plugins the user has installed but never toggled).
 *
 * Does NOT check whether the plugin is actually installed on disk. Callers
 * should pass a warnings collector if they want that check.
 */
function applyProfileToSettings(profile, settings, options = {}) {
  const wantEnabled = new Set(profile.enable);
  const before = settings.enabledPlugins || {};
  const added = [];
  const removed = [];

  // Mutate existing keys
  for (const [id, wasEnabled] of Object.entries(before)) {
    const shouldEnable = wantEnabled.has(id);
    if (shouldEnable && wasEnabled === false) added.push(id);
    if (!shouldEnable && wasEnabled === true) removed.push(id);
    before[id] = shouldEnable;
  }

  // Add new keys (plugins in profile but not yet in settings.json)
  for (const id of wantEnabled) {
    if (!(id in before)) {
      before[id] = true;
      added.push(id);
    }
  }

  settings.enabledPlugins = before;
  const enabled = Object.values(before).filter((v) => v === true).length;
  const disabled = Object.values(before).filter((v) => v === false).length;
  return { enabled, disabled, added, removed };
}

module.exports = {
  SettingsError,
  readSettings,
  enabledPluginIds,
  disabledPluginIds,
  withSettingsLock,
  applyProfileToSettings,
};
