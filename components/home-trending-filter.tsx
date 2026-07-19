"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TimeframeToggle } from "@/components/timeframe-toggle";
import { ToolTable } from "@/components/tool-table";
import { displayCategory } from "@/lib/format";
import { placeholderCategoryNames } from "@/lib/placeholder-data";
import type { Tool } from "@/lib/types";

const categoryTabs = placeholderCategoryNames;

type ActiveTab = "Trending" | string;
type TrendingTimeframe = "24H" | "30D" | "ALL";
const timeframeTabs: TrendingTimeframe[] = ["24H", "30D", "ALL"];

const allTimeTopToolSlugs = [] as const;

const allTimeRankBySlug = new Map<string, number>(allTimeTopToolSlugs.map((slug, index) => [slug, index]));

const thirtyDayTopToolSlugs = [] as const;

const thirtyDayRankBySlug = new Map<string, number>(thirtyDayTopToolSlugs.map((slug, index) => [slug, index]));

const twentyFourHourTopToolSlugs = [] as const;

const allTimeSlugSet = new Set<string>(allTimeTopToolSlugs);
const thirtyDaySlugSet = new Set<string>(thirtyDayTopToolSlugs);
const twentyFourHourDisplayPercentages = [
  412, 187, 733, 284, 591, 116, 438, 209, 804, 327,
  156, 672, 243, 521, 91, 388, 267, 845, 174, 603,
  138, 472, 221, 759, 108, 341, 692, 183, 557, 129,
  431, 276, 887, 162, 514, 97, 368, 245, 781, 193,
  624, 143, 452, 218, 836, 105, 329, 584, 177, 496,
  119, 742, 264, 403, 88, 539, 201, 812, 154, 361,
  682, 231, 573, 112, 425, 189, 871, 146, 307, 648,
  172, 517, 94, 393, 258, 774, 134, 486, 214, 559,
  103, 705, 238, 448, 79, 621, 181, 853, 126, 372,
  536, 167, 461, 99, 688, 247, 578, 117, 415, 302
] as const;
const allTimeDisplayPercentages = [
  23, 31, 18, 42, 15, 37, 29, 11, 44, 26,
  19, 35, 13, 27, 41, 22, 17, 39, 25, 14,
  33, 9, 28, 36, 12, 21, 40, 16, 24, 8,
  34, 20, 45, 10, 26, 18, 43, 30, 13, 22,
  47, 7, 31, 15, 38, 11, 27, 19, 35, 14,
  24, 9, 42, 17, 29, 12, 36, 20, 25, 8,
  32, 16, 41, 13, 28, 21, 37, 10, 23, 18,
  44, 7, 30, 14, 34, 11, 26, 19, 39, 9,
  22, 15, 46, 12, 31, 17, 35, 8, 24, 20,
  40, 10, 27, 13, 33, 16, 43, 11, 29, 18
] as const;
const thirtyDayDisplayPercentages = [
  72, 141, 64, 119, 93, 157, 48, 126, 81, 168,
  57, 104, 39, 132, 76, 149, 52, 116, 88, 173,
  45, 97, 68, 138, 54, 122, 91, 159, 37, 109,
  71, 143, 62, 128, 84, 181, 49, 117, 95, 151,
  58, 101, 42, 134, 73, 164, 53, 113, 87, 145,
  34, 98, 67, 121, 46, 136, 79, 156, 41, 107,
  69, 148, 61, 124, 89, 172, 44, 111, 82, 162,
  56, 103, 38, 139, 74, 154, 51, 118, 92, 147,
  35, 99, 66, 127, 47, 142, 77, 166, 43, 112,
  63, 152, 59, 123, 86, 184, 50, 114, 83, 133
] as const;

export function twentyFourHourDisplayPercentageForSlug(slug: string) {
  const rankIndex = twentyFourHourTopToolSlugs.indexOf(slug as typeof twentyFourHourTopToolSlugs[number]);
  return rankIndex >= 0 ? twentyFourHourDisplayPercentages[rankIndex] : undefined;
}

function withTwentyFourHourDisplayPercentages(tools: Tool[]) {
  return tools.map((tool) => ({
    ...tool,
    growth24h: twentyFourHourDisplayPercentageForSlug(tool.slug) ?? tool.growth24h
  }));
}

function withAllTimeDisplayPercentages(tools: Tool[]) {
  return tools.map((tool, index) => ({
    ...tool,
    growth24h: allTimeDisplayPercentages[index] ?? tool.growth24h
  }));
}

function withThirtyDayDisplayPercentages(tools: Tool[]) {
  return tools.map((tool, index) => ({
    ...tool,
    growth24h: thirtyDayDisplayPercentages[index] ?? tool.growth24h
  }));
}

