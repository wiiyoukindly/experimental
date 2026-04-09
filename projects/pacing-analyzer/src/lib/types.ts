export type SegmentType =
  | "dialogue"
  | "action"
  | "description"
  | "internal"
  | "exposition";

export interface PacingSegment {
  /** 1-indexed segment number in the chapter */
  index: number;
  /** First ~80 chars of the segment, for display */
  preview: string;
  /** Full text of the segment */
  text: string;
  /** Dominant beat type */
  type: SegmentType;
  /** Tempo 1 (slow/contemplative) — 5 (fast/urgent) */
  tempo: 1 | 2 | 3 | 4 | 5;
  /** Claude's one-line note on this segment's pacing */
  note: string;
}

export interface PacingAnalysis {
  segments: PacingSegment[];
  /** High-level summary from Claude (2-4 sentences) */
  summary: string;
  /** Concrete editing suggestions (max 5) */
  suggestions: string[];
}
