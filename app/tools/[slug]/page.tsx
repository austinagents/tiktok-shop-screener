import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AttentionChart } from "@/components/chart";
import { MovementBadge } from "@/components/movement-badge";
import { SaveButton } from "@/components/save-button";
import { Sparkline } from "@/components/sparkline";
import { TimeframeToggle } from "@/components/timeframe-toggle";
import { ToolTable } from "@/components/tool-table";
import { ToolLogo } from "@/components/tool-logo";
import { WorkflowStack } from "@/components/workflow-stack";
import { edgesForTool, getTool, movementEvents, tools, workflows } from "@/lib/data";
import { displayCategory } from "@/lib/format";
import type { Tool } from "@/lib/types";

function isTool(item: Tool | undefined): item is Tool {
  return Boolean(item);
}

function publicTrackingState(tool: Tool) {
  if (tool.listingStatus === "accepted") return "Active Tracking";
  if (tool.listingStatus === "pending_source") return "Under Observation";
  return "Suppressed";
}

function publicVerificationState(tool: Tool) {
  if (tool.listingScore >= 90) return "Verified Momentum";
  if (tool.listingScore >= 70) return "Discovery Verified";
  return "Needs Review";
}

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getTool(params.slug);
  if (!tool) notFound();
  const related = tools.filter((item) => item.category === tool.category && item.slug !== tool.slug).slice(0, 5);
  const usedIn = workflows.filter((workflow) => workflow.toolSlugs.includes(tool.slug));
  const events = movementEvents.filter((event) => event.toolSlug === tool.slug || event.categorySlug === tool.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const explored = related.slice(0, 3);
  const edges = edgesForTool(tool.slug);

  return (
    <div className="stack">
      <section className="detailHeader">
        <div className="toolTitle">
          <ToolLogo officialSrc={tool.officialLogoUrl} src={tool.logoUrl} faviconSrc={tool.faviconUrl} fallback={tool.iconUrl} alt="" size={54} />
          <div>
            <p className="eyebrow">{displayCategory(tool.category)}</p>
            <h1>{tool.name}</h1>
            <p>{tool.description}</p>
          </div>
        </div>
        <div className="headerActions">
          <a className="iconTextButton" href={tool.websiteUrl} target="_blank" rel="noreferrer">Website</a>
          <SaveButton kind="tools" id={tool.slug} />
        </div>
      </section>

      <section className="terminalStatus">
        <Metric label="Momentum Score" value={tool.momentumScore.toString()} />
        <Metric label="Lifecycle" value={tool.lifecycleState} />
        <Metric label="24h Growth" value={<MovementBadge value={tool.growth24h} />} />
        <Metric label="Mentions 24h" value={tool.mentions24h.toLocaleString()} />
        <Metric label="Workflow inclusion" value={tool.workflowInclusions.toString()} />
        <TimeframeToggle compact />
      </section>

      <div className="toggleRow metricTabs">{["Attention", "Mentions", "Workflow Inclusion", "Search Growth", "Category Position"].map((item) => <button key={item}>{item}</button>)}</div>

      <AttentionChart data={tool.sparkline.concat(tool.sparkline.slice(4, 12).map((value) => value + tool.growth24h / 2))} title={`${tool.name} Attention`} />

      <section className="gridTwo">
        <div className="sidePanel">
          <div className="panelHeader"><h2>Overview</h2><span className={`pricingBadge ${tool.pricingType}`}>{tool.pricingType}</span></div>
          <p>{tool.longDescription}</p>
          <div className="metaGrid">
            <span><small>Company</small><strong>{tool.company}</strong></span>
            <span><small>Launch</small><strong>{tool.launchDate}</strong></span>
            <span><small>API</small><strong>{tool.apiAvailable ? "available" : "not listed"}</strong></span>
            <span><small>Open source</small><strong>{tool.openSource ? "yes" : "no"}</strong></span>
            <span><small>Quality</small><strong>{tool.qualityScore}</strong></span>
            <span><small>Breakout</small><strong>{tool.breakoutScore}</strong></span>
            <span><small>Tracking</small><strong>{publicTrackingState(tool)}</strong></span>
            <span><small>Verification</small><strong>{publicVerificationState(tool)}</strong></span>
            <span><small>Size class</small><strong>{tool.sizeClass}</strong></span>
            <span><small>Organic trend</small><strong>{tool.organicTrendingScore}</strong></span>
          </div>
          <div className="tagRail">{tool.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
        <div className="screenshotGrid">
          {tool.screenshots.map((shot) => <img src={shot} alt={`${tool.name} screenshot`} key={shot} />)}
        </div>
      </section>

      <section className="gridTwo">
        <div>
          <div className="sectionHeader"><h2>Why It's Moving</h2><p>Movement preview from product metadata, category pressure, and workflow adjacency.</p></div>
          <div className="feed">
            {events.length ? events.map((event) => (
              <article key={event.id}><span>{event.timestamp}</span><strong>{event.title}</strong><p>{event.description}</p></article>
            )) : <p className="emptyState">Movement explanations are pending stronger product-specific signals.</p>}
          </div>
        </div>
        <aside className="sidePanel">
          <div className="panelHeader"><h2>Creator Relationships</h2></div>
          <p className="emptyState">Verified creator-tool relationships are pending. AppScreener is tracking canonical creators separately from product usage claims.</p>
        </aside>
      </section>

      <section className="gridTwo">
        <div>
          <div className="sectionHeader"><h2>Discovery Chain</h2><p>Potential ecosystem adjacency based on category overlap, use cases, and momentum bands.</p></div>
          <div className="discoveryChain">
            {(edges.length ? edges.map((edge) => getTool(edge.fromSlug === tool.slug ? edge.toSlug : edge.fromSlug)).filter(isTool) : explored).map((item) => (
              <a href={`/tools/${item.slug}`} className="chainNode" key={item.slug}>
                <ToolLogo officialSrc={item.officialLogoUrl} src={item.logoUrl} faviconSrc={item.faviconUrl} fallback={item.iconUrl} alt="" size={32} />
                <strong>{item.name}</strong>
                <small>{item.lifecycleState} · <MovementBadge value={item.growth24h} /></small>
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="sectionHeader"><h2>Attention Flow</h2><p>Workflow-adjacent paths for monitoring, not verified migration claims.</p></div>
          <div className="flowGrid">
            {explored.map((item) => <div className="flowRow" key={item.slug}><strong>{tool.name}</strong><span>→</span><strong>{item.name}</strong><small>{displayCategory(item.category)} adoption path</small></div>)}
          </div>
        </div>
      </section>

      <section className="gridTwo">
        <div>
          <div className="sectionHeader"><h2>Workflows Using This Tool</h2></div>
          <div className="workflowGrid">
            {usedIn.map((workflow) => (
              <a className="workflowRow" href={`/workflows/${workflow.slug}`} key={workflow.id}>
                <WorkflowStack toolSlugs={workflow.toolSlugs} />
                <span><strong>{workflow.name}</strong><small>{workflow.outcome}</small></span>
                <Sparkline data={workflow.sparkline} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="sectionHeader"><h2>Competitors / Alternatives</h2></div>
          <ToolTable tools={related} compact />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}
