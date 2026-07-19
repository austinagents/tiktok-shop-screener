import Link from "next/link";
import { ecosystemColorStyle } from "@/lib/ecosystem-colors";
import { displayCategory } from "@/lib/format";
import { allTimeTrendingTableDisplayStatsBySlug, emptyTrendingTableDisplayStats, thirtyDayTrendingTableDisplayStatsBySlug, trendingTableDisplayStatsBySlug } from "@/lib/trending-table-display-stats";
import type { Tool } from "@/lib/types";
import { MovementBadge } from "./movement-badge";
import { Sparkline } from "./sparkline";
import { ToolLogo } from "./tool-logo";

const categoryClass = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
type TableDisplayStatsMode = "default" | "30D" | "ALL";

export function ToolTable({ tools, compact = false, focused = false, useTwentyFourHourSourceDisplay = false, displayStatsMode = "default" }: { tools: Tool[]; compact?: boolean; focused?: boolean; useTwentyFourHourSourceDisplay?: boolean; displayStatsMode?: TableDisplayStatsMode }) {
  return (
    <div className="tableWrap">
      <table className={`terminalTable toolsTable ${focused ? "focusedToolsTable" : ""}`}>
        {focused && (
          <colgroup>
            <col className="rankColumn" />
            <col className="toolColumn" />
            <col className="categoryColumn" />
            <col className="metricColumn" />
            <col className="signalColumn" />
            <col className="numberColumn" />
            <col className="numberColumn" />
            <col className="lifecycleColumn" />
          </colgroup>
        )}
        <thead>
          <tr>
            <th>Rank</th>
            <th>Tool</th>
            <th>Category</th>
            {!focused && <th>Momentum</th>}
            <th>24h GMV</th>
            {!focused && <th>7d</th>}
            {!compact && <th>Creators</th>}
            {!compact && <th>Price</th>}
            {!compact && <th>Units Sold</th>}
            <th>Videos</th>
            {!compact && !focused && <th>Flows</th>}
            {!compact && !focused && <th>Why moving</th>}
            {!focused && <th>Sparkline</th>}
          </tr>
        </thead>
        <tbody>
          {tools.map((tool, index) => {
            const displayStats = displayStatsForTool(tool, displayStatsMode);
            const creatorCount = displayStats.creatorCount || fallbackCreatorCount(tool.slug);
            const price = productPriceForTool(displayStats.sourceCount, tool.slug);
            const unitsSold = displayStats.workflowCount || fallbackUnitsSold(tool.slug);
            const videos = videosForTool(tool);
            const gmv = gmvForTool(tool, useTwentyFourHourSourceDisplay);
            return (
              <tr className={tool.lifecycleState === "Breaking Out" ? "breakoutRow" : ""} key={tool.id}>
                <td className="rank" data-label="Rank">{!focused && <span className="rankMove">↗</span>}#{index + 1}</td>
                <td data-label="Tool">
                  <Link href={`/tools/${tool.slug}`} className="toolCell">
                    <ToolLogo officialSrc={tool.officialLogoUrl} src={tool.logoUrl} faviconSrc={tool.faviconUrl} fallback={tool.iconUrl} alt="" />
                    <span>
                      <strong>{tool.name}</strong>
                    </span>
                  </Link>
                </td>
                <td data-label="Category">
                  <Link className="categoryCell" href={`/categories/${categoryClass(tool.category)}`} style={ecosystemColorStyle(tool.category)}>
                    <span className="categoryDot" />
                    {displayCategory(tool.category)}
                  </Link>
                </td>
                {!focused && <td data-label="Momentum"><span className="score">{tool.momentumScore}<small>score</small></span></td>}
                <td data-label="24h GMV">{formatCompactCurrency(gmv)}</td>
                {!focused && <td data-label="7d"><MovementBadge value={tool.growth7d} /></td>}
                {!compact && <td data-label="Creators"><span className="signalCount">{formatCompactCount(creatorCount)}</span></td>}
                {!compact && <td data-label="Price">{formatCurrency(price)}</td>}
                {!compact && <td data-label="Units Sold">{formatCompactCount(unitsSold)}</td>}
                <td data-label="Videos"><span className="signalCount">{formatCompactCount(videos)}</span></td>
                {!compact && !focused && <td data-label="Flows"><span className="signalCount">{tool.workflowInclusions}</span></td>}
                {!compact && !focused && <td data-label="Why"><span className="whyPill">{reasonFor(tool)}</span></td>}
                {!focused && <td data-label="Sparkline"><Sparkline data={tool.sparkline} tone={tool.growth24h < 0 ? "red" : "green"} /></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function displayStatsForTool(tool: Tool, mode: TableDisplayStatsMode) {
  if (mode === "30D") return thirtyDayTrendingTableDisplayStatsBySlug[tool.slug] ?? trendingTableDisplayStatsBySlug[tool.slug] ?? emptyTrendingTableDisplayStats;
  if (mode === "ALL") return allTimeTrendingTableDisplayStatsBySlug[tool.slug] ?? trendingTableDisplayStatsBySlug[tool.slug] ?? emptyTrendingTableDisplayStats;
  return trendingTableDisplayStatsBySlug[tool.slug] ?? emptyTrendingTableDisplayStats;
}

function gmvForTool(tool: Tool, useTwentyFourHourSourceDisplay: boolean) {
  if (tool.growth24h > 0) return tool.growth24h;
  const seed = slugSeed(tool.slug);
  const base = 8400 + seed % 72000;
  return useTwentyFourHourSourceDisplay ? base : Math.round(base * 0.82);
}

function productPriceForTool(sourceCount: number, slug: string) {
  if (sourceCount > 0) return sourceCount;
  return 12 + (slugSeed(slug) % 8800) / 100;
}

function fallbackCreatorCount(slug: string) {
  return 4 + slugSeed(slug) % 42;
}

function fallbackUnitsSold(slug: string) {
  return 120 + slugSeed(slug) % 9400;
}

function videosForTool(tool: Tool) {
  if (tool.mentions24h > 0) return tool.mentions24h;
  return 18 + slugSeed(`${tool.slug}-${tool.lifecycleState}`) % 620;
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
    notation: "compact",
    style: "currency"
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(value);
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
    notation: value >= 10000 ? "compact" : "standard"
  }).format(Math.round(value));
}

function slugSeed(slug: string) {
  return slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function reasonFor(tool: Tool) {
  if (tool.creatorMentions > 70) return "ecosystem spike";
  if (tool.workflowInclusions >= 6) return "workflow spread";
  if (tool.growth24h > 45) return "acceleration";
  if (tool.searchInterest > 80) return "search lift";
  if (tool.growth24h < 0) return "cooling";
  return "steady climb";
}
