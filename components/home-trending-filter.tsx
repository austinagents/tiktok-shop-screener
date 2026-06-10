"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TimeframeToggle } from "@/components/timeframe-toggle";
import { ToolTable } from "@/components/tool-table";
import { displayCategory } from "@/lib/format";
import type { Tool } from "@/lib/types";

const categoryTabs = [
  "Coding",
  "Trading",
  "Agents",
  "Automation",
  "Image",
  "Video",
  "Research",
  "Gaming",
  "3D Modeling",
  "Avatars"
] as const;

type ActiveTab = "Trending" | typeof categoryTabs[number];
type TrendingTimeframe = "24H" | "30D" | "ALL";
const timeframeTabs: TrendingTimeframe[] = ["24H", "30D", "ALL"];

const allTimeTopToolSlugs = [
  "chatgpt",
  "claude",
  "google-gemini",
  "perplexity",
  "cursor",
  "github-copilot",
  "midjourney",
  "elevenlabs",
  "microsoft-copilot",
  "deepseek",
  "hugging-face",
  "notebooklm",
  "openai-platform",
  "anthropic-console",
  "meta-ai",
  "runway",
  "adobe-firefly",
  "canva-ai",
  "stable-diffusion",
  "langchain",
  "llamaindex",
  "grok",
  "mistral-ai",
  "synthesia",
  "heygen",
  "vertex-ai",
  "amazon-bedrock",
  "azure-ai-foundry",
  "openrouter",
  "databricks-mosaic-ai",
  "cohere",
  "pinecone",
  "replicate",
  "together-ai",
  "groq",
  "fireworks-ai",
  "weaviate",
  "chroma",
  "vercel",
  "linear",
  "tradingview",
  "polymarket",
  "defillama",
  "kalshi",
  "apollo",
  "claude-code",
  "openai-codex",
  "windsurf",
  "v0",
  "lovable",
  "bolt",
  "replit",
  "devin",
  "manus",
  "ideogram",
  "flux-black-forest-labs",
  "recraft",
  "deepgram",
  "cartesia",
  "exa",
  "openhands",
  "browserbase",
  "stagehand",
  "coderabbit",
  "augment-code",
  "langflow",
  "dify",
  "leonardo-ai",
  "sourcegraph",
  "langsmith",
  "n8n",
  "zapier",
  "make",
  "glean",
  "hebbia",
  "harvey",
  "notion-ai",
  "grammarly",
  "clay",
  "gamma",
  "descript",
  "capcut",
  "figma-ai",
  "framer",
  "webflow-ai",
  "suno",
  "udio",
  "luma",
  "kling",
  "pika",
  "ollama",
  "lm-studio",
  "comfyui",
  "cline",
  "aider",
  "granola",
  "superhuman-ai",
  "jasper",
  "poe",
  "slack"
] as const;

const allTimeRankBySlug = new Map<string, number>(allTimeTopToolSlugs.map((slug, index) => [slug, index]));

const thirtyDayTopToolSlugs = [
  "manus",
  "ideogram",
  "openhands",
  "flux-black-forest-labs",
  "recraft",
  "browserbase",
  "stagehand",
  "wordware",
  "higgsfield",
  "hedra",
  "genspark",
  "deepgram",
  "cartesia",
  "retell-ai",
  "exa",
  "coderabbit",
  "augment-code",
  "langflow",
  "dify",
  "agentops",
  "leonardo-ai",
  "krea",
  "magnific",
  "wan-video",
  "hume-ai",
  "playai",
  "tavily",
  "jina-ai",
  "nansen",
  "meshy",
  "tripo",
  "voiceflow",
  "botpress",
  "langgraph",
  "continue-dev",
  "firecrawl",
  "crawl4ai",
  "open-webui",
  "baseten",
  "langfuse",
  "11x",
  "world-labs",
  "mem0",
  "helicone",
  "comet",
  "d-id",
  "vidu",
  "pixverse",
  "tavus",
  "dreamina",
  "haiper",
  "hailuo",
  "skyreels",
  "deepbrain-ai",
  "bland-ai",
  "sesame",
  "assemblyai",
  "smallest-ai",
  "typefully",
  "arkham",
  "glassnode",
  "santiment",
  "elicit",
  "consensus",
  "research-rabbit",
  "semantic-scholar",
  "veed",
  "photoroom",
  "openart",
  "freepik-ai",
  "remove-bg",
  "andi",
  "kagi-assistant",
  "dia-browser",
  "zed",
  "trigger-dev",
  "temporal",
  "option-alpha",
  "quantconnect",
  "rows",
  "activepieces",
  "workato",
  "veriff",
  "fetcher",
  "qodo",
  "scite",
  "sierra",
  "polycam",
  "kaedim",
  "mindsdb",
  "arize-phoenix",
  "weights-biases",
  "unstructured",
  "llamaparse",
  "fellou",
  "screen-studio",
  "predibase",
  "convai",
  "avaturn",
  "masterpiece-studio"
] as const;

const thirtyDayRankBySlug = new Map<string, number>(thirtyDayTopToolSlugs.map((slug, index) => [slug, index]));

export function HomeTrendingFilter({ tools, children }: { tools: Tool[]; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("Trending");
  const [activeTimeframe, setActiveTimeframe] = useState<TrendingTimeframe>("24H");
  const filteredTools = useMemo(() => {
    const scopedTools = activeTab === "Trending" ? tools : tools.filter((tool) => matchesTab(tool, activeTab));
    if (activeTab === "Trending" && activeTimeframe === "ALL") {
      return selectAllTimeTools(scopedTools);
    }
    if (activeTab === "Trending" && activeTimeframe === "30D") {
      return selectThirtyDayTools(scopedTools);
    }
    return sortByTimeframe(scopedTools, activeTimeframe).slice(0, 100);
  }, [activeTab, activeTimeframe, tools]);

  return (
    <>
      <nav className="screenTabs" aria-label="Trending tools filters">
        <button className={activeTab === "Trending" ? "active" : ""} onClick={() => setActiveTab("Trending")} type="button">Trending</button>
        {categoryTabs.map((tab) => (
          <button className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} type="button" key={tab}>{tab}</button>
        ))}
      </nav>

      <section className="homePrimary">
        <div className="primaryTable">
          <div className="sectionHeader tightHeader">
            <div>
              <h1>Trending Tools</h1>
              <p>The live screener for AI product attention.</p>
            </div>
            <TimeframeToggle compact options={timeframeTabs} active={activeTimeframe} onChange={(frame) => setActiveTimeframe(frame as TrendingTimeframe)} />
          </div>
          <ToolTable tools={filteredTools} focused />
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
