# Pacing Analyzer

> Tier #19 AI-native creative tool — feeds Path F hybrid from `plans/2026-04-09_creative-base-menu.md`.

Narrow dev tool that takes a chapter of long-form fiction and returns a visual heatmap of pacing. Built first for the author of Seven Echoes, dogfooded on their own manuscript, sell-able later.

## What it does

1. You paste a chapter (~500-8000 words).
2. You click **Analyze**.
3. Claude segments the chapter into 8-25 narrative beats, rates each beat's tempo (1=slow, 5=fast), and labels its dominant type (dialogue / action / description / internal / exposition).
4. You see a colored horizontal heatmap — the shape of your chapter's tempo at a glance.
5. You click any segment to see the full text and Claude's one-line note on why the tempo is what it is.
6. You get 2-4 sentences of overall pacing summary and up to 5 concrete editing suggestions.

See [`SPEC.md`](./SPEC.md) for the narrow scope definition.

## Setup

```bash
# From the repo root
cd projects/pacing-analyzer
npm install
cp .env.example .env
# Edit .env and paste your Anthropic API key
npm run dev
```

Open http://localhost:5173.

### API key

Get one at https://console.anthropic.com/settings/keys. The key is used only for local calls from your browser to Anthropic's API — nothing is logged or sent anywhere else.

You can also skip the `.env` file and paste the key into the UI on first run (held in memory only, lost on refresh).

## Scripts

- `npm run dev` — Vite dev server with HMR
- `npm run build` — TypeScript check + production build to `dist/`
- `npm run preview` — Serve the production build locally
- `npm run typecheck` — Type-check without emitting

## Dogfood workflow

This tool exists to be used on the Seven Echoes manuscript. See [`../../drafts/seven-echoes-launch/DOGFOOD_TEST_PLAN.md`](../../drafts/seven-echoes-launch/DOGFOOD_TEST_PLAN.md) for the structured test plan:

1. Run every Seven Echoes chapter through the tool.
2. Compare Claude's tempo ratings against your intuition.
3. Note any suggestion that surfaces a genuine pacing issue you missed.
4. Decide whether the tool is useful enough to ship to other authors.

## Next steps (post v0.1)

Listed roughly in order of how useful they'd be, not implementation order:

1. **File upload** — drop a `.md` or `.txt` file instead of pasting
2. **Multi-chapter comparison** — see how pacing shape differs chapter-to-chapter
3. **Export** — save the analysis as JSON or a PNG of the heatmap
4. **Cached runs** — skip re-analysis if the chapter text is unchanged
5. **Suggestion diffing** — show before/after for proposed edits
6. **Hosted version** — backend proxy so users don't need their own API key
7. **Billing** — LemonSqueezy/Stripe, €9-19/month after a free tier

Do not build any of these until v0.1 proves useful on real Seven Echoes chapters.

## Stack

- Vite 6 + React 18 + TypeScript (strict)
- Tailwind CSS 3
- `@anthropic-ai/sdk` (with `dangerouslyAllowBrowser: true` — local dev only)
- Model: `claude-sonnet-4-6`

## Notes

- **No backend by design.** This is a local dev tool. If v0.1 proves useful and you want to ship to other users, add a proxy backend before deploying publicly so API keys aren't exposed.
- **No telemetry, no analytics, no auth.** Single-user tool.
- **Scope discipline:** resist adding features until dogfooding is done. See SPEC.md for the explicit out-of-scope list.
