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
  "character-ai",
  "runway",
  "adobe-firefly",
  "canva-ai",
  "stable-diffusion",
  "langchain",
  "llamaindex",
  "grok",
  "mistral-ai",
  "dall-e",
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
  "claude-code",
  "openai-codex",
  "windsurf",
  "v0",
  "lovable",
  "bolt",
  "replit",
  "devin",
  "codeium",
  "sourcegraph-cody",
  "tabnine",
  "phind",
  "blackbox-ai",
  "langsmith",
  "modal",
  "crewai",
  "autogen",
  "n8n",
  "zapier",
  "make",
  "relevance-ai",
  "lindy",
  "gumloop",
  "glean",
  "hebbia",
  "harvey",
  "notion-ai",
  "grammarly",
  "jasper",
  "writer",
  "copy-ai",
  "gamma",
  "tome",
  "descript",
  "capcut",
  "figma-ai",
  "framer-ai",
  "webflow-ai",
  "suno",
  "udio",
  "luma",
  "kling",
  "pika",
  "ollama",
  "lm-studio",
  "comfyui",
  "anythingllm",
  "flowise",
  "cline",
  "aider",
  "otter-ai",
  "fireflies-ai",
  "fathom",
  "granola",
  "superhuman-ai",
  "reclaim-ai",
  "motion",
  "clay",
  "instantly",
  "poe"
] as const;

const allTimeRankBySlug = new Map<string, number>(allTimeTopToolSlugs.map((slug, index) => [slug, index]));

export function HomeTrendingFilter({ tools, children }: { tools: Tool[]; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("Trending");
  const [activeTimeframe, setActiveTimeframe] = useState<TrendingTimeframe>("24H");
  const filteredTools = useMemo(() => {
    const scopedTools = activeTab === "Trending" ? tools : tools.filter((tool) => matchesTab(tool, activeTab));
    if (activeTab === "Trending" && activeTimeframe === "ALL") {
      return selectAllTimeTools(scopedTools);
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
    return [...tools].sort((a, b) =>
      b.growth7d - a.growth7d ||
      b.mentions7d - a.mentions7d ||
      b.creatorMentions - a.creatorMentions ||
      b.workflowInclusions - a.workflowInclusions
    );
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
  const toolsBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const selected: Tool[] = [];
  const seenSlugs = new Set<string>();

  for (const slug of allTimeTopToolSlugs) {
    const tool = toolsBySlug.get(slug);
    if (!tool || seenSlugs.has(tool.slug)) continue;
    selected.push(tool);
    seenSlugs.add(tool.slug);
  }

  if (selected.length >= 100) return selected.slice(0, 100);

  for (const tool of sortByAllTimeRanking(tools)) {
    if (seenSlugs.has(tool.slug)) continue;
    selected.push(tool);
    seenSlugs.add(tool.slug);
    if (selected.length === 100) break;
  }

  return selected;
}
