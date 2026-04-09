# project-evaluator

**AI-native project idea evaluator.** Ranks a list of project ideas against a rigorous 12-factor framework, producing recommendations under 4 different lenses (Balanced, Cashflow, Learning, Moat). Built as a Claude Code plugin so it uses your existing Claude subscription tokens — no separate API key, no pay-per-token billing, unless you want it.

## What it does

You have 42 project ideas in a markdown file. You want to know which to build next. You run:

```
/evaluate-projects --ideas my-ideas.md --profile me.yaml --mode balanced
```

In 1-3 minutes of wall clock, the plugin:

1. Parses your ideas file into structured objects
2. Loads your profile (stack, assets, time budget, goals)
3. Dispatches one Claude subagent per idea to score it against 12 weighted factors
4. Applies a red flag overlay (B2B sales, regulatory, category king, mobile mismatch, no distribution)
5. Aggregates scores under all 4 ranking modes
6. Emits a ranked markdown report with:
   - Top 5 picks in your chosen mode
   - Full rankings in all 4 modes
   - Red flags report
   - Portfolio combos (quick-validate, leverage-existing, creator-stack, balanced-diverse)
   - Per-idea detailed scoring appendix
   - Decision tree for picking which mode fits your life stage

## Why it exists

Prioritization frameworks like RICE, ICE, and LIC are designed for product teams with data analysts and engineers. Solo builders have neither. Monday.com, Miro, and Canny offer RICE templates but they are manual spreadsheets — you fill in the numbers yourself. There is no AI-native alternative in the 2026 market.

This plugin fills that gap. It contextualizes each score using your profile (same idea scores differently for a React/TS builder vs a Python/data-science builder), uses explicit 1-5 rubrics for every factor (reproducible, not gut-feel), and supports 4 ranking modes that reflect different life stages.

## The 12 factors

Balanced-mode weights shown. All sum to 100.

| # | Factor | Weight | Why |
|---|---|---:|---|
| 1 | Demand Evidence | 14 | Named competitor with public MRR > generic category claims |
| 2 | Build Effort | 12 | Solo part-time = every hour scarce |
| 3 | Technical Fit | 11 | Velocity = stack familiarity |
| 4 | Distribution Clarity | 10 | No channel = no product |
| 5 | Asset Leverage | 10 | Reusing existing code cuts cold-start |
| 6 | Time-to-First-Revenue | 9 | Fast validation |
| 7 | TAM | 7 | Size matters, not dominantly |
| 8 | Competition Density | 7 | Sweet spot 7-12 |
| 9 | Moat | 6 | Defensibility matters more for single bet than portfolio |
| 10 | Pricing Power | 5 | Commodity = no margin |
| 11 | Differentiator | 5 | Unique wedge survives |
| 12 | Operational Burden | 4 | 24/7 support kills solo builders |

Full rubrics (1-5 per factor) in [`docs/framework.md`](docs/framework.md) or `skills/project-evaluator/reference/factors.md`.

## The 4 ranking modes

- **Balanced** (default) — general-purpose, no strong life-stage constraint
- **Cashflow** — fastest first paid euro; best when you need validation revenue now
- **Learning** — skill acquisition; inverts Technical Fit and Asset Leverage to push into unfamiliar territory
- **Moat** — long-term defensibility; best for a single defensible business bet

Every report includes all 4 modes — the `--mode` flag just determines which appears in the TL;DR.

## Installation

See [`docs/installation.md`](docs/installation.md) for step-by-step instructions.

Short version: install Claude Code → clone this repo → point Claude Code at `tools/project-evaluator` as a plugin → verify with `/evaluate-projects --help`.

## Usage

Three slash commands:

| Command | Purpose |
|---|---|
| `/evaluate-projects --ideas FILE --profile FILE [--mode M] [--out FILE]` | Full 12-factor scoring |
| `/prescreen --ideas FILE` | Fast 5-question yes/no triage (cheaper, faster) |
| `/compare-projects --ideas FILE --ids A,B --profile FILE` | Side-by-side 2-idea comparison |

