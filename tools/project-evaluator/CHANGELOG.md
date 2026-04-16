# Changelog

All user-visible changes to `project-evaluator` are listed here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- `docs/installation.md` rewritten against the real Claude Code plugin install flow (`/plugin marketplace add` + `/plugin install`). Removed references to the non-existent `claude code --add-plugin` flag and the unsupported symlink approach.

### Added
- `CHANGELOG.md` (this file).
- Top-level `CLAUDE.md` at the repo root documents the marketplace layout for future sessions.
- Top-level `scripts/validate-marketplace.mjs` validates the marketplace manifest and cross-checks every plugin.json.

## [0.1.0] — 2026-04-09

Initial plugin release.

### Added
- Three slash commands: `/evaluate-projects`, `/prescreen`, `/compare-projects`.
- 12-factor scoring framework (`framework/factors.json`, `framework/modes.json`, `framework/red-flags.json`).
- 4 scoring modes: Balanced, Cashflow, Learning, Moat.
- Red-flag overlay with auto-demotion when 2+ flags trigger.
- Four scoring agents: `idea-scorer` (default), `scorer-bootstrapper`, `scorer-growth`, `scorer-skeptic` (persona variance).
- Seven Node.js helper scripts under `scripts/` (parse-ideas, load-profile, cache-key, aggregate, format-report, export, calibration).
- Golden-set calibration test (`scripts/calibration.mjs`) with 5 canonical ideas covering the expected score bands.
- Example profile + ideas file under `example/`.
- Persistent score cache under `.cache/scores/` keyed by `(profile, idea, framework-version, model)`.
