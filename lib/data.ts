import { calculateMomentumScore, getLifecycle, isBreakingOut, normalizeProductDisplayName } from "./momentum";
import { attentionSubCategoryLabels, canonicalAttentionSubCategories } from "./attention-subcategories";
import importedPdfCreators from "../data/pdf-x-creators.json";
import importedTaaftTools from "../data/taaft-tools.json";
import importedToolEvidenceSources from "../data/tool-evidence-sources.json";
import { logoAssets } from "./logo-assets";
import { normalizeAudienceTags, normalizeCreatorSpecializations, normalizeCreatorTypes, normalizeInfluenceTags, normalizePlatformFocus, primarySpecializationFrom } from "./creator-tags";
import { calculateListingScore, listingChecksForSeed, listingStatusFromChecks, trustedSourceUrls, trustedSourcesForSeed } from "./listing-policy";
import { breakingOutScoreFor, estimateUsers, organicRankingLabel, organicTrendingScoreFor, rankingModeSort, sizeClassForUsers } from "./ranking";
import type { AttentionFeedItem, AttentionSubCategory, BoostTier, Category, CategoryName, ClaimStatus, CreatorClaimRequest, CreatorProfile, CreatorSignal, CreatorToolRelationship, CreatorWorkflowRelationship, DiscoveryEdge, FeatureFlag, LogoSource, MicroWorkflow, MicroWorkflowToolRelationship, MovementEvent, Platform, PricingType, ProductClaimRequest, PromotionPlacement, Tool, ToolEvidenceSource, ToolEvidenceSourceType, ToolEvidenceTier, Workflow, WorkflowMicroWorkflowRelationship, WorkflowToolRelationship } from "./types";

const categoryNames: CategoryName[] = [
  "AI Video",
  "AI Coding",
  "AI Agents",
  "AI Voice",
  "AI Design",
  "AI Workflow",
  "AI Research",
  "AI Marketing",
  "AI Automation",
  "AI Trading",
  "AI Gaming",
  "AI 3D Modeling",
  "AI Search",
  "AI Infrastructure",
  "AI Image",
  "AI Productivity",
  "AI Meeting",
  "AI Audio",
  "AI Music",
  "AI Avatars",
  "AI Development",
  "AI Analytics",
  "AI Education",
  "AI Writing",
  "AI Sales",
  "AI Customer Support"
];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const xProfileUrl = (handle = "") => {
  const cleanHandle = handle.replace(/^@/, "").trim();
  return cleanHandle ? `https://x.com/${cleanHandle}` : "";
};
const domainFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "appscreener.local";
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
const platformsFor = (category: CategoryName): Platform[] => {
  if (category === "AI Coding") return ["Web", "macOS", "Windows", "VS Code", "API"];
  if (category === "AI Video" || category === "AI Design") return ["Web", "iOS", "API"];
  if (category === "AI Automation" || category === "AI Workflow") return ["Web", "Slack", "Chrome", "API"];
  return ["Web", "iOS", "Android", "API"];
};
const tagsFor = (category: CategoryName, name: string) => [category.replace("AI ", "").toLowerCase(), "ecosystem monitoring", "workflow intelligence", slugify(name)];
const useCasesFor = (category: CategoryName) => [`Monitor ${category} movement`, "Build repeatable workflows", "Track workflow spread", "Compare alternatives"];
const importedAtFallback = new Date("2026-05-23T00:00:00.000Z").toISOString();

function ecosystemCategoryForTool(name: string, category: CategoryName, description = "", tags: string[] = [], useCases: string[] = []): CategoryName {
  const text = `${name} ${description} ${tags.join(" ")} ${useCases.join(" ")}`.toLowerCase();
  if (/\b(3d|3-d|3 dimensional|three dimensional)\b/.test(text)) return "AI 3D Modeling";
  if (/\b(game|gaming|gamelabs)\b/.test(text)) return "AI Gaming";
  if (/\b(trading|trade|stock|stocks|crypto|investing|investment|hedge|market analysis)\b/.test(text)) return "AI Trading";
  if (/\b(avatar|avatars|vtuber|virtual human|digital human)\b/.test(text)) return "AI Avatars";
  return category;
}

