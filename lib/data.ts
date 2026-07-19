import { calculateMomentumScore, getLifecycle, isBreakingOut, normalizeProductDisplayName } from "./momentum";
import { attentionSubCategoryLabels, canonicalAttentionSubCategories } from "./attention-subcategories";
import { logoAssets } from "./logo-assets";
import { normalizeAudienceTags, normalizeCreatorSpecializations, normalizeCreatorTypes, normalizeInfluenceTags, normalizePlatformFocus, primarySpecializationFrom } from "./creator-tags";
import { calculateListingScore, listingChecksForSeed, listingStatusFromChecks, trustedSourceUrls, trustedSourcesForSeed } from "./listing-policy";
import { breakingOutScoreFor, estimateUsers, organicRankingLabel, organicTrendingScoreFor, rankingModeSort, sizeClassForUsers } from "./ranking";
import { placeholderAttentionFeed, placeholderAttentionSubCategories, placeholderBoostTiers, placeholderCanonicalAliases, placeholderCategories, placeholderCategoryNames, placeholderCreatorClaimRequests, placeholderCreators, placeholderCreatorToolRelationships, placeholderDiscoveryEdges, placeholderFeatureFlags, placeholderIngestionSources, placeholderMicroWorkflowToolRelationships, placeholderMicroWorkflows, placeholderMovementEvents, placeholderProductClaimRequests, placeholderPromotionPlacements, placeholderToolEvidenceSources, placeholderTools, placeholderWorkflowMicroWorkflowRelationships, placeholderWorkflowToolRelationships, placeholderWorkflows } from "./placeholder-data";
import type { AttentionFeedItem, AttentionSubCategory, BoostTier, Category, CategoryName, ClaimStatus, CreatorClaimRequest, CreatorProfile, CreatorSignal, CreatorToolRelationship, CreatorWorkflowRelationship, DiscoveryEdge, FeatureFlag, LogoSource, MicroWorkflow, MicroWorkflowToolRelationship, MovementEvent, Platform, PricingType, ProductClaimRequest, PromotionPlacement, Tool, ToolEvidenceSource, ToolEvidenceSourceType, ToolEvidenceTier, Workflow, WorkflowMicroWorkflowRelationship, WorkflowToolRelationship } from "./types";

const categoryNames: CategoryName[] = placeholderCategoryNames;

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const xProfileUrl = (handle = "") => {
  const cleanHandle = handle.replace(/^@/, "").trim();
  return cleanHandle ? `https://x.com/${cleanHandle}` : "";
};
const domainFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "tiktok-shop-screener.local";
  }
};
const logo = (name: string, websiteUrl: string) => `https://logo.clearbit.com/${domainFromUrl(websiteUrl)}?size=128`;
const fallbackIcon = (name: string) => {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#071015"/><rect x="5" y="5" width="118" height="118" fill="none" stroke="#22e58b" stroke-width="4"/><text x="64" y="76" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="800" fill="#46d9ff">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const wave = (seed: number, start = 24) => Array.from({ length: 18 }, (_, index) => Math.max(8, Math.round(start + Math.sin((index + seed) / 2) * 9 + index * (seed % 5) + (index > 12 ? seed * 1.2 : 0))));
const screenshot = (slug: string, index: number) => `https://placehold.co/960x540/0d1318/46d9ff?text=${slug}+signal+${index}`;
const pricingTypeFor = (summary: string): PricingType => {
  const lower = summary.toLowerCase();
  if (lower.includes("enterprise")) return "enterprise";
  if (lower.includes("waitlist")) return "waitlist";
  if (lower.includes("free") && (lower.includes("pro") || lower.includes("plus") || lower.includes("team") || lower.includes("business"))) return "freemium";
  if (lower.includes("free")) return "free";
  return "paid";
};
const platformsFor = (_category: CategoryName): Platform[] => ["Web"];
const tagsFor = (category: CategoryName, name: string) => [category.toLowerCase(), "catalog monitoring", "workflow tracking", slugify(name)].filter(Boolean);
const useCasesFor = (category: CategoryName) => [`Monitor ${category} movement`, "Track workflow spread", "Compare alternatives"].filter(Boolean);
const importedAtFallback = new Date("2026-05-23T00:00:00.000Z").toISOString();

function ecosystemCategoryForTool(_name: string, category: CategoryName, _description = "", _tags: string[] = [], _useCases: string[] = []): CategoryName {
  return category;
}

function subCategoryTagsForTool(_name: string, _category: CategoryName, _description = "", _tags: string[] = [], _useCases: string[] = []) {
  return [] as string[];
}

type ImportedTaaftTool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline?: string;
  longDescription: string;
  websiteUrl: string;
  category: CategoryName;
  categories: CategoryName[];
  rawSourceCategories: string[];
  tags: string[];
  useCases: string[];
  pricingType: PricingType;
  pricingSummary: string;
  pricingTiers: string[];
  taaftRank: number;
  sourceUrl: string;
  sourceConfidence: number;
  verificationSignals: string[];
  importedFrom: string;
  importedAt: string;
  updatedAt: string;
  listingStatus: "accepted" | "pending_review";
  listingScore: number;
  boostEligible: boolean;
  workflowEligible: boolean;
  creatorSignalEligible: boolean;
  logoUrl: string;
  officialLogoUrl: string;
  faviconUrl: string;
  logoSource: LogoSource;
  baselineAttention: number;
  relativeGrowthVsBaseline: number;
  recentVelocity: number;
  acceleration: number;
  growth24h: number;
  growth7d: number;
  mentions24h: number;
  mentions7d: number;
  savesCount: number;
  creatorMentions: number;
  workflowInclusions: number;
  searchInterest: number;
};

