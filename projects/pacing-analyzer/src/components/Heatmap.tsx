import type { PacingSegment } from "../lib/types";

interface HeatmapProps {
  segments: PacingSegment[];
  onSelect?: (segment: PacingSegment) => void;
  selectedIndex?: number;
}

const TEMPO_COLORS: Record<number, string> = {
  1: "bg-blue-900",
  2: "bg-blue-500",
  3: "bg-amber-400",
  4: "bg-orange-500",
  5: "bg-red-600",
};

const TYPE_LABEL: Record<string, string> = {
  dialogue: "DIA",
  action: "ACT",
  description: "DSC",
  internal: "INT",
  exposition: "EXP",
};

export function Heatmap({ segments, onSelect, selectedIndex }: HeatmapProps) {
  if (segments.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm uppercase tracking-wider text-noir-900/70">
          Pacing heatmap
        </h3>
        <TempoLegend />
      </div>
      <div className="flex h-16 w-full overflow-hidden rounded-md border border-noir-900/20 bg-white">
        {segments.map((seg) => {
          const isSelected = seg.index === selectedIndex;
          return (
            <button
              key={seg.index}
              type="button"
              onClick={() => onSelect?.(seg)}
              title={`#${seg.index} · ${seg.type} · tempo ${seg.tempo}\n${seg.note}`}
              className={`group relative flex-1 border-r border-white/30 transition-opacity last:border-r-0 hover:opacity-80 ${
                TEMPO_COLORS[seg.tempo] ?? "bg-gray-400"
              } ${isSelected ? "ring-2 ring-noir-900 ring-offset-1" : ""}`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white/90 opacity-0 group-hover:opacity-100">
                {TYPE_LABEL[seg.type] ?? "?"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="font-mono text-xs text-noir-900/50">
        {segments.length} segments · tap a segment for details
      </div>
    </div>
  );
}

function TempoLegend() {
  return (
    <div className="flex items-center gap-1 font-mono text-[10px] uppercase text-noir-900/60">
      <span>slow</span>
      {[1, 2, 3, 4, 5].map((t) => (
        <span key={t} className={`h-3 w-3 ${TEMPO_COLORS[t]}`} />
      ))}
      <span>fast</span>
    </div>
  );
}
