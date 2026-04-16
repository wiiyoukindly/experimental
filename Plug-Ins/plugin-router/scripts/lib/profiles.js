/**
 * profiles.js — load/save/validate plugin profiles.
 *
 * A profile is a JSON file describing which plugins should be enabled:
 *   {
 *     "description": "...",
 *     "enable": ["name@marketplace", ...],
 *     "note": "optional free-text note"
 *   }
 *
 * Profiles live in two directories:
 *   - PROFILES_DIR (bundled, read-only, shipped with the plugin)
 *   - STATE.customProfiles (user-editable, survives updates)
 *
 * `resolve(name)` checks custom first, then built-in. This lets users
 * override built-in profiles by saving a customized version with the
 * same name.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { PROFILES_DIR, STATE, ensurePluginData } = require('./paths');

const PROFILE_EXT = '.json';

class ProfileError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'ProfileError';
    this.kind = kind; // 'not-found' | 'shape' | 'io'
  }
}

/**
 * Validate that `profile` has the expected shape.
 * Throws ProfileError('shape') on failure.
 */
function validate(profile, nameForError) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new ProfileError('shape', `profile "${nameForError}" must be a JSON object`);
  }
  if (typeof profile.description !== 'string' || profile.description.trim() === '') {
    throw new ProfileError(
      'shape',
      `profile "${nameForError}" missing non-empty "description"`
    );
  }
  if (!Array.isArray(profile.enable)) {
    throw new ProfileError(
      'shape',
      `profile "${nameForError}" must have an "enable" array`
    );
  }
  for (const entry of profile.enable) {
    if (typeof entry !== 'string' || !entry.includes('@')) {
      throw new ProfileError(
        'shape',
        `profile "${nameForError}" has invalid enable entry: ${JSON.stringify(entry)} (expected "name@marketplace")`
      );
    }
  }
}

function profileFilename(name) {
  return name.endsWith(PROFILE_EXT) ? name : name + PROFILE_EXT;
}

function readProfileFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Load a built-in profile by name. Throws ProfileError('not-found') if missing.
 */
function loadBuiltin(name) {
  const filePath = path.join(PROFILES_DIR, profileFilename(name));
  if (!fs.existsSync(filePath)) {
    throw new ProfileError('not-found', `built-in profile "${name}" not found`);
  }
  try {
    const profile = readProfileFile(filePath);
    validate(profile, name);
    return { ...profile, _source: 'builtin', _path: filePath, _name: name };
  } catch (err) {
    if (err instanceof ProfileError) throw err;
    throw new ProfileError(
      'io',
      `built-in profile "${name}" unreadable: ${err.message}`
    );
  }
}

/**
 * Load a custom profile by name. Throws ProfileError('not-found') if missing.
 */
function loadCustom(name) {
  const filePath = path.join(STATE.customProfiles, profileFilename(name));
  if (!fs.existsSync(filePath)) {
    throw new ProfileError('not-found', `custom profile "${name}" not found`);
  }
  try {
    const profile = readProfileFile(filePath);
    validate(profile, name);
    return { ...profile, _source: 'custom', _path: filePath, _name: name };
  } catch (err) {
    if (err instanceof ProfileError) throw err;
    throw new ProfileError(
      'io',
      `custom profile "${name}" unreadable: ${err.message}`
    );
  }
}

/**
 * Resolve a profile by name: custom overrides built-in.
 * Throws ProfileError('not-found') if neither exists.
 */
function resolve(name) {
  try {
    return loadCustom(name);
  } catch (err) {
    if (!(err instanceof ProfileError) || err.kind !== 'not-found') throw err;
  }
  return loadBuiltin(name);
}

/**
 * Save a profile as a custom profile (writes to STATE.customProfiles).
 * Never overwrites built-ins. If a built-in has the same name, the custom
 * version effectively shadows it for resolve().
 */
function saveCustom(name, profile) {
  validate(profile, name);
  ensurePluginData();
  const filePath = path.join(STATE.customProfiles, profileFilename(name));
  const stripped = { description: profile.description, enable: profile.enable };
  if (profile.note) stripped.note = profile.note;
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(stripped, null, 2) + '\n');
  fs.renameSync(tmp, filePath);
  return filePath;
}

/**
 * List all available profiles (built-in + custom). Returns an array of:
 *   { name, source, description, enableCount }
 * Custom profiles shadow built-ins with the same name in the output.
 */
function list() {
  const seen = new Set();
  const out = [];

  // Custom first (they shadow built-ins)
  try {
    const files = fs
      .readdirSync(STATE.customProfiles)
      .filter((f) => f.endsWith(PROFILE_EXT));
    for (const f of files) {
      const name = f.slice(0, -PROFILE_EXT.length);
      try {
        const p = loadCustom(name);
        out.push({
          name,
          source: 'custom',
          description: p.description,
          enableCount: p.enable.length,
        });
        seen.add(name);
      } catch (err) {
        out.push({
          name,
          source: 'custom',
          description: `(invalid: ${err.message})`,
          enableCount: 0,
          error: true,
        });
        seen.add(name);
      }
    }
  } catch (err) {
    // Custom dir may not exist yet — that's fine.
  }

  // Then built-ins that haven't been shadowed
  try {
    const files = fs
      .readdirSync(PROFILES_DIR)
      .filter((f) => f.endsWith(PROFILE_EXT));
    for (const f of files) {
      const name = f.slice(0, -PROFILE_EXT.length);
      if (seen.has(name)) continue;
      try {
        const p = loadBuiltin(name);
        out.push({
          name,
          source: 'builtin',
          description: p.description,
          enableCount: p.enable.length,
        });
      } catch (err) {
        out.push({
          name,
          source: 'builtin',
          description: `(invalid: ${err.message})`,
          enableCount: 0,
          error: true,
        });
      }
    }
  } catch (err) {
    // If PROFILES_DIR is missing, nothing to list — not fatal.
  }

  // Sort by name for stable output
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

module.exports = {
  ProfileError,
  validate,
  loadBuiltin,
  loadCustom,
  resolve,
  saveCustom,
  list,
};
