# experimental

A personal **Claude Code plugin marketplace**. Hosts two plugins built and dogfooded inside this workspace.

## Install the plugins

This repo exposes a Claude Code marketplace at its root. Inside any Claude Code session:

```
/plugin marketplace add wiiyoukindly/experimental
/plugin install project-evaluator@wiiyoukindly-experimental
/plugin install plugin-router@wiiyoukindly-experimental
```

Both plugins install from the same marketplace. Pick whichever you need (or both). Restart Claude Code after install — `plugin-router` ships a `SessionStart` hook that only loads on a fresh session.

## What lives here

### `tools/project-evaluator/` — AI-native project idea evaluator

A Claude Code plugin that ranks project ideas against a weighted 12-factor framework. Given a markdown file of ideas + a YAML profile (your stack, existing assets, time budget, goals), it produces a ranked report under 4 different lenses (Balanced, Cashflow, Learning, Moat). Runs inside your Claude Code session and inherits its auth, so Pro/Max/Team subscription quota is used — no separate API key required.

**Three slash commands**:
- `/evaluate-projects --ideas FILE --profile FILE` — full 12-factor scoring
- `/prescreen --ideas FILE` — fast 5-question yes/no triage gate
- `/compare-projects --ideas FILE --ids A,B` — 2-idea head-to-head

**The 12 factors** (Balanced-mode weights): Demand Evidence (14) · Build Effort (12) · Technical Fit (11) · Distribution Clarity (10) · Asset Leverage (10) · Time-to-First-Revenue (9) · TAM (7) · Competition Density (7) · Moat (6) · Pricing Power (5) · Differentiator (5) · Operational Burden (4).

**Red flag overlay**: B2B enterprise sales · regulatory compliance · category king exists · mobile-native mismatch · no distribution channel. 2+ flags trigger auto-demotion.

**Demo output**: see [`tools/project-evaluator/example/sample-output-balanced.md`](tools/project-evaluator/example/sample-output-balanced.md) for an actual run scoring 42 project ideas across 12 factors and 4 modes, and [`example/sample-output-personas.md`](tools/project-evaluator/example/sample-output-personas.md) for the persona-variance pass.

Full docs: [`README`](tools/project-evaluator/README.md) · [framework](tools/project-evaluator/docs/framework.md) · [installation](tools/project-evaluator/docs/installation.md) · [roadmap](tools/project-evaluator/docs/roadmap.md).

### `tools/plugin-router/` — per-session plugin profile router

A Claude Code plugin that manages which *other* plugins are enabled per session via named profiles (core, frontend, backend-aws, research, writing, plugin-dev, minimal, …). Solves a real problem: when you have 30+ plugins installed, every session burns 30-50k tokens on system prompts, skill descriptions, agent definitions, and MCP tool schemas — even for plugins you don't touch.

`plugin-router` exposes a single `/router` command with subcommands: `status`, `list`, `analyze`, `switch`, `pending`, `save`, `core`, `learn`. Profile changes require a Claude Code restart (the plugin list is read only at session start), but the plugin hardens that restart via atomic writes, pending-profile queuing, and last-known-good snapshots.

Full docs: [`README`](tools/plugin-router/README.md) · [installation](tools/plugin-router/docs/installation.md) · [profiles](tools/plugin-router/docs/profiles.md).

## Repo layout

```
.claude-plugin/marketplace.json    # Marketplace manifest — lists all plugins
tools/
  project-evaluator/               # Plugin: 12-factor project idea scorer
  plugin-router/                   # Plugin: per-session plugin profile router
scripts/
  validate-marketplace.mjs         # Validate the root marketplace manifest
CLAUDE.md                          # Guidance for future Claude Code sessions
LICENSE                            # MIT
```

## Validation

Before opening a PR that touches a plugin or the marketplace manifest:

```bash
node scripts/validate-marketplace.mjs                    # marketplace + plugin.json cross-check
node tools/project-evaluator/scripts/calibration.mjs     # 5/5 PASS expected
node tools/plugin-router/tests/smoke.mjs                 # all OK expected
node tools/plugin-router/tests/validate-profiles.mjs     # all profiles valid
```
