/**
 * transcript.js — parse a Claude Code session transcript (JSONL) for
 * tool_use events.
 *
 * Transcript format (one JSON object per line):
 *   {
 *     type: "assistant" | "user" | ...,
 *     message: { role, content: [ { type: "tool_use", name, input }, ... ] },
 *     ...
 *   }
 *
 * We only care about assistant tool_use entries. The parser is tolerant of
 * malformed lines (skips them silently) and never loads the whole file into
 * memory.
 */
'use strict';

const fs = require('fs');
const readline = require('readline');

/**
 * Classify a tool name by its probable origin. Used to group stats by
 * source in the usage log.
 *   - "builtin" : Read, Write, Edit, Bash, Glob, Grep, TodoWrite, etc.
 *   - "skill"   : "plugin-name:skill-name" (has a colon)
 *   - "mcp"     : "mcp__uuid__tool-name"
 *   - "agent"   : "Agent" or subagent-looking names
 *   - "unknown" : anything else
 */
function classifyToolName(name) {
  if (!name || typeof name !== 'string') return 'unknown';
  if (name.startsWith('mcp__')) return 'mcp';
  if (name === 'Agent') return 'agent';
  if (name.includes(':')) return 'skill';
  const builtins = new Set([
    'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'Glob', 'Grep',
    'TodoWrite', 'WebFetch', 'WebSearch', 'NotebookEdit', 'Task',
    'KillShell', 'BashOutput', 'TaskOutput', 'TaskStop',
    'AskUserQuestion', 'ExitPlanMode', 'EnterPlanMode',
    'EnterWorktree', 'ExitWorktree', 'Skill',
    'CronCreate', 'CronList', 'CronDelete', 'RemoteTrigger',
    'ToolSearch',
  ]);
  if (builtins.has(name)) return 'builtin';
  return 'unknown';
}

/**
 * Given a skill-style tool name "plugin:skill", return the plugin name.
 * For MCP tool names "mcp__uuid__toolname", we can't resolve plugin
 * ownership without extra metadata, so we return the full id.
 */
function sourcePluginForToolName(name) {
  if (typeof name !== 'string') return null;
  if (name.startsWith('mcp__')) {
    // Keep the mcp__uuid portion so usage-log can group by server
    const parts = name.split('__');
    return parts.length >= 2 ? `${parts[0]}__${parts[1]}` : name;
  }
  const colon = name.indexOf(':');
  if (colon >= 0) return name.slice(0, colon);
  return null;
}

/**
 * Stream-parse a transcript file and tally tool_use calls.
 * Returns a Promise<{ totalToolUses, byName, byKind, bySource }>.
 *
 *   totalToolUses: number
 *   byName: { [toolName]: count }
 *   byKind: { builtin, skill, mcp, agent, unknown }
 *   bySource: { [pluginOrMcpServer]: count }  -- only populated for skills + mcp
 */
function extractToolUses(transcriptPath) {
  return new Promise((resolve) => {
    const stats = {
      totalToolUses: 0,
      byName: {},
      byKind: { builtin: 0, skill: 0, mcp: 0, agent: 0, unknown: 0 },
      bySource: {},
    };

    let stream;
    try {
      stream = fs.createReadStream(transcriptPath, { encoding: 'utf8' });
    } catch (err) {
      // File missing or unreadable — return empty stats
      return resolve(stats);
    }

    stream.on('error', () => resolve(stats));

    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    rl.on('line', (line) => {
      if (!line) return;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch (_) {
        return;
      }
      if (!obj || obj.type !== 'assistant' || !obj.message) return;
      const content = obj.message.content;
      if (!Array.isArray(content)) return;

      for (const item of content) {
        if (!item || item.type !== 'tool_use' || !item.name) continue;
        const name = item.name;
        stats.totalToolUses += 1;
        stats.byName[name] = (stats.byName[name] || 0) + 1;
        const kind = classifyToolName(name);
        stats.byKind[kind] = (stats.byKind[kind] || 0) + 1;
        const src = sourcePluginForToolName(name);
        if (src) stats.bySource[src] = (stats.bySource[src] || 0) + 1;
      }
    });

    rl.on('close', () => resolve(stats));
    rl.on('error', () => resolve(stats));
  });
}

module.exports = {
  classifyToolName,
  sourcePluginForToolName,
  extractToolUses,
};
