import Link from "next/link";
import { promotionPlacements, tools } from "@/lib/data";
import { boostRailScoreFor, rankingModeSort } from "@/lib/ranking";
import { ToolLogo } from "./tool-logo";

const visibleRailSlots = 8;

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

export function PromotedMomentumRail() {
  const railItems = [
    ...sponsoredRailItems.map((item) => ({ ...item, sponsored: true, label: "Boosted" })),
    ...organicBackfillItems.map((item) => ({ ...item, sponsored: false, label: item.tool.organicRankingLabel }))
  ];

  return (
    <section className="promotedRail" aria-label="Promoted momentum rail">
      <div className="railLabel">
        <span>Momentum Rail</span>
        <small>Sponsored visibility + live movers</small>
      </div>
      <div className="railViewport">
        <div className="railTrack">
          {[...railItems, ...railItems].map((item, index) => (
            <Link
              className={`railItem ${item.sponsored ? "sponsored" : ""}`}
              href={`/tools/${item.tool.slug}`}
              key={`${item.tool.slug}-${index}`}
            >
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
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
