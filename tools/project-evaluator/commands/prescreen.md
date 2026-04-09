---
name: prescreen
description: Fast 5-question yes/no triage of a project ideas backlog. Cheaper and faster than full scoring. Produces a pass/caution/reject split so you can focus full scoring on the GO bucket. Use this when you have 20+ ideas and limited token budget.
---

# /prescreen

Fast pre-scoring triage gate.

## Usage

```
/prescreen --ideas <ideas.md> [--out <prescreen-report.md>]
```

## Arguments

- `--ideas` (required): path to the markdown ideas file.
- `--out`: output path. Default: `reports/<date>_prescreen.md`.

## Workflow

1. **Parse the ideas**:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/parse-ideas.mjs <ideas.md> --pretty > /tmp/pe-ideas.json
   ```

2. **Read the pre-screen reference**:
   - `${CLAUDE_PLUGIN_ROOT}/framework/prescreen.json` — the 5 questions and their pass criteria
   - `${CLAUDE_PLUGIN_ROOT}/skills/project-evaluator/reference/prescreen.md` — the human-readable version with reasoning

3. **For each idea**, ask yourself the 5 yes/no questions directly (no subagent needed — pre-screen is cheap and you can batch them in one conversation turn):

   1. Is there a named competitor with public revenue evidence?
   2. Is the TAM larger than $100M globally?
   3. Does this extend an existing Replit app of the user?
   4. Can v0.1 ship in under 150 hours?
   5. Is there a platform-native distribution channel?

   Record each as true/false with a 1-sentence justification citing the data point you used.

4. **Compute the verdict** per idea:
   - 4-5 yes → GO (run full scoring)
   - 2-3 yes → CAUTION (score but with caveats)
   - 0-1 yes → REJECT (don't waste scoring time)

5. **Write a markdown report** with this structure:

   ```markdown
   # Pre-screen report — <date>

   <total> ideas triaged via 5-question gate.

   ## Summary
   - GO: <count> ideas
   - CAUTION: <count> ideas
   - REJECT: <count> ideas

   ## GO bucket (run full scoring)

   | # | Title | Yes count | Missing criteria |
   |---|---|---|---|
   | ... |

   ## CAUTION bucket

   | # | Title | Yes count | Missing criteria | Workaround hint |
   |---|---|---|---|---|
   | ... |

   ## REJECT bucket

   | # | Title | Yes count | Why reject |
   |---|---|---|---|
   | ... |

   ## Per-idea breakdown

   ### #N Title
   - Q1 Named competitor: YES/NO — <citation>
   - Q2 TAM >$100M: YES/NO — <citation>
   - Q3 Extends existing app: YES/NO — <citation>
   - Q4 <150h build: YES/NO — <citation>
   - Q5 Platform-native distribution: YES/NO — <citation>
   - **Verdict:** GO | CAUTION | REJECT
   ```

6. **Summarize in chat**: show the split counts + top 5 GO picks + link to the full report.

## Why pre-screen is separate from full scoring

- Pre-screen uses ~200 tokens per idea (one conversation turn for all of them together). Full scoring uses ~2500 tokens per idea via subagent.
- A 42-idea pre-screen costs under $0.01 of model usage. A 42-idea full scoring costs $0.50+.
- Pre-screen is 10x faster (seconds vs. minutes).
- Pre-screen results are useful on their own — the user can decide based on the split without needing full scores.
