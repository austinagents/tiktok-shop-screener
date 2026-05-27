"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
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

export function HomeTrendingFilter({ tools, children }: { tools: Tool[]; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("Trending");
  const filteredTools = useMemo(() => {
    if (activeTab === "Trending") return tools.slice(0, 100);
    return tools.filter((tool) => matchesTab(tool, activeTab)).slice(0, 100);
  }, [activeTab, tools]);

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
