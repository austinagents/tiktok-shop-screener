import Link from "next/link";
import { ecosystemColorStyle } from "@/lib/ecosystem-colors";
import { displayCategory } from "@/lib/format";
import type { Tool } from "@/lib/types";
import { MovementBadge } from "./movement-badge";
import { Sparkline } from "./sparkline";
import { ToolLogo } from "./tool-logo";

const categoryClass = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const lifecycleClass = (lifecycle: string) => lifecycle.toLowerCase().replace(/\s/g, "-");

export function ToolTable({ tools, compact = false, focused = false }: { tools: Tool[]; compact?: boolean; focused?: boolean }) {
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
            <th>24h</th>
            {!focused && <th>7d</th>}
            {!compact && <th>Creators</th>}
            {!compact && <th>Mentions</th>}
            {!compact && <th>Saves</th>}
            <th>Lifecycle</th>
            {!compact && !focused && <th>Flows</th>}
            {!compact && !focused && <th>Why moving</th>}
            {!focused && <th>Sparkline</th>}
          </tr>
        </thead>
        <tbody>
          {tools.map((tool, index) => (
            <tr className={tool.lifecycleState === "Breaking Out" ? "breakoutRow" : ""} key={tool.id}>
              <td className="rank" data-label="Rank"><span className="rankMove">↗</span>#{index + 1}</td>
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
              <td data-label="24h"><MovementBadge value={tool.growth24h} /></td>
              {!focused && <td data-label="7d"><MovementBadge value={tool.growth7d} /></td>}
              {!compact && <td data-label="Creators"><span className="signalCount">{tool.creatorMentions}</span></td>}
              {!compact && <td data-label="Mentions">{tool.mentions24h.toLocaleString()}</td>}
              {!compact && <td data-label="Saves">{tool.savesCount.toLocaleString()}</td>}
              <td data-label="Lifecycle"><span className={`lifecycle ${lifecycleClass(tool.lifecycleState)}`}>{tool.lifecycleState}</span></td>
              {!compact && !focused && <td data-label="Flows"><span className="signalCount">{tool.workflowInclusions}</span></td>}
              {!compact && !focused && <td data-label="Why"><span className="whyPill">{reasonFor(tool)}</span></td>}
              {!focused && <td data-label="Sparkline"><Sparkline data={tool.sparkline} tone={tool.growth24h < 0 ? "red" : "green"} /></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function reasonFor(tool: Tool) {
  if (tool.creatorMentions > 70) return "ecosystem spike";
  if (tool.workflowInclusions >= 6) return "workflow spread";
  if (tool.growth24h > 45) return "acceleration";
  if (tool.searchInterest > 80) return "search lift";
  if (tool.growth24h < 0) return "cooling";
  return "steady climb";
}
