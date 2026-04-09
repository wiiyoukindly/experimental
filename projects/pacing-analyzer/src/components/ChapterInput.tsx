interface ChapterInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ChapterInput({ value, onChange, disabled }: ChapterInputProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="chapter-text"
        className="text-sm font-mono uppercase tracking-wider text-noir-900/70"
      >
        Chapter text
      </label>
      <textarea
        id="chapter-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste a chapter or scene here. Minimum ~500 words for useful analysis."
        className="min-h-[240px] w-full resize-y rounded-md border border-noir-900/20 bg-white p-4 font-serif text-base leading-relaxed shadow-sm focus:border-noir-900/50 focus:outline-none disabled:bg-noir-100/50"
      />
      <div className="text-xs font-mono text-noir-900/50">
        {wordCount.toLocaleString()} words
      </div>
    </div>
  );
}
