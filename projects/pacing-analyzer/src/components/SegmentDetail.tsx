import type { PacingSegment } from "../lib/types";

interface SegmentDetailProps {
  segment: PacingSegment | null;
}

export function SegmentDetail({ segment }: SegmentDetailProps) {
  if (!segment) {
    return (
      <div className="rounded-md border border-dashed border-noir-900/20 p-4 font-mono text-xs text-noir-900/40">
        Select a segment from the heatmap to see detail.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-noir-900/20 bg-white p-4">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-noir-900/60">
        <span>
          Segment #{segment.index} · {segment.type}
        </span>
        <span>tempo {segment.tempo}/5</span>
      </div>
      <blockquote className="border-l-2 border-noir-900/30 pl-3 font-serif text-sm italic leading-relaxed text-noir-900/80">
        {segment.text}
      </blockquote>
      <div className="font-mono text-xs text-noir-900/70">
        <span className="font-bold">Note:</span> {segment.note}
      </div>
    </div>
  );
}