type ImportedCreator = {
  id: string;
  name: string;
  slug: string;
  handle: string;
  xHandle?: string;
  avatarUrl: string;
  avatarSourceType?: CreatorProfile["avatarSourceType"];
  avatarSourceUrl?: string;
  avatarVerified?: boolean;
  bio: string;
  primaryPlatform: CreatorProfile["primaryPlatform"];
  platform: CreatorProfile["platform"];
  xUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  officialWebsite?: string;
  websiteUrl?: string;
  followerCount: number;
  followers: number;
  creatorCategory: string;
  niches: string[];
  primarySpecialization?: string;
  specializationTags?: string[];
  creatorTypes?: string[];
  platformFocus?: string[];
  audienceTags?: string[];
  influenceTags?: string[];
  workflowTags?: string[];
  toolCategoryTags?: string[];
  tagConfidence?: number;
  tagSource?: string;
  tagNotes?: string;
  rawImportedTags?: string[];
  tagInferenceMethod?: string;
  rankingPosition?: number;
  sourceUrl?: string;
  importedFrom?: string;
  importedAt?: string;
  workflowSlugs: string[];
  toolSlugs: string[];
  recentMentions: string[];
  creatorScore: number;
  categorySlugs: string[];
  listingStatus: "accepted" | "pending_review";
  sourceConfidence: number;
  verificationSignals: string[];
  status?: "accepted" | "pending_review";
};

const rawTools: Array<[string, CategoryName, string, string, string, string, number, number, number, number, number, number, number, number]> = [];

const approvedToolXUrls: Record<string, string> = {};