function subCategoryTagsForTool(name: string, category: CategoryName, description = "", tags: string[] = [], useCases: string[] = []) {
  const text = `${name} ${category} ${description} ${tags.join(" ")} ${useCases.join(" ")}`.toLowerCase();
  const matches = new Set<string>();
  const add = (label: string, pattern: RegExp) => { if (pattern.test(text)) matches.add(label); };

  add("Websites", /\b(website|web app|landing page|site|frontend|page builder|web builder)\b/);
  add("Mass Email", /\b(email|newsletter|campaign|mail)\b/);
  add("Prediction Markets", /\b(prediction market|forecast|forecasting|probability|market prediction)\b/);
  add("TikTok Clips", /\b(tiktok|short-form|short form|clips?|reels)\b/);
  add("Lead Generation", /\b(lead|prospect|sales|go-to-market|gtm|crm)\b/);
  add("Animation", /\b(animation|animate|motion|avatar video)\b/);
  add("Thumbnails", /\b(thumbnail|cover image|youtube image)\b/);
  add("Trading Bots", /\b(trading bot|trade bot|crypto bot|bot trading)\b/);
  add("GTA 6", /\b(gta 6|gta vi|grand theft auto)\b/);
  add("Whale Tracking", /\b(whale|wallet|on-chain|onchain)\b/);
  add("Cold Outreach", /\b(cold outreach|outreach|sales email|prospecting)\b/);
  add("Market Analysis", /\b(stock|stocks|crypto|market analysis|investing|investment|hedge|research market)\b/);
  add("Research Agents", /\b(research|answer engine|citations?|source grounding|knowledge|notebook)\b/);
  add("Debugging", /\b(debug|debugging|developer|code review|coding|ide|repo)\b/);
  add("3D Assets", /\b(3d|3-d|3 dimensional|three dimensional|asset|model generator)\b/);
  add("Vibe Coding", /\b(vibe coding|prompt-to-app|app builder|code editor|software builder|ui generation|full-stack prototyping)\b/);
  add("AI Employees", /\b(agent|employee|assistant|operator|operations|autonomous)\b/);
  add("Document Analysis", /\b(document|pdf|meeting notes|notes|summaries|transcript)\b/);
  add("Video Editing", /\b(video editing|video editor|edit|dubbing|production|generative video)\b/);
  add("Web Scraping", /\b(scraping|scraper|crawl|crawler|data extraction)\b/);
  add("Customer Support", /\b(customer support|support|helpdesk|ticket|service)\b/);

  if (!matches.size) {
    if (category === "AI Coding" || category === "AI Development") matches.add("Vibe Coding");
    else if (category === "AI Trading") matches.add("Market Analysis");
    else if (category === "AI Gaming") matches.add("GTA 6");
    else if (category === "AI 3D Modeling") matches.add("3D Assets");
    else if (category === "AI Avatars") matches.add("Animation");
    else if (category === "AI Video") matches.add("Video Editing");
    else if (category === "AI Research" || category === "AI Search") matches.add("Research Agents");
    else if (category === "AI Automation" || category === "AI Agents") matches.add("AI Employees");
    else if (category === "AI Marketing" || category === "AI Sales") matches.add("Lead Generation");
    else if (category === "AI Customer Support") matches.add("Customer Support");
    else if (category === "AI Image" || category === "AI Design") matches.add("Thumbnails");
  }

  return [...matches].filter((label) => attentionSubCategoryLabels.includes(label)).slice(0, 4);
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

const rawTools: Array<[string, CategoryName, string, string, string, string, number, number, number, number, number, number, number, number]> = [
  ["ChatGPT", "AI Agents", "General AI assistant with fast-expanding multimodal product surface.", "https://chat.openai.com", "Free, Plus, Team", "2022-11-30", 1420, 10400, 28500, 8, 19, 132, 8, 92],
  ["Claude", "AI Agents", "Reasoning assistant popular for coding, writing, and long-context workflows.", "https://claude.ai", "Free, Pro, Team", "2023-03-14", 1220, 8600, 22100, 16, 31, 118, 8, 88],
  ["Perplexity", "AI Research", "Answer engine used for live research, citations, and market scanning.", "https://www.perplexity.ai", "Free, Pro", "2022-12-07", 890, 6050, 16400, 24, 39, 84, 5, 75],
  ["Cursor", "AI Coding", "AI-native code editor with agentic development workflows.", "https://cursor.com", "Free, Pro, Business", "2023-01-01", 1180, 7900, 19200, 29, 47, 101, 7, 86],
  ["Windsurf", "AI Coding", "Agentic IDE focused on multi-file code generation and developer flow.", "https://windsurf.com", "Free, Pro, Teams", "2024-11-13", 760, 3850, 9500, 53, 82, 67, 5, 78],
  ["Lovable", "AI Coding", "Prompt-to-app builder for shipping web app prototypes quickly.", "https://lovable.dev", "Free, Pro", "2023-12-01", 680, 4020, 8700, 57, 91, 62, 6, 80],
  ["Replit", "AI Coding", "Cloud development workspace with AI coding and deployment features.", "https://replit.com", "Free, Core, Teams", "2016-01-01", 520, 3300, 11800, 11, 22, 34, 4, 64],
  ["Runway", "AI Video", "Generative video platform for creators, studios, and social teams.", "https://runwayml.com", "Free, Standard, Pro", "2018-01-01", 940, 6100, 13900, 28, 52, 76, 5, 81],
  ["Kling", "AI Video", "High-fidelity AI video generation gaining creator attention.", "https://klingai.com", "Free, Pro", "2024-06-01", 790, 3920, 7200, 64, 96, 71, 4, 79],
  ["Pika", "AI Video", "AI video editor and generator built around short-form creative loops.", "https://pika.art", "Free, Standard, Pro", "2023-04-01", 610, 3600, 8500, 21, 34, 55, 4, 68],
  ["ElevenLabs", "AI Voice", "Voice generation, dubbing, and speech tools used across creator workflows.", "https://elevenlabs.io", "Free, Starter, Creator", "2022-01-01", 830, 5200, 14400, 18, 28, 82, 7, 76],
  ["Midjourney", "AI Design", "Image generation community with strong brand and creator mindshare.", "https://www.midjourney.com", "Subscription", "2022-07-12", 970, 7000, 20500, 5, 11, 90, 4, 82],
  ["Ideogram", "AI Design", "Image generation model known for typography and promptable visuals.", "https://ideogram.ai", "Free, Plus, Pro", "2023-08-01", 620, 3510, 8100, 36, 58, 48, 3, 69],
  ["HeyGen", "AI Video", "Avatar video generation and localization tool for marketing teams.", "https://www.heygen.com", "Free, Creator, Team", "2020-01-01", 470, 2900, 6700, 22, 37, 39, 4, 61],
  ["Synthesia", "AI Video", "Enterprise AI avatar video generation platform.", "https://www.synthesia.io", "Starter, Creator, Enterprise", "2017-01-01", 330, 2100, 5100, 6, 14, 22, 2, 51],
  ["Granola", "AI Workflow", "Meeting notes assistant with rising word-of-mouth among operators.", "https://www.granola.ai", "Free, Pro", "2023-10-01", 430, 1980, 4300, 48, 74, 41, 5, 66],
  ["Notion AI", "AI Workflow", "AI writing and knowledge features inside Notion workspaces.", "https://www.notion.so/product/ai", "Add-on", "2023-02-22", 410, 2800, 11200, 9, 18, 31, 5, 57],
  ["Zapier", "AI Automation", "Automation platform adding AI orchestration across business apps.", "https://zapier.com", "Free, Pro, Team", "2012-01-01", 380, 2420, 13400, 14, 24, 28, 6, 59],
  ["Lindy", "AI Automation", "AI agent platform for operations, sales, and support workflows.", "https://www.lindy.ai", "Free, Pro, Business", "2023-01-01", 520, 2560, 6200, 44, 77, 52, 6, 70],
  ["Gamma", "AI Design", "AI presentation and document builder for business storytelling.", "https://gamma.app", "Free, Plus, Pro", "2020-01-01", 450, 2950, 9000, 19, 31, 38, 4, 62],
  ["Manus", "AI Agents", "General-purpose agent product drawing spikes from launch analysis.", "https://manus.im", "Waitlist", "2025-03-01", 720, 3150, 5600, 68, 112, 88, 3, 83],
  ["V0", "AI Coding", "UI generation tool for turning prompts into React interfaces.", "https://v0.dev", "Free, Premium", "2023-10-01", 630, 3850, 10400, 33, 55, 58, 5, 73],
  ["Bolt", "AI Coding", "Browser-based AI app builder for full-stack prototyping.", "https://bolt.new", "Free, Pro", "2024-10-01", 700, 3720, 8900, 51, 86, 64, 5, 77],
  ["Linear", "AI Workflow", "Product development system adding AI workflow assistance.", "https://linear.app", "Free, Standard, Plus", "2019-01-01", 220, 1510, 7300, 7, 13, 18, 3, 48],
  ["CapCut", "AI Video", "Creator video editor with AI editing features and TikTok-native distribution.", "https://www.capcut.com", "Free, Pro", "2020-01-01", 640, 4200, 15500, 13, 27, 54, 4, 67],
  ["Descript", "AI Voice", "Audio and video editor centered on transcript workflows and voice tools.", "https://www.descript.com", "Free, Creator, Pro", "2017-01-01", 360, 2300, 7600, 8, 17, 25, 4, 53],
  ["Suno", "AI Voice", "AI music creation tool spreading through creator and meme workflows.", "https://suno.com", "Free, Pro, Premier", "2023-12-01", 850, 5700, 12600, 39, 66, 80, 4, 78],
  ["Udio", "AI Voice", "AI music generation product with strong launch and creator experimentation.", "https://udio.com", "Free, Standard, Pro", "2024-04-01", 540, 2980, 6400, 31, 49, 45, 3, 64],
  ["NotebookLM", "AI Research", "Research assistant known for summaries, source grounding, and audio overviews.", "https://notebooklm.google", "Free", "2023-07-01", 780, 4900, 11900, 37, 68, 73, 5, 77],
  ["Grok", "AI Agents", "AI assistant tied to X with fast-moving social and search visibility.", "https://x.ai/grok", "Premium", "2023-11-01", 760, 5200, 10100, 34, 61, 69, 3, 74],
  ["Tome", "AI Marketing", "AI storytelling and deck creation for go-to-market teams.", "https://tome.app", "Free, Pro", "2022-09-01", 260, 1600, 4900, -6, 4, 15, 2, 44],
  ["Clay", "AI Marketing", "AI-enriched sales prospecting and data workflows.", "https://www.clay.com", "Free, Pro, Enterprise", "2017-01-01", 460, 2600, 8200, 26, 44, 43, 5, 65],
  ["Jasper", "AI Marketing", "AI content platform for marketing teams and brand workflows.", "https://www.jasper.ai", "Creator, Pro, Business", "2021-01-01", 240, 1820, 6800, -11, -7, 14, 2, 43],
  ["Glean", "AI Research", "Enterprise search and knowledge assistant across workplace data.", "https://www.glean.com", "Enterprise", "2019-01-01", 310, 1900, 5200, 17, 29, 22, 3, 55],
  ["Make", "AI Automation", "Visual automation platform with AI-enabled workflow building.", "https://www.make.com", "Free, Core, Pro", "2012-01-01", 350, 2180, 7900, 18, 33, 24, 5, 58],
  ["Framer AI", "AI Design", "Website builder with AI page generation and design iteration.", "https://www.framer.com/ai", "Free, Mini, Basic", "2023-01-01", 390, 2450, 7100, 23, 40, 32, 3, 60],
  ["Vercel", "AI Coding", "Frontend cloud and deployment platform used to ship web apps, previews, and production releases.", "https://vercel.com", "Free, Pro, Enterprise", "2015-01-01", 540, 3100, 14200, 18, 34, 46, 6, 72],
  ["n8n", "AI Automation", "Workflow automation platform for connecting AI agents, business systems, APIs, and data sources.", "https://n8n.io", "Free, Starter, Pro", "2019-01-01", 470, 2800, 9800, 24, 41, 38, 6, 68],
  ["Apollo", "AI Marketing", "Sales intelligence and prospecting platform for building account lists and outbound pipelines.", "https://www.apollo.io", "Free, Basic, Professional", "2015-01-01", 430, 2550, 11800, 16, 29, 34, 5, 63],
  ["Framer", "AI Design", "Website design and publishing platform for building responsive marketing pages and product sites.", "https://www.framer.com", "Free, Mini, Basic", "2014-01-01", 410, 2500, 9300, 19, 35, 36, 5, 64],
  ["Typefully", "AI Marketing", "Social writing and scheduling platform for planning and publishing text-first content.", "https://typefully.com", "Free, Creator, Team", "2020-01-01", 260, 1420, 5400, 15, 27, 26, 4, 52],
  ["Slack", "AI Workflow", "Team communication platform used as an operating layer for notifications, approvals, and automations.", "https://slack.com", "Free, Pro, Business+", "2013-01-01", 520, 4200, 24000, 8, 16, 45, 6, 74],
  ["HubSpot", "AI Marketing", "CRM and marketing platform for managing contacts, sales pipelines, and customer workflows.", "https://www.hubspot.com", "Free, Starter, Professional", "2006-01-01", 390, 3100, 21000, 7, 14, 32, 5, 66],
  ["Instantly", "AI Marketing", "Outbound email platform for sending, testing, and managing cold email campaigns.", "https://instantly.ai", "Growth, Hypergrowth", "2021-01-01", 310, 1900, 7200, 20, 34, 29, 5, 61],
  ["Taplio", "AI Marketing", "LinkedIn content and relationship platform for writing posts, scheduling, and tracking engagement.", "https://taplio.com", "Starter, Standard, Pro", "2021-01-01", 280, 1600, 6100, 17, 30, 27, 4, 58],
  ["LinkedIn", "AI Marketing", "Professional network used for publishing, prospecting, recruiting, and relationship-driven growth.", "https://www.linkedin.com", "Free, Premium, Sales Navigator", "2003-01-01", 640, 6200, 32000, 6, 13, 58, 7, 82],
  ["Google Maps", "AI Research", "Local search and mapping platform used to discover businesses, locations, and market context.", "https://www.google.com/maps", "Free", "2005-01-01", 480, 4400, 28000, 5, 11, 34, 4, 76]
] as const;

function productTaglineFor(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

const baseTools: Tool[] = rawTools.map((item, index) => {
  const [name, rawCategory, description, websiteUrl, pricingSummary, launchDate, mentions24h, mentions7d, savesCount, growth24h, growth7d, creatorMentions, workflowInclusions, searchInterest] = item;
  const displayName = normalizeProductDisplayName(name);
  const category = ecosystemCategoryForTool(displayName, rawCategory, description);
  const momentumScore = calculateMomentumScore({ growth24h, growth7d, mentions: mentions24h, creatorMentions, saves: savesCount, workflowInclusions });
  const slug = slugify(displayName);
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
    longDescription: `${description} AppScreener tracks its attention velocity, workflow spread, category rotation, and breakout history so teams can understand why it is moving.`,
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
    company: displayName.replace(/\sAI$/, ""),
    creatorMetadata: `${displayName} is monitored across creator posts, launch chatter, workflow saves, and ecosystem overlap signals.`,
    pricingType: pricingTypeFor(pricingSummary),
    pricingTiers: pricingSummary.split(",").map((tier) => tier.trim()),
    pricingSummary,
    launchDate,
    tags: [...new Set([...tagsFor(category, displayName), ...subCategoryTags.map((tag) => tag.toLowerCase())])],
    supportedPlatforms: platformsFor(category),
    integrations: category === "AI Automation" ? ["Slack", "Google Sheets", "HubSpot", "Notion"] : category === "AI Coding" ? ["GitHub", "Vercel", "VS Code"] : ["Zapier", "Notion", "Chrome"],
    apiAvailable: searchInterest > 55 || category === "AI Coding" || category === "AI Automation",
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
    sourceUrls: [websiteUrl, ...trustedSourceUrls(slug, trustedDiscoverySources)],
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
    company: displayName.replace(/\sAI$/, ""),
    creatorMetadata: `${displayName} is tracked from trusted discovery presence, category fit, and emerging attention signals.`,
    pricingType: record.pricingType,
    pricingTiers: record.pricingTiers?.length ? record.pricingTiers : [record.pricingSummary],
    pricingSummary: record.pricingSummary,
    launchDate: "2026-05-23",
    tags: [...new Set([...(record.tags?.length ? record.tags : tagsFor(category, displayName)), ...subCategoryTags.map((tag) => tag.toLowerCase())])],
    supportedPlatforms: platformsFor(category),
    integrations: category === "AI Automation" ? ["Slack", "Google Sheets", "HubSpot", "Notion"] : category === "AI Coding" ? ["GitHub", "Vercel", "VS Code"] : ["Zapier", "Notion", "Chrome"],
    apiAvailable: record.searchInterest > 65 || category === "AI Coding" || category === "AI Infrastructure",
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
    trustedDiscoverySources: ["TAAFT"],
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
    sourceUrls: [record.websiteUrl, record.sourceUrl].filter(Boolean),
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
  return categoryNames.includes(category as CategoryName) ? category as CategoryName : "AI Productivity";
}

const importedTools = (importedTaaftTools as ImportedTaaftTool[]).map(importedRecordToTool);
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
    importedFrom: "base-local+TAAFT",
    importedAt: baseTool.importedAt,
    updatedAt: imported.updatedAt,
    taaftRank: imported.taaftRank,
    trustedDiscoverySources: [...new Set([...baseTool.trustedDiscoverySources, "TAAFT" as const])]
  };
});

