# Roadmap

This document describes the phased shipping plan for `project-evaluator`.

## Phase 1 — Claude Code plugin (shipped in this PR)

**Status**: complete.

What's included:
- 12-factor framework (factors, weights, rubrics, red flags, pre-screen) as JSON source-of-truth in `framework/`
- 7 Node scripts (parse-ideas, load-profile, cache-key, aggregate, format-report, export, calibration)
- 3 slash commands (`/evaluate-projects`, `/prescreen`, `/compare-projects`)
- 1 skill with 5 reference docs (factors, modes, red-flags, prescreen, scoring-examples)
- 4 agents (default idea-scorer + 3 persona scorers: bootstrapper, growth, skeptic)
- Example profile (auto-generated) + example ideas (42 proposals)
- Golden-set calibration regression tests
- Full docs (framework.md, installation.md, this roadmap)

**Limitations of phase 1**:
- Runs only inside Claude Code (not a standalone CLI)
- Plugin must be loaded via local path, not a published marketplace
- No auto-trigger on PR/commit events (manual invocation only)

## Phase 1.5 — GitHub Action wrapper

**Status**: planned, NOT in this PR.

What it adds:
- `action/action.yml` — GitHub Action manifest
- `action/entrypoint.mjs` — entry point that uses `@anthropic-ai/sdk` with a GitHub Secret API key
- `package.json` at the plugin root declaring the action as a Node action
- `action/README.md` — how to use the action in a workflow

How it reuses phase 1:
- The `framework/` JSON files are unchanged — used as-is by the action
- The `scripts/` directory is reused — `parse-ideas.mjs`, `aggregate.mjs`, `format-report.mjs`, `export.mjs`, `cache-key.mjs` all work the same
- The scoring prompts in `framework/prompts/` are reused
- Only the entry point is new: instead of dispatching Claude Code subagents, the action calls `@anthropic-ai/sdk` directly with structured tool-use

Example workflow file for downstream users:

```yaml
# .github/workflows/evaluate-project-ideas.yml
name: Evaluate project ideas on PR
on:
  pull_request:
    paths:
      - 'ideas/**.md'
jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: wiiyoukindly/project-evaluator-action@v1
        with:
          ideas-file: ideas/backlog.md
          profile-file: .config/profile.yaml
          mode: balanced
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Why this is a separate phase: GitHub Actions require a hosted `action.yml` and either a published action or a Docker image, plus they require users to bring their own API key (since Anthropic banned OAuth subscription tokens in third-party integrations in Feb 2026). Phase 1's plugin path delivers the core value to Claude Code users without this extra complexity.

## Phase 2 — Extract to dedicated repo

**Status**: planned, NOT in this PR.

What it adds:
- New repo `wiiyoukindly/project-evaluator` (or `project-evaluator` as an org)
- Published as a Claude Code plugin via the plugin marketplace once that launches
- Semantic versioning, CHANGELOG, issue tracker
- CI running calibration on every PR

Why separate: keeping the tool in the experimental repo during phase 1 is fine for iteration. Once the framework stabilizes, extracting it to its own repo makes it easier to:
- Accept external contributions
- Tag versions independently of the research repo
- Publish to plugin marketplace
- Track user feedback without mixing with unrelated issues

## Phase 3 — v2 features (deferred from the initial plan)

These were in the original plan's "nice-to-have" bucket and are deferred until phase 1 is stable and used in anger:

9. **Interactive scoring override** — `evaluate --interactive` pauses after each factor and lets the user accept/override
10. **Profile templates** — `init --template solo-bootstrapper | hobbyist | full-time-indie | pm-at-bigco | student` for quick start
11. **Trend analysis across runs** — if the user runs monthly, the tool reads previous reports and notes rank shifts over time
12. **Create-issues integration** — `--create-issues-repo user/repo` pushes the Top 5 to GitHub Issues or Linear as tickets
13. **Localhost web UI** — Vite + React dashboard wrapping the same core logic, for users who prefer a browser UI

Each v2 feature is meaningful but adds complexity. They will be shipped one at a time based on real user feedback, not speculatively bundled.

## Non-goals (explicitly out of scope)

- **We will not** host a SaaS version of this tool. It is deliberately BYO-key / BYO-subscription.
- **We will not** add multi-user collaboration features. The framework is designed for individual decision-making.
- **We will not** support languages other than Markdown and YAML for input files. Keep the surface area tight.
- **We will not** auto-fetch traction data from the web. Users supply the research in the idea descriptions; the tool scores what it sees. Automated web scraping changes the legal/reliability profile significantly and is out of scope.
- **We will not** add analytics/telemetry. Everything is local and private.