function productTaglineFor(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

const baseTools: Tool[] = rawTools.map((item, index) => {
  const [name, rawCategory, description, websiteUrl, pricingSummary, launchDate, mentions24h, mentions7d, savesCount, growth24h, growth7d, creatorMentions, workflowInclusions, searchInterest] = item;
  const displayName = normalizeProductDisplayName(name);
  const category = ecosystemCategoryForTool(displayName, rawCategory, description);
  const momentumScore = calculateMomentumScore({ growth24h, growth7d, mentions: mentions24h, creatorMentions, saves: savesCount, workflowInclusions });
  const slug = slugify(displayName);
  const approvedXUrl = approvedToolXUrls[slug];
  const subCategoryTags = subCategoryTagsForTool(displayName, category, description);
  const logoAsset = logoAssets[slug] ?? { officialLogoUrl: "", faviconUrl: "", logoSource: "generated-fallback" as LogoSource };
  const trustedDiscoverySources = trustedSourcesForSeed(index);
  const listingChecks = listingChecksForSeed(trustedDiscoverySources);
  const listingScore = calculateListingScore(listingChecks);
  const listingStatus = listingStatusFromChecks(listingChecks);
  const estimatedUsers = estimateUsers({ slug, mentions24h, mentions7d, savesCount, creatorMentions, searchInterest });
  const sizeClass = sizeClassForUsers(estimatedUsers);
  const trend = organicTrendingScoreFor({ growth24h, growth7d, mentions24h, mentions7d, creatorMentions, workflowInclusions, searchInterest, listingScore, sizeClass, launchDate });
  const base = {
    id: `tool_${index + 1}`,
    name: displayName,
    slug,
    description,
    tagline: productTaglineFor(description),
    longDescription: `${description} The system tracks attention velocity, workflow spread, category rotation, and breakout history so teams can understand why it is moving.`,
    category,
    categories: [category],
    rawSourceCategories: [rawCategory],
    subCategoryTags,
    logoUrl: logo(displayName, websiteUrl),
    officialLogoUrl: logoAsset.officialLogoUrl,
    faviconUrl: logoAsset.faviconUrl,
    iconUrl: fallbackIcon(displayName),
    logoSource: logoAsset.logoSource,
    websiteUrl,
    officialXUrl: approvedXUrl,
    company: displayName.replace(/\sAI$/, ""),
    creatorMetadata: `${displayName} is monitored across creator posts, launch chatter, workflow saves, and ecosystem overlap signals.`,
    pricingType: pricingTypeFor(pricingSummary),
    pricingTiers: pricingSummary.split(",").map((tier) => tier.trim()),
    pricingSummary,
    launchDate,
    tags: [...new Set([...tagsFor(category, displayName), ...subCategoryTags.map((tag) => tag.toLowerCase())])],
    supportedPlatforms: platformsFor(category),
    integrations: ["Web"],
    apiAvailable: searchInterest > 55,
    openSource: ["Bolt", "V0", "Replit"].includes(displayName),
    screenshots: [screenshot(slug, 1), screenshot(slug, 2)],
    useCases: useCasesFor(category),
    relatedTools: [],
    competitors: [],
    lifecycleState: "Emerging",
    attentionScore: Math.min(100, Math.round(mentions24h / 16 + growth24h / 2)),
    momentumScore,
    creatorScore: Math.min(100, Math.round(creatorMentions / 1.35)),
    workflowScore: Math.min(100, workflowInclusions * 12),
    breakoutScore: 0,
    mentions24h,
    mentions7d,
    savesCount,
    growth24h,
    growth7d,
    creatorMentions,
    workflowInclusions,
    searchInterest,
    qualityScore: Math.min(100, Math.round(momentumScore * 0.65 + searchInterest * 0.25 + workflowInclusions * 2)),
    suppressed: false,
    abandoned: growth24h < -10 && growth7d < -5,
    estimatedUsers,
    sizeClass,
    baselineAttention: trend.baselineAttention,
    relativeGrowthVsBaseline: Number(trend.relativeGrowthVsBaseline.toFixed(2)),
    recentVelocity: Number(trend.recentVelocity.toFixed(2)),
    acceleration: Number(trend.acceleration.toFixed(2)),
    organicTrendingScore: trend.organicTrendingScore,
    organicRankingLabel: "Trending",
    listingScore,
    trustedDiscoverySources,
    listingStatus,
    listingChecks,
    boostEligible: listingStatus === "accepted",
    workflowEligible: listingStatus === "accepted",
    creatorSignalEligible: listingStatus === "accepted",
    sourceUrls: [websiteUrl, approvedXUrl, ...trustedSourceUrls(slug, trustedDiscoverySources)].filter(Boolean),
    sourceUrl: trustedSourceUrls(slug, trustedDiscoverySources).find((url) => url.includes("theresanaiforthat.com")) ?? trustedSourceUrls(slug, trustedDiscoverySources)[0],
    sourceConfidence: listingStatus === "accepted" ? 96 : 55,
    verificationSignals: [
      "trusted_directory_presence",
      "working_url_present",
      "brand_asset_present",
      "category_present"
    ],
    importedFrom: "base-local",
    importedAt: importedAtFallback,
    updatedAt: importedAtFallback,
    trendHistory: wave(index + 3, Math.max(16, Math.round(momentumScore / 2))),
    sparkline: wave(index + 3, Math.max(16, Math.round(momentumScore / 2)))
  } satisfies Tool;
  const withLifecycle = { ...base, lifecycleState: getLifecycle(base) };
  const withBreakout = { ...withLifecycle, breakoutScore: breakingOutScoreFor(withLifecycle) };
  return { ...withBreakout, organicRankingLabel: organicRankingLabel(withBreakout) };
});

function importedRecordToTool(record: ImportedTaaftTool, index: number): Tool {
  const displayName = normalizeProductDisplayName(record.name);
  const slug = slugify(displayName);
  const approvedXUrl = approvedToolXUrls[slug];
  const category = ecosystemCategoryForTool(displayName, APP_CATEGORY(record.category), record.description, record.tags, record.useCases);
  const subCategoryTags = subCategoryTagsForTool(displayName, category, record.description, record.tags, record.useCases);
  const logoAsset = logoAssets[slug] ?? logoAssets[record.slug] ?? {
    officialLogoUrl: record.officialLogoUrl,
    faviconUrl: record.faviconUrl,
    logoSource: record.logoSource
  };
  const momentumScore = calculateMomentumScore({
    growth24h: record.growth24h,
    growth7d: record.growth7d,
    mentions: record.mentions24h,
    creatorMentions: record.creatorMentions,
    saves: record.savesCount,
    workflowInclusions: record.workflowInclusions
  });
  const estimatedUsers = estimateUsers({
    slug,
    mentions24h: record.mentions24h,
    mentions7d: record.mentions7d,
    savesCount: record.savesCount,
    creatorMentions: record.creatorMentions,
    searchInterest: record.searchInterest
  });
  const sizeClass = sizeClassForUsers(estimatedUsers);
  const trend = organicTrendingScoreFor({
    growth24h: record.growth24h,
    growth7d: record.growth7d,
    mentions24h: record.mentions24h,
    mentions7d: record.mentions7d,
    creatorMentions: record.creatorMentions,
    workflowInclusions: record.workflowInclusions,
    searchInterest: record.searchInterest,
    listingScore: record.listingScore,
    sizeClass,
    launchDate: "2026-05-23"
  });
  const base = {
    id: record.id || `taaft_${index + 1}`,
    name: displayName,
    slug,
    description: record.description,
    tagline: productTaglineFor(record.tagline ?? record.description),
    longDescription: record.longDescription,
    category,
    categories: [...new Set([category, ...(record.categories?.map(APP_CATEGORY) ?? [])])],
    rawSourceCategories: record.rawSourceCategories ?? [],
    subCategoryTags,
    logoUrl: record.logoUrl || logo(displayName, record.websiteUrl),
    officialLogoUrl: logoAsset.officialLogoUrl,
    faviconUrl: logoAsset.faviconUrl,
    iconUrl: fallbackIcon(displayName),
    logoSource: logoAsset.logoSource,
    websiteUrl: record.websiteUrl,
    officialXUrl: approvedXUrl,
    company: displayName.replace(/\sAI$/, ""),
    creatorMetadata: `${displayName} is tracked from trusted discovery presence, category fit, and emerging attention signals.`,
    pricingType: record.pricingType,
    pricingTiers: record.pricingTiers?.length ? record.pricingTiers : [record.pricingSummary],
    pricingSummary: record.pricingSummary,
    launchDate: "2026-05-23",
    tags: [...new Set([...(record.tags?.length ? record.tags : tagsFor(category, displayName)), ...subCategoryTags.map((tag) => tag.toLowerCase())])],
    supportedPlatforms: platformsFor(category),
    integrations: ["Web"],
    apiAvailable: record.searchInterest > 65,
    openSource: false,
    screenshots: [screenshot(slug, 1), screenshot(slug, 2)],
    useCases: record.useCases?.length ? record.useCases : useCasesFor(category),
    relatedTools: [],
    competitors: [],
    lifecycleState: "Emerging",
    attentionScore: Math.min(100, Math.round(record.mentions24h / 16 + record.growth24h / 2)),
    momentumScore,
    creatorScore: Math.min(100, Math.round(record.creatorMentions / 1.35)),
    workflowScore: Math.min(100, record.workflowInclusions * 12),
    breakoutScore: 0,
    mentions24h: record.mentions24h,
    mentions7d: record.mentions7d,
    savesCount: record.savesCount,
    growth24h: record.growth24h,
    growth7d: record.growth7d,
    creatorMentions: record.creatorMentions,
    workflowInclusions: record.workflowInclusions,
    searchInterest: record.searchInterest,
    qualityScore: Math.min(100, Math.round(momentumScore * 0.52 + record.sourceConfidence * 0.28 + record.searchInterest * 0.16 + record.workflowInclusions)),
    suppressed: record.listingStatus !== "accepted",
    abandoned: record.growth24h < -10 && record.growth7d < -5,
    estimatedUsers,
    sizeClass,
    baselineAttention: record.baselineAttention || trend.baselineAttention,
    relativeGrowthVsBaseline: Number((record.relativeGrowthVsBaseline || trend.relativeGrowthVsBaseline).toFixed(2)),
    recentVelocity: Number((record.recentVelocity || trend.recentVelocity).toFixed(2)),
    acceleration: Number((record.acceleration || trend.acceleration).toFixed(2)),
    organicTrendingScore: Math.max(record.taaftRank <= 25 ? 48 : 0, trend.organicTrendingScore),
    organicRankingLabel: "Trending",
    listingScore: record.listingScore,
    trustedDiscoverySources: [],
    listingStatus: record.listingStatus,
    listingChecks: {
      trustedPlatform: true,
      workingProduct: Boolean(record.websiteUrl),
      identifiableBranding: Boolean(record.officialLogoUrl),
      clearUseCase: Boolean(record.description),
      categoryFit: Boolean(record.category),
      freshnessActivity: true,
      publicMetadataCompleteness: record.sourceConfidence >= 85,
      spamSafetyPass: true,
      nonSpam: true,
      publicProductPage: Boolean(record.sourceUrl)
    },
    boostEligible: record.boostEligible,
    workflowEligible: record.workflowEligible,
    creatorSignalEligible: record.creatorSignalEligible,
    sourceUrls: [record.websiteUrl, approvedXUrl, record.sourceUrl].filter(Boolean),
    sourceUrl: record.sourceUrl,
    sourceConfidence: record.sourceConfidence,
    verificationSignals: record.verificationSignals,
    importedFrom: record.importedFrom,
    importedAt: record.importedAt,
    updatedAt: record.updatedAt,
    taaftRank: record.taaftRank,
    trendHistory: wave(index + 41, Math.max(14, Math.round(momentumScore / 2))),
    sparkline: wave(index + 41, Math.max(14, Math.round(momentumScore / 2)))
  } satisfies Tool;
  const withLifecycle = { ...base, lifecycleState: getLifecycle(base) };
  const withBreakout = { ...withLifecycle, breakoutScore: breakingOutScoreFor(withLifecycle) };
  return { ...withBreakout, organicRankingLabel: organicRankingLabel(withBreakout) };
}

function APP_CATEGORY(category: string): CategoryName {
  return categoryNames.includes(category as CategoryName) ? category as CategoryName : "";
}

const importedTools: Tool[] = [];
const baseDomains = new Set(baseTools.map((tool) => domainFromUrl(tool.websiteUrl)).filter(Boolean));
const baseSlugs = new Set(baseTools.map((tool) => tool.slug));
const mergedBaseTools = baseTools.map((baseTool) => {
  const baseDomain = domainFromUrl(baseTool.websiteUrl);
  const imported = importedTools.find((tool) => tool.slug === baseTool.slug || (baseDomain && domainFromUrl(tool.websiteUrl) === baseDomain));
  if (!imported) return baseTool;
  return {
    ...baseTool,
    tagline: productTaglineFor(baseTool.tagline || imported.tagline || baseTool.description || imported.description),
    categories: [...new Set([...baseTool.categories, ...imported.categories])],
    rawSourceCategories: [...new Set([...baseTool.rawSourceCategories, ...imported.rawSourceCategories])],
    tags: [...new Set([...baseTool.tags, ...imported.tags])].slice(0, 12),
    useCases: [...new Set([...baseTool.useCases, ...imported.useCases])].slice(0, 8),
    subCategoryTags: [...new Set([...baseTool.subCategoryTags, ...imported.subCategoryTags])].slice(0, 6),
    sourceUrls: [...new Set([...baseTool.sourceUrls, ...imported.sourceUrls])],
    sourceUrl: imported.sourceUrl,
    sourceConfidence: Math.max(baseTool.sourceConfidence, imported.sourceConfidence),
    verificationSignals: [...new Set([...baseTool.verificationSignals, ...imported.verificationSignals])],
    importedFrom: "base-local",
    importedAt: baseTool.importedAt,
    updatedAt: imported.updatedAt,
    taaftRank: imported.taaftRank,
    trustedDiscoverySources: [...baseTool.trustedDiscoverySources]
  };
});

export const importStats = {
  totalImportedProducts: importedTools.length,
  acceptedImportedProducts: importedTools.filter((tool) => tool.listingStatus === "accepted").length,
  pendingReviewProducts: importedTools.filter((tool) => tool.listingStatus === "pending_review").length,
  duplicateMergeCount: importedTools.filter((tool) => baseSlugs.has(tool.slug) || baseDomains.has(domainFromUrl(tool.websiteUrl))).length,
  logoFallbackCount: importedTools.filter((tool) => tool.logoSource === "generated-fallback").length,
  sourceCoverage: "no seeded sources configured"
};

export const tools: Tool[] = placeholderTools;

const toolsByCategory = (category: CategoryName, slug: string) => tools.filter((tool) => tool.category === category && tool.slug !== slug).slice(0, 4).map((tool) => tool.slug);
tools.forEach((tool) => {
  tool.relatedTools = toolsByCategory(tool.category, tool.slug);
  tool.competitors = [...tools].filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug).sort((a, b) => Math.abs(a.momentumScore - tool.momentumScore) - Math.abs(b.momentumScore - tool.momentumScore)).slice(0, 3).map((candidate) => candidate.slug);
});

