#!/usr/bin/env node
/**
 * plugin-router CLI dispatcher
 *
 * Usage: node cli.js <subcommand> [args...]
 *
 * Subcommands (populated incrementally in Steps 1-7):
 *   status   — show current profile + loaded plugins + cost breakdown
 *   list     — list built-in and custom profiles
 *   analyze  — suggest a profile for the current context
 *   switch   — apply a profile to settings.json (requires restart)
 *   pending  — queue a profile for the next session start
 *   save     — save current enabled set as a custom profile
 *   core     — manage the always-on core plugin set
 *   learn    — refine profiles based on usage log
 *   help     — print this message
 *
 * Output convention (first line of stdout):
 *   OK <summary>            — success
 *   ACTION_REQUIRED: RESTART — user must restart Claude Code
 *   ERROR: <reason>         — something went wrong
 *
 * Exit codes:
 *   0 on success or handled error (so slash commands always render cleanly)
 *   1 only on completely unrecoverable internal error
 */
'use strict';

const fs = require('fs');
const path = require('path');

const {
  SETTINGS,
  PLUGIN_DATA,
  STATE,
  ensurePluginData,
} = require('./lib/paths');
const {
  SettingsError,
  readSettings,
  enabledPluginIds,
  disabledPluginIds,
  withSettingsLock,
  applyProfileToSettings,
} = require('./lib/settings-io');
const {
  inventoryAll,
  aggregate,
} = require('./lib/plugin-inventory');
const {
  ProfileError,
  resolve: resolveProfile,
  list: listProfiles,
  loadBuiltin: loadBuiltinProfile,
  saveCustom: saveCustomProfile,
} = require('./lib/profiles');
const { score: matcherScore } = require('./lib/matcher');

