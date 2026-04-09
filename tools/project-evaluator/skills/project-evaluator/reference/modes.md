# The 4 ranking modes

Source of truth: `framework/modes.json`. Weights within each mode sum to 100.

## Balanced (default)

General-purpose ranking. Use when there is no strong life-stage constraint.

| Factor | Weight |
|---|---:|
| Demand Evidence | 14 |
| Build Effort | 12 |
| Technical Fit | 11 |
| Distribution Clarity | 10 |
| Asset Leverage | 10 |
| Time-to-First-Revenue | 9 |
| TAM | 7 |
| Competition Density | 7 |
| Moat | 6 |
| Pricing Power | 5 |
| Differentiator | 5 |
| Operational Burden | 4 |

## Cashflow

Optimizes for the fastest first paid euro. Use when you need validation revenue as soon as possible.

| Factor | Weight |
|---|---:|
| Time-to-First-Revenue | 25 |
| Demand Evidence | 20 |
| Distribution Clarity | 15 |
| Build Effort | 15 |
| Technical Fit | 10 |
| Pricing Power | 10 |
| TAM | 5 |

(other factors: 0)

## Learning

Optimizes for skill acquisition and portfolio growth. **Technical Fit and Asset Leverage are inverted** — new stacks and unfamiliar territory score higher because the point is to grow.

| Factor | Weight | Notes |
|---|---:|---|
| Technical Fit | 20 | **inverted** (6 - score) |
| Differentiator | 15 | |
| Moat | 15 | |
| Build Effort | 15 | |
| Asset Leverage | 10 | **inverted** (6 - score) |
| Demand Evidence | 10 | |
| TAM | 10 | |
| Distribution Clarity | 5 | |

(other factors: 0)

## Moat

Optimizes for long-term defensibility. Use when you want to build a single defensible business rather than a portfolio of small bets.

| Factor | Weight |
|---|---:|
| Moat | 25 |
| Differentiator | 20 |
| Competition Density | 15 |
| Asset Leverage | 15 |
| Pricing Power | 10 |
| Demand Evidence | 10 |
| TAM | 5 |

(other factors: 0)

## How scoring works

For each mode, the idea's aggregate score is:

```
score = Σ(factor_score × mode_weight) / Σ(mode_weights_used)
       = (raw weighted average on a 1-5 scale)
```

Then rescaled to 0-100:

```
percentage = ((score - 1) / 4) × 100
```

So a raw average of 3.0 = 50%, a raw average of 4.0 = 75%, a raw average of 5.0 = 100%.