export const categories: Category[] = placeholderCategories;

export const attentionSubCategories: AttentionSubCategory[] = placeholderAttentionSubCategories;

const workflowSeeds: Array<[string, string, string[], number, number, number, number, number]> = [];

function workflowToolRoleFor(workflowSlug: string, toolSlug: string): WorkflowToolRelationship["role"] {
  void workflowSlug;
  void toolSlug;
  return "other";
}

export const workflowToolRelationships: WorkflowToolRelationship[] = placeholderWorkflowToolRelationships;

function acceptedWorkflowToolSlugs(workflowSlug: string) {
  return workflowToolRelationships
    .filter((relationship) => relationship.status === "accepted" && relationship.workflowSlug === workflowSlug)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .map((relationship) => relationship.toolSlug);
}

export const workflows: Workflow[] = placeholderWorkflows;

const microWorkflowSeeds: Array<[string, string, string]> = [];

export const microWorkflows: MicroWorkflow[] = placeholderMicroWorkflows;

const workflowMicroWorkflowSeeds: Record<string, string[]> = {};

export const workflowMicroWorkflowRelationships: WorkflowMicroWorkflowRelationship[] = placeholderWorkflowMicroWorkflowRelationships;

const microWorkflowToolSeeds: Record<string, string[]> = {};

