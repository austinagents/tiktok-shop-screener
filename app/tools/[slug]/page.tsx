import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bookmark,
  ExternalLink,
  GitCompareArrows,
  Grid2X2,
  Home,
  Megaphone,
  Rocket,
  Search,
  Share2,
  Tag,
  TrendingUp,
  Users,
  Workflow,
  Zap
} from "lucide-react";
import { CreatorAvatar } from "@/components/creator-avatar";
import { MovementBadge } from "@/components/movement-badge";
import { SaveButton } from "@/components/save-button";
import { ToolLogo } from "@/components/tool-logo";
import { WorkflowStack } from "@/components/workflow-stack";
import { creators, creatorSignals, edgesForTool, getTool, tools, toolsForWorkflow, workflows } from "@/lib/data";
import { ecosystemTagSlug } from "@/lib/ecosystem-tags";
import { displayCategory } from "@/lib/format";
import type { CreatorProfile, Tool, Workflow as WorkflowType } from "@/lib/types";

const navSections = [
  {
    title: "",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/", label: "Trending", icon: TrendingUp },
      { href: "/heatmap", label: "Heatmap", icon: Grid2X2 },
      { href: "/categories/ai-coding", label: "Categories", icon: Tag },
      { href: "/", label: "Search", icon: Search }
    ]
  },
  {
    title: "Intelligence",
    items: [
      { href: "/", label: "Momentum Rail", icon: Activity },
      { href: "/breaking-out", label: "Breakouts", icon: Rocket },
      { href: "/breaking-out", label: "Emerging", icon: Zap },
      { href: "/watchlist", label: "Watchlist", icon: Bookmark },
      { href: "/compare", label: "Compare", icon: GitCompareArrows }
    ]
  },
  {
    title: "Ecosystem",
    items: [
      { href: "/creators", label: "Creators", icon: Users },
      { href: "/workflows", label: "Workflows", icon: Workflow },
      { href: "/tags/ai-coding", label: "Tags", icon: Tag }
    ]
  },
  {
    title: "For Builders",
    items: [
      { href: "/", label: "Boost visibility", icon: Zap },
      { href: "/", label: "Ad placements", icon: Megaphone },
      { href: "/", label: "Analytics", icon: BarChart3 }
    ]
  }
];

const bottomLinks = ["About", "Methodology", "API", "Pricing", "Privacy", "Terms"];

function isTool(item: Tool | undefined): item is Tool {
  return Boolean(item);
}