export const importStats = {
  totalImportedProducts: importedTools.length,
  acceptedImportedProducts: importedTools.filter((tool) => tool.listingStatus === "accepted").length,
  pendingReviewProducts: importedTools.filter((tool) => tool.listingStatus === "pending_review").length,
  duplicateMergeCount: importedTools.filter((tool) => baseSlugs.has(tool.slug) || baseDomains.has(domainFromUrl(tool.websiteUrl))).length,
  logoFallbackCount: importedTools.filter((tool) => tool.logoSource === "generated-fallback").length,
  sourceCoverage: "backend-only TAAFT provenance"
};

export const tools: Tool[] = [
  ...mergedBaseTools,
  ...importedTools.filter((tool) => !baseSlugs.has(tool.slug) && !baseDomains.has(domainFromUrl(tool.websiteUrl)))
].sort((a, b) => b.organicTrendingScore - a.organicTrendingScore);

const toolsByCategory = (category: CategoryName, slug: string) => tools.filter((tool) => tool.category === category && tool.slug !== slug).slice(0, 4).map((tool) => tool.slug);
tools.forEach((tool) => {
  tool.relatedTools = toolsByCategory(tool.category, tool.slug);
  tool.competitors = [...tools].filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug).sort((a, b) => Math.abs(a.momentumScore - tool.momentumScore) - Math.abs(b.momentumScore - tool.momentumScore)).slice(0, 3).map((candidate) => candidate.slug);
});

export const categories: Category[] = categoryNames.map((name, index) => {
  const categoryTools = tools.filter((tool) => tool.category === name);
  const avg = (key: "momentumScore" | "growth24h" | "growth7d") => categoryTools.length ? Math.round(categoryTools.reduce((sum, tool) => sum + tool[key], 0) / categoryTools.length) : Math.max(8, 38 - index);

  return {
    id: `cat_${index + 1}`,
    name,
    slug: slugify(name),
    description: `${name} attention, launches, category pressure, and workflow spread.`,
    momentumScore: avg("momentumScore"),
    growth24h: avg("growth24h"),
    growth7d: avg("growth7d"),
    toolsTracked: categoryTools.length || Math.max(1, 8 - (index % 5)),
    sparkline: wave(index + 9, avg("momentumScore") / 2)
  };
}).sort((a, b) => b.momentumScore - a.momentumScore);

export const attentionSubCategories: AttentionSubCategory[] = canonicalAttentionSubCategories.map((subCategory, index) => {
  const relatedTools = tools.filter((tool) => tool.subCategoryTags.includes(subCategory.label));
  const avg = (key: "momentumScore" | "growth24h" | "growth7d") => relatedTools.length
    ? Math.round(relatedTools.reduce((sum, tool) => sum + tool[key], 0) / relatedTools.length)
    : Math.max(10, 54 - index);

  return {
    ...subCategory,
    momentumScore: Math.min(98, avg("momentumScore") + (index % 4)),
    growth24h: relatedTools.length ? avg("growth24h") : Math.max(4, 31 - index),
    growth7d: relatedTools.length ? avg("growth7d") : Math.max(7, 48 - index),
    toolsTracked: relatedTools.length,
    relatedToolSlugs: relatedTools.slice(0, 8).map((tool) => tool.slug)
  };
});

