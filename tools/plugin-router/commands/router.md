---
description: Manage plugin profiles — show, list, analyze, switch, save, or learn which plugins are enabled per session.
allowed-tools: Bash(node:*), Read
argument-hint: [status|list|analyze|switch|pending|save|core|learn|help] [args]
---

You are dispatching a plugin-router subcommand. Arguments: `$ARGUMENTS`

## Step 1 — Run the CLI

Execute the router CLI with the arguments exactly as given:

```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/cli.js" $ARGUMENTS
```

## Step 2 — Interpret the output

The CLI output follows a simple marker convention on the first line:

- `OK <summary>` — success; show the rest of the output to the user
- `ACTION_REQUIRED: RESTART` — the user must restart Claude Code for the change to take effect. Surface this as a prominent warning
- `ERROR: <reason>` — something went wrong; explain it clearly

## Step 3 — Subcommand-specific guidance

- **status / list** — Just show the formatted output. If the user has many plugins loaded and no profile is active, suggest `/router analyze`.
- **analyze** — The CLI ranks profiles. Explain the top recommendation, show alternatives, and remind the user that applying requires a restart via `/router switch <name>` or `/router pending <name>`.
- **switch** — If output contains `ACTION_REQUIRED: RESTART`, state clearly that the settings.json was updated AND a `pending-profile.json` was queued as insurance, and that the change takes effect on next Claude Code startup.
- **pending** — Lighter than switch: only queues. Explain that the change will apply on next session start, not now.
- **save** — Confirms a custom profile was written.
- **core add / core remove** — Explain that all built-in profiles have been updated (copies saved under custom-profiles/).
- **learn** — Summarize the usage-based suggestions and offer to apply them.
- **help** — Show the subcommand list verbatim.

If no argument is given, treat it as `help`.
