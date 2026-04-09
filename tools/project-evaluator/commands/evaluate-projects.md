---
name: evaluate-projects
description: Run the full 12-factor scoring framework against a markdown file of project ideas. Produces a ranked report under all 4 modes (Balanced, Cashflow, Learning, Moat), identifies red flags, and suggests portfolio combos. Accepts --ideas, --profile, --mode, --out, --personas, --no-cache, --calibration flags.
---

# /evaluate-projects

Full 12-factor scoring run on a list of project ideas.

## Usage

```
/evaluate-projects --ideas <ideas.md> --profile <profile.yaml> [--mode balanced|cashflow|learning|moat] [--out <report.md>] [--personas] [--no-cache] [--calibration]
```

## Arguments

- `--ideas` (required): path to a markdown file with project ideas. Each idea should be an H3 group heading followed by `**N. Title**` bold entries with description, traction, effort, source.
- `--profile` (required): path to the user's `profile.yaml`. Can be auto-parsed first from a markdown file via `node scripts/load-profile.mjs --from-markdown <file>`.
- `--mode`: primary ranking mode for the headline TL;DR. Default: `balanced`.
- `--out`: output path for the markdown report. Default: `reports/<date>_evaluation.md`.
- `--personas`: score each idea 3 times using the bootstrapper/growth/skeptic persona agents. Reports variance as an ambiguity signal.
- `--no-cache`: force re-scoring; don't read from the `.cache/scores/` directory.
- `--calibration`: run the golden-set regression test first to verify the framework is working before scoring real ideas.

## Workflow (for Claude to execute)

When this command is invoked, you MUST follow the SKILL.md scoring workflow precisely:

1. **Parse the user's command arguments**. Default `--mode` to `balanced`, default `--out` to `reports/<today>_evaluation.md` where `<today>` is in `YYYY-MM-DD` format. Create the `reports/` directory if missing.

2. **If `--calibration` is set**, first run:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/calibration.mjs
   ```
   Fail the entire command if calibration fails. Report the errors to the user.

3. **Parse the ideas file**:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/parse-ideas.mjs <ideas.md> --pretty > /tmp/pe-ideas.json
   ```
   Read the result back and verify it contains at least 1 idea.

4. **Load and validate the profile**:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/load-profile.mjs <profile.yaml> > /tmp/pe-profile.json
   ```

5. **Read the framework files** into your context for the scoring rubric:
   - `${CLAUDE_PLUGIN_ROOT}/framework/factors.json`
   - `${CLAUDE_PLUGIN_ROOT}/framework/modes.json`
   - `${CLAUDE_PLUGIN_ROOT}/framework/red-flags.json`
   - `${CLAUDE_PLUGIN_ROOT}/framework/prompts/system.md` — the system prompt template for scoring subagents
   - `${CLAUDE_PLUGIN_ROOT}/framework/prompts/user.md` — the user message template

6. **For each idea in the parsed list**:
   a. Compute a cache key:
      ```
      node ${CLAUDE_PLUGIN_ROOT}/scripts/cache-key.mjs --profile /tmp/pe-profile.json --idea /tmp/pe-idea-<id>.json --framework-version 1.0.0 --model haiku
      ```
   b. If `--no-cache` is NOT set, check if `${CLAUDE_PLUGIN_ROOT}/.cache/scores/<key>.json` exists. If yes, load it and skip scoring.
   c. If cache miss, dispatch the `idea-scorer` subagent with the idea + profile + framework rubric as context. Expect a JSON block with `factor_scores`, `red_flags`, `justification`.
   d. If `--personas` is set, dispatch `scorer-bootstrapper`, `scorer-growth`, and `scorer-skeptic` in parallel for each idea. Average the factor_scores across personas and include variance data in the final report.
   e. Write the result to the cache at `${CLAUDE_PLUGIN_ROOT}/.cache/scores/<key>.json`.

7. **Collect all scored results** into a single JSON array and save to `/tmp/pe-scored.json`.

8. **Aggregate**:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/aggregate.mjs /tmp/pe-scored.json --pretty > /tmp/pe-aggregated.json
   ```

9. **Format the report**:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/format-report.mjs /tmp/pe-aggregated.json --mode <mode> --out <out.md>
   ```

10. **Summarize in the chat**:
    - Show the Top 5 from the primary mode with their scores and one-line justifications.
    - State how many red flags were found.
    - Link to the full report file.
    - Remind the user they can:
      - Re-run with `--mode cashflow|learning|moat` for different lenses
      - Re-run with `--no-cache` to force fresh scoring
      - Export to CSV or Notion with `node ${CLAUDE_PLUGIN_ROOT}/scripts/export.mjs /tmp/pe-aggregated.json --format csv --out report.csv`
      - Check actual token usage with `/cost`

## Error handling

- If `--ideas` file doesn't exist: abort with clear error message.
- If `--profile` file doesn't exist: offer to auto-parse from a markdown file via `load-profile.mjs --from-markdown`.
- If parse-ideas returns 0 ideas: the markdown format doesn't match the parser's regex. Print the expected format and abort.
- If the idea-scorer subagent returns invalid JSON: retry once; on second failure, log the raw response and skip that idea with a warning.
- If aggregate.mjs errors: likely a schema mismatch between the scored JSON and the aggregator. Show the error and the offending idea.
