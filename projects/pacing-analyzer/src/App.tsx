import { useState } from "react";
import { ChapterInput } from "./components/ChapterInput";
import { Heatmap } from "./components/Heatmap";
import { SegmentDetail } from "./components/SegmentDetail";
import { analyzeChapter } from "./lib/anthropic";
import type { PacingAnalysis, PacingSegment } from "./lib/types";

const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY ?? "";

export default function App() {
  const [chapter, setChapter] = useState("");
  const [apiKey, setApiKey] = useState(envKey);
  const [analysis, setAnalysis] = useState<PacingAnalysis | null>(null);
  const [selected, setSelected] = useState<PacingSegment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setSelected(null);
    try {
      const result = await analyzeChapter({
        chapterText: chapter,
        apiKey,
      });
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6 md:p-10">
      <header className="flex flex-col gap-1 border-b border-noir-900/20 pb-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Pacing Analyzer
        </h1>
        <p className="font-mono text-xs uppercase tracking-wider text-noir-900/60">
          Paste chapter · get scene-tempo heatmap · dogfood on Seven Echoes
        </p>
      </header>

      {!envKey && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="api-key"
            className="font-mono text-xs uppercase tracking-wider text-noir-900/70"
          >
            Anthropic API key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="rounded-md border border-noir-900/20 bg-white p-2 font-mono text-sm focus:border-noir-900/50 focus:outline-none"
          />
          <p className="font-mono text-[10px] text-noir-900/50">
            Key is held in memory only. For persistent config, set
            VITE_ANTHROPIC_API_KEY in .env.
          </p>
        </div>
      )}

      <ChapterInput
        value={chapter}
        onChange={setChapter}
        disabled={loading}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !chapter.trim() || !apiKey}
          className="rounded-md bg-noir-900 px-5 py-2 font-mono text-sm uppercase tracking-wider text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
        {loading && (
          <span className="font-mono text-xs text-noir-900/60">
            (first pass usually takes 15-30s)
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-50 p-3 font-mono text-xs text-red-900">
          {error}
        </div>
      )}

      {analysis && (
        <>
          <Heatmap
            segments={analysis.segments}
            onSelect={setSelected}
            selectedIndex={selected?.index}
          />
          <SegmentDetail segment={selected} />
          <section className="flex flex-col gap-3 rounded-md border border-noir-900/20 bg-white p-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-noir-900/70">
              Overall summary
            </h3>
            <p className="font-serif text-sm leading-relaxed">
              {analysis.summary}
            </p>
            {analysis.suggestions.length > 0 && (
              <>
                <h4 className="font-mono text-xs uppercase tracking-wider text-noir-900/70">
                  Suggestions
                </h4>
                <ul className="flex list-inside list-disc flex-col gap-1 font-serif text-sm leading-relaxed">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
