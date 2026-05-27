const frames = ["1H", "6H", "24H", "7D", "30D"];

export function TimeframeToggle({ compact = false, options = frames }: { compact?: boolean; options?: string[] }) {
  return (
    <div className={`timeframeToggle ${compact ? "compact" : ""}`} aria-label="Timeframe selector">
      {options.map((frame) => (
        <button className={frame === "24H" ? "active" : ""} key={frame} type="button">
          {frame}
        </button>
      ))}
    </div>
  );
}
