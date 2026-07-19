import type {
  AttentionFeedItem,
  AttentionSubCategory,
  BoostTier,
  Category,
  CategoryName,
  CreatorClaimRequest,
  CreatorProfile,
  CreatorToolRelationship,
  DiscoveryEdge,
  FeatureFlag,
  MicroWorkflow,
  MicroWorkflowToolRelationship,
  MovementEvent,
  ProductClaimRequest,
  PromotionPlacement,
  Tool,
  ToolEvidenceSource,
  Workflow,
  WorkflowMicroWorkflowRelationship,
  WorkflowToolRelationship
} from "./types";

const placeholderIcon = (label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#071015"/><rect x="5" y="5" width="118" height="118" fill="none" stroke="#22e58b" stroke-width="4"/><text x="64" y="76" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="800" fill="#46d9ff">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const sparkline = Array.from({ length: 18 }, () => 0);

export const placeholderCategoryNames: CategoryName[] = [
  "Category 1",
  "Category 2",
  "Category 3",
  "Category 4",
  "Category 5",
  "Category 6",
  "Category 7",
  "Category 8"
];

export const placeholderTools: Tool[] = Array.from({ length: 24 }, (_, index) => {
  const number = index + 1;
  const slug = `placeholder-product-${number}`;
  const category = placeholderCategoryNames[index % placeholderCategoryNames.length];
  const lifecycleStates: Tool["lifecycleState"][] = ["Emerging", "Accelerating", "Breaking Out", "Peak Hype", "Stabilizing", "Cooling Off", "Reviving"];

  return {
    id: `tool_${number}`,
    name: `Product ${number}`,
    slug,
    description: "—",
    tagline: "—",
    longDescription: "—",
    category,
    categories: [category],
    rawSourceCategories: [category],
    subCategoryTags: [`Subcategory ${number}`],
    logoUrl: "",
    officialLogoUrl: "",
    faviconUrl: "",
    iconUrl: placeholderIcon("P"),
    logoSource: "generated-fallback",
    websiteUrl: "",
    officialXUrl: "",
    company: "—",
    creatorMetadata: "—",
    pricingType: "paid",
    pricingTiers: ["—"],
    pricingSummary: "—",
    launchDate: "2026-01-01",
    tags: ["—", `placeholder-product-${number}`],
    supportedPlatforms: ["Web"],
    integrations: ["—"],
    apiAvailable: false,
    openSource: false,
    screenshots: [placeholderIcon("—"), placeholderIcon("—")],
    useCases: ["—"],
    relatedTools: [`placeholder-product-${(number % 24) + 1}`, `placeholder-product-${((number + 1) % 24) + 1}`],
    competitors: [`placeholder-product-${((number + 2) % 24) + 1}`],
    lifecycleState: lifecycleStates[index % lifecycleStates.length],
    attentionScore: 0,
    momentumScore: 0,
    creatorScore: 0,
    workflowScore: 0,
    breakoutScore: index % 7 === 2 ? 60 : 0,
    mentions24h: 0,
    mentions7d: 0,
    savesCount: 0,
    growth24h: 0,
    growth7d: 0,
    creatorMentions: 0,
    workflowInclusions: 0,
    searchInterest: 0,
    qualityScore: 0,
    suppressed: false,
    abandoned: false,
    estimatedUsers: 0,
    sizeClass: "Emerging",
    baselineAttention: 0,
    relativeGrowthVsBaseline: 0,
    recentVelocity: 0,
    acceleration: 0,
    organicTrendingScore: 24 - index,
    organicRankingLabel: "Trending",
    listingScore: 0,
    trustedDiscoverySources: [],
    listingStatus: "accepted",
    listingChecks: {
      trustedPlatform: false,
      workingProduct: false,
      identifiableBranding: false,
      clearUseCase: false,
      categoryFit: false,
      freshnessActivity: false,
      publicMetadataCompleteness: false,
      spamSafetyPass: true,
      nonSpam: true,
      publicProductPage: false
    },
    boostEligible: false,
    workflowEligible: true,
    creatorSignalEligible: true,
    sourceUrls: [],
    sourceUrl: "",
    sourceConfidence: 0,
    verificationSignals: ["—"],
    importedFrom: "placeholder",
    importedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    trendHistory: sparkline,
    sparkline
  };
});

export const placeholderCategories: Category[] = placeholderCategoryNames.map((name, index) => ({
  id: `cat_${index + 1}`,
  name,
  slug: `category-${index + 1}`,
  description: "—",
  momentumScore: 0,
  growth24h: 0,
  growth7d: 0,
  toolsTracked: 0,
  sparkline
}));

export const placeholderAttentionSubCategories: AttentionSubCategory[] = Array.from({ length: 18 }, (_, index) => ({
  id: `subcat_placeholder_${index + 1}`,
  slug: `placeholder-subcategory-${index + 1}`,
  label: index % 2 === 0 ? "Subcategory" : "—",
  color: "#64748B",
  momentumScore: 0,
  growth24h: 0,
  growth7d: 0,
  toolsTracked: 0,
  relatedToolSlugs: [`placeholder-product-${(index % 24) + 1}`]
}));

export const placeholderWorkflowToolRelationships: WorkflowToolRelationship[] = [
  ["placeholder-workflow-1", "placeholder-product-1", "research"],
  ["placeholder-workflow-1", "placeholder-product-2", "generation"],
  ["placeholder-workflow-1", "placeholder-product-3", "editing"],
  ["placeholder-workflow-2", "placeholder-product-4", "automation"],
  ["placeholder-workflow-2", "placeholder-product-5", "publishing"],
  ["placeholder-workflow-2", "placeholder-product-6", "analysis"],
  ["placeholder-workflow-3", "placeholder-product-7", "infrastructure"],
  ["placeholder-workflow-3", "placeholder-product-8", "other"]
].map(([workflowSlug, toolSlug, role], index) => ({
  id: `wtr_placeholder_${index + 1}`,
  workflowSlug,
  toolSlug,
  role: role as WorkflowToolRelationship["role"],
  position: (index % 3) + 1,
  required: index % 3 < 2,
  confidence: 0,
  status: "accepted",
  sourceType: "manual"
}));

export const placeholderWorkflows: Workflow[] = Array.from({ length: 8 }, (_, index) => {
  const number = index + 1;
  const slug = `placeholder-workflow-${number}`;
  const toolSlugs = placeholderWorkflowToolRelationships
    .filter((relationship) => relationship.workflowSlug === slug)
    .map((relationship) => relationship.toolSlug);

  return {
    id: `wf_${number}`,
    name: `Workflow ${number}`,
    slug,
    description: "—",
    outcome: "—",
    toolSlugs: toolSlugs.length ? toolSlugs : [`placeholder-product-${number}`],
    momentumScore: 0,
    growth24h: 0,
    growth7d: 0,
    savesCount: 0,
    creatorUsage: 0,
    sparkline,
    featured: index < 2
  };
});

export const placeholderMicroWorkflows: MicroWorkflow[] = Array.from({ length: 8 }, (_, index) => ({
  id: `mwf_${index + 1}`,
  name: `Micro Workflow ${index + 1}`,
  slug: `placeholder-micro-workflow-${index + 1}`,
  description: "—",
  outcome: "—",
  status: "accepted",
  confidence: 0,
  sourceType: "manual"
}));

export const placeholderWorkflowMicroWorkflowRelationships: WorkflowMicroWorkflowRelationship[] = placeholderMicroWorkflows.map((microWorkflow, index) => ({
  id: `wmwr_placeholder_${index + 1}`,
  workflowSlug: `placeholder-workflow-${(index % 4) + 1}`,
  microWorkflowSlug: microWorkflow.slug,
  position: (index % 3) + 1,
  required: index % 3 < 2,
  confidence: 0,
  status: "accepted",
  sourceType: "manual"
}));

export const placeholderMicroWorkflowToolRelationships: MicroWorkflowToolRelationship[] = placeholderMicroWorkflows.flatMap((microWorkflow, index) => [
  {
    id: `mwtr_placeholder_${index + 1}_a`,
    microWorkflowSlug: microWorkflow.slug,
    toolSlug: `placeholder-product-${(index % 8) + 1}`,
    position: 1,
    required: true,
    confidence: 0,
    status: "accepted" as const,
    sourceType: "manual" as const
  },
  {
    id: `mwtr_placeholder_${index + 1}_b`,
    microWorkflowSlug: microWorkflow.slug,
    toolSlug: `placeholder-product-${((index + 1) % 8) + 1}`,
    position: 2,
    required: false,
    confidence: 0,
    status: "accepted" as const,
    sourceType: "manual" as const
  }
]);

export const placeholderCreators: CreatorProfile[] = Array.from({ length: 8 }, (_, index) => {
  const number = index + 1;
  return {
    id: `creator_placeholder_${number}`,
    name: `Creator ${number}`,
    handle: `placeholder-creator-${number}`,
    xHandle: `placeholder-creator-${number}`,
    avatarUrl: placeholderIcon("C"),
    avatarSourceType: "none",
    avatarVerified: false,
    platform: "TikTok",
    primaryPlatform: "TikTok",
    bio: "—",
    followers: 0,
    followerCount: 0,
    creatorCategory: "—",
    niches: ["—"],
    primarySpecialization: "—",
    specializationTags: ["—"],
    creatorTypes: ["—"],
    platformFocus: ["TikTok"],
    audienceTags: ["—"],
    influenceTags: ["—"],
    workflowTags: [`placeholder-workflow-${(index % 4) + 1}`],
    toolCategoryTags: ["—"],
    tagConfidence: 0,
    tagSource: "manual",
    tagNotes: "—",
    rawImportedTags: [],
    tagInferenceMethod: "placeholder",
    workflowSlugs: [`placeholder-workflow-${(index % 4) + 1}`],
    toolSlugs: [`placeholder-product-${(index % 8) + 1}`, `placeholder-product-${((index + 1) % 8) + 1}`],
    recentMentions: ["—"],
    creatorScore: 0,
    categorySlugs: [`category-${(index % 8) + 1}`],
    rankingPosition: number,
    tiktokUrl: "",
    websiteUrl: "",
    sourceUrl: "",
    importedFrom: "placeholder",
    importedAt: "2026-01-01T00:00:00.000Z",
    status: "accepted",
    listingStatus: "accepted",
    sourceConfidence: 0,
    verificationSignals: ["—"]
  };
});

export const placeholderCreatorToolRelationships: CreatorToolRelationship[] = [
  "uses",
  "teaches",
  "mentions",
  "recommends",
  "builds_with",
  "switched_to",
  "abandoned"
].map((relationshipType, index) => ({
  id: `ctr_placeholder_${index + 1}`,
  creatorId: `creator_placeholder_${(index % 8) + 1}`,
  toolSlug: `placeholder-product-${(index % 8) + 1}`,
  relationshipType: relationshipType as CreatorToolRelationship["relationshipType"],
  validationLayer: index % 2 === 0 ? "observed" : "verified",
  confidence: 0,
  status: "accepted",
  sourceType: "manual",
  sourceUrl: "",
  evidenceText: "—",
  observedAt: "2026-01-01"
}));

export const placeholderToolEvidenceSources: ToolEvidenceSource[] = [
  "x",
  "youtube",
  "github",
  "docs",
  "official",
  "news",
  "newsletter_blog",
  "directory",
  "article",
  "other"
].map((sourceType, index) => ({
  id: `evidence_placeholder_${index + 1}`,
  toolId: `tool_${(index % 8) + 1}`,
  toolSlug: `placeholder-product-${(index % 8) + 1}`,
  workflowId: `wf_${(index % 4) + 1}`,
  workflowSlug: `placeholder-workflow-${(index % 4) + 1}`,
  sourceType: sourceType as ToolEvidenceSource["sourceType"],
  sourceTitle: "—",
  sourceAuthor: "—",
  sourceUrl: "#",
  canonicalUrl: "#",
  sourceImageUrl: placeholderIcon("S"),
  sourcePublishedAt: "2026-01-01",
  detectedAt: "2026-01-01T00:00:00.000Z",
  matchedTools: [`Product ${(index % 8) + 1}`, `Product ${((index + 1) % 8) + 1}`],
  snippet: "—",
  platformLabel: "Source",
  previewFetchedAt: "2026-01-01T00:00:00.000Z"
}));

export const placeholderMovementEvents: MovementEvent[] = [
  "creator_spike",
  "launch",
  "workflow_spread",
  "category_shift"
].map((eventType, index) => ({
  id: `event_placeholder_${index + 1}`,
  toolSlug: `placeholder-product-${index + 1}`,
  workflowSlug: `placeholder-workflow-${index + 1}`,
  categorySlug: `category-${index + 1}`,
  title: "—",
  description: "—",
  eventType: eventType as MovementEvent["eventType"],
  sourceUrl: "#",
  timestamp: "—"
}));

export const placeholderAttentionFeed: AttentionFeedItem[] = [
  { id: "feed_placeholder_1", title: "—", description: "—", severity: "high", entityType: "tool", entitySlug: "placeholder-product-1", timestamp: "—" },
  { id: "feed_placeholder_2", title: "—", description: "—", severity: "medium", entityType: "workflow", entitySlug: "placeholder-workflow-1", timestamp: "—" },
  { id: "feed_placeholder_3", title: "—", description: "—", severity: "low", entityType: "category", entitySlug: "category-1", timestamp: "—" },
  { id: "feed_placeholder_4", title: "—", description: "—", severity: "medium", entityType: "creator", entitySlug: "creator_placeholder_1", timestamp: "—" }
];

export const placeholderDiscoveryEdges: DiscoveryEdge[] = [
  { id: "edge_placeholder_1", fromSlug: "placeholder-product-1", toSlug: "placeholder-product-2", relationship: "also_viewed", strength: 0, narrative: "—", reason: "—", evidenceSource: "placeholder" },
  { id: "edge_placeholder_2", fromSlug: "placeholder-product-2", toSlug: "placeholder-product-3", relationship: "creator_overlap", strength: 0, narrative: "—", reason: "—", evidenceSource: "placeholder" },
  { id: "edge_placeholder_3", fromSlug: "placeholder-product-3", toSlug: "placeholder-product-4", relationship: "workflow_overlap", strength: 0, narrative: "—", reason: "—", evidenceSource: "placeholder" },
  { id: "edge_placeholder_4", fromSlug: "placeholder-product-4", toSlug: "placeholder-product-5", relationship: "migration", strength: 0, narrative: "—", reason: "—", evidenceSource: "placeholder" },
  { id: "edge_placeholder_5", fromSlug: "placeholder-product-5", toSlug: "placeholder-product-6", relationship: "ecosystem", strength: 0, narrative: "—", reason: "—", evidenceSource: "placeholder" }
];

export const placeholderFeatureFlags: FeatureFlag[] = [
  { id: "flag_placeholder_1", name: "Feature", key: "placeholder_feature", enabled: true, description: "—" },
  { id: "flag_placeholder_2", name: "Feature", key: "placeholder_feature_secondary", enabled: false, description: "—" }
];

export const placeholderPromotionPlacements: PromotionPlacement[] = Array.from({ length: 4 }, (_, index) => ({
  id: `promo_placeholder_${index + 1}`,
  toolSlug: `placeholder-product-${index + 1}`,
  label: "—",
  sponsorName: "—",
  placement: index === 3 ? "homepage_panel" : "top_rail",
  priorityWeight: 0,
  momentumLift: 0,
  impressions: 0,
  ctr: 0,
  startsAt: "2026-01-01",
  expiresAt: "2026-01-01",
  status: "active"
}));

export const placeholderBoostTiers: BoostTier[] = ["10x", "30x", "50x", "100x", "500x"].map((label, index) => ({
  id: `boost_placeholder_${index + 1}`,
  label,
  multiplier: Number.parseInt(label, 10),
  price: "—",
  duration: "—",
  description: "—",
  placementSlots: ["—"]
}));

export const placeholderCanonicalAliases = [
  { alias: "Product 1", canonical: "Product 1", slug: "placeholder-product-1" }
];

export const placeholderIngestionSources = [
  { id: "src_placeholder_1", sourceName: "Source", sourceType: "placeholder", url: "#", enabled: false, lastCheckedAt: "—" },
  { id: "src_placeholder_2", sourceName: "Source", sourceType: "placeholder", url: "#", enabled: false, lastCheckedAt: "—" }
];

export const placeholderCreatorClaimRequests: CreatorClaimRequest[] = [
  {
    id: "creator_claim_placeholder_1",
    creatorId: "creator_placeholder_1",
    name: "Creator 1",
    email: "placeholder@example.com",
    socialProofUrl: "#",
    preferredProfileUrl: "/creators/creator_placeholder_1",
    note: "—",
    status: "pending_review",
    submittedAt: "2026-01-01T00:00:00.000Z"
  }
];

export const placeholderProductClaimRequests: ProductClaimRequest[] = [
  {
    id: "product_claim_placeholder_1",
    toolSlug: "placeholder-product-1",
    requesterName: "—",
    workEmail: "placeholder@example.com",
    role: "—",
    websiteUrl: "#",
    claimProof: "—",
    note: "—",
    status: "pending_review",
    submittedAt: "2026-01-01T00:00:00.000Z"
  }
];

export const placeholderNarratives = ["—", "—", "—", "—"];
