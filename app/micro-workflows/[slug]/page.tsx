import { notFound } from "next/navigation";
import { WorkflowProcessTabs } from "@/components/workflow-process-tabs";
import { WorkflowStack } from "@/components/workflow-stack";
import { evidenceSourcesForTool, tools } from "@/lib/data";
import type { Tool, ToolEvidenceSource } from "@/lib/types";

type MicroWorkflowPair = {
  slug: string;
  tools: [Tool, Tool];
  evidenceItems: ToolEvidenceSource[];
};

export function generateStaticParams() {
  return microWorkflowPairs().map((pair) => ({ slug: pair.slug }));
}

export default function MicroWorkflowDetailPage({ params }: { params: { slug: string } }) {
  const pair = microWorkflowPairs().find((item) => item.slug === params.slug);
  if (!pair) notFound();

  return (
    <div className="stack">
      <section className="detailHeader">
        <div>
          <p className="eyebrow">Micro Workflow</p>
          <h1>{pair.tools.map((tool) => tool.name).join(" + ")}</h1>
          <p>Exact two-tool connection detected across public receipts.</p>
        </div>
      </section>

      <section className="terminalStatus">
        <Metric label="Receipts" value={pair.evidenceItems.length.toLocaleString()} />
        <Metric label="Sources" value={sourceTypesFor(pair.evidenceItems).length.toLocaleString()} />
        <Metric label="Tools" value="2" />
        <WorkflowStack toolSlugs={pair.tools.map((tool) => tool.slug)} limit={2} />
      </section>

      <MicroWorkflowBreakdown pair={pair} />

      <section className="toolIntelPanel">
        <div className="toolPanelHeader">
          <div><h2>Proof Sources</h2><p>Public receipts matching exactly this two-tool micro workflow.</p></div>
        </div>
        {pair.evidenceItems.length ? (
          <div className="toolEvidenceRow">
            {sourceTypesFor(pair.evidenceItems).map((sourceType) => (
              <article className="toolEvidenceCard" key={sourceType}>
                <div className="toolReceiptSourceHeader"><span>{sourceTypeIcon(sourceType)}</span><strong>{sourceTypeLabel(sourceType)}</strong></div>
                <div className="toolReceiptPreviewList">
                  {pair.evidenceItems.filter((item) => item.sourceType === sourceType).slice(0, 3).map((item) => (
                    <article className="toolReceiptPreview" key={item.id}>
                      {item.sourceImageUrl ? <img src={item.sourceImageUrl} alt="" /> : null}
                      <div className="toolEvidenceIdentity"><strong>{item.sourceAuthor || item.platformLabel}</strong><p>{item.sourceTitle}</p></div>
                      {item.snippet ? <p className="toolEvidenceSnippet">{item.snippet}</p> : null}
                      <a className="toolReportCta" href={item.sourceUrl} target="_blank" rel="noreferrer">Open source →</a>
                    </article>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState">No proof sources are indexed for this exact two-tool micro workflow yet.</p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function MicroWorkflowBreakdown({ pair }: { pair: MicroWorkflowPair }) {
  const steps = pair.tools.map((tool, index) => {
    const otherTool = pair.tools[index === 0 ? 1 : 0];
    return {
      toolSlug: tool.slug,
      toolName: tool.name,
      officialLogoUrl: tool.officialLogoUrl,
      logoUrl: tool.logoUrl,
      faviconUrl: tool.faviconUrl,
      iconUrl: tool.iconUrl,
      task: whatToDoForTool(tool, otherTool),
      lookFor: whatToLookForTool(tool),
      output: outputForTool(tool),
      connection: whyStepMattersForTool(tool, otherTool)
    };
  });

  return (
    <section className="workflowProcess">
      <div className="sectionHeader">
        <h2>How This Micro Workflow Breaks Down</h2>
        <p>Two actionable steps showing what each tool contributes to this exact connection.</p>
      </div>
      <WorkflowProcessTabs steps={steps} />
    </section>
  );
}

function microWorkflowPairs(): MicroWorkflowPair[] {
  const knownTools = new Map(tools.map((tool) => [normalizeToolName(tool.name), tool]));
  const groups = new Map<string, { tools: [Tool, Tool]; evidenceItems: ToolEvidenceSource[] }>();

  tools.forEach((tool) => {
    evidenceSourcesForTool(tool.slug).forEach((source) => {
      if (source.matchedTools.length !== 2) return;
      const pairTools = source.matchedTools
        .map((toolName) => knownTools.get(normalizeToolName(toolName)))
        .filter(isTool)
        .filter((matchedTool, index, list) => list.findIndex((candidate) => candidate.slug === matchedTool.slug) === index)
        .sort((a, b) => a.slug.localeCompare(b.slug));

      if (pairTools.length !== 2) return;
      const slug = microWorkflowPairSlug(pairTools.map((pairTool) => pairTool.slug));
      const existing = groups.get(slug);
      if (existing) {
        existing.evidenceItems.push(source);
        return;
      }
      groups.set(slug, {
        tools: [pairTools[0], pairTools[1]],
        evidenceItems: [source]
      });
    });
  });

  return [...groups.entries()].map(([slug, group]) => ({
    slug,
    tools: group.tools,
    evidenceItems: [...new Map(group.evidenceItems.map((item) => [item.id, item])).values()]
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
  }));
}

function sourceTypesFor(evidenceItems: ToolEvidenceSource[]) {
  const ordered: ToolEvidenceSource["sourceType"][] = ["x", "youtube", "github", "news", "newsletter_blog", "article", "directory", "docs", "official", "other"];
  return ordered.filter((sourceType) => evidenceItems.some((item) => item.sourceType === sourceType));
}

function sourceTypeLabel(type: ToolEvidenceSource["sourceType"]) {
  if (type === "x") return "X";
  if (type === "youtube") return "YouTube";
  if (type === "github") return "Repository";
  if (type === "docs") return "Docs";
  if (type === "official") return "Official";
  if (type === "news") return "News";
  if (type === "newsletter_blog") return "Newsletter / Blog";
  if (type === "directory") return "Directory";
  if (type === "article") return "Article";
  return "Other";
}

function sourceTypeIcon(type: ToolEvidenceSource["sourceType"]) {
  if (type === "youtube") return "YT";
  if (type === "github") return "GH";
  if (type === "newsletter_blog") return "NB";
  if (type === "directory") return "DIR";
  return sourceTypeLabel(type).slice(0, 2).toUpperCase();
}

function microWorkflowPairSlug(toolSlugs: string[]) {
  return [...toolSlugs].sort().join("-");
}

function normalizeToolName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isTool(item: Tool | undefined): item is Tool {
  return Boolean(item);
}

function whatToDoForTool(tool: Tool, otherTool: Tool) {
  return `Use ${tool.name} to handle the ${cleanCategory(tool.category).toLowerCase()} layer before passing the result to ${otherTool.name}.`;
}

function whatToLookForTool(tool: Tool) {
  return "A clean output, clear handoff point, and enough structure for the second tool to use without extra cleanup.";
}

function outputForTool(tool: Tool) {
  return `A ${cleanCategory(tool.category).toLowerCase()} output ready for the next tool.`;
}

function whyStepMattersForTool(tool: Tool, otherTool: Tool) {
  return `${tool.name} provides the ${cleanCategory(tool.category).toLowerCase()} step that makes the handoff with ${otherTool.name} useful.`;
}

function cleanCategory(category: string) {
  return category;
}
