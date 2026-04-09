---
name: compare-projects
description: Side-by-side comparison of 2 specific project ideas under the 12-factor framework. Produces a delta report showing which idea wins each factor and why. Use this when you are torn between 2 specific options and need a focused head-to-head.
---

# /compare-projects

2-idea head-to-head under the 12-factor framework.

## Usage

```
/compare-projects --ideas <ideas.md> --ids <id1>,<id2> --profile <profile.yaml> [--out <compare.md>]
```

## Arguments

- `--ideas` (required): path to the markdown ideas file (same format as `/evaluate-projects`).
- `--ids` (required): comma-separated integers — the two idea IDs to compare, e.g. `3,24`.
- `--profile` (required): the user's profile.yaml.
- `--out`: output path. Default: `reports/<date>_compare_<id1>_vs_<id2>.md`.

## Workflow

1. **Parse the ideas file**:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/parse-ideas.mjs <ideas.md> --pretty > /tmp/pe-ideas.json
   ```
   Extract the two ideas with matching IDs from the result.

2. **Load profile**:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/load-profile.mjs <profile.yaml> > /tmp/pe-profile.json
   ```

3. **Read framework files** (same as `/evaluate-projects` workflow).

4. **Dispatch two idea-scorer subagents in parallel**, one per idea, with the same profile and framework context. Collect the two JSON results.

5. **Compute deltas**:
   - For each of the 12 factors: `delta = idea_A.factor_score - idea_B.factor_score`. Negative = idea B wins, positive = idea A wins.
   - Compute aggregate scores under all 4 modes.
   - Mode-by-mode winner: which idea scored higher.
   - Collect red flags per idea.

6. **Write a markdown report** with this structure:

   ```markdown
   # Compare #<A> vs #<B> — <date>

   ## Candidates

   ### #<A> <Title A>
   <description>
   - Balanced: <A%>
   - Cashflow: <A%>
   - Learning: <A%>
   - Moat: <A%>

   ### #<B> <Title B>
   <description>
   - Balanced: <B%>
   - Cashflow: <B%>
   - Learning: <B%>
   - Moat: <B%>

   ## Mode-by-mode winner

   | Mode | Winner | Delta |
   |---|---|---:|
   | Balanced | #<X> | <delta>% |
   | Cashflow | #<X> | <delta>% |
   | Learning | #<X> | <delta>% |
   | Moat | #<X> | <delta>% |

   ## Factor-by-factor delta

   | Factor | #<A> | #<B> | Δ | Winner | Why |
   |---|:-:|:-:|:-:|:-:|---|
   | Demand Evidence | 4 | 3 | +1 | A | A has named competitor with MRR, B has only category claim |
   | ... |

   ## Red flags
   - #<A>: <flags or none>
   - #<B>: <flags or none>

   ## Recommendation

   <1-2 paragraph conclusion synthesizing which idea to build first and why, citing specific factor deltas>
   ```

7. **Summarize in chat**: 3-sentence summary plus link to the full report.

## When to use this vs. full `/evaluate-projects`

Use `/compare-projects` when:
- You already have 2 specific ideas in mind and need a deep head-to-head
- You want the factor-by-factor deltas, not just an aggregate rank
- You are trying to decide "A or B" not "which of these 42"

Use `/evaluate-projects` instead when:
- You have more than 2 candidates
- You don't yet know which 2 to compare
- You want portfolio combos and red flag reports across the full set
