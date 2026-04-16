# Writing custom profiles

Profiles are JSON files that enumerate which plugins should be enabled for a given context. `plugin-router` ships 9 built-in profiles and lets you layer custom ones on top.

## Profile schema

```json
{
  "description": "One-line explanation of when to use this profile.",
  "enable": [
    "plugin-name@marketplace-name",
    "another-plugin@another-marketplace"
  ],
  "note": "Optional free-form guidance (shown by /router list and /router status)."
}
```

**Fields**:

| Field | Required | Purpose |
|------|---------|---------|
| `description` | Yes | Shown in `/router list`. Keep under 80 chars. |
| `enable` | Yes | Array of `<plugin-name>@<marketplace-name>` IDs. Order-independent. Duplicates are ignored. |
| `note` | No | Shown at the bottom of `/router list <name>` and `/router status`. Good for trade-off context. |

## Plugin ID format

Every entry in `enable` must be `<plugin-name>@<marketplace-name>`, matching the keys Claude Code writes to `~/.claude/settings.json` under `enabledPlugins`.

Examples:

- `project-evaluator@wiiyoukindly-experimental` — a plugin from this repo's marketplace
- `remember@claude-plugins-official` — a plugin from Anthropic's official marketplace
- `my-custom-plugin@local` — a plugin from a local marketplace (see [installation.md](installation.md#option-c))

A profile can mix plugins from multiple marketplaces freely.

## Built-in profiles

Location: `tools/plugin-router/profiles/*.json` — one file per profile, filename matches the profile name.

| Profile | Intended use |
|---------|-------------|
| `core` | Always-on baseline. Memory, git, docs hygiene, hook guardrails. |
| `minimal` | Smallest useful set. Good for quick tasks or diagnosing plugin interference. |
| `dev-general` | General-purpose dev: code review, feature dev, refactoring, docs fetching. |
| `frontend` | React/Vue/TS + design + browser devtools. |
| `backend-aws` | Lambda + SAM/CDK + API Gateway + DynamoDB + serverless tooling. |
| `browser-automation` | Playwright, Chrome DevTools, scraping, E2E. |
| `research` | Idea comparison, project scoring, prioritization. |
| `writing` | Blog posts, docs, READMEs, essays. |
| `plugin-dev` | Building Claude Code plugins, skills, hooks, agents, MCP servers. |

Do not edit built-in profiles directly in the repo — they will be overwritten on plugin update. Instead, use `/router save <name>` after enabling the plugins you want to bake a custom profile to `${CLAUDE_PLUGIN_DATA}/custom-profiles/<name>.json`.

## Writing a custom profile

### Interactive (recommended)

```
# Enable the exact plugin set you want in the current session
/plugin install ...
/plugin disable ...

# Snapshot it
/router save my-side-project
```

### Manual

1. Create `~/.claude/plugins/data/plugin-router-<id>/custom-profiles/<name>.json` with the schema above.
2. Verify it with `/router list` — the custom profile appears alongside built-ins, tagged `(custom)`.
3. Apply it with `/router switch <name>`.

### Adding a plugin to every built-in profile

`/router core add <plugin-id>` adds the plugin to the "core" baseline and writes modified copies of every built-in profile to `${CLAUDE_PLUGIN_DATA}/custom-profiles/` (so updates don't wipe your edits). `/router core remove <plugin-id>` is the inverse.

## Selecting the right profile automatically

`/router analyze [prompt]` ranks profiles by matching:

- **cwd signals** — files under the current directory (`package.json` → frontend/node; `Cargo.toml` → rust; `.aws-sam/` → backend-aws; `*.md` in `plans/` or `drafts/` → writing; etc.)
- **prompt tokens** — the optional first-prompt text, if provided
- **recent usage** — if `usage-log.jsonl` exists, recently-used profiles get a small boost

The scorer lives in `scripts/lib/matcher.js`. Extend it by adding cwd patterns or prompt keyword weights there.

## Validation

Before committing a profile change:

```bash
node tests/validate-profiles.mjs
```

This parses every JSON under `profiles/`, confirms the schema, and verifies the plugin IDs look well-formed (`<name>@<marketplace>`).

## Cost estimation (how `/router status` computes it)

`plugin-router` does not read plugin sources to measure token cost. It uses a rough heuristic:

- Each enabled plugin contributes ~1k prompt tokens for system text + command/skill metadata
- MCP tool schemas contribute ~500–2000 tokens per exposed tool (no reliable way to count without loading them)
- The `core` profile's 4 plugins cost ~4–6k tokens baseline

The displayed cost is an order-of-magnitude estimate, not a precise measurement. For the real number, check `/cost` after your first prompt in the session.
