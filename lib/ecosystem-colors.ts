import type { CreatorSpecialization } from "./creator-tags";
import type { CategoryName } from "./types";

export type EcosystemColorKey =
  | CreatorSpecialization
  | CategoryName;

export const ecosystemColors: Record<string, string> = {};

export function ecosystemColorFor(key: string) {
  return ecosystemColors[key] ?? "#64748B";
}

export function ecosystemColorStyle(key: string) {
  return { "--ecosystem-color": ecosystemColorFor(key), "--tag-color": ecosystemColorFor(key) } as Record<string, string>;
}
