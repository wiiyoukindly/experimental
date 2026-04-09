# The 12 factors — full rubrics

Source of truth: `framework/factors.json`. This file is the human-readable companion — keep them in sync if you edit either.

Every factor is scored **1-5** (integer only, no decimals). The overall score for an idea is the weighted sum of factor scores divided by the mode's total weight, then rescaled to a 0-100 percentage.

## 1. Demand Evidence (weight: 14, direction: up)

How strong is the evidence that people actually pay for this? Named competitors with public MRR figures are the gold standard.

| Score | Criterion |
|---:|---|
| 1 | Pure speculation. No named competitors, no traction data. |
| 2 | Adjacent products exist but no direct proof of paid users. |
| 3 | Direct competitors exist with indirect revenue signals (app store presence, funding). |
| 4 | Direct competitors with known public revenue figures (blog posts, press, public MRR). |
| 5 | Concrete named competitor with >$1K MRR publicly cited in the research sources, plus a clear "X made Y in Z" data point. |

## 2. Build Effort (weight: 12, direction: down — inverted)

Less effort = higher score. Solo part-time builders cannot absorb 400h projects.

| Score | Hours to v0.1 |
|---:|---|
| 1 | More than 400h |
| 2 | 250-400h |
| 3 | 150-250h |
| 4 | 80-150h |
| 5 | Less than 80h |

## 3. Technical Fit (weight: 11, direction: up)

How closely does the required stack match the user's existing comfort stack? Read `profile.yaml:stack` to contextualize.

| Score | Criterion |
|---:|---|
| 1 | Completely new stack (different language or runtime) |
| 2 | New framework in a familiar language (e.g. React Native when user only knows web React) |
| 3 | Mostly familiar with 1-2 new dependencies |
| 4 | Pure match with the user's existing stack |
| 5 | Extends an app the user has already shipped — direct code reuse possible |

## 4. Distribution Clarity (weight: 10, direction: up)

Platform-native stores beat SEO. No channel = the #1 killer of indie projects.

| Score | Criterion |
|---:|---|
| 1 | Pure "build it and they will come" — no channel identified |
| 2 | SEO + content marketing only, long-tail play |
| 3 | One clear channel (Reddit, X, Product Hunt) but competitive |
| 4 | Platform-native store provides built-in discovery |
| 5 | Platform-native store plus an existing audience the user already reaches |

## 5. Asset Leverage (weight: 10, direction: up)

How much of the user's existing assets (Replit apps, code, audience) does this reuse? Contextualize using `profile.yaml:assets`.

| Score | Criterion |
|---:|---|
| 1 | Zero reuse — starts from scratch |
| 2 | Reuses general skills only |
| 3 | Reuses specific patterns / snippets from existing apps |
| 4 | Extends a specific existing Replit app |
| 5 | Direct v2 of an existing Replit app |

## 6. Time-to-First-Revenue (weight: 9, direction: up)

Fast validation beats theoretical upside for solo builders.

| Score | Time to first paid user |
|---:|---|
| 1 | More than 4 months |
| 2 | 2-4 months |
| 3 | 1-2 months |
| 4 | 2-4 weeks |
| 5 | Less than 2 weeks |

## 7. TAM — Total Addressable Market (weight: 7, direction: up)

Solo builders can live in $100M niches; larger TAM is a bonus, not a requirement.

| Score | Global market size |
|---:|---|
| 1 | Less than $10M |
| 2 | $10M — $100M |
| 3 | $100M — $500M |
| 4 | $500M — $2B |
| 5 | More than $2B |

## 8. Competition Density (weight: 7, direction: CURVE)

**Middle is best.** 0 competitors = no market. 30+ = commoditized. Sweet spot is 7-12.

| Score | Criterion |
|---:|---|
| 1 | Zero competitors (no validated market) OR more than 30 (commoditized) |
| 2 | 1-2 competitors, OR 20-30 competitors |
| 3 | 3 competitors, OR 15-20 competitors |
| 4 | 4-6 competitors, OR 12-15 competitors |
| 5 | 7-12 competitors — the sweet spot |

## 9. Moat (weight: 6, direction: up)

How hard is this to copy after launch? Less critical for portfolio strategy than for a single defensible bet.

| Score | Criterion |
|---:|---|
| 1 | Pure wrapper anyone can copy in a weekend |
| 2 | Wrapper plus some custom logic |
| 3 | Custom data or workflow integration that would take weeks to replicate |
| 4 | Network effects OR data accumulation OR deep vertical integration |
| 5 | Multiple of the above plus high switching costs |

## 10. Pricing Power (weight: 5, direction: up)

| Score | Monthly price |
|---:|---|
| 1 | Free only, ad-supported |
| 2 | €3-5 |
| 3 | €7-15 |
| 4 | €20-50 |
| 5 | €50+ (vertical B2B) |

## 11. Differentiator Strength (weight: 5, direction: up)

| Score | Criterion |
|---:|---|
| 1 | Me-too |
| 2 | One small improvement |
| 3 | Clear unique angle |
| 4 | Unique angle + hard to copy |
| 5 | Category-defining wedge |

## 12. Operational Burden (weight: 4, direction: down — inverted)

Less burden = higher score.

| Score | Criterion |
|---:|---|
| 1 | 24/7 support, compliance-heavy, enterprise sales |
| 2 | High-touch support required |
| 3 | Standard SaaS |
| 4 | Light SaaS, mostly automated |
| 5 | Fire-and-forget one-time sale |