const workflowSeeds: Array<[string, string, string[], number, number, number, number, number]> = [
  ["Solo Founder MVP", "Launch a working MVP without hiring a team.", ["Claude", "V0", "Cursor", "Vercel"], 86, 42, 72, 5600, 76],
  ["SaaS In A Weekend", "Ship a simple SaaS product in 48 hours.", ["ChatGPT", "Lovable", "Cursor", "Vercel"], 84, 39, 68, 5200, 70],
  ["AI Agent Builder", "Create a working AI agent for repetitive business tasks.", ["Claude", "Cursor", "n8n"], 82, 41, 69, 4800, 64],
  ["Landing Page Builder", "Launch a conversion-focused landing page.", ["Claude", "V0", "Framer"], 78, 34, 58, 3900, 52],
  ["Research Assistant", "Collect source material, organize references, and synthesize a research brief.", ["Perplexity", "NotebookLM", "Claude"], 76, 29, 51, 3700, 48],
  ["Competitive Intelligence", "Understand how competitors operate.", ["Perplexity", "NotebookLM", "Claude"], 74, 27, 48, 3300, 41],
  ["Founder Outbound Engine", "Generate qualified sales conversations.", ["Apollo", "Clay", "ChatGPT", "Lindy"], 75, 36, 61, 3600, 49],
  ["AI Influencer", "Create a scalable content creator without being on camera.", ["ChatGPT", "ElevenLabs", "HeyGen"], 77, 40, 66, 4100, 55],
  ["Faceless TikTok Engine", "Script, voice, generate, and edit short-form videos without filming yourself.", ["ChatGPT", "ElevenLabs", "Kling", "CapCut"], 81, 41, 68, 4700, 64],
  ["Faceless YouTube Channel", "Create long-form YouTube videos without filming.", ["Perplexity", "Claude", "ElevenLabs", "Runway"], 73, 31, 54, 3500, 43],
  ["Podcast Repurposing", "Convert long audio into clips, written posts, and reusable content assets.", ["Descript", "Claude", "CapCut", "Typefully"], 69, 23, 39, 2800, 32],
  ["Newsletter Operator", "Research a topic, draft an issue, and organize the final newsletter package.", ["Perplexity", "Claude", "Notion AI", "Jasper"], 70, 25, 43, 2900, 36],
  ["Daily AI News Channel", "Find daily AI stories, write a script, generate voice, and edit a news clip.", ["Perplexity", "Claude", "HeyGen"], 72, 34, 55, 3200, 42],
  ["LinkedIn Thought Leader", "Turn expert ideas into polished LinkedIn posts and reusable publishing notes.", ["Perplexity", "Claude", "Taplio"], 68, 22, 38, 2600, 33],
  ["X Growth Engine", "Find timely angles, draft concise posts, and maintain an idea backlog.", ["Perplexity", "Claude", "Typefully"], 69, 28, 45, 3000, 38],
  ["Market Research Sprint", "Collect market sources, compare patterns, and produce an opportunity brief.", ["Perplexity", "NotebookLM", "Claude"], 73, 28, 47, 3300, 40],
  ["Customer Research Engine", "Organize customer knowledge, synthesize insights, and turn them into action items.", ["Perplexity", "NotebookLM", "Claude"], 67, 20, 34, 2400, 30],
  ["Product Discovery", "Turn research and customer signals into a prioritized product direction.", ["Perplexity", "Claude", "Linear"], 71, 26, 44, 3100, 39],
  ["Design-to-Code", "Create visual direction, generate interface screens, and turn them into code.", ["Ideogram", "V0", "Cursor"], 77, 35, 60, 4200, 56],
  ["AI Executive Assistant", "Capture meetings, summarize decisions, and create follow-up tasks.", ["ChatGPT", "Notion AI", "Zapier"], 70, 24, 42, 3000, 37],
  ["Agency Prospecting", "Find target accounts, enrich prospects, and generate outreach drafts.", ["Apollo", "Clay", "ChatGPT", "HubSpot"], 72, 32, 50, 3200, 43],
  ["B2B Lead Research", "Build an enriched B2B account list and summarize the strongest outreach angles.", ["Apollo", "Clay", "ChatGPT"], 71, 30, 49, 3100, 41],
  ["LinkedIn Lead Engine", "Build targeted LinkedIn lead lists and turn them into outreach sequences.", ["LinkedIn", "Clay", "ChatGPT", "Taplio"], 69, 29, 48, 2900, 37],
  ["Local Business Prospecting", "Find local businesses, enrich account context, and draft personalized outreach.", ["Google Maps", "Clay", "ChatGPT"], 66, 24, 39, 2500, 31],
  ["Recruiter Outreach System", "Find candidate or hiring signals, draft outreach, and automate follow-up.", ["LinkedIn", "ChatGPT", "HubSpot"], 65, 23, 37, 2400, 29],
  ["CRM Automation", "Convert sales process rules into automated CRM handoffs and follow-up flows.", ["ChatGPT", "Zapier", "Make"], 67, 26, 43, 2700, 34],
  ["Meeting Intelligence", "Capture calls, synthesize decisions, and publish team-ready notes.", ["Granola", "ChatGPT", "Linear"], 66, 21, 36, 2500, 30],
  ["Business Operations Hub", "Centralize internal knowledge, draft operating procedures, and automate tasks.", ["ChatGPT", "Notion AI", "Zapier"], 68, 25, 41, 2800, 35],
  ["AI Content Repurposing", "Turn long-form content into short clips, posts, voice assets, and summaries.", ["Claude", "ChatGPT", "Typefully"], 70, 31, 52, 3200, 42],
  ["Customer Support Automation", "Retrieve support knowledge, draft responses, and route repeated issues.", ["Glean", "Claude", "Lindy", "Zapier"], 67, 26, 43, 2600, 34]
];

function workflowToolRoleFor(workflowSlug: string, toolSlug: string): WorkflowToolRelationship["role"] {
  if (["perplexity", "notebooklm", "glean"].includes(toolSlug)) return "research";
  if (["cursor", "windsurf", "v0", "bolt", "lovable", "replit", "vercel"].includes(toolSlug)) return "generation";
  if (["kling", "pika", "runway", "capcut", "descript"].includes(toolSlug)) return "editing";
  if (["zapier", "make", "lindy", "n8n", "hubspot"].includes(toolSlug)) return "automation";
  if (["gamma", "notion-ai", "linear"].includes(toolSlug)) return "publishing";
  if (workflowSlug.includes("sales") || ["clay", "apollo", "linkedin", "google-maps"].includes(toolSlug)) return "analysis";
  if (["claude", "chatgpt", "elevenlabs", "suno", "midjourney", "ideogram", "heygen", "framer-ai", "framer", "typefully", "taplio"].includes(toolSlug)) return "generation";
  return "other";
}

export const workflowToolRelationships: WorkflowToolRelationship[] = workflowSeeds.flatMap(([name, , toolNames]) => {
  const workflowSlug = slugify(name);
  return toolNames.map((toolName, index) => {
    const toolSlug = slugify(toolName);
    return {
      id: `wtr_${workflowSlug}_${toolSlug}`,
      workflowSlug,
      toolSlug,
      role: workflowToolRoleFor(workflowSlug, toolSlug),
      position: index + 1,
      required: index < 3,
      confidence: 94,
      status: "accepted",
      sourceType: "manual"
    };
  });
});

function acceptedWorkflowToolSlugs(workflowSlug: string) {
  return workflowToolRelationships
    .filter((relationship) => relationship.status === "accepted" && relationship.workflowSlug === workflowSlug)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .map((relationship) => relationship.toolSlug);
}

export const workflows: Workflow[] = workflowSeeds.map(([name, outcome, names, momentumScore, growth24h, growth7d, savesCount, creatorUsage], index) => ({
  id: `wf_${index + 1}`,
  name,
  slug: slugify(name),
  description: `${outcome} Tracks saves, movement, and tool-stack spread.`,
  outcome,
  toolSlugs: acceptedWorkflowToolSlugs(slugify(name)),
  momentumScore,
  growth24h,
  growth7d,
  savesCount,
  creatorUsage,
  sparkline: wave(index + 6, momentumScore / 2)
}));

const microWorkflowSeeds: Array<[string, string, string]> = [
  ["Source Discovery", "Find relevant sources, companies, references, or inputs.", "Reusable discovery layer for research, content, sales, and market workflows."],
  ["Knowledge Retrieval", "Retrieve and organize source-grounded context.", "Connects research, enterprise search, and briefing workflows."],
  ["Brief Synthesis", "Turn scattered inputs into a useful brief, summary, or plan.", "Core reasoning layer for knowledge and creator workflows."],
  ["Task Planning", "Convert goals into structured tasks, specs, or project steps.", "Bridge between idea, execution, and product-building workflows."],
  ["Code Generation", "Generate or modify code from instructions.", "Core build primitive across coding, founder, and design-to-code workflows."],
  ["Code Review", "Debug, review, or improve code quality.", "Trust and quality primitive distinct from initial code generation."],
  ["UI Generation", "Generate screens, components, or frontend interfaces.", "Connects design, prototyping, and app-building workflows."],
  ["App Prototyping", "Turn an idea or interface into a working product prototype.", "Outcome-oriented build primitive for product and software workflows."],
  ["Visual Asset Generation", "Create images, mockups, brand visuals, thumbnails, or concepts.", "Reusable creative primitive across design, video, and marketing workflows."],
  ["Script Writing", "Turn research or ideas into video, audio, or social scripts.", "Creator production primitive for short-form, long-form, and repurposed content."],
  ["Voice Generation", "Generate narration, dubbing, or spoken audio.", "Audio primitive shared by video, podcast, avatar, and content workflows."],
  ["Video Generation", "Generate or transform video scenes.", "Core creation primitive for short-form and long-form video workflows."],
  ["Media Editing", "Edit, clip, polish, or repurpose audio and video assets.", "Post-production primitive across video and podcast workflows."]
];

export const microWorkflows: MicroWorkflow[] = microWorkflowSeeds.map(([name, outcome, description], index) => ({
  id: `mwf_${index + 1}`,
  name,
  slug: slugify(name),
  description,
  outcome,
  status: "accepted",
  confidence: 94,
  sourceType: "manual"
}));

const workflowMicroWorkflowSeeds: Record<string, string[]> = {
  "solo-founder-mvp": ["task-planning", "app-prototyping", "code-generation"],
  "saas-in-a-weekend": ["brief-synthesis", "ui-generation", "code-generation", "app-prototyping"],
  "ai-agent-builder": ["task-planning", "app-prototyping", "code-generation"],
  "landing-page-builder": ["brief-synthesis", "ui-generation", "app-prototyping"],
  "research-assistant": ["source-discovery", "knowledge-retrieval", "brief-synthesis"],
  "competitive-intelligence": ["source-discovery", "knowledge-retrieval", "brief-synthesis"],
  "founder-outbound-engine": ["source-discovery", "brief-synthesis", "task-planning"],
  "ai-influencer": ["visual-asset-generation", "script-writing", "voice-generation", "media-editing"],
  "faceless-tiktok-engine": ["script-writing", "voice-generation", "video-generation", "media-editing"],
  "faceless-youtube-channel": ["source-discovery", "script-writing", "voice-generation", "media-editing"],
  "podcast-repurposing": ["brief-synthesis", "script-writing", "media-editing"],
  "newsletter-operator": ["source-discovery", "brief-synthesis", "script-writing"],
  "daily-ai-news-channel": ["source-discovery", "script-writing", "voice-generation", "media-editing"],
  "linkedin-thought-leader": ["brief-synthesis", "script-writing"],
  "x-growth-engine": ["source-discovery", "script-writing"],
  "market-research-sprint": ["source-discovery", "knowledge-retrieval", "brief-synthesis"],
  "customer-research-engine": ["knowledge-retrieval", "brief-synthesis", "task-planning"],
  "product-discovery": ["source-discovery", "brief-synthesis", "task-planning"],
  "design-to-code": ["visual-asset-generation", "ui-generation", "code-generation"],
  "ai-executive-assistant": ["knowledge-retrieval", "brief-synthesis", "task-planning"],
  "agency-prospecting": ["source-discovery", "brief-synthesis"],
  "b2b-lead-research": ["source-discovery", "brief-synthesis"],
  "linkedin-lead-engine": ["source-discovery", "brief-synthesis", "task-planning"],
  "local-business-prospecting": ["source-discovery", "brief-synthesis"],
  "recruiter-outreach-system": ["source-discovery", "brief-synthesis", "task-planning"],
  "crm-automation": ["task-planning", "brief-synthesis"],
  "meeting-intelligence": ["knowledge-retrieval", "brief-synthesis"],
  "business-operations-hub": ["knowledge-retrieval", "brief-synthesis", "task-planning"],
  "ai-content-repurposing": ["brief-synthesis", "script-writing", "voice-generation", "media-editing"],
  "customer-support-automation": ["knowledge-retrieval", "brief-synthesis", "task-planning"]
};