export const microWorkflowToolRelationships: MicroWorkflowToolRelationship[] = placeholderMicroWorkflowToolRelationships;

export const movementEvents: MovementEvent[] = placeholderMovementEvents;

export const creatorToolRelationships: CreatorToolRelationship[] = placeholderCreatorToolRelationships;

function isAdoptionRelationship(relationship: CreatorToolRelationship) {
  return relationship.relationshipType === "uses" || relationship.relationshipType === "teaches";
}

function acceptedCreatorToolSlugs(creatorId: string) {
  return creatorToolRelationships
    .filter((relationship) => relationship.status === "accepted" && relationship.creatorId === creatorId && isAdoptionRelationship(relationship))
    .map((relationship) => relationship.toolSlug)
    .filter((toolSlug) => tools.some((tool) => tool.slug === toolSlug));
}

export const creatorWorkflowRelationships: CreatorWorkflowRelationship[] = creatorToolRelationships
  .filter((relationship) => relationship.status === "accepted")
  .flatMap((relationship) => {
    const creatorToolSlugs = acceptedCreatorToolSlugs(relationship.creatorId);
    return workflows
      .map((workflow) => {
        const supportingToolSlugs = workflow.toolSlugs.filter((toolSlug) => creatorToolSlugs.includes(toolSlug));
        return { workflow, supportingToolSlugs };
      })
      .filter(({ workflow, supportingToolSlugs }) => supportingToolSlugs.length >= Math.min(2, workflow.toolSlugs.length))
      .map(({ workflow, supportingToolSlugs }) => ({
        id: `cwr_${relationship.creatorId.replace(/^creator_/, "")}_${workflow.slug}`,
        creatorId: relationship.creatorId,
        workflowSlug: workflow.slug,
        relationshipType: "inferred_from_tools" as const,
        confidence: supportingToolSlugs.length >= 3 ? 88 : 82,
        status: "accepted" as const,
        sourceType: "derived" as const,
        evidenceText: "Derived from accepted creator-tool relationships overlapping this workflow stack.",
        supportingToolSlugs
      }));
  })
  .filter((relationship, index, relationships) => relationships.findIndex((item) => item.id === relationship.id) === index);

