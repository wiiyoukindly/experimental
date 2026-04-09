# Pacing Analyzer — Dogfood Test Plan for Seven Echoes

> Companion to `LAUNCH_EXECUTION_PLAN.md` Day 4-7 and to `projects/pacing-analyzer/SPEC.md`.

This document defines how to validate whether the Pacing Analyzer is actually useful, using Seven Echoes as the test corpus. It exists to force honesty: if the tool doesn't add signal beyond what you already know as the author, you retire it and reallocate the effort.

## Why dogfood

You are the first user and the only user whose judgement matters for v0.1. You already know Seven Echoes chapter by chapter. If Claude's analysis confirms everything you already think, the tool is a mirror — useless. If Claude's analysis surfaces something you didn't notice, the tool has signal.

**Success is not "the heatmap is pretty". Success is "the heatmap told me something I didn't know."**

## Corpus

All 15 chapters of Seven Echoes, EN version. GR version skipped for v0.1 dogfooding — you can add it later once Claude's EN analysis is validated.

## Protocol

For each of the 15 chapters:

1. **Before running the tool**, write down your own pre-read in `RETRO.md` under that chapter:
   - Your gut tempo rating for the chapter overall (1-5)
   - Which 2-3 scenes you think are slow
   - Which 2-3 scenes you think are fast
   - One sentence: "The pacing problem I already know this chapter has is ___"
   - One sentence: "The pacing strength I already know this chapter has is ___"

2. **Run the tool** on the full chapter text.

3. **After running the tool**, write down:
   - Claude's segment count
   - Claude's tempo distribution (how many 1s, 2s, 3s, 4s, 5s)
   - **Top 1-3 agreements**: where did Claude's tempo match your gut?
   - **Top 1-3 disagreements**: where did Claude rate a scene differently than you?
   - **The surprise**: Did Claude point out anything that made you think "huh, I hadn't seen that"?
   - **The noise**: Did Claude say something wrong, generic, or boilerplate?

4. **Rate the run on 3 axes** (1-5 each):
   - **Accuracy** — did tempo ratings match your intuition?
   - **Insight** — did anything new come up?
   - **Actionability** — did the suggestions lead to a real edit you'd make?

## Aggregate analysis (after all 15 chapters)

Answer these questions in `RETRO.md`:

1. **Is the tool calibrated?** Compute: what % of Claude's tempo ratings are within ±1 of your gut rating, per chapter? Target: ≥70%.
2. **Is the tool additive?** Count: across all 15 chapters, how many "huh, surprise" moments did you have? Target: ≥5 (one every 3 chapters).
3. **Is the tool prescriptive?** Count: across all 15 chapters, how many suggestions did you actually act on (or would act on if time allowed)? Target: ≥3.
4. **Is the tool redundant?** Count: how many chapters where the output felt "100% predictable, no surprise"? Target: ≤5.

## Decision rules

Based on the aggregates, decide:

- **GO (continue to v0.2):** accuracy ≥70% AND insight count ≥5 AND actionable count ≥3
- **PIVOT (keep the idea, change the implementation):** accuracy <70% but insight or actionable ≥5 → the approach is right but the prompt or model needs work
- **RETIRE (shelve the tool):** accuracy <70% AND insight <3 AND redundant ≥10 → the tool doesn't add signal, move effort elsewhere

## Known biases to watch for

- **Confirmation bias:** you might rate Claude higher on chapters where you agree with it. Pre-read BEFORE running the tool — the pre-read is the control.
- **Novelty bias:** the first 2-3 chapters will feel exciting because the tool is new. By chapter 8-10 you'll see clearly whether the signal persists. Do not decide until you've run at least 8 chapters.
- **Author blind spots:** you may reject valid criticisms because you're too close to the material. If Claude flags the same issue on 3+ chapters and you initially dismissed it, take it seriously.

## Time budget

- Pre-reads: 15 × 5 min = 75 min
- Tool runs: 15 × ~2 min = 30 min (most of which is waiting for Claude)
- Post-reads: 15 × 10 min = 150 min
- Aggregate analysis: 60 min
- **Total: ~5 hours**

Spread across Days 4, 5, and 7 of the Launch Execution Plan. Do not compress into one day — fatigue wrecks the signal.

## Output

A single file: `projects/pacing-analyzer/RETRO.md` with:

- Per-chapter pre-read + post-read + ratings
- Aggregate scores on the 4 questions above
- GO / PIVOT / RETIRE decision with one-paragraph rationale
- If GO: a prioritized list of 2-3 v0.2 improvements
- If PIVOT: what changes (prompt / model / architecture)
- If RETIRE: where does the effort go instead? (back to Path F book-only? to Path E extensions?)