export const workflowMicroWorkflowRelationships: WorkflowMicroWorkflowRelationship[] = Object.entries(workflowMicroWorkflowSeeds).flatMap(([workflowSlug, microWorkflowSlugs]) =>
  microWorkflowSlugs.map((microWorkflowSlug, index) => ({
    id: `wmwr_${workflowSlug}_${microWorkflowSlug}`,
    workflowSlug,
    microWorkflowSlug,
    position: index + 1,
    required: index < 2,
    confidence: 92,
    status: "accepted",
    sourceType: "manual"
  }))
);

const microWorkflowToolSeeds: Record<string, string[]> = {
  "source-discovery": ["perplexity", "clay"],
  "knowledge-retrieval": ["notebooklm", "glean"],
  "brief-synthesis": ["claude", "chatgpt"],
  "task-planning": ["chatgpt", "linear"],
  "code-generation": ["cursor", "claude"],
  "code-review": ["cursor", "claude"],
  "ui-generation": ["v0", "framer-ai"],
  "app-prototyping": ["lovable", "bolt"],
  "visual-asset-generation": ["midjourney", "ideogram"],
  "script-writing": ["chatgpt", "claude"],
  "voice-generation": ["chatgpt", "elevenlabs"],
  "video-generation": ["kling", "runway"],
  "media-editing": ["descript", "capcut"]
};

export const microWorkflowToolRelationships: MicroWorkflowToolRelationship[] = Object.entries(microWorkflowToolSeeds).flatMap(([microWorkflowSlug, toolSlugs]) =>
  toolSlugs.map((toolSlug, index) => ({
    id: `mwtr_${microWorkflowSlug}_${toolSlug}`,
    microWorkflowSlug,
    toolSlug,
    position: index + 1,
    required: index < 2,
    confidence: 92,
    status: "accepted",
    sourceType: "manual"
  }))
);

export const movementEvents: MovementEvent[] = [
  { id: "event_1", categorySlug: "ai-video", title: "AI Video momentum +31%", description: "Kling, Runway, and CapCut are pulling more creator mentions into short-form workflows.", eventType: "category_shift", sourceUrl: "#", timestamp: "12 min ago" },
  { id: "event_2", toolSlug: "manus", title: "Manus entered Breaking Out", description: "Launch analysis and benchmark threads pushed acceleration above the breakout threshold.", eventType: "launch", sourceUrl: "#", timestamp: "19 min ago" },
  { id: "event_3", toolSlug: "windsurf", title: "Coding-agent comparison activity rising", description: "Windsurf and Cursor are appearing in adjacent coding-agent workflows.", eventType: "creator_spike", sourceUrl: "#", timestamp: "27 min ago" },
  { id: "event_4", workflowSlug: "faceless-tiktok-engine", title: "Faceless TikTok Engine saves +44%", description: "Video and voice tools are being bundled into repeatable creator stacks.", eventType: "workflow_spread", sourceUrl: "#", timestamp: "41 min ago" },
  { id: "event_5", toolSlug: "notebooklm", title: "YouTube spike for NotebookLM", description: "Research-to-audio demos are driving renewed discovery.", eventType: "youtube_spike", sourceUrl: "#", timestamp: "1 hr ago" }
];

