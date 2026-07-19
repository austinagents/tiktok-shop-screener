import type { ListingStatus, Tool, TrustedDiscoverySource } from "./types";

export const trustedDiscoverySources: TrustedDiscoverySource[] = [];

export const mvpListingRequirements = [
  "Working product, site, or demo",
  "Identifiable branding or logo",
  "Clear public use case",
  "Non-malicious and non-spam",
  "Usable public product page"
];

export function trustedSourcesForSeed(index: number): TrustedDiscoverySource[] {
  return [];
}

export function trustedSourceUrls(slug: string, sources: TrustedDiscoverySource[]) {
  return sources.map(() => "#");
}

export function listingChecksForSeed(sources: TrustedDiscoverySource[]) {
  return {
    trustedPlatform: sources.some((source) => trustedDiscoverySources.includes(source)),
    workingProduct: true,
    identifiableBranding: true,
    clearUseCase: true,
    categoryFit: true,
    freshnessActivity: true,
    publicMetadataCompleteness: true,
    spamSafetyPass: true,
    nonSpam: true,
    publicProductPage: true
  };
}

export function calculateListingScore(checks: Tool["listingChecks"]) {
  return (
    (checks.trustedPlatform ? 25 : 0) +
    (checks.workingProduct ? 20 : 0) +
    (checks.clearUseCase ? 15 : 0) +
    (checks.identifiableBranding ? 10 : 0) +
    (checks.categoryFit ? 10 : 0) +
    (checks.freshnessActivity ? 10 : 0) +
    (checks.publicMetadataCompleteness ? 5 : 0) +
    (checks.spamSafetyPass ? 5 : 0)
  );
}

export function listingStatusFromChecks(checks: Tool["listingChecks"]): ListingStatus {
  const score = calculateListingScore(checks);
  if (score >= 70) return "accepted";
  return checks.trustedPlatform ? "pending_source" : "rejected";
}
