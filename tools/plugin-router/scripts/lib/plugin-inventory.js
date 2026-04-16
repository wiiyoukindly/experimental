/**
 * plugin-inventory.js — walk installed plugins and tally their components.
 *
 * For each installed plugin, count:
 *   - skills    : directories under skills/ that contain a SKILL.md
 *   - commands  : *.md files under commands/
 *   - agents    : *.md files under agents/
 *   - mcpServers: top-level keys in .mcp.json (or under "mcpServers" in
 *                 plugin.json), each of which is one MCP server that may
 *                 expose many tools at runtime
 *   - hooks     : 1 if hooks/hooks.json exists, 0 otherwise
 *   - skillDescChars: total character length of skill `description:` frontmatter
 *                 fields, useful for estimating the auto-truncate budget
 *
 * Why approximate MCP tool count with "servers":
 *   We can't know how many tools an MCP server exposes without actually
 *   starting it and calling listTools. That's expensive and has side effects.
 *   Surfacing "mcpServers: 2" is enough to flag that this plugin contributes
 *   non-trivial context, and the router UI will colour MCP-bearing plugins
 *   as "heavy" in /router status.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { INSTALLED } = require('./paths');

/**
 * Read installed_plugins.json. Returns an object:
 *   { "name@mk": { installPath, version, installedAt } }
 * Missing/malformed → empty object (non-fatal for inventory).
 */
function readInstalledPlugins() {
  try {
    const raw = fs.readFileSync(INSTALLED, 'utf8');
    const parsed = JSON.parse(raw);
    const out = {};
    const plugins = parsed && parsed.plugins ? parsed.plugins : {};
    for (const [id, entries] of Object.entries(plugins)) {
      if (Array.isArray(entries) && entries.length > 0) {
        const first = entries[0];
        out[id] = {
          installPath: first.installPath,
          version: first.version || 'unknown',
          installedAt: first.installedAt,
        };
      }
    }
    return out;
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    console.error(`[inventory] warning: ${INSTALLED} unreadable: ${err.message}`);
    return {};
  }
}

/**
 * Count *.md files in a directory (non-recursive). Returns 0 if dir missing.
 */
function countMarkdown(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.md'))
      .length;
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return 0;
    throw err;
  }
}

/**
 * Count skill directories (subdirs of `skills/` that contain a SKILL.md).
 * Returns { count, descChars } where descChars is the total byte-length
 * of all `description:` frontmatter values (rough budget estimate).
 */
function scanSkills(dir) {
  let count = 0;
  let descChars = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return { count: 0, descChars: 0 };
    throw err;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(dir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;
    count += 1;
    try {
      const text = fs.readFileSync(skillFile, 'utf8');
      const m = text.match(/^description:\s*(.+?)\s*$/m);
      if (m) {
        let val = m[1];
        // Strip surrounding quotes if present
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        descChars += val.length;
      }
    } catch (_) {
      // Unreadable SKILL.md — still count the skill, skip char sum
    }
  }
  return { count, descChars };
}

/**
 * Count MCP servers declared by a plugin.
 * Looks at .mcp.json at the plugin root. Each top-level key is one server.
 * Also checks plugin.json for an "mcpServers" field (alternative location).
 */
function countMcpServers(pluginRoot) {
  let count = 0;
  // .mcp.json at root
  try {
    const mcpPath = path.join(pluginRoot, '.mcp.json');
    const raw = fs.readFileSync(mcpPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Some plugins wrap under a "mcpServers" key, others are flat.
      if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
        count += Object.keys(parsed.mcpServers).length;
      } else {
        count += Object.keys(parsed).length;
      }
    }
  } catch (_) {
    // missing or malformed -> 0 from this source
  }
  // plugin.json with "mcpServers" field
  try {
    const pjPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
    const raw = fs.readFileSync(pjPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.mcpServers && typeof parsed.mcpServers === 'object') {
      count += Object.keys(parsed.mcpServers).length;
    }
  } catch (_) {
    // missing or malformed -> 0 from this source
  }
  return count;
}

/**
 * Check if a plugin has a hooks.json file.
 */
function hasHooks(pluginRoot) {
  return fs.existsSync(path.join(pluginRoot, 'hooks', 'hooks.json'));
}

/**
 * Inventory a single plugin by walking its install directory.
 * Returns null if the install path doesn't exist.
 */
function inventoryPlugin(id, installPath) {
  if (!installPath || !fs.existsSync(installPath)) return null;
  const skills = scanSkills(path.join(installPath, 'skills'));
  const commands = countMarkdown(path.join(installPath, 'commands'));
  const agents = countMarkdown(path.join(installPath, 'agents'));
  const mcpServers = countMcpServers(installPath);
  const hooks = hasHooks(installPath) ? 1 : 0;
  // Heavy score: simple heuristic. MCPs dominate, then skills, then agents.
  // Not a real token count — a comparative weight for sorting.
  const heavyScore = mcpServers * 10 + skills.count * 1 + agents * 2 + commands * 0.5;
  return {
    id,
    installPath,
    skills: skills.count,
    skillDescChars: skills.descChars,
    commands,
    agents,
    mcpServers,
    hooks,
    heavyScore,
  };
}

/**
 * Inventory all installed plugins. Returns an object keyed by plugin id.
 */
function inventoryAll() {
  const installed = readInstalledPlugins();
  const out = {};
  for (const [id, info] of Object.entries(installed)) {
    const inv = inventoryPlugin(id, info.installPath);
    if (inv) {
      inv.version = info.version;
      out[id] = inv;
    }
  }
  return out;
}

/**
 * Aggregate inventory over a subset of plugin ids.
 * Returns totals + breakdown for display.
 */
function aggregate(inventory, pluginIds) {
  const totals = {
    plugins: 0,
    skills: 0,
    skillDescChars: 0,
    commands: 0,
    agents: 0,
    mcpServers: 0,
    hooks: 0,
  };
  const mcpHeavy = []; // ids that ship MCP servers
  const missing = []; // ids not installed
  for (const id of pluginIds) {
    const inv = inventory[id];
    if (!inv) {
      missing.push(id);
      continue;
    }
    totals.plugins += 1;
    totals.skills += inv.skills;
    totals.skillDescChars += inv.skillDescChars;
    totals.commands += inv.commands;
    totals.agents += inv.agents;
    totals.mcpServers += inv.mcpServers;
    totals.hooks += inv.hooks;
    if (inv.mcpServers > 0) mcpHeavy.push({ id, mcpServers: inv.mcpServers });
  }
  mcpHeavy.sort((a, b) => b.mcpServers - a.mcpServers);
  return { totals, mcpHeavy, missing };
}

module.exports = {
  readInstalledPlugins,
  inventoryPlugin,
  inventoryAll,
  aggregate,
};