export const creatorToolRelationships: CreatorToolRelationship[] = [
  {
    id: "ctr_logan-kilpatrick_chatgpt",
    creatorId: "creator_logan-kilpatrick",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 96,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/OfficialLoganK",
    evidenceText: "OpenAI developer relations creator publicly associated with ChatGPT ecosystem education."
  },
  {
    id: "ctr_guillermo-rauch_v0",
    creatorId: "creator_guillermo-rauch",
    toolSlug: "v0",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 98,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/rauchg",
    evidenceText: "Vercel creator/operator publicly associated with v0 product development and usage."
  },
  {
    id: "ctr_lee-robinson_v0",
    creatorId: "creator_lee-robinson",
    toolSlug: "v0",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 95,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/leeerob",
    evidenceText: "Vercel creator publicly demos and explains v0 workflows."
  },
  {
    id: "ctr_amjad-masad_replit",
    creatorId: "creator_amjad-masad",
    toolSlug: "replit",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 99,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/amasad",
    evidenceText: "Replit founder publicly associated with Replit product development."
  },
  {
    id: "ctr_simon-willison_chatgpt",
    creatorId: "creator_simon-willison",
    toolSlug: "chatgpt",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 94,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://simonwillison.net/",
    evidenceText: "Creator regularly publishes technical analysis of ChatGPT and OpenAI tool usage."
  },
  {
    id: "ctr_simon-willison_claude",
    creatorId: "creator_simon-willison",
    toolSlug: "claude",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 94,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://simonwillison.net/",
    evidenceText: "Creator regularly publishes technical analysis of Claude and Anthropic tool usage."
  },
  {
    id: "ctr_andrej-karpathy_cursor",
    creatorId: "creator_andrej-karpathy",
    toolSlug: "cursor",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/karpathy",
    evidenceText: "AI coding educator publicly associated with coding-agent workflows and Cursor discussion."
  },
  {
    id: "ctr_greg-kamradt_cursor",
    creatorId: "creator_greg-kamradt",
    toolSlug: "cursor",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 91,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/GregKamradt",
    evidenceText: "AI workflow educator publicly demonstrates coding-agent and app-building workflows."
  },
  {
    id: "ctr_nick-st-pierre_midjourney",
    creatorId: "creator_nick-st-pierre",
    toolSlug: "midjourney",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 97,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/nickfloats",
    evidenceText: "AI image creator publicly known for Midjourney workflows and visual prompting."
  },
  {
    id: "ctr_linusekenstam_midjourney",
    creatorId: "creator_linus-ekenstam",
    toolSlug: "midjourney",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 93,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/linusekenstam",
    evidenceText: "AI design creator publicly associated with generative image and design workflows."
  },
  {
    id: "ctr_min-choi_kling",
    creatorId: "creator_min-choi",
    toolSlug: "kling",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 92,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/minchoi",
    evidenceText: "AI video creator publicly associated with emerging AI video tool demos."
  },
  {
    id: "ctr_theoretically-media_runway",
    creatorId: "creator_theoretically-media",
    toolSlug: "runway",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 92,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://www.youtube.com/@TheoreticallyMedia",
    evidenceText: "AI video channel publicly associated with Runway and generative video workflows."
  },
  {
    id: "ctr_theoretically-media_pika",
    creatorId: "creator_theoretically-media",
    toolSlug: "pika",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://www.youtube.com/@TheoreticallyMedia",
    evidenceText: "AI video channel publicly associated with Pika and generative video workflows."
  },
  {
    id: "ctr_dan-shipper_chatgpt",
    creatorId: "creator_dan-shipper",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 92,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://www.every.to/",
    evidenceText: "AI productivity writer publicly discusses ChatGPT in knowledge-work workflows."
  },
  {
    id: "ctr_ethan-mollick_chatgpt",
    creatorId: "creator_ethan-mollick",
    toolSlug: "chatgpt",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 95,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://www.oneusefulthing.org/",
    evidenceText: "AI productivity researcher publicly teaches and analyzes ChatGPT usage."
  },
  {
    id: "ctr_ethan-mollick_claude",
    creatorId: "creator_ethan-mollick",
    toolSlug: "claude",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 93,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://www.oneusefulthing.org/",
    evidenceText: "AI productivity researcher publicly teaches and analyzes Claude usage."
  },
  {
    id: "ctr_theo-browne_cursor",
    creatorId: "creator_theo-browne",
    toolSlug: "cursor",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 93,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/t3dotgg",
    evidenceText: "Developer creator publicly associated with Cursor-centered AI coding workflows."
  },
  {
    id: "ctr_pietro-schirano_v0",
    creatorId: "creator_pietro-schirano",
    toolSlug: "v0",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 92,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/skirano",
    evidenceText: "AI product builder publicly associated with v0-powered interface prototyping."
  },
  {
    id: "ctr_min-choi_runway",
    creatorId: "creator_min-choi",
    toolSlug: "runway",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 91,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/minchoi",
    evidenceText: "AI video creator publicly associated with Runway and generative video workflows."
  },
  {
    id: "ctr_greg-kamradt_claude",
    creatorId: "creator_greg-kamradt",
    toolSlug: "claude",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 92,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/GregKamradt",
    evidenceText: "AI workflow educator publicly teaches Claude-oriented agent and app-building workflows."
  },
  {
    id: "ctr_theo-browne_v0",
    creatorId: "creator_theo-browne",
    toolSlug: "v0",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 91,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/t3dotgg",
    evidenceText: "Developer creator publicly explains v0 and AI app-building workflows."
  },
  {
    id: "ctr_matt-wolfe_chatgpt",
    creatorId: "creator_matt-wolfe",
    toolSlug: "chatgpt",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 92,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/mreflow",
    evidenceText: "AI tools educator publicly teaches ChatGPT capabilities and practical workflows."
  },
  {
    id: "ctr_wes-roth_notebooklm",
    creatorId: "creator_wes-roth",
    toolSlug: "notebooklm",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 91,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/WesRothMoney",
    evidenceText: "AI news and tutorial creator publicly explains NotebookLM capabilities and workflows."
  },
  {
    id: "ctr_dan-shipper_claude",
    creatorId: "creator_dan-shipper",
    toolSlug: "claude",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://www.every.to/",
    evidenceText: "AI productivity writer publicly discusses Claude in knowledge-work contexts."
  },
  {
    id: "ctr_andrej-karpathy_chatgpt",
    creatorId: "creator_andrej-karpathy",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 91,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/karpathy",
    evidenceText: "AI educator publicly discusses ChatGPT and language-model product behavior."
  },
  {
    id: "ctr_wes-roth_claude",
    creatorId: "creator_wes-roth",
    toolSlug: "claude",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/WesRothMoney",
    evidenceText: "AI news creator publicly discusses Claude in model and product coverage."
  },
  {
    id: "ctr_aravind-srinivas_perplexity",
    creatorId: "creator_aravind-srinivas",
    toolSlug: "perplexity",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 98,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/AravSrinivas",
    evidenceText: "Perplexity founder/operator publicly associated with building and using Perplexity."
  },
  {
    id: "ctr_david-holz_midjourney",
    creatorId: "creator_david-holz",
    toolSlug: "midjourney",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 98,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/DavidSHolz",
    evidenceText: "Midjourney founder/operator publicly associated with building and using Midjourney."
  },
  {
    id: "ctr_cristobal-valenzuela_runway",
    creatorId: "creator_cristobal-valenzuela",
    toolSlug: "runway",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 98,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/c_valenzuelab",
    evidenceText: "Runway founder/operator publicly associated with building and using Runway."
  },
  {
    id: "ctr_varun-mohan_windsurf",
    creatorId: "creator_varun-mohan",
    toolSlug: "windsurf",
    relationshipType: "uses",
    validationLayer: "verified",
    confidence: 96,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/_mohansolo",
    evidenceText: "Windsurf founder/operator publicly associated with building and using Windsurf."
  },
  {
    id: "ctr_alex-albert_claude",
    creatorId: "creator_alex-albert",
    toolSlug: "claude",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/alexalbert__",
    evidenceText: "Reviewed manual candidate for Claude-focused educational content and workflow explanation."
  },
  {
    id: "ctr_riley-goodside_chatgpt",
    creatorId: "creator_riley-goodside",
    toolSlug: "chatgpt",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 91,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/goodside",
    evidenceText: "Reviewed manual candidate for ChatGPT-focused educational content and prompt/workflow explanation."
  },
  {
    id: "ctr_andrew-ng_chatgpt",
    creatorId: "creator_andrew-ng",
    toolSlug: "chatgpt",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 91,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/AndrewYNg",
    evidenceText: "Reviewed manual candidate for ChatGPT-focused educational content and AI workflow explanation."
  },
  {
    id: "ctr_shawn-wang_claude",
    creatorId: "creator_shawn-wang",
    toolSlug: "claude",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/swyx",
    evidenceText: "Reviewed manual candidate for public Claude discussion; not treated as verified usage."
  },
  {
    id: "ctr_shawn-wang_chatgpt",
    creatorId: "creator_shawn-wang",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/swyx",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_chip-huyen_chatgpt",
    creatorId: "creator_chip-huyen",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/chipro",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_jeremy-howard_chatgpt",
    creatorId: "creator_jeremy-howard",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/jeremyphoward",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_harrison-chase_chatgpt",
    creatorId: "creator_harrison-chase",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/hwchase17",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_harrison-chase_claude",
    creatorId: "creator_harrison-chase",
    toolSlug: "claude",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/hwchase17",
    evidenceText: "Reviewed manual candidate for public Claude discussion; not treated as verified usage."
  },
  {
    id: "ctr_lance-martin_claude",
    creatorId: "creator_lance-martin",
    toolSlug: "claude",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/RLanceMartin",
    evidenceText: "Reviewed manual candidate for Claude-focused educational content and workflow explanation."
  },
  {
    id: "ctr_lance-martin_chatgpt",
    creatorId: "creator_lance-martin",
    toolSlug: "chatgpt",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/RLanceMartin",
    evidenceText: "Reviewed manual candidate for ChatGPT-focused educational content and workflow explanation."
  },
  {
    id: "ctr_jason-liu_chatgpt",
    creatorId: "creator_jason-liu",
    toolSlug: "chatgpt",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/jxnlco",
    evidenceText: "Reviewed manual candidate for ChatGPT-focused educational content and workflow explanation."
  },
  {
    id: "ctr_hamel-husain_claude",
    creatorId: "creator_hamel-husain",
    toolSlug: "claude",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/HamelHusain",
    evidenceText: "Reviewed manual candidate for public Claude discussion; not treated as verified usage."
  },
  {
    id: "ctr_hamel-husain_chatgpt",
    creatorId: "creator_hamel-husain",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/HamelHusain",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_rowan-cheung_chatgpt",
    creatorId: "creator_rowan-cheung",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 89,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/rowancheung",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_rowan-cheung_claude",
    creatorId: "creator_rowan-cheung",
    toolSlug: "claude",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 89,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/rowancheung",
    evidenceText: "Reviewed manual candidate for public Claude discussion; not treated as verified usage."
  },
  {
    id: "ctr_matt-wolfe_claude",
    creatorId: "creator_matt-wolfe",
    toolSlug: "claude",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/mreflow",
    evidenceText: "Reviewed manual candidate for Claude-focused educational content and AI tools coverage."
  },
  {
    id: "ctr_matt-wolfe_midjourney",
    creatorId: "creator_matt-wolfe",
    toolSlug: "midjourney",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 89,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/mreflow",
    evidenceText: "Reviewed manual candidate for Midjourney-focused educational content and AI tools coverage."
  },
  {
    id: "ctr_wes-roth_chatgpt",
    creatorId: "creator_wes-roth",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/WesRothMoney",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_ben-tossell_chatgpt",
    creatorId: "creator_ben-tossell",
    toolSlug: "chatgpt",
    relationshipType: "teaches",
    validationLayer: "verified",
    confidence: 90,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/bentossell",
    evidenceText: "Reviewed manual candidate for ChatGPT-focused educational content and practical workflow explanation."
  },
  {
    id: "ctr_yohei-nakajima_chatgpt",
    creatorId: "creator_yohei-nakajima",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/yoheinakajima",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_dave-ebbelaar_make",
    creatorId: "creator_dave-ebbelaar",
    toolSlug: "make",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/daveebbelaar",
    evidenceText: "Reviewed manual candidate for public Make discussion; not treated as verified usage."
  },
  {
    id: "ctr_dave-ebbelaar_zapier",
    creatorId: "creator_dave-ebbelaar",
    toolSlug: "zapier",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/daveebbelaar",
    evidenceText: "Reviewed manual candidate for public Zapier discussion; not treated as verified usage."
  },
  {
    id: "ctr_cole-medin_lindy",
    creatorId: "creator_cole-medin",
    toolSlug: "lindy",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/ColeMedin",
    evidenceText: "Reviewed manual candidate for public Lindy discussion; not treated as verified usage."
  },
  {
    id: "ctr_cole-medin_make",
    creatorId: "creator_cole-medin",
    toolSlug: "make",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/ColeMedin",
    evidenceText: "Reviewed manual candidate for public Make discussion; not treated as verified usage."
  },
  {
    id: "ctr_liam-ottley_zapier",
    creatorId: "creator_liam-ottley",
    toolSlug: "zapier",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/LiamOttley",
    evidenceText: "Reviewed manual candidate for public Zapier discussion; not treated as verified usage."
  },
  {
    id: "ctr_liam-ottley_make",
    creatorId: "creator_liam-ottley",
    toolSlug: "make",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/LiamOttley",
    evidenceText: "Reviewed manual candidate for public Make discussion; not treated as verified usage."
  },
  {
    id: "ctr_nick-saraev_make",
    creatorId: "creator_nick-saraev",
    toolSlug: "make",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/nicksaraev",
    evidenceText: "Reviewed manual candidate for public Make discussion; not treated as verified usage."
  },
  {
    id: "ctr_sander-schulhoff_chatgpt",
    creatorId: "creator_sander-schulhoff",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/sander_schulhoff",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_mckay-wrigley_lovable",
    creatorId: "creator_mckay-wrigley",
    toolSlug: "lovable",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/mckaywrigley",
    evidenceText: "Reviewed manual candidate for public Lovable discussion; not treated as verified usage."
  },
  {
    id: "ctr_mckay-wrigley_bolt",
    creatorId: "creator_mckay-wrigley",
    toolSlug: "bolt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/mckaywrigley",
    evidenceText: "Reviewed manual candidate for public Bolt discussion; not treated as verified usage."
  },
  {
    id: "ctr_jason-zhou_lovable",
    creatorId: "creator_jason-zhou",
    toolSlug: "lovable",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/jasonzhou1993",
    evidenceText: "Reviewed manual candidate for public Lovable discussion; not treated as verified usage."
  },
  {
    id: "ctr_jason-zhou_framer-ai",
    creatorId: "creator_jason-zhou",
    toolSlug: "framer-ai",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/jasonzhou1993",
    evidenceText: "Reviewed manual candidate for public Framer AI discussion; not treated as verified usage."
  },
  {
    id: "ctr_peter-steinberger_cursor",
    creatorId: "creator_peter-steinberger",
    toolSlug: "cursor",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/steipete",
    evidenceText: "Reviewed manual candidate for public Cursor discussion; not treated as verified usage."
  },
  {
    id: "ctr_armin-ronacher_cursor",
    creatorId: "creator_armin-ronacher",
    toolSlug: "cursor",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/mitsuhiko",
    evidenceText: "Reviewed manual candidate for public Cursor discussion; not treated as verified usage."
  },
  {
    id: "ctr_nat-friedman_cursor",
    creatorId: "creator_nat-friedman",
    toolSlug: "cursor",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 88,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/natfriedman",
    evidenceText: "Reviewed manual candidate for public Cursor discussion; not treated as verified usage."
  },
  {
    id: "ctr_boris-power_chatgpt",
    creatorId: "creator_boris-power",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/BorisMPower",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_matt-shumer_lindy",
    creatorId: "creator_matt-shumer",
    toolSlug: "lindy",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/mattshumer_",
    evidenceText: "Reviewed manual candidate for public Lindy discussion; not treated as verified usage."
  },
  {
    id: "ctr_dharmesh-shah_chatgpt",
    creatorId: "creator_dharmesh-shah",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/dharmesh",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_allie-k-miller_chatgpt",
    creatorId: "creator_allie-k-miller",
    toolSlug: "chatgpt",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/alliekmiller",
    evidenceText: "Reviewed manual candidate for public ChatGPT discussion; not treated as verified usage."
  },
  {
    id: "ctr_ruben-hassid_clay",
    creatorId: "creator_ruben-hassid",
    toolSlug: "clay",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/RubenHssd",
    evidenceText: "Reviewed manual candidate for public Clay discussion; not treated as verified usage."
  },
  {
    id: "ctr_rob-lennon_jasper",
    creatorId: "creator_rob-lennon",
    toolSlug: "jasper",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/thatroblennon",
    evidenceText: "Reviewed manual candidate for public Jasper discussion; not treated as verified usage."
  },
  {
    id: "ctr_julian-goldie_jasper",
    creatorId: "creator_julian-goldie",
    toolSlug: "jasper",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 86,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/JulianGoldieSEO",
    evidenceText: "Reviewed manual candidate for public Jasper discussion; not treated as verified usage."
  },
  {
    id: "ctr_theoretically-media_elevenlabs",
    creatorId: "creator_theoretically-media",
    toolSlug: "elevenlabs",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/TheoMediaAI",
    evidenceText: "Reviewed manual candidate for public ElevenLabs discussion; not treated as verified usage."
  },
  {
    id: "ctr_theoretically-media_capcut",
    creatorId: "creator_theoretically-media",
    toolSlug: "capcut",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/TheoMediaAI",
    evidenceText: "Reviewed manual candidate for public CapCut discussion; not treated as verified usage."
  },
  {
    id: "ctr_nick-st-pierre_ideogram",
    creatorId: "creator_nick-st-pierre",
    toolSlug: "ideogram",
    relationshipType: "mentions",
    validationLayer: "observed",
    confidence: 87,
    status: "accepted",
    sourceType: "manual",
    sourceUrl: "https://x.com/nickfloats",
    evidenceText: "Reviewed manual candidate for public Ideogram discussion; not treated as verified usage."
  }
];

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

