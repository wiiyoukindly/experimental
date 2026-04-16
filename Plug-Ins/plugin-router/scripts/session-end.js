#!/usr/bin/env node
/**
 * session-end.js — SessionEnd hook handler for plugin-router.
 *
 * Fires once when a session ends (unlike Stop, which fires every turn).
 * Parses the session transcript to extract actually-used tools and appends
 * a single line to usage-log.jsonl for later analysis by /router learn.
 *
 * Input (stdin JSON, per Claude Code hook protocol):
 *   { session_id, transcript_path, cwd, ... }
 *
 * Output: nothing user-visible (stdout ignored for SessionEnd). Stderr
 * carries diagnostics for `claude --debug`.
 *
 * Never crashes or exits non-zero.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { STATE, ensurePluginData } = require('./lib/paths');
const { extractToolUses } = require('./lib/transcript');

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
      process.stdin.on('data', (chunk) => (buf += chunk));
      process.stdin.on('end', finish);
      process.stdin.on('error', finish);
      setTimeout(finish, 2000);
    } catch (_) {
      finish();
    }
  });
}

function readActiveProfile() {
  try {
    return fs.readFileSync(STATE.activeProfile, 'utf8').trim() || null;
  } catch (_) {
    return null;
  }
}

function appendUsageLog(entry) {
  ensurePluginData();
  const line = JSON.stringify(entry) + '\n';
  try {
    fs.appendFileSync(STATE.usageLog, line);
  } catch (err) {
    logError(`failed to append usage log: ${err.message}`);
  }
}

function cleanupSessionFlag(sessionId) {
  if (!sessionId) return;
  const flagPath = path.join(STATE.sessionSeen, String(sessionId));
  try {
    fs.unlinkSync(flagPath);
  } catch (err) {
    if (err.code !== 'ENOENT') logError(`failed to clean session flag: ${err.message}`);
  }
}

async function main() {
  const input = await readStdinJson();
  const sessionId = input.session_id || input.sessionId || null;
  const transcriptPath = input.transcript_path || input.transcriptPath || null;
  const cwd = input.cwd || null;

  // Parse transcript if we have a path — best effort, never fail the hook
  let stats = { totalToolUses: 0, byName: {}, byKind: {}, bySource: {} };
  if (transcriptPath) {
    try {
      stats = await extractToolUses(transcriptPath);
    } catch (err) {
      logError(`transcript parse failed: ${err.message}`);
    }
  }

  const entry = {
    ts: new Date().toISOString(),
    session_id: sessionId,
    cwd,
    profile: readActiveProfile(),
    totalToolUses: stats.totalToolUses,
    byKind: stats.byKind,
    // Keep the top-20 tool names sorted by count — full detail would blow up
    // the log file over time.
    topTools: Object.entries(stats.byName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, n]) => ({ name, n })),
    // Plugin/MCP source breakdown (empty for built-in-only sessions)
    bySource: stats.bySource,
  };

  appendUsageLog(entry);
  cleanupSessionFlag(sessionId);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logError(`top-level error: ${err && err.message ? err.message : err}`);
    process.exit(0);
  });
