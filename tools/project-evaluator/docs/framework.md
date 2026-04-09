# The 12-Factor Project Evaluation Framework

This document is the long-form explanation of the framework used by the `project-evaluator` Claude Code plugin. It is the companion to the machine-readable source of truth at `framework/factors.json`, `framework/modes.json`, `framework/red-flags.json`, and `framework/prescreen.json`.

## What problem it solves

Solo and part-time builders face a recurring decision: **which project should I build next?** The market is full of plausible ideas. Prioritization frameworks like RICE (Reach × Impact × Confidence / Effort), ICE (Impact × Confidence × Ease), and LIC (Lift × Impact × Conviction) exist, but they are designed for product teams with data analysts and engineers. Adapted for solo builders, they either oversimplify (ICE becomes gut-feel) or require data a solo builder does not have (RICE's Reach number).

The 12-factor framework is purpose-built for solo part-time builders with an existing portfolio of shipped work. It:

1. Uses **explicit 1-5 rubrics per factor**, so scores are reproducible across sessions and across users
2. Weights factors **differently by life stage** via 4 ranking modes (Balanced, Cashflow, Learning, Moat)
3. Attaches a **red flag overlay** for qualitative risks the numeric score cannot capture (regulatory exposure, B2B enterprise sales, category-king competition)
4. Includes a **5-question pre-screen gate** for fast triage of large idea backlogs
5. Contextualizes scoring via a **user profile** — the same idea scores differently for a React/TS builder vs a Python/data-science builder

## The 12 factors

Source of truth: `framework/factors.json`. Human-readable version: `skills/project-evaluator/reference/factors.md`.

Ordered by weight in the default (Balanced) mode:

| # | Factor | Weight | Why this weight |
|---|---|---:|---|
| 1 | Demand Evidence | 14 | Highest — don't build what nobody buys. Named competitor + public MRR is the single strongest predictor of shippable ideas |
| 2 | Build Effort | 12 | Solo part-time = every hour is scarce. Inverted: less effort = higher score |
| 3 | Technical Fit | 11 | Velocity = stack familiarity. Builders ship 3-5x faster on their known stack |
| 4 | Distribution Clarity | 10 | No distribution = no product. Platform-native stores beat SEO-only |
| 5 | Asset Leverage | 10 | Reusing existing code/data/audience cuts cold-start time dramatically |
| 6 | Time-to-First-Revenue | 9 | Fast validation beats theoretical upside for solo builders |
| 7 | TAM | 7 | Size matters but not dominantly — solo can live in $100M niches |
| 8 | Competition Density | 7 | Sweet spot 7-12 competitors: validated demand with room to differentiate |
| 9 | Moat | 6 | Less critical for portfolio strategy than for a single defensible bet |
| 10 | Pricing Power | 5 | Commodity pricing leaves no margin |
| 11 | Differentiator | 5 | Me-too dies, unique wedge survives |
| 12 | Operational Burden | 4 | 24/7 support kills solo builders. Inverted: less burden = higher score |

Weights sum to 100. Every factor is scored 1-5 against a written rubric. The overall score under Balanced mode is the weighted average, rescaled to 0-100 percent.

## The 4 ranking modes

Source of truth: `framework/modes.json`.

The same 12 factors are re-weighted under 4 different ranking modes to reflect different life stages. Running the same ideas through all 4 modes reveals the **shape** of each idea's strength: a proposal that ranks #1 under Cashflow but #30 under Moat is a fast-ship low-defensibility play; a proposal that ranks #30 under Cashflow but #2 under Moat is a long-horizon defensible business.

### Balanced (default)

General-purpose. The weight vector is the one shown in the table above. Use this when there is no strong life-stage constraint.

### Cashflow

Optimizes for the **fastest first paid euro**. Weights:
- Time-to-First-Revenue: 25
- Demand Evidence: 20
- Distribution Clarity: 15
- Build Effort: 15
- Technical Fit: 10
- Pricing Power: 10
- TAM: 5

Use when you need validation revenue as soon as possible, such as when proving that side-project income is possible or when time-to-runway matters.

### Learning

Optimizes for **skill acquisition and portfolio growth**. Uniquely, this mode **inverts Technical Fit and Asset Leverage** — projects that push into unfamiliar stacks and don't reuse existing assets score higher, because the whole point is to grow.

- Technical Fit (inverted): 20
- Differentiator: 15
- Moat: 15
- Build Effort: 15
- Asset Leverage (inverted): 10
- Demand Evidence: 10
- TAM: 10
- Distribution Clarity: 5

Use when you are building skills for a career pivot or want to deliberately stretch.

### Moat

Optimizes for **long-term defensibility**. Weights:
- Moat: 25
- Differentiator: 20
- Competition Density: 15
- Asset Leverage: 15
- Pricing Power: 10
- Demand Evidence: 10
- TAM: 5

Use when you want to build a single defensible business rather than a portfolio of small bets.

## Red flags overlay

Source of truth: `framework/red-flags.json`. Qualitative risks the numeric score cannot capture:

1. **B2B enterprise sales** — solo builders cannot sustain weeks-long sales cycles
2. **Regulatory compliance** — healthcare, finance, legal have personal liability exposure
3. **Category king exists** — Calm, Descript, Notion, Superhuman own their spaces in 2026
4. **Mobile-native mismatch** — web-first stack can't absorb Swift/Kotlin complexity
5. **No distribution channel** — "build it and they will come" is the #1 killer of indie projects

A single flag attaches a warning but does not demote. **2+ flags trigger automatic demotion** regardless of numeric score.

## 5-question pre-screen

Source of truth: `framework/prescreen.json`. A fast yes/no triage gate applied before full scoring:

1. Is there a named competitor with public revenue evidence?
2. Is the TAM larger than $100M globally?
3. Does this extend an existing app the user has already shipped?
4. Can v0.1 ship in under 150 hours?
5. Is there a platform-native distribution channel?

- **4-5 yes** → run full 12-factor scoring
- **2-3 yes** → score with caution
- **0-1 yes** → reject, don't waste scoring time

The pre-screen is ~10x cheaper than full scoring (one conversation turn vs. one subagent per idea) and is useful on its own for triaging 20+ idea backlogs.

## Calibration

The framework is regression-tested via `tests/golden.json` — 5 known-answer ideas with expected score bands:

| ID | Title | Expected balanced band | Why |
|---|---|---|---|
| 9001 | Photoshop clone | 20-45% | Category king + no distribution |
| 9002 | AniRec v2 | 55-80% | High asset leverage + tech fit |
| 9003 | Generic SMS gateway | 25-55% | Commodity wrapper |
| 9004 | Chrome bookmark dedupe | 55-75% | Fast ship, small TAM |
| 9005 | B2B healthcare EHR | 20-50% | B2B enterprise + regulatory |

Running `node scripts/calibration.mjs` verifies all 5 fall within their expected bands. If any score drifts outside, something in the framework weights or aggregation logic has regressed.

## Why this framework is not RICE / ICE / LIC

- **RICE requires reach numbers** that solo builders don't have (no user research team, no analytics on a product that doesn't exist yet)
- **ICE is too coarse** — only 3 factors and no explicit rubrics, so scores are gut-feel
- **LIC is opinionated for VC-backed founders** — the "Conviction" factor rewards confidence which biases toward the scorer's mood

The 12-factor framework borrows from all three (weighted scoring from RICE, ease-of-scoring from ICE, founder-context from LIC) but adds:
- Explicit 1-5 rubrics per factor (reproducible)
- User profile contextualization (same idea, different scores per user)
- Red flag qualitative overlay (non-numeric risks)
- Pre-screen gate (fast triage)
- 4 ranking modes (life-stage awareness)

## Sources and inspiration

- [RICE scoring model — Intercom](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/)
- [Product prioritization frameworks — monday.com](https://monday.com/blog/rnd/product-prioritization-frameworks/)
- [Paul Graham — Schlep Blindness](http://paulgraham.com/schlep.html)
- [Pieter Levels — Make Book](https://readmake.com/) (scratch own itch + ship fast + charge day one)
- [Marc Lou indie heuristics](https://marclou.com/) (boring upgrade to proven tool)
- [Why temperature=0 isn't deterministic](https://mbrenndoerfer.com/writing/why-llms-are-not-deterministic) — motivation for content-hashed caching instead of relying on model determinism