export const importedCreators: CreatorProfile[] = (importedPdfCreators as ImportedCreator[]).map((creator) => {
  const toolSlugs = acceptedCreatorToolSlugs(creator.id);
  const workflowSlugs = acceptedCreatorWorkflowSlugs(creator.id);
  const rawImportedTags = [
    creator.creatorCategory,
    ...creator.niches,
    ...(creator.specializationTags ?? []),
    ...(creator.toolCategoryTags ?? [])
  ].filter(Boolean);
  const specializationTags = normalizeCreatorSpecializations([
    creator.primarySpecialization,
    ...rawImportedTags
  ]);
  const toolCategoryTags = normalizeCreatorSpecializations(toolSlugs.map((slug) => tools.find((tool) => tool.slug === slug)?.category));
  const publicSpecializationTags = [...new Set([...specializationTags, ...toolCategoryTags])];
  const tagConfidence = publicSpecializationTags.length ? creator.tagConfidence ?? creator.sourceConfidence : 0;

  return {
    id: creator.id,
    name: creator.name,
    handle: creator.handle,
    xHandle: creator.xHandle || creator.handle,
    avatarUrl: creator.avatarUrl,
    avatarSourceType: creator.avatarSourceType ?? "none",
    avatarSourceUrl: creator.avatarSourceUrl,
    avatarVerified: Boolean(creator.avatarVerified),
    platform: creator.platform,
    primaryPlatform: creator.primaryPlatform,
    bio: creator.bio,
    followers: creator.followers || creator.followerCount || 0,
    followerCount: creator.followerCount || creator.followers || 0,
    creatorCategory: creator.creatorCategory,
    niches: creator.niches,
    primarySpecialization: primarySpecializationFrom(publicSpecializationTags),
    specializationTags: publicSpecializationTags,
    creatorTypes: normalizeCreatorTypes(creator.creatorTypes ?? []),
    platformFocus: normalizePlatformFocus([creator.primaryPlatform, creator.platform, ...(creator.platformFocus ?? [])]),
    audienceTags: normalizeAudienceTags(creator.audienceTags ?? []),
    influenceTags: normalizeInfluenceTags(creator.influenceTags ?? []),
    workflowTags: creator.workflowTags ?? creator.workflowSlugs,
    toolCategoryTags,
    tagConfidence,
    tagSource: publicSpecializationTags.length ? "imported" : undefined,
    tagNotes: creator.tagNotes,
    rawImportedTags,
    tagInferenceMethod: publicSpecializationTags.length ? "normalized-imported-creator-tags" : undefined,
    workflowSlugs,
    toolSlugs,
    recentMentions: creator.recentMentions,
    creatorScore: creator.creatorScore,
    categorySlugs: creator.categorySlugs,
    rankingPosition: creator.rankingPosition,
    xUrl: creator.xUrl || xProfileUrl(creator.xHandle || creator.handle),
    youtubeUrl: creator.youtubeUrl,
    linkedinUrl: creator.linkedinUrl,
    instagramUrl: creator.instagramUrl,
    tiktokUrl: creator.tiktokUrl,
    officialWebsite: creator.officialWebsite,
    websiteUrl: creator.websiteUrl,
    sourceUrl: creator.sourceUrl,
    importedFrom: creator.importedFrom,
    importedAt: creator.importedAt,
    status: creator.status ?? creator.listingStatus,
    listingStatus: creator.listingStatus,
    sourceConfidence: creator.sourceConfidence,
    verificationSignals: creator.verificationSignals
  };
});

export const creators: CreatorProfile[] = importedCreators.filter((creator) => creator.listingStatus === "accepted");
export const creatorIntelligenceStatus = {
  imported: importedCreators.length,
  accepted: creators.length,
  pendingReview: importedCreators.filter((creator) => creator.listingStatus === "pending_review").length,
  publicReady: creators.length >= 3
};

export const creatorSignals: CreatorSignal[] = [];

export const toolEvidenceSources: ToolEvidenceSource[] = importedToolEvidenceSources as ToolEvidenceSource[];

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

export const creatorClaimRequests: CreatorClaimRequest[] = [
  {
    id: "creator_claim_simon_willison_pending",
    creatorId: "creator_simon-willison",
    name: "Simon Willison",
    email: "simon@example.com",
    socialProofUrl: "https://x.com/simonw",
    preferredProfileUrl: "/creators/creator_simon-willison",
    note: "Mock pending claim used to validate the Phase 2 creator ownership flow.",
    status: "pending_review",
    submittedAt: "2026-05-30T10:00:00.000Z"
  }
];

