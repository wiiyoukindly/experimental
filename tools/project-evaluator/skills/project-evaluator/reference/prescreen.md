# Pre-screen gate — 5 yes/no questions

Source of truth: `framework/prescreen.json`. This is a fast, cheap filter for triaging a large idea backlog before committing to the full 12-factor scoring run.

## The 5 questions

### 1. Is there a named competitor with public revenue evidence?

**Why it matters**: no named competitor = pure speculation. This is the single strongest predictor of shippable ideas. If you can't point at a specific product by name with a specific revenue figure, you don't know if the market exists.

**Pass criteria**: the idea description or research sources cite a specific product by name with a specific revenue figure (MRR, ARR, total sales, user count with pricing).

### 2. Is the total addressable market larger than $100M globally?

**Why it matters**: solo builders can live in niche markets, but a $100M floor filters out markets that are too small to sustain even a single-person business.

**Pass criteria**: the target audience (freelancers, designers, gamers, students, etc.) has more than ~1M global potential users.

### 3. Does this extend an existing app the user has already shipped?

**Why it matters**: asset leverage cuts cold-start time. A v2 of something real ships 3-5x faster than something new because you skip the domain research, initial UX, first-draft copy, and onboarding.

**Pass criteria**: the idea explicitly references an existing Replit app (AniRec, weight-game, ThesPlan, pacing-analyzer, etc.) OR reuses a large portion of existing code/data.

### 4. Can v0.1 ship in under 150 hours of effort?

**Why it matters**: part-time operators have ~20h/week. 150h = ~8 weeks to first shippable version. Longer risks stall and context-switching losses.

**Pass criteria**: the research data or honest estimate for v0.1 effort is <150h. **v0.1 = shippable with paying users**, not "finished".

### 5. Is there a platform-native distribution channel?

**Why it matters**: Chrome Web Store, Figma Community, Raycast Store, Apple App Store, etc. provide built-in discovery that beats SEO alone. Without a platform store, you have to build an audience first.

**Pass criteria**: the product could be listed in at least one platform-native store where users already search for tools of its type.

## Verdict table

| Yes count | Verdict | Label |
|---:|---|---|
| 5 | GO | Run full 12-factor scoring. High-confidence candidate. |
| 4 | GO | Run full 12-factor scoring. |
| 3 | CAUTION | Score but expect mid-range results. Verify the missing criteria first. |
| 2 | CAUTION | Score only if the two missing criteria have creative workarounds. |
| 1 | REJECT | Only 1 of 5 criteria met. Don't waste scoring time. |
| 0 | REJECT | No criteria met. This is not a real opportunity. |

## How to use this in practice

When the user has a backlog of 20+ ideas and wants a fast triage:
1. Run the pre-screen against every idea (fast — Claude can do 20 ideas in one conversation turn)
2. Show the user the pass/caution/reject split
3. Only run the full 12-factor scoring on the GO and CAUTION buckets
4. Save API tokens and wall clock time

When the user is evaluating 1-5 ideas, skip the pre-screen and go straight to full scoring — the pre-screen overhead isn't worth it for small batches.
