#!/usr/bin/env node
/**
 * install-locally.js — register plugin-router as a permanent local plugin.
 *
 * Performs a 5-step install:
 *   1. Create cache parent dir (~/.claude/plugins/cache/local/plugin-router/)
 *   2. Create a directory junction at .../0.1.0/ pointing to this repo
 *      (so edits in the desktop folder apply immediately — no re-copy)
 *   3. Create a minimal local marketplace dir + marketplace.json
 *   4. Register "local" marketplace in known_marketplaces.json
 *   5. Add plugin-router@local to installed_plugins.json AND settings.json
 *
 * After running, the user must RESTART Claude Code for the plugin to load.
 *
 * Safe to re-run: each step is idempotent.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const CLAUDE = path.join(HOME, '.claude');
const PLUGINS_DIR = path.join(CLAUDE, 'plugins');

const PLUGIN_SOURCE = __dirname; // this file lives in the repo root
const MARKETPLACE_NAME = 'local';
const PLUGIN_NAME = 'plugin-router';
const PLUGIN_VERSION = '0.1.0';
const PLUGIN_ID = `${PLUGIN_NAME}@${MARKETPLACE_NAME}`;

const CACHE_PLUGIN_DIR = path.join(PLUGINS_DIR, 'cache', MARKETPLACE_NAME, PLUGIN_NAME);
const CACHE_VERSION_DIR = path.join(CACHE_PLUGIN_DIR, PLUGIN_VERSION);
const MARKETPLACE_DIR = path.join(PLUGINS_DIR, 'marketplaces', MARKETPLACE_NAME);

function toForward(p) {
  return p.split(path.sep).join('/');
}

function atomicWriteJson(filePath, obj) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(tmp, filePath);
}

console.log('=== plugin-router permanent install ===');
console.log(`Source:        ${PLUGIN_SOURCE}`);
console.log(`Cache target:  ${CACHE_VERSION_DIR}`);
console.log(`Marketplace:   ${MARKETPLACE_DIR}`);
console.log('');

// ─── Step 1: cache parent directory ─────────────────────────────────────
console.log('[1/5] Create cache parent directory');
fs.mkdirSync(CACHE_PLUGIN_DIR, { recursive: true });
console.log(`      mkdir -p ${CACHE_PLUGIN_DIR}`);

// ─── Step 2: directory junction ─────────────────────────────────────────
console.log('[2/5] Create directory junction');
if (fs.existsSync(CACHE_VERSION_DIR)) {
  const stat = fs.lstatSync(CACHE_VERSION_DIR);
  console.log(`      Target exists (${stat.isSymbolicLink() ? 'symlink' : 'dir'}); removing`);
  fs.rmSync(CACHE_VERSION_DIR, { recursive: true, force: true });
}
fs.symlinkSync(PLUGIN_SOURCE, CACHE_VERSION_DIR, 'junction');
console.log(`      junction ${CACHE_VERSION_DIR} -> ${PLUGIN_SOURCE}`);

// Verify the junction is readable by reading plugin.json through it
const pjPath = path.join(CACHE_VERSION_DIR, '.claude-plugin', 'plugin.json');
const pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
console.log(`      verified: plugin.json.name="${pj.name}" version="${pj.version}"`);

// ─── Step 3: marketplace directory + marketplace.json ──────────────────
console.log('[3/5] Create marketplace dir + marketplace.json');
fs.mkdirSync(path.join(MARKETPLACE_DIR, '.claude-plugin'), { recursive: true });
const marketplaceJson = {
  name: 'local',
  description: 'User local development plugins (installed via file junction)',
  owner: { name: 'User' },
  plugins: [
    {
      name: PLUGIN_NAME,
      description: 'Smart plugin profile router for Claude Code',
      category: 'productivity',
      source: {
        source: 'local',
        path: toForward(PLUGIN_SOURCE),
      },
    },
  ],
};
atomicWriteJson(
  path.join(MARKETPLACE_DIR, '.claude-plugin', 'marketplace.json'),
  marketplaceJson
);
console.log(`      wrote ${path.join(MARKETPLACE_DIR, '.claude-plugin', 'marketplace.json')}`);

// ─── Step 4: known_marketplaces.json ───────────────────────────────────
console.log('[4/5] Register "local" in known_marketplaces.json');
const kmPath = path.join(PLUGINS_DIR, 'known_marketplaces.json');
const km = JSON.parse(fs.readFileSync(kmPath, 'utf8'));
const wasNew = !km[MARKETPLACE_NAME];
km[MARKETPLACE_NAME] = {
  source: {
    source: 'local',
    path: toForward(MARKETPLACE_DIR),
  },
  installLocation: MARKETPLACE_DIR,
  lastUpdated: new Date().toISOString(),
};
atomicWriteJson(kmPath, km);
console.log(`      ${wasNew ? 'added' : 'updated'} "${MARKETPLACE_NAME}" marketplace`);

// ─── Step 5a: installed_plugins.json ───────────────────────────────────
console.log('[5/5] Register plugin + enable in settings');
const ipPath = path.join(PLUGINS_DIR, 'installed_plugins.json');
const ip = JSON.parse(fs.readFileSync(ipPath, 'utf8'));
if (!ip.plugins) ip.plugins = {};
const now = new Date().toISOString();
ip.plugins[PLUGIN_ID] = [
  {
    scope: 'user',
    installPath: CACHE_VERSION_DIR,
    version: PLUGIN_VERSION,
    installedAt: now,
    lastUpdated: now,
  },
];
atomicWriteJson(ipPath, ip);
console.log(`      added ${PLUGIN_ID} to installed_plugins.json`);

// ─── Step 5b: settings.json ────────────────────────────────────────────
const settingsPath = path.join(CLAUDE, 'settings.json');
const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
if (!s.enabledPlugins) s.enabledPlugins = {};
const wasEnabled = s.enabledPlugins[PLUGIN_ID] === true;
s.enabledPlugins[PLUGIN_ID] = true;
atomicWriteJson(settingsPath, s);
console.log(`      ${wasEnabled ? 'already enabled' : 'enabled'} ${PLUGIN_ID} in settings.json`);

console.log('');
console.log('✅ INSTALL COMPLETE');
console.log('');
console.log('Restart Claude Code to load plugin-router.');
console.log('After restart, /router should appear in /help.');
console.log('');
console.log('To uninstall, delete:');
console.log(`  - ${CACHE_VERSION_DIR} (junction — does NOT delete source)`);
console.log(`  - ${MARKETPLACE_DIR}`);
console.log(`  - "${MARKETPLACE_NAME}" from ${kmPath}`);
console.log(`  - "${PLUGIN_ID}" from ${ipPath} and ${settingsPath}`);