function publicTrackingState(tool: Tool) {
  if (tool.listingStatus === "accepted") return "Active";
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
  const movementReasons = reasonsForTool(tool, usedIn.length, edgeTools.length, connectedCreators.length, recentSignals.length);

  return (
    <div className="toolIntelShell">
      <ToolSidebar />

      <div className="toolIntelWorkspace">
        <section className="toolIntelHeroGrid">
          <article className="toolIntelHero">
            <Link href="/" className="toolBackLink">← Back to search</Link>
            <div className="toolHeroBody">
              <ToolLogo officialSrc={tool.officialLogoUrl} src={tool.logoUrl} faviconSrc={tool.faviconUrl} fallback={tool.iconUrl} alt="" size={112} />
              <div>
                <h1>{tool.name}{verification ? <span>{verification}</span> : null}</h1>
                <p className="toolHeroCategory">{displayCategory(tool.category)}</p>
                <p className="toolHeroDescription">{tool.description}</p>
                <TagRail tool={tool} tags={relatedTags.slice(0, 5)} />
                <div className="toolHeroActions">
                  <a className="iconTextButton primaryWebsiteButton" href={tool.websiteUrl} target="_blank" rel="noreferrer">Visit website <ExternalLink size={14} /></a>
                  <SaveButton kind="tools" id={tool.slug} label="Add to watchlist" />
                </div>
              </div>
            </div>
          </article>

          <TrendingCard tool={tool} rank={rank} />
        </section>

        <section className="toolIntelContentGrid">
          <main className="toolIntelMain">
            <Panel title={`Why is ${tool.name} trending?`}>
              <div className="toolWhyGrid">
                {movementReasons.map((reason) => <ReasonCard title={reason.title} text={reason.text} key={reason.title} />)}
              </div>
            </Panel>

            <Panel title={`Who is using ${tool.name}?`} subtitle="Top creators and teams using this tool">
              {connectedCreators.length ? (
                <div className="toolCreatorShelf">
                  {connectedCreators.map((creator) => <CreatorCard creator={creator} key={creator.id} />)}
                </div>
              ) : (
                <p className="toolEmptyState">No accepted creator-tool relationships are public yet. AppScreener is keeping this blank until attribution is verified.</p>
              )}
            </Panel>

            <Panel title="Popular in these workflows" subtitle="Real workflows from creators and builders">
              {usedIn.length ? (
                <div className="toolWorkflowShelf">
                  {usedIn.map((workflow) => <WorkflowCard workflow={workflow} key={workflow.id} />)}
                </div>
              ) : (
                <p className="toolEmptyState">No verified workflow stack currently includes this tool. AppScreener is not filling this with inferred usage.</p>
              )}
            </Panel>

            <Panel title="Recent mentions" subtitle={`What creators are saying about ${tool.name}`}>
              {recentSignals.length ? (
                <div className="toolMentionList">
                  {recentSignals.map((signal) => (
                    <article className="toolMentionRow" key={signal.id}>
                      <CreatorAvatar name={signal.creatorName} size={34} />
                      <div>
                        <strong>{signal.creatorName} <span>{signal.handle} · {signal.timestamp}</span></strong>
                        <p>{signal.context}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="toolEmptyState">No verified public mentions are attached yet. AppScreener is not showing unsourced quotes or loose attribution.</p>
              )}
            </Panel>
          </main>

          <aside className="toolIntelRail">
            <Panel title={`About ${tool.name}`}>
              <div className="toolAboutTable">
                <InfoRow label="Best for" value={tool.useCases.slice(0, 2).join(", ")} />
                <InfoRow label="Use cases" value={tool.useCases.slice(0, 3).join(", ")} />
                <InfoRow label="Platform" value={tool.supportedPlatforms.join(", ")} />
                <InfoRow label="Pricing" value={tool.pricingSummary} />
                <InfoRow label="Website" value={<a href={tool.websiteUrl} target="_blank" rel="noreferrer">{domainFor(tool.websiteUrl)}</a>} />
                <InfoRow label="Integrations" value={tool.integrations.join(", ")} />
                <InfoRow label="API" value={tool.apiAvailable ? "Yes" : ""} />
                <InfoRow label="Status" value={publicTrackingState(tool)} />
                {launchYear ? <InfoRow label="Launched" value={launchYear} /> : null}
              </div>
            </Panel>

            <Panel title="Related tags">
              <TagRail tool={tool} tags={relatedTags} />
            </Panel>

            <Panel title={`Tools often used with ${tool.name}`}>
              <div className="toolMiniList">
                {(edgeTools.length ? edgeTools : related).slice(0, 5).map((item) => <ToolMiniRow tool={item} key={item.slug} />)}
              </div>
            </Panel>

            <Panel title="Trending nearby">
              <div className="toolMiniList">
                {nearby.map((item) => <ToolMiniRow tool={item} showGrowth key={item.slug} />)}
              </div>
            </Panel>
          </aside>
        </section>
      </div>
    </div>
  );
}

function ToolSidebar() {
  return (
    <aside className="toolIntelSidebar">
      <nav>
        {navSections.map((section) => (
          <div className="toolSidebarSection" key={section.title || "global"}>
            {section.title ? <small>{section.title}</small> : null}
            {section.items.map((item) => (
              <Link href={item.href} key={`${section.title}-${item.label}`}>
                <item.icon size={14} />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="toolSidebarBottom">
        {bottomLinks.map((label) => <Link href="/" key={label}>{label}</Link>)}
        <span>© 2026 AppScreener.ai</span>
      </div>
    </aside>
  );
}

function TrendingCard({ tool, rank }: { tool: Tool; rank: number }) {
  return (
    <aside className="toolTrendPanel">
      <h2>Trending on AppScreener</h2>
      <div className="toolTrendStats">
        <span><small>Rank</small><strong>#{rank || "N/A"}</strong></span>
        <span><small>24H Growth</small><strong><MovementBadge value={tool.growth24h} /></strong></span>
        <span><small>Mentions (24H)</small><strong>{compactNumber(tool.mentions24h)}</strong></span>
        <span><small>Saves</small><strong>{compactNumber(tool.savesCount)}</strong></span>
      </div>
      <p><span /> Active tracking in the current organic ranking.</p>
    </aside>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="toolIntelPanel">
      <div className="toolPanelHeader">
        <div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>
      </div>
      {children}
    </section>
  );
}

function ReasonCard({ title, text }: { title: string; text: string }) {
  return <span><strong>{title}</strong><small>{text}</small></span>;
}

function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const tags = [creator.primarySpecialization, ...creator.specializationTags].filter(Boolean).slice(0, 1);
  return (
    <Link href={`/creators/${creator.id}`} className="toolIntelCreatorCard">
      <CreatorAvatar name={creator.name} src={creator.avatarUrl} size={54} />
      <strong>{creator.name}</strong>
      <small>{creator.handle}</small>
      <em>{tags.map((tag) => tag ? tag.replace(/^AI\s+/, "").replace(/ AI$/, "") : "").join(" · ") || creator.creatorCategory}</em>
      {creator.followers ? <small>{compactNumber(creator.followers)} followers</small> : null}
      <span>Used in {creator.workflowSlugs.length} workflows</span>
    </Link>
  );
}

function WorkflowCard({ workflow }: { workflow: WorkflowType }) {
  const workflowCreators = creatorsForWorkflow(workflow.slug);
  const stackTools = toolsForWorkflow(workflow);
  return (
    <Link href={`/workflows/${workflow.slug}`} className="toolIntelWorkflowCard">
      <strong>{workflow.name}</strong>
      <WorkflowStack toolSlugs={workflow.toolSlugs} />
      <small>{stackTools.map((tool) => tool.name).join(" · ")}</small>
      <em>{workflowCreators.length ? `Used by ${compactNumber(workflow.creatorUsage)} creators` : "Creator attribution pending"}</em>
      {workflowCreators.length ? (
        <span className="workflowCreatorStrip">
          {workflowCreators.slice(0, 5).map((creator) => <CreatorAvatar name={creator.name} src={creator.avatarUrl} size={18} key={creator.id} />)}
          {workflow.creatorUsage > workflowCreators.length ? <b>+{workflow.creatorUsage - workflowCreators.length}</b> : null}
        </span>
      ) : (
        <span className="workflowCreatorStrip empty">No public creator links yet</span>
      )}
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | ReactNode }) {
  if (!value) return null;
  return <div><small>{label}</small><strong>{value}</strong></div>;
}

function ToolMiniRow({ tool, showGrowth = false }: { tool: Tool; showGrowth?: boolean }) {
  return (
    <Link className="toolIntelMiniRow" href={`/tools/${tool.slug}`}>
      <ToolLogo officialSrc={tool.officialLogoUrl} src={tool.logoUrl} faviconSrc={tool.faviconUrl} fallback={tool.iconUrl} alt="" size={24} />
      <span><strong>{tool.name}</strong><small>{displayCategory(tool.category)}</small></span>
      {showGrowth ? <MovementBadge value={tool.growth24h} /> : null}
    </Link>
  );
}

function TagRail({ tool, tags }: { tool: Tool; tags: string[] }) {
  return (
    <div className="toolIntelTags">
      <Link href={`/categories/${slugify(tool.category)}`}>{displayCategory(tool.category)}</Link>
      {tags.map((tag) => <Link href={`/tags/${ecosystemTagSlug(tag)}`} key={tag}>{tag}</Link>)}
    </div>
  );
}

function creatorsForTool(tool: Tool) {
  return creators.filter((creator) => creator.toolSlugs.includes(tool.slug)).slice(0, 5);
}

function creatorsForWorkflow(workflowSlug: string) {
  return creators.filter((creator) => creator.workflowSlugs.includes(workflowSlug));
}

function reasonsForTool(tool: Tool, workflowCount: number, relatedCount: number, creatorCount: number, mentionCount: number) {
  const hasPublicCreatorEvidence = creatorCount > 0 || mentionCount > 0;
  return [
    hasPublicCreatorEvidence
      ? { title: "Verified creator context indexed", text: `${creatorCount + mentionCount} public creator ${creatorCount + mentionCount === 1 ? "relationship is" : "relationships are"} attached to this profile.` }
      : tool.creatorMentions
        ? { title: "Creator attention under review", text: "Seeded attention metrics show creator-side activity, but public attribution is still being verified." }
        : { title: "Creator relationships pending", text: "Verified creator usage is being mapped before AppScreener shows attribution." },
    workflowCount
      ? { title: `Active in ${displayCategory(tool.category)} workflows`, text: `Appears in ${workflowCount} tracked workflow ${workflowCount === 1 ? "stack" : "stacks"} on AppScreener.` }
      : { title: "Workflow relationships forming", text: "No verified workflow stack currently includes this tool." },
    relatedCount
      ? { title: "Often paired with adjacent tools", text: "Relationship mapping shows nearby products in similar workflow and category lanes." }
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

function compactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return value.toLocaleString();
}
