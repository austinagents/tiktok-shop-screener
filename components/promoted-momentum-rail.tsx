"use client";

import type { CSSProperties } from "react";
import { promotionPlacements, tools } from "@/lib/data";
import { boostRailScoreFor, rankingModeSort } from "@/lib/ranking";
import { ToolLogo } from "./tool-logo";

const visibleRailSlots = 8;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const safeSponsoredTextColor = "#789F99";
const temporaryDiscoverySlotSlug = "clocsy";

export const INDUSTRY_LEADER_EXCLUSIONS = [
  "chatgpt",
  "claude",
  "perplexity",
  "cursor",
  "windsurf",
  "lovable",
  "replit",
  "runway",
  "kling",
  "pika",
  "elevenlabs",
  "midjourney",
  "ideogram",
  "heygen",
  "synthesia",
  "notion-ai",
  "zapier",
  "gamma",
  "v0",
  "bolt",
  "linear",
  "capcut",
  "descript",
  "suno",
  "notebooklm",
  "grok",
  "clay",
  "jasper",
  "glean",
  "make",
  "framer-ai",
  "vercel",
  "n8n",
  "apollo",
  "framer",
  "slack",
  "hubspot",
  "linkedin",
  "google-maps",
  "manus",
  "udio",
  "granola",
  "lindy",
  "tome",
  "typefully",
  "instantly",
  "taplio"
] as const;

const industryLeaderExclusions = new Set<string>(INDUSTRY_LEADER_EXCLUSIONS);
const sponsoredBrandColors: Record<string, string> = {
  "biela-dev": "#4ADE80",
  clocsy: "#16F1FD"
};

const discoveryCandidateTools = tools.filter((tool) => tool.name && tool.slug && !industryLeaderExclusions.has(tool.slug));

function utcDayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / millisecondsPerDay);
}

function discoveryCandidateForDay(dayIndex = utcDayIndex()) {
  return discoveryCandidateTools[dayIndex % discoveryCandidateTools.length];
}

function sponsoredBrandColorFor(slug: string) {
  return sponsoredBrandColors[slug] ?? safeSponsoredTextColor;
}

const sponsoredRailItems = promotionPlacements
  .filter((placement) => placement.status === "active" && placement.placement === "top_rail")
  .map((placement) => {
    const tool = tools.find((item) => item.slug === placement.toolSlug);
    return tool && tool.boostEligible ? { placement, tool, railScore: boostRailScoreFor(placement, tool) } : null;
  })
  .filter(Boolean)
  .sort((a, b) => (b?.railScore ?? 0) - (a?.railScore ?? 0)) as Array<{ placement: (typeof promotionPlacements)[number]; tool: (typeof tools)[number]; railScore: number }>;

const organicBackfillItems = rankingModeSort(tools, "Trending")
  .filter((tool) => !sponsoredRailItems.some((item) => item.tool.slug === tool.slug))
  .slice(0, Math.max(0, visibleRailSlots - sponsoredRailItems.length))
  .map((tool) => ({ tool, placement: null, railScore: tool.organicTrendingScore }));

function DiscoverySlotName({ name }: { name: string }) {
  return <span>{name.toUpperCase()}</span>;
}

export function PromotedMomentumRail() {
  const discoveryCandidate = tools.find((tool) => tool.slug === temporaryDiscoverySlotSlug) ?? discoveryCandidateForDay();
  const discoveryHref = discoveryCandidate?.websiteUrl || `/tools/${discoveryCandidate?.slug}`;
  const discoveryIsExternal = Boolean(discoveryCandidate?.websiteUrl);
  const discoveryLinkProps = discoveryIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const railItems = [
    ...sponsoredRailItems.map((item) => ({ ...item, sponsored: true, label: "Boosted" })),
    ...organicBackfillItems.map((item) => ({ ...item, sponsored: false, label: item.tool.organicRankingLabel }))
  ];

  return (
    <section className="promotedRail" aria-label="Promoted momentum rail">
      {discoveryCandidate ? (
        <a
          className="railLabel railAdSlot"
          aria-label={`Discovery candidate: ${discoveryCandidate.name}`}
          href={discoveryHref}
          style={
            {
              "--rail-ad-brand-color": sponsoredBrandColorFor(discoveryCandidate.slug)
            } as CSSProperties
          }
          {...discoveryLinkProps}
        >
          <DiscoverySlotName name={discoveryCandidate.name} />
        </a>
      ) : (
        null
      )}
      <div className="railViewport">
        <div className="railTrack">
          {[...railItems, ...railItems].map((item, index) => {
            const content = (
              <>
                <span className="railRank">#{(index % railItems.length) + 1}</span>
                <ToolLogo
                  officialSrc={item.tool.officialLogoUrl}
                  src={item.tool.logoUrl}
                  faviconSrc={item.tool.faviconUrl}
                  fallback={item.tool.iconUrl}
                  alt=""
                  size={24}
                />
                <strong>{item.tool.name}</strong>
                <em>+{item.sponsored ? item.placement?.momentumLift : item.tool.growth24h}%</em>
                <small>{item.label}</small>
              </>
            );

            return item.tool.websiteUrl ? (
              <a
                className={`railItem ${item.sponsored ? "sponsored" : ""}`}
                href={item.tool.websiteUrl}
                key={`${item.tool.slug}-${index}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            ) : (
              <div className={`railItem ${item.sponsored ? "sponsored" : ""}`} key={`${item.tool.slug}-${index}`}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
