# Installation & Setup

`plugin-router` is a **Claude Code plugin**. It runs inside your Claude Code session and manages which *other* plugins are enabled via named profiles. It inherits the session's auth, so no extra API key is required.

## Prerequisites

- [Claude Code](https://claude.com/claude-code) installed on your machine
- Node.js 18+ (for the CLI and hooks the plugin ships)
- At least one other marketplace added — `plugin-router` is useless if you have zero other plugins installed. Most built-in profiles reference `@claude-plugins-official`, so add that marketplace too if you want the out-of-the-box profiles to work

## Installation

The repo exposes a marketplace at its root (`.claude-plugin/marketplace.json`). Install inside any Claude Code session:

### Option A — Install from GitHub (recommended)

```
/plugin marketplace add wiiyoukindly/experimental
/plugin install plugin-router@wiiyoukindly-experimental
```

Restart Claude Code once so the SessionStart hook takes effect.

### Option B — Install from a local clone

If you've already cloned the repo:

```bash
git clone https://github.com/wiiyoukindly/experimental.git ~/code/experimental
```

Then in Claude Code:

```
/plugin marketplace add ~/code/experimental
/plugin install plugin-router@wiiyoukindly-experimental
```

Edits in `~/code/experimental/tools/plugin-router/` require re-running `/plugin marketplace update` + restart before they're picked up.

### Option C — Direct junction install (offline / dev)

The repo ships `install-locally.js`, which creates a directory junction from the Claude Code plugin cache to your repo checkout, so edits apply **immediately** with no re-copy. Useful for:

- Iterating on the plugin source (every edit takes effect on next restart)
- Air-gapped or proxy-restricted environments where `/plugin marketplace add` can't reach GitHub

```bash
cd tools/plugin-router
node install-locally.js
```

Prefer Options A or B for normal use. The script manipulates Claude Code's internal plugin files (`known_marketplaces.json`, `installed_plugins.json`, `settings.json`) directly — if Anthropic changes the schema, this script will break until it's updated.

## Verify installation

Inside Claude Code, after restart:

```
/router status
```

Expected: a status line listing the active profile (`(none)` on first run), enabled plugin count, and any pending profile. If you see `ERROR: could not read settings.json`, the plugin loaded but doesn't know how to find your Claude Code config — open an issue.

Also exercise the smoke test from a terminal:

```bash
cd tools/plugin-router
node tests/smoke.mjs
```

Expected: `PASS smoke: all subcommands respond with expected markers`.

## First run

```
/router list       # show available profiles
/router analyze    # suggest a profile for your current cwd
/router switch dev-general   # apply the dev-general profile
```

`/router switch` writes to `~/.claude/settings.json` AND queues a `pending-profile.json`. Restart Claude Code to see the new plugin set take effect.

## Uninstall

```
/plugin uninstall plugin-router@wiiyoukindly-experimental
```

This removes the plugin from settings and the cache. State files under `~/.claude/plugins/data/plugin-router-*/` are preserved (so your custom profiles survive a reinstall). Delete them manually if you want a clean slate.

## Troubleshooting

### `/router` doesn't appear in `/help`

- Confirm the plugin installed: `/plugin list` should include `plugin-router@wiiyoukindly-experimental`
- Restart Claude Code. The command registry is read at session start.

### Built-in profiles reference plugins you don't have

Most built-in profiles list plugins from `@claude-plugins-official`. If you haven't added that marketplace, `switch` will still write the profile but Claude Code will silently ignore unknown plugin IDs. Add the marketplace first:

```
/plugin marketplace add anthropic-experimental/claude-plugins-official
```

(Check the current canonical name in the [Claude Code docs](https://docs.claude.com/en/docs/claude-code) — the exact marketplace identifier may change.)

### `SessionStart` hook times out

- Check `~/.claude/plugins/data/plugin-router-*/lock` — if present, a previous session crashed mid-write. Delete it.
- The hook timeout is 8 seconds (set in `hooks/hooks.json`). If your filesystem is slow, bump it.