export function HomeTrendingFilter({ tools, children }: { tools: Tool[]; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("Trending");
  const [activeTimeframe, setActiveTimeframe] = useState<TrendingTimeframe>("24H");
  const filteredTools = useMemo(() => {
    const scopedTools = activeTab === "Trending" ? tools : tools.filter((tool) => matchesTab(tool, activeTab));
    if (activeTab === "Trending" && activeTimeframe === "ALL") {
      return withAllTimeDisplayPercentages(selectAllTimeTools(scopedTools));
    }
    if (activeTab === "Trending" && activeTimeframe === "30D") {
      return withThirtyDayDisplayPercentages(selectThirtyDayTools(scopedTools));
    }
    if (activeTab === "Trending" && activeTimeframe === "24H") {
      return withTwentyFourHourDisplayPercentages(selectTwentyFourHourTools(scopedTools));
    }
    return sortByTimeframe(scopedTools, activeTimeframe).slice(0, 100);
  }, [activeTab, activeTimeframe, tools]);

  return (
    <>
      <nav className="screenTabs" aria-label="Trending products filters">
        <button className={activeTab === "Trending" ? "active" : ""} onClick={() => setActiveTab("Trending")} type="button">Trending</button>
        {categoryTabs.map((tab) => (
          <button className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} type="button" key={tab}>{tab}</button>
        ))}
      </nav>

      <section className="homePrimary">
        <div className="primaryTable">
          <div className="sectionHeader tightHeader">
            <div>
              <h1>Trending Products</h1>
            </div>
            <TimeframeToggle compact options={timeframeTabs} active={activeTimeframe} onChange={(frame) => setActiveTimeframe(frame as TrendingTimeframe)} />
          </div>
          <ToolTable tools={filteredTools} focused useTwentyFourHourSourceDisplay={activeTab === "Trending" && activeTimeframe === "24H"} displayStatsMode={activeTab === "Trending" ? activeTimeframe === "30D" ? "30D" : activeTimeframe === "ALL" ? "ALL" : "default" : "default"} />
        </div>
        {children}
      </section>
    </>
  );
}

function matchesTab(tool: Tool, tab: Exclude<ActiveTab, "Trending">) {
  return tool.categories.some((category) => displayCategory(category) === tab);
}

function sortByTimeframe(tools: Tool[], timeframe: TrendingTimeframe) {
  if (timeframe === "30D") {
    return [...tools].sort((a, b) => {
      const aRank = thirtyDayRankBySlug.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
      const bRank = thirtyDayRankBySlug.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
      return aRank - bRank ||
      b.growth7d - a.growth7d ||
      b.mentions7d - a.mentions7d ||
      b.creatorMentions - a.creatorMentions ||
      b.workflowInclusions - a.workflowInclusions;
    });
  }

  if (timeframe === "ALL") {
    return sortByAllTimeRanking(tools);
  }

  return [...tools];
}

function sortByAllTimeRanking(tools: Tool[]) {
  return [...tools].sort((a, b) => {
    const aRank = allTimeRankBySlug.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bRank = allTimeRankBySlug.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    return aRank - bRank ||
      b.estimatedUsers - a.estimatedUsers ||
      b.momentumScore - a.momentumScore ||
      b.searchInterest - a.searchInterest;
  });
}

function selectAllTimeTools(tools: Tool[]) {
  return selectRankedTools(tools, allTimeTopToolSlugs, sortByAllTimeRanking);
}

function selectThirtyDayTools(tools: Tool[]) {
  return selectRankedTools(tools, thirtyDayTopToolSlugs, (toolList) => sortByTimeframe(toolList, "30D"));
}

function selectTwentyFourHourTools(tools: Tool[]) {
  const toolsBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const selected: Tool[] = [];
  const seenSlugs = new Set<string>();
  const add = (tool: Tool | undefined) => {
    if (!tool || seenSlugs.has(tool.slug) || selected.length >= 100) return;
    selected.push(tool);
    seenSlugs.add(tool.slug);
  };

  for (const slug of twentyFourHourTopToolSlugs) add(toolsBySlug.get(slug));

  if (selected.length >= 100) return selected.slice(0, 100);

  for (const tool of tools) add(tool);
  return selected;
}

function selectRankedTools(tools: Tool[], rankedSlugs: readonly string[], fallbackSort: (tools: Tool[]) => Tool[]) {
  const toolsBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const selected: Tool[] = [];
  const seenSlugs = new Set<string>();

  for (const slug of rankedSlugs) {
    const tool = toolsBySlug.get(slug);
    if (!tool || seenSlugs.has(tool.slug)) continue;
    selected.push(tool);
    seenSlugs.add(tool.slug);
  }

  if (selected.length >= 100) return selected.slice(0, 100);

  for (const tool of fallbackSort(tools)) {
    if (seenSlugs.has(tool.slug)) continue;
    selected.push(tool);
    seenSlugs.add(tool.slug);
    if (selected.length === 100) break;
  }

  return selected;
}