Optional flags on `/evaluate-projects`:
- `--mode balanced|cashflow|learning|moat` — primary mode for the TL;DR (default: balanced)
- `--personas` — score each idea 3 times with bootstrapper/growth/skeptic personas, reports variance
- `--no-cache` — force re-scoring (bypass the content-hash cache)
- `--calibration` — run the golden-set regression tests first

Export the aggregated data to other formats with the standalone export script:
```bash
node scripts/export.mjs aggregated.json --format csv --out report.csv
node scripts/export.mjs aggregated.json --format notion --out report-notion.md
```

## Authentication

This plugin uses your existing Claude Code session. If you're logged into Claude Code with a Pro/Max/Team subscription, the plugin uses your subscription quota — no extra pay-per-token billing, no separate API key configuration.

If you've configured Claude Code with an `ANTHROPIC_API_KEY`, the plugin uses pay-per-token billing instead. Either way, the plugin never stores or transmits credentials.

Why a plugin and not a standalone CLI? In February 2026, Anthropic banned subscription OAuth tokens in third-party Agent SDK apps, GitHub Actions, and GitHub Apps. Only Claude Code itself (and plugins running inside it) can use subscription auth. Building as a plugin is the only way to deliver subscription-based billing to the user.

A GitHub Action wrapper for users who prefer pay-per-token + CI/CD automation is planned in phase 1.5 and will reuse the same `framework/` and `scripts/` shared core.

## Directory layout

```
project-evaluator/
├── .claude-plugin/plugin.json          # plugin manifest
├── commands/                           # 3 slash commands
│   ├── evaluate-projects.md
│   ├── prescreen.md
│   └── compare-projects.md
├── skills/project-evaluator/           # skill with reference docs
│   ├── SKILL.md
│   └── reference/
│       ├── factors.md
│       ├── modes.md
│       ├── red-flags.md
│       ├── prescreen.md
│       └── scoring-examples.md
├── agents/                             # 4 scoring subagents
│   ├── idea-scorer.md                  # default
│   ├── scorer-bootstrapper.md          # persona
│   ├── scorer-growth.md                # persona
│   └── scorer-skeptic.md               # persona
├── framework/                          # source of truth (reused by phase 1.5)
│   ├── factors.json
│   ├── modes.json
│   ├── red-flags.json
│   ├── prescreen.json
│   └── prompts/
│       ├── system.md
│       └── user.md
├── scripts/                            # Node helpers (reused by phase 1.5)
│   ├── parse-ideas.mjs
│   ├── load-profile.mjs
│   ├── cache-key.mjs
│   ├── aggregate.mjs
│   ├── format-report.mjs
│   ├── export.mjs
│   └── calibration.mjs
├── example/
│   ├── profile.yaml                    # the user's auto-parsed profile
│   └── ideas.md                        # 42 proposals from creative-base-menu.md
├── tests/
│   └── golden.json                     # 5 calibration ideas with expected bands
├── docs/
│   ├── framework.md                    # long-form framework explanation
│   ├── installation.md                 # setup + auth
│   └── roadmap.md                      # phased shipping plan
└── README.md
```

## Docs

- [`docs/framework.md`](docs/framework.md) — the full 12-factor framework explanation
- [`docs/installation.md`](docs/installation.md) — install, setup, auth, troubleshooting
- [`docs/roadmap.md`](docs/roadmap.md) — phased shipping plan (phase 1 = plugin, 1.5 = GitHub Action, 2 = extract to own repo)

## License

MIT.

## Why I built this

The context behind this project is in `plans/2026-04-09_creative-base-menu.md` in the same repo. Short version: I had 42 project ideas in a markdown file and could not decide which to build next. The framework I designed to answer that question became the framework this plugin now applies. The plugin is itself one of the 42 ideas — the meta pick that answers the question by automating the answer to the question.