function acceptedCreatorWorkflowSlugs(creatorId: string) {
  return creatorWorkflowRelationships
    .filter((relationship) => relationship.status === "accepted" && relationship.creatorId === creatorId)
    .map((relationship) => relationship.workflowSlug);
}

export const importedCreators: CreatorProfile[] = placeholderCreators;

export const creators: CreatorProfile[] = importedCreators.filter((creator) => creator.listingStatus === "accepted");
export const creatorIntelligenceStatus = {
  imported: importedCreators.length,
  accepted: creators.length,
  pendingReview: importedCreators.filter((creator) => creator.listingStatus === "pending_review").length,
  publicReady: creators.length >= 3
};

export const creatorSignals: CreatorSignal[] = [];

export const toolEvidenceSources: ToolEvidenceSource[] = placeholderToolEvidenceSources;

export const evidenceSourcesForTool = (toolSlug: string) => toolEvidenceSources.filter((source) => source.toolSlug === toolSlug);

export const discussionEvidenceSourceTypes: ToolEvidenceSourceType[] = ["x", "youtube", "github", "news", "newsletter_blog", "article"];
export const referenceEvidenceSourceTypes: ToolEvidenceSourceType[] = ["official", "docs", "directory"];

export const evidenceTierForSourceType = (sourceType: ToolEvidenceSourceType): ToolEvidenceTier => {
  if (discussionEvidenceSourceTypes.includes(sourceType)) return "discussion";
  if (referenceEvidenceSourceTypes.includes(sourceType)) return "reference";
  return "other";
};

