/**
 * paths.js — resolve key filesystem paths used across plugin-router.
 *
 * Centralising this avoids sprinkling path.join calls everywhere and makes
 * it trivial to test modules in isolation (override env vars in tests).
 *
 * Environment variables (set by Claude Code when hooks/commands run):
 *   CLAUDE_PLUGIN_ROOT  — the plugin's install directory
 *   CLAUDE_PLUGIN_DATA  — persistent per-plugin state dir (survives updates)
 *
 * When invoked outside Claude Code (e.g. smoke tests), we fall back to
 * sensible defaults so the CLI works from any terminal.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');

// Plugin root: prefer env var, else the repo two levels up from this file
// (scripts/lib/paths.js -> ../../ === plugin root).
const PLUGIN_ROOT =
  process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..');

// Plugin data dir: prefer env var, else a deterministic fallback that mirrors
// what Claude Code would pick for a local-dev install. Created lazily.
const PLUGIN_DATA =
  process.env.CLAUDE_PLUGIN_DATA ||
  path.join(CLAUDE_DIR, 'plugins', 'data', 'plugin-router-local-dev');

const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const INSTALLED = path.join(CLAUDE_DIR, 'plugins', 'installed_plugins.json');
const CACHE_DIR = path.join(CLAUDE_DIR, 'plugins', 'cache');

// Derived paths under PLUGIN_DATA
const STATE = {
  activeProfile: path.join(PLUGIN_DATA, 'active-profile'),
  pendingProfile: path.join(PLUGIN_DATA, 'pending-profile.json'),
  lastGood: path.join(PLUGIN_DATA, 'settings.lastgood.json'),
  usageLog: path.join(PLUGIN_DATA, 'usage-log.jsonl'),
  lock: path.join(PLUGIN_DATA, 'lock'),
  sessionSeen: path.join(PLUGIN_DATA, 'session-seen'),
  customProfiles: path.join(PLUGIN_DATA, 'custom-profiles'),
};

const PROFILES_DIR = path.join(PLUGIN_ROOT, 'profiles');

/**
 * Ensure a directory exists (recursive mkdir, idempotent).
 * Returns the absolute path for chaining.
 */
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Ensure the plugin data directory and all its subdirs exist.
 * Called by any script that needs to write state.
 */
function ensurePluginData() {
  ensureDir(PLUGIN_DATA);
  ensureDir(STATE.sessionSeen);
  ensureDir(STATE.customProfiles);
  return PLUGIN_DATA;
}

module.exports = {
  HOME,
  CLAUDE_DIR,
  PLUGIN_ROOT,
  PLUGIN_DATA,
  SETTINGS,
  INSTALLED,
  CACHE_DIR,
  PROFILES_DIR,
  STATE,
  ensureDir,
  ensurePluginData,
};
