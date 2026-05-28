import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CreatorAvatar } from "@/components/creator-avatar";
import { MovementBadge } from "@/components/movement-badge";
import { SaveButton } from "@/components/save-button";
import { ToolLogo } from "@/components/tool-logo";
import { WorkflowStack } from "@/components/workflow-stack";
import { creators, creatorSignals, edgesForTool, getTool, tools, toolsForWorkflow, workflows } from "@/lib/data";
import { ecosystemTagSlug } from "@/lib/ecosystem-tags";
import { displayCategory } from "@/lib/format";
import type { CreatorProfile, Tool } from "@/lib/types";

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
  return "";
}

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getTool(params.slug);
  if (!tool) notFound();

  const connectedCreators = creatorsForTool(tool);
  const usedIn = workflows.filter((workflow) => workflow.toolSlugs.includes(tool.slug));
  const related = relatedToolsFor(tool);
  const edgeTools = edgesForTool(tool.slug)
    .map((edge) => getTool(edge.fromSlug === tool.slug ? edge.toSlug : edge.fromSlug))
    .filter(isTool)
    .slice(0, 5);
  const nearby = [...tools]
    .filter((item) => item.slug !== tool.slug && item.categories.some((category) => tool.categories.includes(category)))
    .sort((a, b) => b.growth24h - a.growth24h)
    .slice(0, 5);
  const recentSignals = creatorSignals.filter((signal) => signal.toolSlug === tool.slug);
  const verification = publicVerificationState(tool);
  const launchYear = knownYear(tool.launchDate);
  const relatedTags = [...new Set([...tool.subCategoryTags, ...tool.tags.slice(0, 5)])].slice(0, 8);
  const rank = [...tools].sort((a, b) => b.organicTrendingScore - a.organicTrendingScore).findIndex((item) => item.slug === tool.slug) + 1;
  const movementReasons = reasonsForTool(tool, usedIn.length, edgeTools.length);

  return (
    <div className="stack toolProfilePage">
      <div className="toolProfileNav">
        <a href="/">← Back to search</a>
        <div className="toolProfileActions">
          <SaveButton kind="tools" id={tool.slug} label="Add to watchlist" />
          <button className="iconTextButton" type="button">Share</button>
        </div>
      </div>

      <section className="toolProfileTop">
        <div className="toolProfileHero">
          <div className="toolProfileIdentity">
            <ToolLogo officialSrc={tool.officialLogoUrl} src={tool.logoUrl} faviconSrc={tool.faviconUrl} fallback={tool.iconUrl} alt="" size={112} />
            <div>
              <p className="eyebrow">{displayCategory(tool.category)}</p>
              <h1>{tool.name}{verification ? <span>{verification}</span> : null}</h1>
              <p>{tool.description}</p>
              <div className="tagRail">
                <a href={`/categories/${slugify(tool.category)}`}>{displayCategory(tool.category)}</a>
                {tool.subCategoryTags.slice(0, 4).map((tag) => <a href={`/tags/${ecosystemTagSlug(tag)}`} key={tag}>{tag}</a>)}
              </div>
              <div className="headerActions">
                <a className="iconTextButton primaryWebsiteButton" href={tool.websiteUrl} target="_blank" rel="noreferrer">Visit website</a>
                <SaveButton kind="tools" id={tool.slug} label="Add to watchlist" />
              </div>
            </div>
          </div>
        </div>

        <TrendingCard tool={tool} rank={rank} />
      </section>

      <section className="toolProfileLayout">
        <main className="toolProfileMain">
          <section className="sidePanel">
            <div className="panelHeader"><h2>Why is {tool.name} trending?</h2></div>
            <div className="toolReasonGrid">
              {movementReasons.map((reason) => <ReasonCard title={reason.title} text={reason.text} key={reason.title} />)}
            </div>
          </section>

          <section className="sidePanel">
            <div className="sectionHeader"><h2>Who is using {tool.name}?</h2><p>Top creators and teams using this tool</p></div>
            {connectedCreators.length ? (
              <div className="toolCreatorGrid">
                {connectedCreators.map((creator) => <CreatorToolCard creator={creator} key={creator.id} />)}
              </div>
            ) : (
              <p className="emptyState">Verified creator-tool relationships are pending for {tool.name}. AppScreener is not showing unsupported usage claims.</p>
            )}
          </section>

          <section className="sidePanel">
            <div className="sectionHeader"><h2>Popular in these workflows</h2><p>Real workflows from creators and builders</p></div>
            {usedIn.length ? (
              <div className="toolWorkflowGrid">
                {usedIn.map((workflow) => (
                  <a className="toolWorkflowCard" href={`/workflows/${workflow.slug}`} key={workflow.id}>
                    <WorkflowStack toolSlugs={workflow.toolSlugs} />
                    <strong>{workflow.name}</strong>
                    <small>{toolsForWorkflow(workflow).map((item) => item.name).join(" · ")}</small>
                    <span className="workflowCreatorMeta">Used by {workflow.creatorUsage.toLocaleString()} creators</span>
                    <span className="workflowCreatorStrip">
                      {creatorsForWorkflow(workflow.slug).slice(0, 5).map((creator) => (
                        <CreatorAvatar name={creator.name} src={creator.avatarUrl} size={18} key={creator.id} />
                      ))}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="emptyState">No tracked workflows currently include {tool.name}.</p>
            )}
          </section>

          <section className="sidePanel">
            <div className="sectionHeader"><h2>Recent mentions</h2><p>What creators are saying about {tool.name}</p></div>
            {recentSignals.length ? (
              <div className="feed">
                {recentSignals.map((signal) => (
                  <article className="toolMentionRow" key={signal.id}>
                    <span>{signal.timestamp}</span>
                    <strong>{signal.creatorName} <small>{signal.handle}</small></strong>
                    <p>{signal.context}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="emptyState">Verified creator mentions are still being mapped for {tool.name}. AppScreener is not showing unsourced quotes.</p>
            )}
          </section>
        </main>

        <aside className="toolProfileRail">
          <RailCard title={`About ${tool.name}`}>
            <p>{tool.longDescription || tool.description}</p>
            <div className="toolAboutList">
              <InfoRow label="Best for" value={tool.useCases.slice(0, 2).join(", ")} />
              <InfoRow label="Use cases" value={tool.useCases.slice(0, 3).join(", ")} />
              <InfoRow label="Platform" value={tool.supportedPlatforms.join(", ")} />
              <InfoRow label="Pricing" value={tool.pricingSummary} />
              <InfoRow label="Website" value={<a href={tool.websiteUrl} target="_blank" rel="noreferrer">{domainFor(tool.websiteUrl)}</a>} />
              <InfoRow label="Integrations" value={tool.integrations.join(", ")} />
              <InfoRow label="API" value={tool.apiAvailable ? "Available" : ""} />
              <InfoRow label="Status" value={publicTrackingState(tool)} />
              {launchYear ? <InfoRow label="Launched" value={launchYear} /> : null}
            </div>
          </RailCard>

          <RailCard title="Related tags">
            <div className="tagRail">
              <a href={`/categories/${slugify(tool.category)}`}>{displayCategory(tool.category)}</a>
              {relatedTags.map((tag) => <a href={`/tags/${ecosystemTagSlug(tag)}`} key={tag}>{tag}</a>)}
            </div>
          </RailCard>

          <RailCard title={`Tools often used with ${tool.name}`}>
            <div className="miniList">
              {(edgeTools.length ? edgeTools : related).slice(0, 5).map((item) => <ToolMiniRow tool={item} key={item.slug} />)}
            </div>
          </RailCard>

          <RailCard title="Trending nearby">
            <div className="miniList">
              {nearby.map((item) => <ToolMiniRow tool={item} showGrowth key={item.slug} />)}
            </div>
          </RailCard>
        </aside>
      </section>
    </div>
  );
}

function TrendingCard({ tool, rank }: { tool: Tool; rank: number }) {
  return (
    <aside className="sidePanel toolTrendingCard">
      <div className="panelHeader"><h2>Trending on AppScreener</h2></div>
      <div className="toolTrendingGrid">
        <span><small>Rank</small><strong>#{rank || "N/A"}</strong></span>
        <span><small>24h Growth</small><strong><MovementBadge value={tool.growth24h} /></strong></span>
        <span><small>Mentions (24h)</small><strong>{tool.mentions24h.toLocaleString()}</strong></span>
        <span><small>Saves</small><strong>{tool.savesCount.toLocaleString()}</strong></span>
      </div>
      <p className="toolTrendNote"><span /> {tool.lifecycleState} in the current organic ranking.</p>
    </aside>
  );
}

function ReasonCard({ title, text }: { title: string; text: string }) {
  return <span><strong>{title}</strong><small>{text}</small></span>;
}

function InfoRow({ label, value }: { label: string; value?: string | ReactNode }) {
  if (!value) return null;
  return <div className="toolInfoRow"><small>{label}</small><strong>{value}</strong></div>;
}

function RailCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="sidePanel"><div className="panelHeader"><h2>{title}</h2></div>{children}</section>;
}

function ToolMiniRow({ tool, showGrowth = false }: { tool: Tool; showGrowth?: boolean }) {
  return (
    <a className="miniRow" href={`/tools/${tool.slug}`}>
      <ToolLogo officialSrc={tool.officialLogoUrl} src={tool.logoUrl} faviconSrc={tool.faviconUrl} fallback={tool.iconUrl} alt="" size={24} />
      <span><strong>{tool.name}</strong><small>{displayCategory(tool.category)}</small></span>
      {showGrowth ? <MovementBadge value={tool.growth24h} /> : null}
    </a>
  );
}

function CreatorToolCard({ creator }: { creator: CreatorProfile }) {
  const tags = [creator.primarySpecialization, ...creator.specializationTags].filter(Boolean).slice(0, 2);
  return (
    <a className="toolCreatorCard" href={`/creators/${creator.id}`}>
      <CreatorAvatar name={creator.name} src={creator.avatarUrl} size={34} />
      <span><strong>{creator.name}</strong><small>{creator.handle}</small></span>
      <em>{tags.map((tag) => tag ? tag.replace(/^AI\s+/, "").replace(/ AI$/, "") : "").join(" · ")}</em>
      {creator.followers ? <small>{creator.followers.toLocaleString()} audience signal</small> : null}
    </a>
  );
}

function creatorsForTool(tool: Tool) {
  return creators.filter((creator) => creator.toolSlugs.includes(tool.slug)).slice(0, 6);
}

function creatorsForWorkflow(workflowSlug: string) {
  return creators.filter((creator) => creator.workflowSlugs.includes(workflowSlug));
}

function reasonsForTool(tool: Tool, workflowCount: number, relatedCount: number) {
  return [
    tool.creatorMentions
      ? { title: "Creator mentions accelerating", text: `${tool.creatorMentions} creator signals are attached to this product in the current ecosystem read.` }
      : { title: "Creator relationships pending", text: "Verified creator usage is being mapped before AppScreener shows attribution." },
    workflowCount
      ? { title: `Active in ${displayCategory(tool.category)} workflows`, text: `Appears in ${workflowCount} tracked workflow ${workflowCount === 1 ? "stack" : "stacks"} on AppScreener.` }
      : { title: "Workflow relationships forming", text: "No verified workflow stack currently includes this tool." },
    relatedCount
      ? { title: "Used near adjacent tools", text: "Related-tool mapping shows nearby products in similar workflow and category lanes." }
      : { title: "Adjacent tools under review", text: "Relationship mapping is still being refined for this product." },
    { title: "Growing in ecosystem discovery", text: `${tool.name} is part of the current organic discovery universe for ${displayCategory(tool.category)}.` }
  ];
}

function relatedToolsFor(tool: Tool) {
  const explicit = tool.relatedTools.map(getTool).filter(isTool);
  const fallback = tools.filter((item) => item.category === tool.category && item.slug !== tool.slug);
  return [...new Map([...explicit, ...fallback].map((item) => [item.slug, item])).values()].slice(0, 5);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function domainFor(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function knownYear(date: string) {
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? String(year) : "";
}