export const evidenceTierCountsForTool = (toolSlug: string) => {
  const sources = evidenceSourcesForTool(toolSlug);
  return {
    discussionEvidenceCount: sources.filter((source) => evidenceTierForSourceType(source.sourceType) === "discussion").length,
    referenceEvidenceCount: sources.filter((source) => evidenceTierForSourceType(source.sourceType) === "reference").length,
    otherEvidenceCount: sources.filter((source) => evidenceTierForSourceType(source.sourceType) === "other").length
  };
};

export const creatorClaimRequests: CreatorClaimRequest[] = placeholderCreatorClaimRequests;

export const productClaimRequests: ProductClaimRequest[] = placeholderProductClaimRequests;

export function creatorClaimStatus(creatorId: string): ClaimStatus {
  const request = creatorClaimRequests.find((claim) => claim.creatorId === creatorId);
  if (!request) return "unclaimed";
  if (request.status === "approved") return "claimed";
  if (request.status === "pending_review") return "pending";
  return "unclaimed";
}

export function productClaimStatus(toolSlug: string): ClaimStatus {
  const request = productClaimRequests.find((claim) => claim.toolSlug === toolSlug);
  if (!request) return "unclaimed";
  if (request.status === "approved") return "claimed";
  if (request.status === "pending_review") return "pending";
  return "unclaimed";
}

export const attentionFeed: AttentionFeedItem[] = placeholderAttentionFeed;

function overlapCount(a: string[], b: string[]) {
  const bSet = new Set(b.map((item) => item.toLowerCase()));
  return a.reduce((count, item) => count + (bSet.has(item.toLowerCase()) ? 1 : 0), 0);
}

function deriveDiscoveryEdges(sourceTools: Tool[]) {
  const edges: DiscoveryEdge[] = [];
  const candidates = sourceTools
    .filter((tool) => tool.listingStatus === "accepted" && !tool.suppressed)
    .slice(0, 140);

  for (const tool of candidates) {
    const scored = candidates
      .filter((candidate) => candidate.slug !== tool.slug)
      .map((candidate) => {
        const tagOverlap = overlapCount(tool.tags, candidate.tags);
        const useCaseOverlap = overlapCount(tool.useCases, candidate.useCases);
        const categoryMatch = tool.category === candidate.category ? 1 : 0;
        const score = categoryMatch * 34 + tagOverlap * 11 + useCaseOverlap * 14 + Math.max(0, 18 - Math.abs(tool.organicTrendingScore - candidate.organicTrendingScore) / 3);
        return { candidate, score, tagOverlap, useCaseOverlap, categoryMatch };
      })
      .filter((item) => item.score >= 42)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    for (const item of scored) {
      const id = [tool.slug, item.candidate.slug].sort().join("__");
      if (edges.some((edge) => edge.id === `derived_${id}`)) continue;
      const relationship = item.useCaseOverlap > 0 ? "workflow_overlap" : item.categoryMatch ? "ecosystem" : "also_viewed";
      const reason = item.useCaseOverlap > 0
        ? "shared use case and category pressure"
        : item.categoryMatch
          ? "shared category and similar momentum band"
          : "tag overlap and adjacent discovery behavior";
      edges.push({
        id: `derived_${id}`,
        fromSlug: tool.slug,
        toSlug: item.candidate.slug,
        fromToolId: tool.id,
        toToolId: item.candidate.id,
        relationship,
        strength: Math.min(95, Math.round(item.score)),
        narrative: `${tool.name} and ${item.candidate.name} show adjacent attention based on ${reason}.`,
        reason,
        evidenceSource: "derived_from_categories_tags_use_cases"
      });
    }
  }

  return edges.slice(0, 220);
}

