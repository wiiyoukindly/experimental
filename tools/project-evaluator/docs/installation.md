# Installation & Setup

`project-evaluator` is a **Claude Code plugin**. It runs inside your existing Claude Code session and inherits its authentication, so you use your Pro/Max/Team subscription quota (no separate API key required).

## Prerequisites

- [Claude Code](https://claude.com/claude-code) installed on your machine
- Node.js 18+ (for the scripts the plugin calls via Bash)
- An active Claude Pro, Max, Team, or Enterprise subscription — OR an Anthropic API key configured in Claude Code

## Installation (phase 1 — local)

In phase 1, the plugin lives inside the `wiiyoukindly/experimental` repo at `tools/project-evaluator/`. To install it for local use:

### Option A — Clone and point Claude Code at it

```bash
# Clone the repo
git clone https://github.com/wiiyoukindly/experimental.git ~/code/experimental

# Tell Claude Code about the plugin
# (exact mechanism depends on your Claude Code version — see /plugins docs)
claude code --add-plugin ~/code/experimental/tools/project-evaluator
```

### Option B — Symlink into your plugins directory

```bash
ln -s ~/code/experimental/tools/project-evaluator ~/.claude/plugins/project-evaluator
```

### Option C — Run directly from the repo

If you already work inside the `experimental` repo in Claude Code, the plugin is discovered automatically by setting the plugin root in your Claude Code settings:

```json
{
  "plugins": {
    "path": "./tools"
  }
}
```

Restart Claude Code. The three slash commands (`/evaluate-projects`, `/prescreen`, `/compare-projects`) should now appear.

## Verify installation

In Claude Code, type:
```
/evaluate-projects --help
```

If you see the command's usage info, the plugin is loaded.

Then run the calibration regression:
```bash
cd tools/project-evaluator
node scripts/calibration.mjs
```

Expected output:
```
  PASS  #9001 Photoshop clone (web-based) → balanced 22% (expected 20-45)
  PASS  #9002 AniRec v2 (mood-aware anime recommender) → balanced 65% (expected 55-80)
  PASS  #9003 Generic SMS gateway wrapper → balanced 36% (expected 25-55)
  PASS  #9004 Chrome extension — bookmark dedupe → balanced 61% (expected 55-75)
  PASS  #9005 B2B healthcare record management system → balanced 36% (expected 20-50)

Calibration: 5 passed, 0 failed
```

## Authentication — how this plugin uses your tokens

The plugin runs **inside your Claude Code session**, so it inherits whatever auth mode Claude Code is using:

- **If Claude Code is logged in with your Pro/Max/Team subscription**: the plugin uses your subscription quota. No extra cost beyond your normal monthly subscription fee.
- **If Claude Code is configured with an `ANTHROPIC_API_KEY` environment variable**: the plugin uses pay-per-token billing against your Anthropic API key.

The plugin never stores, logs, or transmits your API key. It does not make its own API calls. Every token consumed goes through Claude Code's existing authenticated session.

**Important Anthropic policy note (Feb 2026)**: the `@anthropic-ai/claude-agent-sdk` package and third-party integrations (GitHub Actions, GitHub Apps) are **banned** from using subscription OAuth tokens — they must use pay-per-token API keys. Only Claude Code itself (and plugins running inside it) can use subscription tokens. This is why this project is built as a Claude Code plugin rather than a standalone CLI.

## First run — evaluate the 42 proposals

To reproduce the demo run from the phase 1 ship:

```bash
cd tools/project-evaluator

# The profile is already auto-generated from the experimental repo's own creative-base-menu.md
cat example/profile.yaml

# The ideas file is the 42 non-writing proposals
cat example/ideas.md | head -20
```

Then from inside Claude Code:

```
/evaluate-projects --ideas ./example/ideas.md --profile ./example/profile.yaml --mode balanced --out ./reports/first-run.md
```

The plugin will:
1. Parse `example/ideas.md` into 42 JSON idea objects
2. Load `example/profile.yaml`
3. For each idea, dispatch an `idea-scorer` subagent to score it against the 12-factor rubric
4. Cache each result in `.cache/scores/` for reproducibility on re-runs
5. Aggregate scores under all 4 modes
6. Emit a ranked markdown report to `reports/first-run.md`

Expected time: 1-3 minutes of wall clock (42 parallel subagents).

After it finishes, check your Claude Code token usage with:
```
/cost
```

## Cost transparency

Per-idea cost estimate (using `claude-haiku-4-5` default):
- Input: ~2000 tokens (profile + idea + framework rubrics)
- Output: ~500 tokens (structured JSON response)
- Cost per idea: ~$0.002 pay-per-token, or ~0.002 units of your Pro/Max quota

Full 42-idea run: ~$0.08 pay-per-token, or ~0.08 units of your monthly quota. With the cache enabled, re-runs are **free** (no API calls).

Escalate to `--model sonnet` for nuanced scoring runs. Escalate to `--model opus` for maximum scoring quality. The framework rubric is specific enough that Haiku usually suffices.

## Troubleshooting

### "Plugin not found" when typing `/evaluate-projects`

- Verify `.claude-plugin/plugin.json` exists at the plugin root
- Verify the plugin's parent directory is in Claude Code's plugin discovery path
- Restart Claude Code

### Calibration fails

- `node scripts/calibration.mjs` should always return 5 passes. If any fail, the framework weights have been edited in a way that breaks calibration. Revert changes or update `tests/golden.json` to the new expected bands.

### Scripts fail with "Cannot find module"

- Run `node --version` → must be 18+
- Run from the plugin root: `cd tools/project-evaluator`
- The scripts use relative paths; they assume the working directory is the plugin root.

### "No matching command" when invoking slash commands

- Check Claude Code version: `claude code --version`. Plugin support requires a recent version.
- Verify command markdown files have valid YAML frontmatter (name + description)
