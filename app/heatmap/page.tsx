import { AttentionHeatmap } from "@/components/heatmap";
import { TimeframeToggle } from "@/components/timeframe-toggle";
import { ToolTable } from "@/components/tool-table";
import { attentionSubCategories, tools } from "@/lib/data";

export default function HeatmapPage() {
  const avg24h = Math.round(attentionSubCategories.reduce((sum, item) => sum + item.growth24h, 0) / attentionSubCategories.length);

  return (
    <div className="stack">
      <section className="terminalStatus">
        <div className="statusIdentity"><strong>Attention Heatmap</strong><span>MODEL</span></div>
        <div className="metric hotMetric"><span>pressure leader</span><strong>{attentionSubCategories[0].label}</strong></div>
        <div className="metric"><span>avg 24h</span><strong>+{avg24h}%</strong></div>
        <div className="metric"><span>pockets</span><strong>{attentionSubCategories.length}</strong></div>
        <TimeframeToggle compact />
      </section>
      <AttentionHeatmap items={attentionSubCategories} />
      <section>
        <div className="sectionHeader"><h2>Tools Powering The Heat</h2><p>Momentum leaders mapped to practical attention pockets.</p></div>
        <ToolTable tools={tools.slice(0, 18)} />
      </section>
    </div>
  );
}
