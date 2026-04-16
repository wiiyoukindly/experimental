# Changelog

All user-visible changes to `plugin-router` are listed here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `.claude-plugin/plugin.json` — the plugin was previously missing this manifest, which meant Claude Code could not load it via `/plugin install`.
- `CHANGELOG.md` (this file).
- `docs/installation.md` — step-by-step install guide.
- `docs/profiles.md` — authoring guide for custom profiles.
- `tests/smoke.mjs` — smoke-tests `cli.js` subcommands (`help`, `list`).
- `tests/validate-profiles.mjs` — schema-validates every built-in profile JSON.
- `.gitignore` — excludes local cache + dev state files.

### Changed
- Moved the plugin from `Plug-Ins/plugin-router/` to `tools/plugin-router/` for consistency with `tools/project-evaluator/`.
- `install-locally.js` hardened: handles fresh installs (when `known_marketplaces.json` / `installed_plugins.json` don't yet exist) by initialising them, and the header comment clarifies when to use it vs `/plugin install`.

## [0.1.0] — 2026-04-16

Initial plugin drop.

### Added
- `/router` command with 8 subcommands: `status`, `list`, `analyze`, `switch`, `pending`, `save`, `core`, `learn`.
- 9 built-in profiles: `core`, `minimal`, `dev-general`, `frontend`, `backend-aws`, `browser-automation`, `research`, `writing`, `plugin-dev`.
- SessionStart hook that auto-applies any queued `pending-profile.json`.
- UserPromptSubmit hook that logs usage hints for the `learn` subcommand.
- SessionEnd hook for usage log cleanup.
- Atomic settings.json writes (lock + tmp + rename) + last-known-good snapshot for rollback.
- `install-locally.js` for alt-path installation via directory junction (edits in source apply immediately).
