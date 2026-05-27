import type { CreatorSpecialization } from "./creator-tags";
import type { CategoryName } from "./types";

export type EcosystemColorKey =
  | CreatorSpecialization
  | CategoryName;

export const ecosystemColors: Record<string, string> = {
  "AI Coding": "#06B6D4",
  "AI Agents": "#8B5CF6",
  "AI Automation": "#14B8A6",
  "AI Workflow": "#6366F1",
  "AI Workflows": "#6366F1",
  "AI Productivity": "#22C55E",
  "AI Design": "#EC4899",
  "AI Image": "#F59E0B",
  "AI Video": "#10B981",
  "AI Marketing": "#F43F5E",
  "AI Research": "#A855F7",
  "AI Infrastructure": "#2563EB",
  "AI Voice": "#06B6D4",
  "AI Search": "#84CC16",
  "Open Source AI": "#F97316",
  "AI Trading": "#22C55E",
  "AI Gaming": "#A855F7",
  "AI 3D Modeling": "#0EA5E9",

  "AI Meeting": "#0F766E",
  "AI Audio": "#0891B2",
  "AI Music": "#C084FC",
  "AI Avatars": "#F97316",
  "AI Development": "#2563EB",
  "AI Analytics": "#7C3AED",
  "AI Education": "#D97706",
  "AI Writing": "#6B7280",
  "AI Sales": "#059669",
  "AI Customer Support": "#0284C7"
};

export function ecosystemColorFor(key: string) {
  return ecosystemColors[key] ?? "#64748B";
}

export function ecosystemColorStyle(key: string) {
  return { "--ecosystem-color": ecosystemColorFor(key), "--tag-color": ecosystemColorFor(key) } as Record<string, string>;
}