export const productClaimRequests: ProductClaimRequest[] = [
  {
    id: "product_claim_clay_pending",
    toolSlug: "clay",
    requesterName: "Clay GTM Team",
    workEmail: "team@example.com",
    role: "Product operator",
    websiteUrl: "https://clay.com",
    claimProof: "Mock pending claim used to validate the Phase 2 product ownership flow.",
    note: "Product ownership requests stay pending until AppScreener review.",
    status: "pending_review",
    submittedAt: "2026-05-30T10:05:00.000Z"
  }
];

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

export const attentionFeed: AttentionFeedItem[] = [
  { id: "feed_1", title: "Cursor coding-agent momentum rising", description: "Coding-agent tools are clustering around build workflow comparisons.", severity: "high", entityType: "tool", entitySlug: "cursor", timestamp: "4 min ago" },
  { id: "feed_2", title: "AI Video overtook AI Image", description: "Short-form video workflows are pulling attention from static image generation.", severity: "high", entityType: "category", entitySlug: "ai-video", timestamp: "9 min ago" },
  { id: "feed_3", title: "Kling workflow saves +41%", description: "Faceless TikTok and YouTube production stacks are driving repeat saves.", severity: "medium", entityType: "tool", entitySlug: "kling", timestamp: "17 min ago" },
  { id: "feed_4", title: "Research workflows trending among founders", description: "NotebookLM, Perplexity, and Claude are appearing together in founder research stacks.", severity: "medium", entityType: "workflow", entitySlug: "research-assistant", timestamp: "24 min ago" }
];

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

const curatedDiscoveryEdges: DiscoveryEdge[] = [
  { id: "edge_1", fromSlug: "cursor", toSlug: "windsurf", relationship: "also_viewed", strength: 91, narrative: "Users comparing coding agents frequently jump from Cursor to Windsurf." },
  { id: "edge_2", fromSlug: "cursor", toSlug: "claude", relationship: "workflow_overlap", strength: 88, narrative: "Claude appears in most high-signal Cursor coding stacks." },
  { id: "edge_3", fromSlug: "midjourney", toSlug: "kling", relationship: "migration", strength: 83, narrative: "Image-generation creators are moving into AI video experiments." },
  { id: "edge_4", fromSlug: "chatgpt", toSlug: "cursor", relationship: "ecosystem", strength: 78, narrative: "General AI usage is converting into build workflows." },
  { id: "edge_5", fromSlug: "notebooklm", toSlug: "perplexity", relationship: "workflow_overlap", strength: 86, narrative: "Research workflows often pair source-grounded notebooks with answer engines." }
];

export const discoveryEdges: DiscoveryEdge[] = [
  ...curatedDiscoveryEdges,
  ...deriveDiscoveryEdges(tools).filter((edge) => !curatedDiscoveryEdges.some((curated) => {
    const curatedPair = [curated.fromSlug, curated.toSlug].sort().join("__");
    const edgePair = [edge.fromSlug, edge.toSlug].sort().join("__");
    return curatedPair === edgePair;
  }))
];

export const featureFlags: FeatureFlag[] = [
  { id: "flag_1", name: "Attention Feed", key: "attention_feed", enabled: true, description: "Central live intelligence feed across tools, workflows, categories, and creators." },
  { id: "flag_2", name: "Compare Experiments", key: "compare_experiments", enabled: true, description: "Shareable compare modules and overlap scoring." },
  { id: "flag_3", name: "Replay Mode", key: "replay_mode", enabled: false, description: "Replay the rise of a product through attention, creators, and workflows." },
  { id: "flag_4", name: "Local Alert Preview", key: "alert_preview_state", enabled: true, description: "Local watchlist architecture before auth and notifications." },
  { id: "flag_5", name: "Ingestion Sources", key: "ingestion_sources", enabled: true, description: "Source adapters normalized into the canonical graph." },
  { id: "flag_6", name: "Promoted Momentum", key: "promoted_momentum", enabled: true, description: "Sponsored placement architecture for momentum rail, homepage boosts, and future ranking injections." }
];

export const promotionPlacements: PromotionPlacement[] = [
  { id: "promo_1", toolSlug: "cursor", label: "Sponsored build stack", sponsorName: "Cursor", placement: "top_rail", priorityWeight: 94, momentumLift: 42, impressions: 18420, ctr: 3.8, startsAt: "2026-05-22", expiresAt: "2026-05-29", status: "active" },
  { id: "promo_2", toolSlug: "kling", label: "Creator video push", sponsorName: "Kling", placement: "top_rail", priorityWeight: 88, momentumLift: 31, impressions: 14210, ctr: 3.2, startsAt: "2026-05-22", expiresAt: "2026-05-27", status: "active" },
  { id: "promo_3", toolSlug: "lovable", label: "Launch acceleration", sponsorName: "Lovable", placement: "top_rail", priorityWeight: 82, momentumLift: 18, impressions: 11890, ctr: 2.9, startsAt: "2026-05-22", expiresAt: "2026-05-26", status: "active" },
  { id: "promo_4", toolSlug: "notebooklm", label: "Research workflow", sponsorName: "NotebookLM", placement: "homepage_panel", priorityWeight: 76, momentumLift: 24, impressions: 9620, ctr: 2.4, startsAt: "2026-05-22", expiresAt: "2026-05-30", status: "active" }
];

export const boostTiers: BoostTier[] = [
  { id: "boost_10", label: "10x", multiplier: 10, price: "$149", duration: "24h", description: "Starter visibility across the promoted momentum rail.", placementSlots: ["Top rail", "Category mention"] },
  { id: "boost_30", label: "30x", multiplier: 30, price: "$399", duration: "72h", description: "Priority rail rotation plus homepage movement context.", placementSlots: ["Top rail", "What is moving"] },
  { id: "boost_50", label: "50x", multiplier: 50, price: "$749", duration: "7d", description: "High-signal sponsor placement for launch and growth pushes.", placementSlots: ["Top rail", "Boost panel", "Workflow mention"] },
  { id: "boost_100", label: "100x", multiplier: 100, price: "$1.4k", duration: "14d", description: "Sustained distribution with admin-reviewed ranking weight.", placementSlots: ["Top rail", "Homepage panel", "Related tools"] },
  { id: "boost_500", label: "500x", multiplier: 500, price: "Custom", duration: "30d", description: "Managed campaign for serious product launches and category ownership.", placementSlots: ["Rail takeover", "Feature workflow", "Analytics"] }
];

export const canonicalAliases = [
  { alias: "Chat GPT", canonical: "ChatGPT", slug: "chatgpt" },
  { alias: "chat-gpt", canonical: "ChatGPT", slug: "chatgpt" },
  { alias: "OpenAI", canonical: "ChatGPT", slug: "chatgpt" },
  { alias: "Claude AI", canonical: "Claude", slug: "claude" },
  { alias: "Anthropic Claude", canonical: "Claude", slug: "claude" },
  { alias: "Anthropic", canonical: "Claude", slug: "claude" },
  { alias: "OpenAI ChatGPT", canonical: "ChatGPT", slug: "chatgpt" },
  { alias: "Midjourney AI", canonical: "Midjourney", slug: "midjourney" },
  { alias: "Notebook LM", canonical: "NotebookLM", slug: "notebooklm" },
  { alias: "Google NotebookLM", canonical: "NotebookLM", slug: "notebooklm" },
  { alias: "Google Notebook LM", canonical: "NotebookLM", slug: "notebooklm" },
  { alias: "v0", canonical: "V0", slug: "v0" },
  { alias: "v0.dev", canonical: "V0", slug: "v0" },
  { alias: "Vercel v0", canonical: "V0", slug: "v0" }
];

export const ingestionSources = [
  { id: "src_1", sourceName: "Product Hunt", sourceType: "launches", url: "https://www.producthunt.com", enabled: true, lastCheckedAt: "Configured" },
  { id: "src_2", sourceName: "TAAFT", sourceType: "directory", url: "https://theresanaiforthat.com", enabled: true, lastCheckedAt: "Configured" },
  { id: "src_3", sourceName: "Futurepedia", sourceType: "future_candidate", url: "https://www.futurepedia.io", enabled: false, lastCheckedAt: "Future" },
  { id: "src_4", sourceName: "GitHub", sourceType: "future_candidate", url: "https://github.com/trending", enabled: false, lastCheckedAt: "Future" },
  { id: "src_5", sourceName: "Hugging Face", sourceType: "future_candidate", url: "https://huggingface.co", enabled: false, lastCheckedAt: "Future" },
  { id: "src_6", sourceName: "Reddit", sourceType: "future_candidate", url: "https://www.reddit.com", enabled: false, lastCheckedAt: "Future" },
  { id: "src_7", sourceName: "X", sourceType: "future_candidate", url: "https://x.com", enabled: false, lastCheckedAt: "Future" },
  { id: "src_8", sourceName: "YouTube", sourceType: "future_candidate", url: "https://www.youtube.com", enabled: false, lastCheckedAt: "Future" },
  { id: "src_9", sourceName: "Newsletters/RSS", sourceType: "future_candidate", url: "https://example.com/rss", enabled: false, lastCheckedAt: "Future" },
  { id: "src_10", sourceName: "Manual Submissions", sourceType: "future_candidate", url: "#", enabled: false, lastCheckedAt: "Future" },
  { id: "src_11", sourceName: "Creator Discovery", sourceType: "future_candidate", url: "#", enabled: false, lastCheckedAt: "Future" }
];

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