const SUBCOMMANDS = [
  'status',
  'list',
  'analyze',
  'switch',
  'pending',
  'save',
  'core',
  'learn',
  'help',
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Read the active-profile name from state. Returns null if no profile has
 * been set yet.
 */
function readActiveProfile() {
  try {
    const text = fs.readFileSync(STATE.activeProfile, 'utf8').trim();
    return text === '' ? null : text;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Write the active-profile file. Atomic via tmp+rename.
 */
function writeActiveProfile(name) {
  ensurePluginData();
  const tmp = STATE.activeProfile + '.tmp';
  fs.writeFileSync(tmp, `${name}\n`);
  fs.renameSync(tmp, STATE.activeProfile);
}

/**
 * Write the pending-profile.json file. Atomic via tmp+rename.
 */
function writePendingProfile(name) {
  ensurePluginData();
  const payload = { profile: name, scheduled: new Date().toISOString() };
  const tmp = STATE.pendingProfile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2) + '\n');
  fs.renameSync(tmp, STATE.pendingProfile);
}

/**
 * Clear the pending-profile.json file if it exists. Idempotent.
 */
function clearPendingProfile() {
  try {
    fs.unlinkSync(STATE.pendingProfile);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

/**
 * Read the pending-profile.json file. Returns null if none queued.
 */
function readPendingProfile() {
  try {
    const raw = fs.readFileSync(STATE.pendingProfile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    // Malformed pending file shouldn't crash status — log and ignore.
    console.error(`[router] warning: pending-profile.json unreadable: ${err.message}`);
    return null;
  }
}

/**
 * Group enabled plugin IDs by their marketplace (part after '@').
 */
function groupByMarketplace(pluginIds) {
  const groups = {};
  for (const id of pluginIds) {
    const idx = id.lastIndexOf('@');
    const mk = idx >= 0 ? id.slice(idx + 1) : '(unknown)';
    const name = idx >= 0 ? id.slice(0, idx) : id;
    if (!groups[mk]) groups[mk] = [];
    groups[mk].push(name);
  }
  // Sort plugin names within each group for stable output
  for (const names of Object.values(groups)) names.sort();
  return groups;
}

// ────────────────────────────────────────────────────────────────────────────
// Subcommand: status
// ────────────────────────────────────────────────────────────────────────────

function cmdStatus() {
  let settings;
  try {
    settings = readSettings();
  } catch (err) {
    if (err instanceof SettingsError) {
      console.log(`ERROR: ${err.message}`);
      return 0;
    }
    throw err;
  }

  const enabled = enabledPluginIds(settings);
  const disabled = disabledPluginIds(settings);
  const active = readActiveProfile();
  const pending = readPendingProfile();

  const header = active
    ? `OK profile="${active}" enabled=${enabled.length} plugins`
    : `OK profile=(none) enabled=${enabled.length} plugins`;

  console.log(header);
  console.log('');

  if (!active) {
    console.log('⚠️  No router profile is active.');
    console.log('   Every enabled plugin in settings.json is loaded.');
    console.log('   Run `/router analyze` after your first prompt for a recommendation,');
    console.log('   or `/router switch minimal` for a bare-bones baseline.');
    console.log('');
  }

  if (pending) {
    console.log(`📌 Pending profile: ${pending.profile || '(unknown)'}`);
    if (pending.scheduled) console.log(`   Queued at: ${pending.scheduled}`);
    console.log('   Will apply on next Claude Code session start.');
    console.log('');
  }

  // Walk every installed plugin's cache dir to tally components.
  const inventory = inventoryAll();
  const { totals, mcpHeavy, missing } = aggregate(inventory, enabled);

  console.log('Component breakdown (currently loaded):');
  console.log(`  Plugins:       ${totals.plugins}`);
  console.log(`  Skills:        ${totals.skills}`);
  console.log(`  Commands:      ${totals.commands}`);
  console.log(`  Agents:        ${totals.agents}`);
  console.log(`  MCP servers:   ${totals.mcpServers}   ← heaviest context cost`);
  console.log(`  Hooks:         ${totals.hooks}`);
  console.log(
    `  Skill desc:    ~${totals.skillDescChars} chars (budget ~8000, auto-truncated above)`
  );
  console.log('');

  if (mcpHeavy.length > 0) {
    console.log('MCP-heavy plugins (target these for max token savings):');
    for (const { id, mcpServers } of mcpHeavy) {
      console.log(`  ${mcpServers}× server(s)  ${id}`);
    }
    console.log('');
  }

  if (missing.length > 0) {
    console.log('⚠️  Enabled in settings.json but not installed on disk:');
    for (const id of missing) console.log(`  - ${id}`);
    console.log('');
  }

  const groups = groupByMarketplace(enabled);
  console.log('Enabled plugins by marketplace:');
  for (const [marketplace, names] of Object.entries(groups)) {
    console.log(`  ${marketplace} (${names.length})`);
    for (const name of names) {
      console.log(`    - ${name}`);
    }
  }

  if (disabled.length > 0) {
    console.log('');
    console.log(`Explicitly disabled: ${disabled.length} plugin(s)`);
    for (const id of disabled) console.log(`  - ${id}`);
  }

  console.log('');
  console.log(`Settings file: ${SETTINGS}`);
  console.log(`Plugin data:   ${PLUGIN_DATA}`);
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Subcommand: list
// ────────────────────────────────────────────────────────────────────────────

function cmdList() {
  const profiles = listProfiles();
  const active = readActiveProfile();

  if (profiles.length === 0) {
    console.log('OK 0 profiles found');
    console.log('');
    console.log('No built-in or custom profiles exist yet. Check that the profiles/');
    console.log('directory under CLAUDE_PLUGIN_ROOT is populated.');
    return 0;
  }

  console.log(`OK ${profiles.length} profile(s) available`);
  console.log('');

  const builtins = profiles.filter((p) => p.source === 'builtin');
  const customs = profiles.filter((p) => p.source === 'custom');

  if (customs.length > 0) {
    console.log('Custom profiles (override built-ins of the same name):');
    for (const p of customs) {
      const marker = p.name === active ? ' ● active' : '';
      const err = p.error ? ' [INVALID]' : '';
      console.log(`  ${p.name.padEnd(22)} ${p.enableCount.toString().padStart(2)} plugins  ${p.description}${marker}${err}`);
    }
    console.log('');
  }

  if (builtins.length > 0) {
    console.log('Built-in profiles:');
    for (const p of builtins) {
      const marker = p.name === active ? ' ● active' : '';
      const err = p.error ? ' [INVALID]' : '';
      console.log(`  ${p.name.padEnd(22)} ${p.enableCount.toString().padStart(2)} plugins  ${p.description}${marker}${err}`);
    }
    console.log('');
  }

  console.log('Apply with: /router switch <name>');
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Subcommand: analyze [prompt text...]
// ────────────────────────────────────────────────────────────────────────────

function cmdAnalyze(args) {
  // Drop a leading --deep flag if present (the opt-in subagent path isn't
  // built yet; the flag is reserved for Phase 2).
  const deep = args[0] === '--deep';
  if (deep) args = args.slice(1);

  const prompt = args.join(' ').trim();
  const cwd = process.cwd();

  // Run the matcher (zero-LLM-cost heuristic)
  const ranked = matcherScore(prompt, cwd);
  const existing = new Set(listProfiles().map((p) => p.name));

  // Filter to profiles that actually exist on disk, keep order
  const available = ranked.filter((r) => existing.has(r.profile));

  if (available.length === 0) {
    console.log('OK no matching profiles found');
    console.log('');
    console.log('The matcher returned results but none of them have a corresponding');
    console.log('profile file under profiles/ or custom-profiles/. Run /router list.');
    return 0;
  }

  const top = available.slice(0, 3);
  console.log(`OK analyzed prompt (${prompt ? prompt.length + ' chars' : 'empty — cwd-only heuristic'})`);
  console.log('');
  console.log(`Working directory: ${cwd}`);
  if (prompt) console.log(`Prompt: "${prompt.length > 80 ? prompt.slice(0, 77) + '…' : prompt}"`);
  console.log('');

  console.log('Top recommendations:');
  for (const [i, r] of top.entries()) {
    const marker = i === 0 ? '→' : ' ';
    console.log(`  ${marker} ${r.profile.padEnd(20)} score=${r.score.toString().padEnd(5)} ${r.reasons.join(' | ')}`);
  }
  console.log('');

  const best = top[0];
  if (best.score >= 0.3) {
    console.log(`💡 Best fit: "${best.profile}" (confidence ${best.score >= 0.45 ? 'high' : 'medium'})`);
    console.log(`   Apply for next session: /router pending ${best.profile}`);
    console.log(`   Apply now + restart:    /router switch  ${best.profile}`);
  } else {
    console.log('⚠️  No profile scored high enough for a confident recommendation.');
    console.log('   Consider running /router analyze with a more specific prompt, or');
    console.log('   stick with `dev-general` / `minimal` if the task is ad-hoc.');
  }

  if (deep) {
    console.log('');
    console.log('(--deep subagent path not built yet; reserved for Phase 2.)');
  }

  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Subcommand: switch <name>
// ────────────────────────────────────────────────────────────────────────────

async function cmdSwitch(args) {
  const name = args[0];
  if (!name) {
    console.log('ERROR: `/router switch` requires a profile name. Run /router list to see options.');
    return 0;
  }

  // Resolve the profile (custom overrides built-in)
  let profile;
  try {
    profile = resolveProfile(name);
  } catch (err) {
    if (err instanceof ProfileError) {
      console.log(`ERROR: ${err.message}. Run /router list for available profiles.`);
      return 0;
    }
    throw err;
  }

  // Cross-check against installed plugins — warn (don't block) if any are missing
  const inventory = inventoryAll();
  const notInstalled = profile.enable.filter((id) => !inventory[id]);

  // Apply the profile to settings.json via the safe write path
  let metadata;
  try {
    metadata = await withSettingsLock((settings) =>
      applyProfileToSettings(profile, settings)
    );
  } catch (err) {
    if (err instanceof SettingsError) {
      console.log(`ERROR: ${err.message}`);
      return 0;
    }
    throw err;
  }

  // Persist the active profile and queue a pending-profile as insurance
  // (in case the user forgets to restart — SessionStart will reapply next time)
  writeActiveProfile(name);
  writePendingProfile(name);

  console.log('ACTION_REQUIRED: RESTART');
  console.log('');
  console.log(`Profile "${name}" applied. settings.json now has ${metadata.enabled} plugins enabled.`);
  console.log(`Source: ${profile._source} profile`);
  console.log('');
  console.log(`Changes:`);
  console.log(`  added:   ${metadata.added.length} plugin(s)`);
  if (metadata.added.length > 0) {
    for (const id of metadata.added.slice(0, 10)) console.log(`    + ${id}`);
    if (metadata.added.length > 10) console.log(`    ... and ${metadata.added.length - 10} more`);
  }
  console.log(`  removed: ${metadata.removed.length} plugin(s)`);
  if (metadata.removed.length > 0) {
    for (const id of metadata.removed.slice(0, 10)) console.log(`    - ${id}`);
    if (metadata.removed.length > 10) console.log(`    ... and ${metadata.removed.length - 10} more`);
  }
  console.log('');

  if (notInstalled.length > 0) {
    console.log('⚠️  Profile lists plugins that are not installed on disk:');
    for (const id of notInstalled) console.log(`    - ${id}`);
    console.log('   settings.json was written anyway; Claude Code will silently ignore missing entries.');
    console.log('');
  }

  console.log('⚠️  RESTART Claude Code for the changes to take effect.');
  console.log('   A pending-profile.json has also been queued as insurance —');
  console.log('   if you forget to restart now, it will be applied on your next session.');
  console.log('');
  console.log(`Backup of previous settings.json saved to: ${STATE.lastGood}`);
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Subcommand: pending <name>
// ────────────────────────────────────────────────────────────────────────────

function cmdPending(args) {
  const name = args[0];
  if (!name) {
    console.log('ERROR: `/router pending` requires a profile name. Run /router list to see options.');
    return 0;
  }

  // Validate that the profile exists before queueing (fail loud if typo)
  try {
    resolveProfile(name);
  } catch (err) {
    if (err instanceof ProfileError) {
      console.log(`ERROR: ${err.message}. Run /router list for available profiles.`);
      return 0;
    }
    throw err;
  }

  writePendingProfile(name);
  console.log(`OK profile "${name}" queued for next session start`);
  console.log('');
  console.log('Your current session is unaffected. When you next start Claude Code,');
  console.log('the SessionStart hook will apply this profile to settings.json before any');
  console.log('plugins load. To apply immediately (and restart), use /router switch instead.');
  console.log('');
  console.log(`Pending file: ${STATE.pendingProfile}`);
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Subcommand: save <name> [--description "..."]
// ────────────────────────────────────────────────────────────────────────────

function cmdSave(args) {
  const name = args[0];
  if (!name) {
    console.log('ERROR: `/router save` requires a profile name.');
    console.log('Usage: /router save <name> [--description "human-readable description"]');
    return 0;
  }

  // Refuse reserved built-in names to avoid confusion. Custom can shadow
  // built-ins by design, but we'd rather force an explicit "override" opt-in.
  const BUILTIN_NAMES = ['core', 'minimal', 'dev-general', 'frontend',
    'plugin-dev', 'backend-aws', 'browser-automation', 'writing', 'research'];
  if (BUILTIN_NAMES.includes(name) && !args.includes('--override-builtin')) {
    console.log(
      `ERROR: "${name}" is a built-in profile name. Pass --override-builtin to save a custom profile that shadows it.`
    );
    return 0;
  }

  // Parse optional --description
  let description = `Custom profile saved from current enabled set`;
  const descIdx = args.indexOf('--description');
  if (descIdx >= 0 && args[descIdx + 1]) {
    description = args[descIdx + 1];
  }

  // Read current enabled set from settings.json
  let settings;
  try {
    settings = readSettings();
  } catch (err) {
    if (err instanceof SettingsError) {
      console.log(`ERROR: ${err.message}`);
      return 0;
    }
    throw err;
  }

  const enabled = enabledPluginIds(settings).sort();
  if (enabled.length === 0) {
    console.log('ERROR: no plugins are currently enabled; nothing to save.');
    return 0;
  }

  const profile = { description, enable: enabled };
  let savedPath;
  try {
    savedPath = saveCustomProfile(name, profile);
  } catch (err) {
    if (err instanceof ProfileError) {
      console.log(`ERROR: ${err.message}`);
      return 0;
    }
    throw err;
  }

  console.log(`OK saved custom profile "${name}" with ${enabled.length} plugins`);
  console.log('');
  console.log(`File: ${savedPath}`);
  console.log(`Description: ${description}`);
  console.log('');
  console.log(`Apply with: /router switch ${name} (or /router pending ${name})`);
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Subcommand: core add/remove <plugin-id>
// ────────────────────────────────────────────────────────────────────────────
//
// "core" plugins are the baseline set that every built-in profile includes.
// Editing the core propagates the change across ALL built-in profiles.
// To preserve the read-only contract on profiles/*.json, we save the
// edited versions as CUSTOM profiles with the same name (which shadow the
// built-ins via resolve() order).

const CORE_MANAGED_BUILTINS = [
  'core', 'minimal', 'dev-general', 'frontend',
  'plugin-dev', 'backend-aws', 'browser-automation', 'writing', 'research',
];

function cmdCore(args) {
  const action = args[0];
  const pluginId = args[1];

  if (!action || !['add', 'remove', 'show'].includes(action)) {
    console.log('ERROR: usage is `/router core add|remove|show <plugin@marketplace>`');
    return 0;
  }

  if (action === 'show') {
    // Read the current core from the custom-override or built-in
    let coreProfile;
    try {
      coreProfile = resolveProfile('core');
    } catch (err) {
      console.log(`ERROR: cannot read core profile: ${err.message}`);
      return 0;
    }
    console.log(`OK core profile (source: ${coreProfile._source})`);
    console.log('');
    console.log('Currently in core:');
    for (const id of coreProfile.enable) console.log(`  - ${id}`);
    return 0;
  }

  if (!pluginId || !pluginId.includes('@')) {
    console.log(
      `ERROR: plugin id required in "name@marketplace" format (e.g. remember@claude-plugins-official)`
    );
    return 0;
  }

  // Walk through every managed built-in, load it (resolve order: custom > builtin),
  // mutate its enable list, save as custom.
  const report = { touched: [], unchanged: [] };
  for (const name of CORE_MANAGED_BUILTINS) {
    let profile;
    try {
      profile = resolveProfile(name);
    } catch (err) {
      if (err instanceof ProfileError && err.kind === 'not-found') {
        // Profile doesn't exist (e.g. partial install) — skip silently
        continue;
      }
      throw err;
    }

    const enable = new Set(profile.enable);
    let changed = false;

    if (action === 'add') {
      if (!enable.has(pluginId)) {
        enable.add(pluginId);
        changed = true;
      }
    } else if (action === 'remove') {
      if (enable.has(pluginId)) {
        enable.delete(pluginId);
        changed = true;
      }
    }

    if (!changed) {
      report.unchanged.push(name);
      continue;
    }

    const newProfile = {
      description: profile.description,
      enable: Array.from(enable),
    };
    if (profile.note) newProfile.note = profile.note;
    try {
      saveCustomProfile(name, newProfile);
      report.touched.push(name);
    } catch (err) {
      console.log(`ERROR saving custom override for "${name}": ${err.message}`);
      return 0;
    }
  }

  if (report.touched.length === 0) {
    console.log(
      `OK no profiles needed changes (plugin "${pluginId}" was already ${action === 'add' ? 'present' : 'absent'} in all of them).`
    );
    return 0;
  }

  console.log(`OK ${action === 'add' ? 'added' : 'removed'} "${pluginId}" in ${report.touched.length} profile(s)`);
  console.log('');
  console.log('Changed (now saved as custom overrides):');
  for (const n of report.touched) console.log(`  - ${n}`);
  if (report.unchanged.length > 0) {
    console.log('');
    console.log(`Unchanged: ${report.unchanged.join(', ')}`);
  }
  console.log('');
  console.log('Built-in files under profiles/ are untouched — the changes live in');
  console.log('custom-profiles/ and shadow the built-ins. To revert, delete the file(s)');
  console.log(`under ${STATE.customProfiles}.`);
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Subcommand: help
// ────────────────────────────────────────────────────────────────────────────

function cmdHelp() {
  console.log('OK plugin-router v0.1.0');
  console.log('');
  console.log('Usage: /router <subcommand> [args]');
  console.log('');
  console.log('Subcommands:');
  console.log('  status             Show current profile, loaded plugins, cost breakdown');
  console.log('  list               List built-in and custom profiles');
  console.log('  analyze [prompt]   Suggest a profile based on prompt text + cwd');
  console.log('  switch <name>      Apply a profile to settings.json (requires restart)');
  console.log('  pending <name>     Queue a profile for next session start (no immediate write)');
  console.log('  save <name>        Snapshot current enabled set as a custom profile');
  console.log('  core show          Display the always-on core plugin set');
  console.log('  core add <p>       Add a plugin to every built-in profile (as custom override)');
  console.log('  core remove <p>    Remove a plugin from every built-in profile');
  console.log('  help               Print this message');
  console.log('');
  console.log('Phase 2 (not yet built): `learn` (refine from usage log), `analyze --deep`');
  console.log('(Haiku subagent tie-breaker), `doctor` (restore settings from lastgood snapshot).');
  console.log('');
  console.log('Key constraint: profile changes take effect on NEXT Claude Code start. ');
  console.log('Plugins are loaded once at session start and cannot be toggled mid-session.');
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Stub for unimplemented subcommands
// ────────────────────────────────────────────────────────────────────────────

function cmdStub(name, args) {
  console.log(`OK (not-yet-implemented) subcommand="${name}" args=${JSON.stringify(args)}`);
  console.log('');
  console.log(`The "${name}" subcommand arrives in a later step. Run /router help for progress.`);
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Main dispatcher
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const [, , subcommand, ...rest] = process.argv;

  if (!subcommand || subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
    return cmdHelp();
  }

  if (!SUBCOMMANDS.includes(subcommand)) {
    console.log(`ERROR: unknown subcommand "${subcommand}". Run /router help for the list.`);
    return 0;
  }

  switch (subcommand) {
    case 'status':
      return cmdStatus();
    case 'list':
      return cmdList();
    case 'switch':
      return await cmdSwitch(rest);
    case 'pending':
      return cmdPending(rest);
    case 'analyze':
      return cmdAnalyze(rest);
    case 'save':
      return cmdSave(rest);
    case 'core':
      return cmdCore(rest);
    case 'help':
      return cmdHelp();
    default:
      return cmdStub(subcommand, rest);
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.log(`ERROR: unhandled exception: ${err && err.message ? err.message : err}`);
    if (process.env.ROUTER_DEBUG) {
      console.error(err && err.stack ? err.stack : err);
    }
    process.exit(1);
  });
