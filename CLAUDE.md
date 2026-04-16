# CLAUDE.md

Guidance for Claude Code sessions working inside this repo.

## What this repo is

A personal experimental workspace that doubles as a **Claude Code plugin marketplace**. The root ships a `.claude-plugin/marketplace.json` that exposes the plugins built under `tools/`.

## Layout

```
.claude-plugin/marketplace.json    # Marketplace manifest — lists all plugins
tools/
  project-evaluator/               # Plugin: 12-factor project idea scorer
    .claude-plugin/plugin.json
    commands/ agents/ skills/ framework/ scripts/ docs/ example/ tests/
  plugin-router/                   # Plugin: per-session plugin profile router
    .claude-plugin/plugin.json
    commands/ hooks/ profiles/ scripts/ docs/ tests/
plans/                             # Datestamped planning/research notes
projects/                          # Standalone in-progress project code
drafts/                            # Scratch notes
scripts/
  validate-marketplace.mjs         # Validate the root marketplace manifest
```

## Rules for plugins

Every plugin under `tools/` MUST have:

1. `.claude-plugin/plugin.json` at the plugin root (name, version, description, keywords, license)
2. A `README.md` that opens with an `## Install` section showing the `/plugin marketplace add` + `/plugin install` commands
3. A `CHANGELOG.md` — bumped on every user-visible change
4. An entry in the root `.claude-plugin/marketplace.json` with a matching `source: "./tools/<name>"`

Every plugin SHOULD have:

- `tests/` with at least a smoke test that can run via `node tests/smoke.mjs`
- A `docs/` directory for install, usage, and architecture notes beyond the README

## Validation

Before opening a PR that touches a plugin or the marketplace manifest, run:

```bash
node scripts/validate-marketplace.mjs
```

It checks that every plugin listed in the marketplace resolves to a directory with a valid `plugin.json`, and that plugin names/versions agree between the two manifests.

Per-plugin sanity:

```bash
node tools/project-evaluator/scripts/calibration.mjs    # 5/5 PASS expected
node tools/plugin-router/tests/smoke.mjs                 # all OK expected
node tools/plugin-router/tests/validate-profiles.mjs     # all profiles valid
```

## Installation (user-facing)

```
/plugin marketplace add wiiyoukindly/experimental
/plugin install project-evaluator@wiiyoukindly-experimental
/plugin install plugin-router@wiiyoukindly-experimental
```

Both plugins inherit the Claude Code session's auth, so Pro/Max/Team subscription quota is used (no separate API key needed).

## Notes for Claude

- Prefer editing existing plugins over creating new top-level tools. When a new plugin is needed, scaffold it under `tools/<kebab-name>/` with the 4 required artefacts listed above.
- Do **not** modify `~/.claude/` or any file under the user's Claude Code installation. Plugins must be self-contained.
- When adding a new profile to `plugin-router`, the plugin IDs take the form `<plugin-name>@<marketplace-name>`. The `@claude-plugins-official` marketplace is Anthropic's official one; users who use those profiles also need to add that marketplace themselves (see `tools/plugin-router/docs/profiles.md`).
- Keep the marketplace manifest sorted: plugins listed alphabetically by `name` for a stable diff.
