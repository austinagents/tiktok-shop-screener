import { ecosystemColorFor } from "./ecosystem-colors";

export const creatorSpecializations = [] as const;
export type CreatorSpecialization = string;

export const creatorTypes = [] as const;
export type CreatorType = string;

export const platformFocusTags = [
  "X",
  "YouTube",
  "LinkedIn",
  "TikTok",
  "Newsletter",
  "Website",
  "Multi-platform",
  "Unknown"
] as const;

export type PlatformFocus = (typeof platformFocusTags)[number];

export const audienceTags = [] as const;
export type AudienceTag = string;

export const influenceTags = [] as const;
export type InfluenceTag = string;

export type CreatorTagSource = "manual" | "imported" | "inferred" | "admin_reviewed";

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const unique = <T extends string>(values: T[]) => [...new Set(values)];

export function normalizeCreatorSpecialization(value: string | undefined): CreatorSpecialization | undefined {
  if (!value) return undefined;
  const normalized = normalizeKey(value);
  return creatorSpecializations.find((tag) => normalizeKey(tag) === normalized);
}

export function normalizeCreatorSpecializations(values: Array<string | undefined>): CreatorSpecialization[] {
  return unique(values.flatMap((value) => {
    if (!value) return [];
    return value.split(/[,/|]+/).map((part) => normalizeCreatorSpecialization(part)).filter(Boolean) as CreatorSpecialization[];
  }));
}

export function primarySpecializationFrom(tags: CreatorSpecialization[]): CreatorSpecialization | undefined {
  return tags[0];
}

export function normalizeCreatorTypes(values: Array<string | undefined>): CreatorType[] {
  return unique(values.filter((value): value is CreatorType => creatorTypes.includes(value as never)));
}

export function normalizePlatformFocus(values: Array<string | undefined>): PlatformFocus[] {
  const normalized = unique(values.flatMap((value) => {
    if (!value) return [];
    return platformFocusTags.includes(value as PlatformFocus) ? [value as PlatformFocus] : [];
  }));
  return normalized.length ? normalized : ["Unknown"];
}

export function normalizeAudienceTags(values: Array<string | undefined>): AudienceTag[] {
  return unique(values.filter((value): value is AudienceTag => audienceTags.includes(value as never)));
}

export function normalizeInfluenceTags(values: Array<string | undefined>): InfluenceTag[] {
  return unique(values.filter((value): value is InfluenceTag => influenceTags.includes(value as never)));
}

export function creatorTagSlug(tag: CreatorSpecialization) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function creatorSpecializationFromSlug(slug: string) {
  return creatorSpecializations.find((tag) => creatorTagSlug(tag) === slug);
}

export function creatorTagDisplayLabel(tag: CreatorSpecialization) {
  return tag;
}

export function creatorTagStyle(tag: CreatorSpecialization) {
  return { "--tag-color": ecosystemColorFor(tag), "--ecosystem-color": ecosystemColorFor(tag) } as Record<string, string>;
}
