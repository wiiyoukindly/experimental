# plugin-router

A Claude Code plugin that manages which other plugins are enabled per session,
so you only pay the context-cost for plugins you actually need.

## Why

Claude Code loads all enabled plugins at session start. Every plugin adds
system prompt tokens, skill descriptions, agent definitions, and (most
expensive of all) MCP tool schemas — even if you never use them. With 30+
plugins installed, this can burn 30-50k tokens before you type a word.

## What it does

- `/router status` — show what's loaded right now and its cost
- `/router list` — list available profiles (built-in + custom)
- `/router analyze` — suggest a profile based on your cwd + first prompt
- `/router switch <profile>` — write the profile to `settings.json` and prompt restart
- `/router pending <profile>` — queue a profile to apply on next session start
- `/router save <name>` — snapshot current enabled set as a custom profile
- `/router core add/remove <plugin>` — edit the always-on core plugins
- `/router learn` — analyze usage log and suggest profile refinements

## The core constraint

Claude Code reads `enabledPlugins` **only at session start**. There is no
in-session API to toggle plugins. Any profile change requires a restart.

This plugin makes that restart as smooth as possible by:

1. Writing the profile atomically (lock + tmp + rename) so concurrent sessions don't corrupt settings.json
2. Keeping a `pending-profile.json` file that the SessionStart hook applies automatically if you forgot to restart in time
3. Snapshotting settings.json before each change (`settings.lastgood.json`) for safe rollback

## Not built (and why)

- **In-session plugin toggle** — architecturally impossible in Claude Code
- **PreToolUse tool suppression** — the tool schema is already in context by the time PreToolUse fires, so blocking saves zero prompt tokens and wastes output tokens + user trust

## State location

All plugin-router state lives under `${CLAUDE_PLUGIN_DATA}`, which resolves to
`~/.claude/plugins/data/plugin-router-*/`. It survives plugin updates and is
cleaned up on uninstall.
