import { categories, tools, workflows } from "@/lib/data";
import { placeholderNarratives } from "@/lib/placeholder-data";

const narratives = placeholderNarratives;

export default function NarrativesPage() {
  return (
    <div className="stack">
      <section className="terminalStatus">
        <div className="statusIdentity"><strong>Micro Narratives</strong><span>DAILY</span></div>
        <div className="metric hotMetric"><span>top sector</span><strong>{categories[0]?.name ?? "None"}</strong></div>
        <div className="metric"><span>tools</span><strong>{tools.length}</strong></div>
        <div className="metric"><span>workflows</span><strong>{workflows.length}</strong></div>
      </section>
      <section className="narrativePage">
        {narratives.map((narrative, index) => (
          <article className="narrativeArticle" key={`${narrative}-${index}`}>
            <span>0{index + 1}</span>
            <h2>{narrative}</h2>
            <p>Movement preview based on category rotation, workflow adjacency, and local momentum modeling.</p>
          </article>
        ))}
      </section>
      <section className="previewPanel">
        <div className="panelHeader"><h2>Graph Context</h2><small>relationship layer</small></div>
        <p className="emptyState">Creator-linked narratives will appear after verified creator-tool relationships are available. Current narratives use category and workflow adjacency only.</p>
      </section>
    </div>
  );
}
