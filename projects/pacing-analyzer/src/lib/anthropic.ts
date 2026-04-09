import Anthropic from "@anthropic-ai/sdk";
import type { PacingAnalysis, PacingSegment } from "./types";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a narrative pacing analyst for long-form fiction.
You break chapters into their constituent beats and rate each one for tempo.

You MUST respond with a single JSON object matching this exact TypeScript shape:

{
  "segments": [
    {
      "index": number,
      "preview": string,
      "text": string,
      "type": "dialogue" | "action" | "description" | "internal" | "exposition",
      "tempo": 1 | 2 | 3 | 4 | 5,
      "note": string
    }
  ],
  "summary": string,
  "suggestions": string[]
}

Rules:
- Segment the chapter by natural beats (usually 1 beat = 1-3 paragraphs).
- tempo 1 = slow, contemplative, still. tempo 5 = fast, urgent, propulsive.
- "type" is the dominant mode of the beat.
- "preview" is the first ~80 characters of the beat, verbatim.
- "text" is the full text of the beat, verbatim.
- "note" is ONE sentence explaining why the beat has this tempo.
- "summary" is 2-4 sentences on overall pacing shape.
- "suggestions" is up to 5 concrete, actionable editing suggestions.
- Respond with ONLY the JSON object — no markdown code fences, no prose before or after.`;

export interface AnalyzeOptions {
  chapterText: string;
  apiKey: string;
}

export async function analyzeChapter({
  chapterText,
  apiKey,
}: AnalyzeOptions): Promise<PacingAnalysis> {
  if (!apiKey) {
    throw new Error(
      "Missing Anthropic API key. Set VITE_ANTHROPIC_API_KEY in .env or paste it in the UI.",
    );
  }
  if (!chapterText.trim()) {
    throw new Error("Empty chapter text.");
  }

  const client = new Anthropic({
    apiKey,
    // NOTE: This is a local dev tool. In production, proxy through a backend.
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze the pacing of this chapter. Respond with JSON only.\n\n---\n\n${chapterText}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content.");
  }

  const parsed = parseAnalysisResponse(textBlock.text);
  validateAnalysis(parsed);
  return parsed;
}

function parseAnalysisResponse(raw: string): PacingAnalysis {
  // Strip potential markdown code fences defensively even though the prompt forbids them.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as PacingAnalysis;
  } catch (err) {
    throw new Error(
      `Failed to parse Claude response as JSON: ${
        err instanceof Error ? err.message : String(err)
      }\n\nRaw response:\n${raw.slice(0, 500)}`,
    );
  }
}

function validateAnalysis(value: unknown): asserts value is PacingAnalysis {
  if (!value || typeof value !== "object") {
    throw new Error("Response is not an object.");
  }
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.segments)) {
    throw new Error('Response missing "segments" array.');
  }
  if (typeof v.summary !== "string") {
    throw new Error('Response missing "summary" string.');
  }
  if (!Array.isArray(v.suggestions)) {
    throw new Error('Response missing "suggestions" array.');
  }
  for (const [i, seg] of v.segments.entries()) {
    const s = seg as Partial<PacingSegment>;
    if (
      typeof s.index !== "number" ||
      typeof s.preview !== "string" ||
      typeof s.text !== "string" ||
      typeof s.type !== "string" ||
      typeof s.tempo !== "number" ||
      typeof s.note !== "string"
    ) {
      throw new Error(`Segment ${i} has missing or malformed fields.`);
    }
  }
}
