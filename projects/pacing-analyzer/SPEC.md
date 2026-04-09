# Pacing Analyzer — 1-page SPEC

## Purpose

Narrow dev tool that takes a chapter of long-form fiction and returns a visual heatmap of pacing, so the writer can see the shape of the tempo at a glance and decide where to cut or expand.

**First user:** the author of Seven Echoes. This tool is built for their workflow first; generalization comes later.

## Brutally narrow scope (v0.1)

One screen. One interaction. Paste a chapter → click Analyze → see heatmap.

### In scope

- Paste a single chapter of text (no multi-chapter, no file upload).
- Claude API analysis that segments the chapter into 8-25 beats.
- For each beat: type (dialogue / action / description / internal / exposition), tempo 1-5, one-sentence note.
- Visual heatmap: colored horizontal bar, one cell per beat, color = tempo.
- Click a cell → see the full segment text + Claude's note.
- Overall summary (2-4 sentences) + up to 5 editing suggestions.
- Per-session API key input OR env var.

### Out of scope for v0.1

- File upload / multi-chapter analysis
- Export / save / history
- Comparison between chapters
- Inline editing / suggestions application
- Authentication / multi-user
- Backend (all API calls happen in the browser with user's key)
- Any training data collection

## Success criteria for v0.1

- The author can paste a Seven Echoes chapter (~3000-6000 words) and see a meaningful heatmap within 30 seconds.
- At least one of the suggestions feels "yes, that's a real pacing issue I missed".
- The tool is reusable across all 15 Seven Echoes chapters and surfaces different patterns per chapter.

## Tech stack

- Vite + React + TypeScript + Tailwind CSS
- `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true` (local dev tool only)
- Model: `claude-sonnet-4-6` (tradeoff: cheaper than Opus, plenty capable for JSON output)
- No backend

## Architecture

```
src/
├── main.tsx              # React entry
├── App.tsx               # Single-page app, state container
├── styles.css            # Tailwind entry
├── components/
│   ├── ChapterInput.tsx  # Textarea + word counter
│   ├── Heatmap.tsx       # Colored bar visualization
│   └── SegmentDetail.tsx # Detail panel for selected beat
└── lib/
    ├── anthropic.ts      # Claude API wrapper, JSON parsing, validation
    └── types.ts          # PacingSegment, PacingAnalysis
```

## Prompt design

System prompt instructs Claude to return strict JSON matching the `PacingAnalysis` shape. Validation happens client-side in `anthropic.ts` (throws if malformed).

Key rules in the prompt:

- Segment by natural beats, not arbitrary word counts (1 beat ≈ 1-3 paragraphs).
- Tempo 1 = slow/still; tempo 5 = fast/urgent.
- Preview is first ~80 characters verbatim.
- Full text verbatim (for the detail panel).
- Note is ONE sentence explaining the tempo assignment.
- JSON only, no markdown fences.

## What dogfooding tests

- Does the segmentation match the author's intuition on their own chapters?
- Do the tempo ratings correlate with scenes the author already knows are slow/fast?
- Do the editing suggestions add signal or just restate the obvious?
- Does the heatmap reveal *anything* about pacing the author didn't already know?

The answer to these determines whether v0.1 becomes v0.2 or gets retired.

## Time box

**8 hours max** for the whole v0.1 (spec + scaffold + working MVP + first dogfood run). If it takes longer, scope is too big — narrow it further.
