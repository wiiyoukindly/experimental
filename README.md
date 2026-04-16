# experimental

Experimental workspace for plans, research, tools, and exploratory work co-authored with Claude Code.

## Install the plugins

This repo exposes a Claude Code **marketplace** at its root. Inside any Claude Code session:

```
/plugin marketplace add wiiyoukindly/experimental
/plugin install project-evaluator@wiiyoukindly-experimental
/plugin install plugin-router@wiiyoukindly-experimental
```

Both plugins install from the same marketplace. Pick whichever you need (or both).

## What lives here

### `tools/project-evaluator/` — AI-native project idea evaluator

A **Claude Code plugin** that ranks project ideas against a weighted 12-factor framework. Built to solve a concrete problem: given a curated backlog of 40+ project ideas, which should you build next?

The plugin takes a markdown file of ideas + a YAML profile (your stack, existing assets, time budget, goals) and produces a ranked report under 4 different lenses (Balanced, Cashflow, Learning, Moat). It runs inside your existing Claude Code session, so it uses your Pro/Max/Team subscription quota — no separate API key required.

**Three slash commands**:
- `/evaluate-projects --ideas FILE --profile FILE` — full 12-factor scoring of an ideas file
- `/prescreen --ideas FILE` — fast 5-question yes/no triage gate
- `/compare-projects --ideas FILE --ids A,B` — 2-idea head-to-head

**The 12 factors** (Balanced-mode weights): Demand Evidence (14) · Build Effort (12) · Technical Fit (11) · Distribution Clarity (10) · Asset Leverage (10) · Time-to-First-Revenue (9) · TAM (7) · Competition Density (7) · Moat (6) · Pricing Power (5) · Differentiator (5) · Operational Burden (4).

**Red flag overlay**: B2B enterprise sales · regulatory compliance · category king exists · mobile-native mismatch · no distribution channel. 2+ flags trigger auto-demotion.

**Why a Claude Code plugin and not a standalone CLI**: in February 2026, Anthropic banned subscription OAuth tokens in third-party Agent SDK apps, GitHub Actions, and GitHub Apps. Only plugins running inside Claude Code can use subscription auth. Building as a plugin was the only way to inherit your Pro/Max tokens instead of forcing pay-per-token billing.

**Phase 1.5 (planned)**: a GitHub Action wrapper that reuses the same `framework/` + `scripts/` shared core, letting non-Claude-Code users invoke the same evaluation via CI/CD with their own API keys. See [`tools/project-evaluator/docs/roadmap.md`](tools/project-evaluator/docs/roadmap.md).

Full docs: [`tools/project-evaluator/README.md`](tools/project-evaluator/README.md) · [framework explanation](tools/project-evaluator/docs/framework.md) · [installation](tools/project-evaluator/docs/installation.md).

### `tools/plugin-router/` — per-session plugin profile router

A **Claude Code plugin** that manages which *other* plugins are enabled per session via named profiles (core, frontend, backend-aws, research, writing, plugin-dev, minimal, …). Built to solve a concrete problem: when you have 30+ plugins installed, every session burns 30-50k tokens on system prompts, skill descriptions, agent definitions, and MCP tool schemas — even for plugins you don't touch.

`plugin-router` exposes a single `/router` command with subcommands: `status`, `list`, `analyze`, `switch`, `pending`, `save`, `core`, `learn`. Profile changes require a Claude Code restart (the plugin list is read only at session start), but the plugin hardens that restart via atomic writes, pending-profile queuing, and last-known-good snapshots.

Full docs: [`tools/plugin-router/README.md`](tools/plugin-router/README.md).

### `plans/` — Claude Code planning documents

Datestamped markdown files (`YYYY-MM-DD_<slug>.md`) that capture research, decision frameworks, and ranked artifacts produced during Claude Code sessions.

Current notable files:
- **`plans/2026-04-09_creative-base-menu.md`** — a curated research document with 20 creative bases (fiction, games, comics, animation, audio) plus a 42-idea non-writing project proposal addendum covering 14 domain groups (Chrome extensions, AI agents, mobile apps, dev tools, creator tools, finance automation, Figma plugins, education). This is the source of the 42 ideas that the `project-evaluator` tool was first run against.
- **`plans/2026-04-09_project-evaluation-run.md`** — the first-run report produced by the `project-evaluator` plugin, scoring all 42 proposals across 12 factors and 4 ranking modes, with red flags, portfolio combos, and a decision tree.

### `projects/` — standalone project code

In-progress code projects that are big enough to live in their own directory but small enough not to need their own repo.

### `drafts/` — informal notes and in-progress drafts

Scratch space for ideas that may or may not become plans or projects.

## Workflow

Plans are drafted in `C:/Users/User/.claude/plans/` during a Claude Code session and committed here at the end of the session with a datestamped filename.

Tools built here (like `project-evaluator`) live under `tools/` until they stabilize, then may be extracted to dedicated repos. The `docs/roadmap.md` file inside each tool explains its phasing plan.

## The 42-proposal story

In April 2026, a set of research into non-writing project proposals (42 ideas across 14 domain groups, all targeting the global/EN market) landed in `plans/2026-04-09_creative-base-menu.md` via PRs #3 and #4. But a list of 42 ideas is only useful if you can rank them — so PR #5 built a Claude Code plugin (`tools/project-evaluator`) that applies a rigorous 12-factor framework and produces the ranked answer. The tool's first run against those 42 ideas sits at `plans/2026-04-09_project-evaluation-run.md`, and the tool itself is now reusable for any future idea list.

The meta-observation: the tool is itself one of the 42 ideas. Building it answered the question of which idea to build next by building the answer.