const curatedDiscoveryEdges: DiscoveryEdge[] = placeholderDiscoveryEdges;

export const discoveryEdges: DiscoveryEdge[] = [
  ...curatedDiscoveryEdges,
  ...deriveDiscoveryEdges(tools).filter((edge) => !curatedDiscoveryEdges.some((curated) => {
    const curatedPair = [curated.fromSlug, curated.toSlug].sort().join("__");
    const edgePair = [edge.fromSlug, edge.toSlug].sort().join("__");
    return curatedPair === edgePair;
  }))
];

export const featureFlags: FeatureFlag[] = placeholderFeatureFlags;

export const promotionPlacements: PromotionPlacement[] = placeholderPromotionPlacements;

export const boostTiers: BoostTier[] = placeholderBoostTiers;

export const canonicalAliases: Array<{ alias: string; canonical: string; slug: string }> = placeholderCanonicalAliases;

export const ingestionSources: Array<{ id: string; sourceName: string; sourceType: string; url: string; enabled: boolean; lastCheckedAt: string }> = placeholderIngestionSources;

export const liveMetrics = {
  toolsTracked: tools.length,
  mentions24h: tools.reduce((sum, tool) => sum + tool.mentions24h, 0),
  breakingOut: tools.filter(isBreakingOut).length,
  workflowsTracked: workflows.length,
  creatorSignals: creators.length
};

export const getTool = (slug: string) => tools.find((tool) => tool.slug === slug);
export const getCategory = (slug: string) => categories.find((category) => category.slug === slug);
export const getWorkflow = (slug: string) => workflows.find((workflow) => workflow.slug === slug);
export const toolsForWorkflow = (workflow: Workflow) => workflow.toolSlugs.map(getTool).filter(Boolean) as Tool[];
export const microWorkflowsForWorkflow = (workflowSlug: string) =>
  workflowMicroWorkflowRelationships
    .filter((relationship) => relationship.status === "accepted" && relationship.workflowSlug === workflowSlug)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .map((relationship) => microWorkflows.find((microWorkflow) => microWorkflow.slug === relationship.microWorkflowSlug))
    .filter(Boolean) as MicroWorkflow[];
export const toolsForMicroWorkflow = (microWorkflowSlug: string) =>
  microWorkflowToolRelationships
    .filter((relationship) => relationship.status === "accepted" && relationship.microWorkflowSlug === microWorkflowSlug)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .map((relationship) => getTool(relationship.toolSlug))
    .filter(Boolean) as Tool[];
export const microWorkflowToolPairsForWorkflow = (workflowSlug: string) =>
  microWorkflowsForWorkflow(workflowSlug).flatMap((microWorkflow) =>
    toolsForMicroWorkflow(microWorkflow.slug).map((tool) => ({ microWorkflow, tool }))
  );
export const categoryTools = (slug: string) => tools.filter((tool) => slugify(tool.category) === slug);
const strictBreakingOutTools = rankingModeSort(tools, "Breaking Out").filter(isBreakingOut);
const accelerationBackfillTools = rankingModeSort(tools, "Breaking Out").filter((tool) => !strictBreakingOutTools.some((item) => item.slug === tool.slug));
export const breakingOutTools = [...strictBreakingOutTools, ...accelerationBackfillTools].slice(0, 8);
export const getCreator = (id: string) => creators.find((creator) => creator.id === id || creator.handle === id);
export const edgesForTool = (slug: string) => discoveryEdges.filter((edge) => edge.fromSlug === slug || edge.toSlug === slug);
export const searchIndex = [
  ...tools.map((tool) => ({ type: "tool" as const, label: tool.name, slug: `/tools/${tool.slug}`, tags: [...tool.tags, ...tool.subCategoryTags].join(" ") })),
  ...workflows.map((workflow) => ({ type: "workflow" as const, label: workflow.name, slug: `/workflows/${workflow.slug}`, tags: workflow.outcome })),
  ...categories.map((category) => ({ type: "category" as const, label: category.name, slug: `/categories/${category.slug}`, tags: category.description })),
  ...creators.map((creator) => ({
    type: "creator" as const,
    label: creator.name,
    slug: `/creators/${creator.id}`,
    tags: `${creator.handle} ${creator.bio} ${creator.specializationTags.join(" ")} ${creator.creatorTypes.join(" ")} ${creator.platformFocus.join(" ")} ${creator.audienceTags.join(" ")} ${creator.influenceTags.join(" ")}`
  }))
];
