# Node System Audit

Approved baseline: `c047854 - Establish TikTok Shop placeholder baseline`.

Scope: this document describes the node system exactly as implemented in the current repository. It does not propose new mappings, route changes, component changes, or data changes.

## Executive Summary

The application is a Next.js App Router graph browser backed by static placeholder data. The core graph uses internal `Tool` terminology for the product node, while the visible UI frequently presents that same node as "Product" and the route terminology remains `/tools/[slug]`. This split is intentional in the current baseline and is visible across the type layer (`lib/types.ts:25-111`), data layer (`lib/data.ts:432-438`), search layer (`lib/search.ts:88-135`), homepage table (`components/tool-table.tsx:1-128`), and detail route (`app/tools/[slug]/page.tsx:38-90`).

The primary static graph is populated from `lib/placeholder-data.ts`, then re-exported and lightly wired in `lib/data.ts`. Placeholder records exercise products/tools, categories, attention subcategories, workflows, micro workflows, creators, creator-tool relationships, workflow-tool relationships, workflow-micro-workflow relationships, micro-workflow-tool relationships, evidence sources, movement events, attention feed items, discovery edges, promotions, boost tiers, feature flags, claim requests, canonical aliases, ingestion sources, and narrative strings (`lib/placeholder-data.ts:31-451`; `lib/data.ts:432-647`).

The main user traversal model is: homepage discovery modules -> product, category, heatmap, creator, workflow, event, moving, narrative, search, compare, watchlist, claim, onboarding, dashboard, and operator routes. Static route generation exists for product, creator, workflow, category, tag, claim, and some micro-workflow pages, but missing-record behavior differs: product and creator dynamic routes fall back to local browser graph profiles, while category, workflow, claim, tag, and micro-workflow dynamic routes call `notFound()` (`app/tools/[slug]/page.tsx:42-44`; `app/creators/[id]/page.tsx:18-20`; `app/categories/[slug]/page.tsx:17-19`; `app/workflows/[slug]/page.tsx:15-17`; `app/micro-workflows/[slug]/page.tsx:17-19`).

Search is graph-aware and virtualizes the public result names as `product`, `creator`, `workflow`, and `micro_workflow`, while also building internal `topic` and `category` results that are filtered out from public result groups (`lib/search.ts:5-6`, `lib/search.ts:341-348`, `lib/search.ts:407-422`, `lib/search.ts:469-478`). Watchlist and local dashboards use browser `localStorage` keys that still include `appscreener` in the internal storage namespace (`components/save-button.tsx:6-23`; `lib/local-graph.ts:3-6`; `app/watchlist/page.tsx:10-30`).

Compatibility note: the Trending Products table temporarily preserves legacy internal field names and metric slots while presenting TikTok Shop semantics. In `components/tool-table.tsx`, the existing `growth24h` position is displayed as `24h GMV`, the existing creator-count position is displayed as `Creators`, the existing source-count position is displayed as `Price`, the existing workflow-count position is displayed as `Units Sold`, and the existing lifecycle column position is displayed as `Videos`. This is a presentation-layer mapping only; no node, route, relationship, type field, or storage field is renamed or removed in this phase.

---

## 1. Canonical Node Inventory

### NODE-01: Tool / Product

| Attribute | Current implementation |
|---|---|
| Internal name | `Tool` |
| Visible name | Product in major public UI; Tool in several legacy labels and internal/admin surfaces |
| Route terminology | `/tools/[slug]`, `/tools/${tool.slug}` |
| Aliases | Product, Tool, item, product profile, local product |
| Definition | A first-class catalog node with identity, description, category, image/logo fields, pricing fields, lifecycle fields, attention/momentum metrics, listing policy fields, graph relationship arrays, source fields, and chart history. |
| Type declarations | `Tool` in `lib/types.ts:25-111`; `PricingType`, `LogoSource`, `Platform`, `LifecycleState`, `ListingStatus`, `SizeClass`, and `RankingMode` in `lib/types.ts:3-23`. |
| Data source | `placeholderTools` in `lib/placeholder-data.ts:42-134`; exported as `tools` in `lib/data.ts:432`; `relatedTools` and `competitors` are overwritten by category-local resolver logic in `lib/data.ts:434-438`. |
| Primary routes | `/tools/[slug]` in `app/tools/[slug]/page.tsx:38-90`; local fallback variant in `app/tools/[slug]/page.tsx:93-146`. |
| Secondary appearances | Homepage (`app/page.tsx:15-82`), category page (`app/categories/[slug]/page.tsx:20-58`), workflows (`app/workflows/page.tsx:9-38`, `app/workflows/[slug]/page.tsx:18-59`), creators (`app/creators/[id]/page.tsx:21-114`), heatmap (`app/heatmap/page.tsx:55-197`), search (`app/search/page.tsx:17-199`), compare (`app/compare/page.tsx:18-48`), watchlist (`app/watchlist/page.tsx:10-61`), dashboard (`app/dashboard/page.tsx:20-216`), operator (`app/operator/page.tsx:29-143`), API routes (`app/api/trending-tools/route.ts:1-5`, `app/api/breakout-tools/route.ts:1-5`). |
| Renderer components | `ToolTable`, `ToolLogo`, `HomeTrendingFilter`, `PromotedMomentumRail`, `WorkflowStack`, `WorkflowProcessTabs`, `SaveButton`, `MovementBadge`, product-detail local components in `app/tools/[slug]/page.tsx`. |
| Identifier | `slug` is the primary routing/join key; `id` is also present and used by evidence `toolId`. |
| Required fields | All fields in `Tool` are non-optional except `officialXUrl`, `sourceUrl`, and `taaftRank` (`lib/types.ts:25-111`). Rendering assumes `name`, `slug`, `category`, `description`, logo fields, metrics, relationship arrays, and `sparkline` exist. |
| Optional fields | `officialXUrl`, `sourceUrl`, `taaftRank` (`lib/types.ts:42`, `lib/types.ts:102`, `lib/types.ts:108`). |
| Metrics | `attentionScore`, `momentumScore`, `creatorScore`, `workflowScore`, `breakoutScore`, `mentions24h`, `mentions7d`, `savesCount`, `growth24h`, `growth7d`, `creatorMentions`, `workflowInclusions`, `searchInterest`, `qualityScore`, `estimatedUsers`, `baselineAttention`, `relativeGrowthVsBaseline`, `recentVelocity`, `acceleration`, `organicTrendingScore`, `listingScore`, `sourceConfidence`, `trendHistory`, `sparkline` (`lib/types.ts:59-110`). |
| Incoming relationships | Category -> Tool by `Tool.category`; Workflow -> Tool by `Workflow.toolSlugs` and `WorkflowToolRelationship`; MicroWorkflow -> Tool by `MicroWorkflowToolRelationship`; Creator -> Tool by `CreatorProfile.toolSlugs` and `CreatorToolRelationship`; Evidence -> Tool by `ToolEvidenceSource.toolSlug`; DiscoveryEdge -> Tool by `fromSlug`/`toSlug`; PromotionPlacement -> Tool by `toolSlug`; ProductClaimRequest -> Tool by `toolSlug`; AttentionSubCategory -> Tool by `relatedToolSlugs`; Watchlist -> Tool by localStorage slug arrays. |
| Outgoing relationships | Tool -> Category via `category`/`categories`; Tool -> tags via `tags` and `subCategoryTags`; Tool -> related tools by `relatedTools`, `competitors`, and `discoveryEdges`; Tool -> evidence by `evidenceSourcesForTool`; Tool -> workflows by workflow stack membership; Tool -> creators by creator-tool relationships. |
| Navigation behavior | Product rows/cards/link controls route to `/tools/${tool.slug}`; product detail links to search, external website, compare, watchlist, category, tags, workflows, micro-workflows, creators, and related tools (`app/tools/[slug]/page.tsx:61-87`, `app/tools/[slug]/page.tsx:924-947`, `app/tools/[slug]/page.tsx:1038-1100`). |
| Empty-state behavior | If `getTool(params.slug)` fails, `/tools/[slug]` renders `LocalProductProfile` and searches browser `localStorage` for a matching `LocalProductRecord`; if absent, script text becomes "Product not found" (`app/tools/[slug]/page.tsx:42-44`, `app/tools/[slug]/page.tsx:157-215`). Tables and cards map over arrays and usually render no rows if arrays are empty. |

### NODE-02: Category

| Attribute | Current implementation |
|---|---|
| Internal name | `Category`; category names use `CategoryName = string`. |
| Visible name | Category; displayed values are neutral placeholders such as `Category 1`. |
| Route terminology | `/categories/[slug]`. |
| Aliases | Sector in some admin action text; category rotation; ecosystem category. |
| Definition | A first-class taxonomy node grouping tools/products and supporting momentum/growth metrics. |
| Type declarations | `CategoryName` in `lib/types.ts:12`; `Category` in `lib/types.ts:113-123`. |
| Data source | `placeholderCategoryNames` and `placeholderCategories` in `lib/placeholder-data.ts:31-40` and `lib/placeholder-data.ts:136-146`; exported as `categories` in `lib/data.ts:440`. |
| Primary routes | `/categories/[slug]` in `app/categories/[slug]/page.tsx:13-58`; `/heatmap` cluster category links in `app/heatmap/page.tsx:140`. |
| Secondary appearances | Homepage attention rotation (`app/page.tsx:65-72`), homepage table category cells (`components/tool-table.tsx:64`), search category virtual results (`lib/search.ts:279-302`), tags page category matches (`app/tags/[tag]/page.tsx:21-29`, `app/tags/[tag]/page.tsx:65-75`), operator categories (`app/operator/page.tsx:75-76`). |
| Renderer components | `CategoryHeatmap` and `AttentionHeatmap` in `components/heatmap.tsx`; category page local `Metric`; `ToolTable`; `Chart`; `MovementBadge`. |
| Identifier | `slug`; category membership is often matched by `Tool.category` and `slugify(tool.category)`. |
| Required fields | `id`, `name`, `slug`, `description`, `momentumScore`, `growth24h`, `growth7d`, `toolsTracked`, `sparkline` (`lib/types.ts:113-123`). |
| Optional fields | None in the type declaration. |
| Metrics | `momentumScore`, `growth24h`, `growth7d`, `toolsTracked`, `sparkline`. |
| Incoming relationships | Tool -> Category by `Tool.category`; Creator -> Category by `CreatorProfile.categorySlugs`; AttentionFeedItem -> Category by `entityType: "category"` and `entitySlug`; Watchlist -> Category by localStorage `appscreener:categories`. |
| Outgoing relationships | Category -> Tool through `categoryTools(slug)`; Category -> Workflow through workflows containing category tools; Category -> Creator through heatmap helper `creatorsForCategory`. |
| Navigation behavior | Category links route to `/categories/${slug}` from table cells, heatmap clusters, tags pages, search, watchlist, moving feed, and homepage preview panels. |
| Empty-state behavior | Missing category route calls `notFound()` (`app/categories/[slug]/page.tsx:17-19`). Existing route renders metrics and sections even when scoped collections are empty; maps produce empty lists and category creator section includes explicit empty state (`app/categories/[slug]/page.tsx:49-56`). |

### NODE-03: Attention SubCategory / Topic

| Attribute | Current implementation |
|---|---|
| Internal name | `AttentionSubCategory`; search virtual result type `topic`. |
| Visible name | Subcategory, Topic, tag, attention cluster item. |
| Route terminology | `/tags/[tag]` for public tag/topic route; `/heatmap` for full heatmap. |
| Aliases | Attention topic, ecosystem tag, creator tag, subcategory. |
| Definition | A supporting taxonomy/attention node used by the homepage heatmap, search topic results, and tag route matching. |
| Type declarations | `AttentionSubCategory` in `lib/types.ts:125-135`; search `SearchResultType` includes `"topic"` in `lib/search.ts:5`. |
| Data source | `placeholderAttentionSubCategories` in `lib/placeholder-data.ts:148-158`; exported as `attentionSubCategories` in `lib/data.ts:442`. Historical/canonical subcategory labels also exist in `lib/attention-subcategories.ts` and are converted into ecosystem tags in `lib/ecosystem-tags.ts:37-47`. |
| Primary routes | No dedicated `/attention-subcategories/[slug]`; public node route is `/tags/[tag]` in `app/tags/[tag]/page.tsx:13-120`. |
| Secondary appearances | Homepage `AttentionHeatmap` (`app/page.tsx:23-27`), search topic results (`lib/search.ts:224-277`), heatmap route side/category context (`app/heatmap/page.tsx:55-197`). |
| Renderer components | `AttentionHeatmap`, `CategoryHeatmap`, `SearchResultRow`, tag page local sections. |
| Identifier | `slug`; visible label is `label`. |
| Required fields | `id`, `slug`, `label`, `color`, metrics, and `relatedToolSlugs` (`lib/types.ts:125-135`). |
| Optional fields | None in the type declaration. |
| Metrics | `momentumScore`, `growth24h`, `growth7d`, `toolsTracked`. |
| Incoming relationships | Tool -> topic/tag by `Tool.tags` and `Tool.subCategoryTags`; `ecosystemTags` derives heatmap topics from canonical subcategories (`lib/ecosystem-tags.ts:37-47`). |
| Outgoing relationships | Topic -> Tool through `relatedToolSlugs` and search resolver topic tools (`lib/search.ts:225-247`); topic/tag page matches tools, creators, workflows, and categories by tag/category comparisons (`app/tags/[tag]/page.tsx:98-120`). |
| Navigation behavior | Homepage heatmap cluster item links to `/tags/${ecosystemTagSlug(tag.label)}` (`components/heatmap.tsx:78-140`); search topic results generate hrefs `/tags/${topic.slug}` but public grouping filters topics from normal result buckets (`lib/search.ts:224-277`, `lib/search.ts:407-422`). |
| Empty-state behavior | `AttentionHeatmap` currently ignores its `items` prop and renders a hardcoded five-cluster visual model (`components/heatmap.tsx:78-140`, `components/heatmap.tsx:166-244`). Tag route calls `notFound()` if `ecosystemTagBySlug` cannot resolve a tag (`app/tags/[tag]/page.tsx:17-19`). |

### NODE-04: Workflow

| Attribute | Current implementation |
|---|---|
| Internal name | `Workflow`. |
| Visible name | Workflow; Trending Workflows; Workflow stack. |
| Route terminology | `/workflows`, `/workflows/[slug]`. |
| Aliases | Stack, playbook, process, workflow node. |
| Definition | A first-class node representing a sequence/stack of tools with outcome, metrics, saves, creator usage, and related micro workflows. |
| Type declarations | `Workflow` in `lib/types.ts:137-151`; relationship types in `lib/types.ts:164-184` and `lib/types.ts:251-274`. |
| Data source | `placeholderWorkflows` in `lib/placeholder-data.ts:181-203`; exported as `workflows` in `lib/data.ts:461`; stack joins use `Workflow.toolSlugs` and `workflowToolRelationships` in `lib/data.ts:452`. |
| Primary routes | `/workflows` in `app/workflows/page.tsx:9-38`; `/workflows/[slug]` in `app/workflows/[slug]/page.tsx:11-80`. |
| Secondary appearances | Homepage preview (`app/page.tsx:42-49`), product detail (`app/tools/[slug]/page.tsx:84-87`, `app/tools/[slug]/page.tsx:842-907`), creator detail (`app/creators/[id]/page.tsx:89-95`), category page (`app/categories/[slug]/page.tsx:58`), heatmap (`app/heatmap/page.tsx:22-28`, `app/heatmap/page.tsx:163-170`), search (`lib/search.ts:137-174`), dashboard, watchlist, API `/api/workflows`. |
| Renderer components | `WorkflowStack`, `WorkflowProcessTabs`, `SaveButton`, `MovementBadge`, workflow detail local components, `ToolLogo`. |
| Identifier | `slug`; `id` also present. |
| Required fields | `id`, `name`, `slug`, `description`, `outcome`, `toolSlugs`, metrics, `sparkline` (`lib/types.ts:137-149`). |
| Optional fields | `featured` (`lib/types.ts:150`). |
| Metrics | `momentumScore`, `growth24h`, `growth7d`, `savesCount`, `creatorUsage`, `sparkline`; workflow detail derives tool-stack count and proof source count. |
| Incoming relationships | Tool -> Workflow by `Workflow.toolSlugs`; Creator -> Workflow by `CreatorProfile.workflowSlugs` and derived `CreatorWorkflowRelationship`; MicroWorkflow -> Workflow by `WorkflowMicroWorkflowRelationship`; Evidence -> Workflow by exact matched tool stack in `evidenceForWorkflowStack`. |
| Outgoing relationships | Workflow -> Tool via `toolSlugs` and `toolsForWorkflow`; Workflow -> MicroWorkflow via `workflowMicroWorkflowRelationships`; Workflow -> Creator via `creatorWorkflowRelationships`; Workflow -> Evidence via exact stack proof resolver. |
| Navigation behavior | Workflow rows link to `/workflows/${workflow.slug}`; workflow detail links to creators, related workflows, external proof sources, and tool pages through `WorkflowProcessTabs`. |
| Empty-state behavior | Missing workflow route calls `notFound()` (`app/workflows/[slug]/page.tsx:15-17`). Workflow detail hides process section when no stack tools exist and shows explicit empty state for missing creator relationships and proof sources (`app/workflows/[slug]/page.tsx:53-60`, `app/workflows/[slug]/page.tsx:74-75`, `app/workflows/[slug]/page.tsx:108-110`). |

### NODE-05: MicroWorkflow

| Attribute | Current implementation |
|---|---|
| Internal name | `MicroWorkflow`. |
| Visible name | Micro Workflow. |
| Route terminology | `/micro-workflows/[slug]`; search result href often resolves to `/workflows/[slug]` or `/workflows`. |
| Aliases | Micro workflow, exact two-tool connection, step/task. |
| Definition | A supporting node representing a smaller workflow unit with status, confidence, source type, and tool relationships. The public dynamic micro-workflow route currently derives pages from two-tool evidence pairs, not directly from `microWorkflows`. |
| Type declarations | `MicroWorkflow` in `lib/types.ts:153-162`; `WorkflowMicroWorkflowRelationship` in `lib/types.ts:164-173`; `MicroWorkflowToolRelationship` in `lib/types.ts:175-184`. |
| Data source | `placeholderMicroWorkflows` in `lib/placeholder-data.ts:205-214`; relationship placeholders in `lib/placeholder-data.ts:216-248`; exported in `lib/data.ts:465`, `lib/data.ts:469`, and `lib/data.ts:473`. |
| Primary routes | `/micro-workflows/[slug]` in `app/micro-workflows/[slug]/page.tsx:13-68`, but route params are generated from `microWorkflowPairs()` evidence-derived pair slugs (`app/micro-workflows/[slug]/page.tsx:102-135`). |
| Secondary appearances | Workflow detail process context, product detail evidence graph groups, search micro-workflow results, creator local fallback, dashboard forms. |
| Renderer components | `WorkflowProcessTabs`, `WorkflowStack`, product detail `MicroWorkflowCard`, search rows. |
| Identifier | `slug` for type/data helpers; dynamic route uses pair slug generated from sorted tool slugs (`app/micro-workflows/[slug]/page.tsx:163-164`). |
| Required fields | `id`, `name`, `slug`, `description`, `outcome`, `status`, `confidence`, `sourceType` (`lib/types.ts:153-162`). |
| Optional fields | None in type declaration. |
| Metrics | `confidence`; route also derives receipts count, source count, and fixed tool count from evidence pairs (`app/micro-workflows/[slug]/page.tsx:31-35`). |
| Incoming relationships | Workflow -> MicroWorkflow by `workflowMicroWorkflowRelationships`; Tool -> MicroWorkflow by `microWorkflowToolRelationships`; Evidence -> MicroWorkflow indirectly when exactly two matched tools form a pair. |
| Outgoing relationships | MicroWorkflow -> Tool by `toolsForMicroWorkflow`; MicroWorkflow -> Workflow by reverse lookup over `workflowMicroWorkflowRelationships`; route pair -> Evidence by evidence sources whose `matchedTools.length === 2`. |
| Navigation behavior | Product detail graph groups link to `/micro-workflows/${microWorkflowPairSlug(toolSlugs)}` (`app/tools/[slug]/page.tsx:1083-1095`); search micro-workflow results link to the first related workflow or `/workflows` (`lib/search.ts:304-327`). |
| Empty-state behavior | Missing pair route calls `notFound()` (`app/micro-workflows/[slug]/page.tsx:17-19`). Search can still expose `MicroWorkflow` records even when the dedicated dynamic route does not use their slug as the route key (`lib/search.ts:304-339`). |

### NODE-06: Creator

| Attribute | Current implementation |
|---|---|
| Internal name | `CreatorProfile`. |
| Visible name | Creator; creator profile; creator signal; Creator Graph. |
| Route terminology | `/creators`, `/creators/[id]`, `/creators/tags/[tag]`. |
| Aliases | Creator, profile, local creator, creator signal. |
| Definition | A first-class profile node with identity, social/avatar metadata, classification tags, relationship slug arrays, scores, category slugs, and source/listing metadata. |
| Type declarations | `CreatorProfile` in `lib/types.ts:276-325`; creator taxonomy types imported from `lib/creator-tags.ts` (`lib/types.ts:1`). |
| Data source | `placeholderCreators` in `lib/placeholder-data.ts:250-296`; exported as `importedCreators` and filtered into `creators` by accepted `listingStatus` in `lib/data.ts:520-528`. |
| Primary routes | `/creators` in `app/creators/page.tsx:4-16`; `/creators/[id]` in `app/creators/[id]/page.tsx:14-117`; local fallback in `app/creators/[id]/page.tsx:119-241`. |
| Secondary appearances | Homepage creator graph (`app/page.tsx:33-40`), product detail creator relationships (`app/tools/[slug]/page.tsx:874-887`, `app/tools/[slug]/page.tsx:939-947`), workflow detail creator relationships (`app/workflows/[slug]/page.tsx:60-77`), heatmap category clusters (`app/heatmap/page.tsx:30-33`, `app/heatmap/page.tsx:153-160`), tag pages, search, dashboard, operator, claims. |
| Renderer components | `CreatorCard`, `CreatorAvatar`, creator detail local components, `ClaimStatusBadge`, `XProfileButton`, `WorkflowStack`, `ToolLogo`. |
| Identifier | `id` is primary route param and join key; `handle` is accepted by `getCreator(id)` as an alternate lookup (`lib/data.ts:681`). Local creators use `slug`. |
| Required fields | Non-optional fields from `CreatorProfile`: `id`, `name`, `handle`, `avatarUrl`, `platform`, `primaryPlatform`, `bio`, followers fields, taxonomy arrays, `workflowSlugs`, `toolSlugs`, `recentMentions`, `creatorScore`, and `categorySlugs` (`lib/types.ts:276-325`). |
| Optional fields | `xHandle`, avatar source fields, `primarySpecialization`, tag metadata fields, ranking/social/source/listing fields (`lib/types.ts:280-324`). |
| Metrics | `followers`, `followerCount`, `tagConfidence`, `creatorScore`, `rankingPosition`, `sourceConfidence`; relationship counts are derived in route/component code. |
| Incoming relationships | Tool -> Creator through `CreatorToolRelationship`; Workflow -> Creator through `CreatorWorkflowRelationship` and `CreatorProfile.workflowSlugs`; Category -> Creator through `CreatorProfile.categorySlugs`; Claim -> Creator by `creatorId`; Watchlist -> Creator by localStorage `appscreener:creators`; AttentionFeed -> Creator by `entityType: "creator"`. |
| Outgoing relationships | Creator -> Tool by `toolSlugs` and creator-tool relationships; Creator -> Workflow by `workflowSlugs` and creator-workflow relationships; Creator -> tag/topic by specialization and taxonomy arrays; Creator -> category by `categorySlugs`. |
| Navigation behavior | Creator cards and rows link to `/creators/${creator.id}`; creator detail links to claim route, tags, workflows, product/tool pages, and dashboard for local fallback. |
| Empty-state behavior | Missing creator route renders `LocalCreatorProfile` and client script reads localStorage; absent local record displays "Creator not found" (`app/creators/[id]/page.tsx:18-20`, `app/creators/[id]/page.tsx:182-240`). `/creators` uses `creatorIntelligenceStatus.publicReady` to choose cards vs placeholder (`app/creators/page.tsx:4-16`). |

### NODE-07: Evidence / Source

| Attribute | Current implementation |
|---|---|
| Internal name | `ToolEvidenceSource`. |
| Visible name | Proof sources, public receipts, evidence, source, detections. |
| Route terminology | No first-class route; external source URLs are opened from product, workflow, and micro-workflow pages. |
| Aliases | Receipt, source, proof source, evidence item. |
| Definition | A supporting source record attached to a tool and optionally workflow, including source identity, URL, image, timestamp, matched tool names, snippet, and platform label. |
| Type declarations | `ToolEvidenceSourceType`, `ToolEvidenceTier`, and `ToolEvidenceSource` in `lib/types.ts:209-231`. |
| Data source | `placeholderToolEvidenceSources` in `lib/placeholder-data.ts:320-349`; exported as `toolEvidenceSources` in `lib/data.ts:532`; product resolver `evidenceSourcesForTool` in `lib/data.ts:534`. |
| Primary routes | Rendered inside `/tools/[slug]`, `/workflows/[slug]`, and `/micro-workflows/[slug]`; no standalone evidence route. |
| Secondary appearances | Product detail source cards and evidence graph groups; workflow proof sources; micro-workflow proof sources; operator evidence/import sections. |
| Renderer components | Product detail local evidence components, workflow detail `WorkflowProofSources`, micro-workflow proof source cards, source icons in `app/tools/[slug]/page.tsx:232-265`. |
| Identifier | `id`; joins use `toolSlug`, optional `workflowSlug`, and `matchedTools` string names. |
| Required fields | `id`, `toolSlug`, `sourceType`, `sourceTitle`, `sourceAuthor`, `sourceUrl`, `detectedAt`, `matchedTools`, `snippet`, `platformLabel` (`lib/types.ts:212-231`). |
| Optional fields | `toolId`, `workflowId`, `workflowSlug`, `canonicalUrl`, `sourceImageUrl`, `sourcePublishedAt`, preview fetch fields (`lib/types.ts:214-230`). |
| Metrics | Derived source tier counts (`evidenceTierCountsForTool`), source mix counts, receipt counts, evidence strength ranking, relative last seen (`lib/data.ts:536-552`; `app/tools/[slug]/page.tsx:1038-1178`). |
| Incoming relationships | Tool -> Evidence by `toolSlug`; Workflow -> Evidence by exact stack `matchedTools`; MicroWorkflow route -> Evidence by exactly two matched tools. |
| Outgoing relationships | Evidence -> Tool through `toolSlug` and `matchedTools`; Evidence -> Workflow through optional `workflowSlug`; Evidence -> external URL via `sourceUrl`. |
| Navigation behavior | Source CTAs open `sourceUrl` externally; evidence-derived graph groups route to workflow/micro-workflow pages if a known group is found. |
| Empty-state behavior | Workflow and micro-workflow proof sections show explicit empty states when no evidence is found (`app/workflows/[slug]/page.tsx:108-110`; `app/micro-workflows/[slug]/page.tsx:62-64`). Product evidence containers conditionally render fallback copy in local components. |

### NODE-08: Movement Event

| Attribute | Current implementation |
|---|---|
| Internal name | `MovementEvent`. |
| Visible name | News & Events, Movement Events, curated highlights. |
| Route terminology | `/events`; also appears on `/moving`. |
| Aliases | Event, launch, category shift, highlight. |
| Definition | A supporting event/timeline record attached optionally to tool, workflow, or category slugs. |
| Type declarations | `MovementEvent` in `lib/types.ts:186-196`. |
| Data source | `placeholderMovementEvents` in `lib/placeholder-data.ts:351-366`; exported as `movementEvents` in `lib/data.ts:475`. |
| Primary routes | `/events` in `app/events/page.tsx:6-28`. |
| Secondary appearances | Homepage News & Events (`app/page.tsx:79-81`), operator movement events (`app/operator/page.tsx:78`), moving route adjacent to attention feed (`app/moving/page.tsx:4-16`). |
| Renderer components | Homepage `FeedLine`; movement/event route local markup; `MovementBadge` for related metrics. |
| Identifier | `id`; optional joins by `toolSlug`, `workflowSlug`, and `categorySlug`. |
| Required fields | `id`, `title`, `description`, `eventType`, `sourceUrl`, `timestamp` (`lib/types.ts:186-196`). |
| Optional fields | `toolSlug`, `workflowSlug`, `categorySlug`. |
| Metrics | None directly; route combines with recent launches sorted by `launchDate`. |
| Incoming relationships | Tool/Workflow/Category may be referenced by optional slug fields; operator imports event list. |
| Outgoing relationships | Event -> optional tool/workflow/category by slug; external source by `sourceUrl`. |
| Navigation behavior | `/events` launch cards link to `/tools/${tool.slug}`; movement feed links by entity type in attention feed, not by movement event itself. |
| Empty-state behavior | Routes map arrays; no explicit movement-event empty state in `/events`. |

### NODE-09: Attention Feed Item

| Attribute | Current implementation |
|---|---|
| Internal name | `AttentionFeedItem`. |
| Visible name | What's Moving, live feed, attention feed. |
| Route terminology | `/moving`; entity links route to `/tools`, `/workflows`, `/categories`, or `/creators`. |
| Aliases | Feed item, ticker, alert. |
| Definition | A supporting feed record pointing to a target entity by entity type and slug. |
| Type declarations | `AttentionFeedItem` in `lib/types.ts:385-393`. |
| Data source | `placeholderAttentionFeed` in `lib/placeholder-data.ts:368-373`; exported as `attentionFeed` in `lib/data.ts:574`. |
| Primary routes | `/moving` in `app/moving/page.tsx:4-16`. |
| Secondary appearances | Homepage What's Moving (`app/page.tsx:73-75`), operator Attention Feed (`app/operator/page.tsx:80`). |
| Renderer components | Homepage `FeedLine`; moving page local article rows. |
| Identifier | `id`; entity identity is `(entityType, entitySlug)`. |
| Required fields | `id`, `title`, `description`, `severity`, `entityType`, `entitySlug`, `timestamp` (`lib/types.ts:385-393`). |
| Optional fields | None in type declaration. |
| Metrics | `severity` is categorical. |
| Incoming relationships | Source entity may be tool/workflow/category/creator. |
| Outgoing relationships | Feed item routes to target entity using conditional route prefix in `app/moving/page.tsx:16`. |
| Navigation behavior | "Monitor" link builds the destination from `entityType` and `entitySlug`. |
| Empty-state behavior | `/moving` maps the feed array without an explicit empty-state branch. |

### NODE-10: Discovery Edge

| Attribute | Current implementation |
|---|---|
| Internal name | `DiscoveryEdge`. |
| Visible name | Related products/tools, paired tools, adjacent products. |
| Route terminology | No direct route; links usually point to `/tools/[slug]`. |
| Aliases | Edge, related item, pair, graph edge. |
| Definition | A supporting relationship record connecting two tool slugs with a relationship type, strength, narrative, and optional reason/source. |
| Type declarations | `DiscoveryEdge` in `lib/types.ts:395-406`. |
| Data source | `placeholderDiscoveryEdges` in `lib/placeholder-data.ts:375-381`; merged with derived edges in `lib/data.ts:581-637`. |
| Primary routes | None. |
| Secondary appearances | Heatmap route paired tools (`app/heatmap/page.tsx:44-53`, `app/heatmap/page.tsx:107-112`), product search related products (`lib/search.ts:115-120`), product detail relationship summaries. |
| Renderer components | Heatmap page local `ToolSignalRow`, product detail relationship cards, search relationship buckets. |
| Identifier | `id`; join fields are `fromSlug` and `toSlug`. |
| Required fields | `id`, `fromSlug`, `toSlug`, `relationship`, `strength`, `narrative` (`lib/types.ts:395-406`). |
| Optional fields | `fromToolId`, `toToolId`, `reason`, `evidenceSource`. |
| Metrics | `strength`; derived edges score by category/tag/use-case overlap (`lib/data.ts:581-625`). |
| Incoming relationships | Tool -> Edge by slug; search and heatmap call edge filters. |
| Outgoing relationships | Edge -> two Tool nodes by `fromSlug` and `toSlug`. |
| Navigation behavior | Heatmap pair row links to the `from` tool route; search related product links route to the other tool. |
| Empty-state behavior | Edge consumers filter unresolved endpoints; unresolved pairs are dropped (`app/heatmap/page.tsx:44-53`; `lib/search.ts:115-119`). |

### NODE-11: Watchlist Item

| Attribute | Current implementation |
|---|---|
| Internal name | No exported first-class type; client state object with arrays `tools`, `workflows`, `categories`, `creators`. |
| Visible name | Watchlist, saved item, monitor. |
| Route terminology | `/watchlist`; storage keys `appscreener:tools`, `appscreener:workflows`, `appscreener:categories`, `appscreener:creators`. |
| Aliases | Saved entity, monitor item. |
| Definition | Browser-local saved entity references by slug/id. |
| Type declarations | Inline component state in `app/watchlist/page.tsx:10-30`; `SaveButton` `Kind` union in `components/save-button.tsx:6`. |
| Data source | Browser `localStorage`; loaded in watchlist and dashboard (`app/watchlist/page.tsx:14-20`; `app/dashboard/page.tsx:198-214`). |
| Primary routes | `/watchlist`. |
| Secondary appearances | `SaveButton` on product, workflow, and category pages; dashboard watchlist summary. |
| Renderer components | `SaveButton`, watchlist page `WatchPanel`, dashboard `WatchlistToolRow`. |
| Identifier | Slug/id string stored in kind-specific arrays. |
| Required fields | Saved references must match existing entity identifiers to render as rows. |
| Optional fields | N/A. |
| Metrics | Watchlist count; saved rows reuse target node `growth` and `sparkline` fields. |
| Incoming relationships | Product/workflow/category `SaveButton`; watchlist can read creators but no current `SaveButton` supports creator kind. |
| Outgoing relationships | Watchlist references -> Tools, Workflows, Categories, Creators. |
| Navigation behavior | Monitor links route to main discovery pages; saved row rendering itself is summary-only in `WatchPanel`. |
| Empty-state behavior | `WatchPanel` renders "No saved items yet." when the passed items array is empty (`app/watchlist/page.tsx:61-68`). |

### NODE-12: Comparison Item

| Attribute | Current implementation |
|---|---|
| Internal name | No exported first-class type; selected slugs in compare page state. |
| Visible name | Compare, selected products. |
| Route terminology | `/compare`; product detail links include query parameter `?tools=${tool.slug}`. |
| Aliases | Comparison row, selected tool. |
| Definition | Client-only comparison state over up to four tool slugs. |
| Type declarations | Inline `metrics` and `selected` state in `app/compare/page.tsx:9-48`. |
| Data source | `tools` from `lib/data.ts`; local component state. |
| Primary routes | `/compare`. |
| Secondary appearances | Product detail Compare link (`app/tools/[slug]/page.tsx:74`). |
| Renderer components | Compare page local table. |
| Identifier | Tool `slug`. |
| Required fields | Selected slug must match a `Tool`; table reads `momentumScore`, `growth24h`, `creatorMentions`, `workflowInclusions`, `searchInterest`, and `savesCount` (`app/compare/page.tsx:9-15`). |
| Optional fields | None for selected state. |
| Metrics | Six metrics listed above. |
| Incoming relationships | Product -> Compare via link; compare page does not currently parse query params. |
| Outgoing relationships | Compare item -> Tool by selected slug. |
| Navigation behavior | Buttons toggle selection; no navigation from selected table cells. |
| Empty-state behavior | With no selected tools, metric rows render only metric labels and no values. |

### NODE-13: Promotion Placement / Boost Tier

| Attribute | Current implementation |
|---|---|
| Internal name | `PromotionPlacement`, `BoostTier`. |
| Visible name | Promoted rail, boost campaign, boost package. |
| Route terminology | No entity route; actions can route to onboarding. |
| Aliases | Campaign, ad package, boost tier, sponsored placement. |
| Definition | Supporting commercial placement and tier records used by homepage rail, boost panel, and operator controls. |
| Type declarations | `PromotionPlacement` in `lib/types.ts:416-429`; `BoostTier` in `lib/types.ts:431-439`. |
| Data source | `placeholderPromotionPlacements` and `placeholderBoostTiers` in `lib/placeholder-data.ts:388-411`; exported in `lib/data.ts:641-643`. |
| Primary routes | None. |
| Secondary appearances | Homepage `PromotedMomentumRail` and `BoostPanel` (`app/page.tsx:21`, `app/page.tsx:62`), operator Promotions (`app/operator/page.tsx:84`). |
| Renderer components | `PromotedMomentumRail`, `BoostPanel`. |
| Identifier | `id`; placement joins to Tool by `toolSlug`; tier uses `id`/`label`. |
| Required fields | All fields in `PromotionPlacement` and `BoostTier` type declarations are required (`lib/types.ts:416-439`). |
| Optional fields | None in type declarations. |
| Metrics | Placement `priorityWeight`, `momentumLift`, `impressions`, `ctr`; tier `multiplier`. `boostRailScoreFor` derives ranking from placement/tool fields (`lib/ranking.ts:103-117`). |
| Incoming relationships | Tool -> PromotionPlacement by `toolSlug`; boost panel uses tiers independently. |
| Outgoing relationships | PromotionPlacement -> Tool; BoostTier -> modal/onboarding action. |
| Navigation behavior | Promoted rail links to external `websiteUrl` if present, otherwise internal fallback; boost panel buttons route to `/onboarding/product` or `/onboarding/creator` through `router.push` (`components/boost-panel.tsx:154`, `components/boost-panel.tsx:165`). |
| Empty-state behavior | Rail builds fallback items from `tools.slice(0,8)` and a temporary discovery slot; boost panel maps passed tiers. |

### NODE-14: Claim Entity

| Attribute | Current implementation |
|---|---|
| Internal name | `CreatorClaimRequest`, `ProductClaimRequest`; status helper returns `ClaimStatus`. |
| Visible name | Claim Profile, Manage Profile, claim request, ownership. |
| Route terminology | `/claim/creator/[id]`, `/claim/product/[slug]`, `/operator/claims`. |
| Aliases | Ownership profile, product claim, creator claim. |
| Definition | Supporting request records for claiming creator and product pages. |
| Type declarations | `CreatorClaimRequest` in `lib/types.ts:327-337`; `ProductClaimRequest` in `lib/types.ts:339-350`; `ClaimStatus` in `lib/types.ts:20`. |
| Data source | `placeholderCreatorClaimRequests` and `placeholderProductClaimRequests` in `lib/placeholder-data.ts:422-449`; exported in `lib/data.ts:554-572`. |
| Primary routes | `/claim/creator/[id]`, `/claim/product/[slug]`, `/operator/claims`. |
| Secondary appearances | Creator detail and product detail claim badges/actions; dashboards use first claim as fallback profile (`app/dashboard/product/page.tsx:15-35`; `app/dashboard/creator/page.tsx:16-31`). |
| Renderer components | `ClaimStatusBadge`, claim route forms, operator claims lists. |
| Identifier | Claim `id`; joins use `creatorId` or `toolSlug`. |
| Required fields | All fields listed in claim request types except optional note/preferred profile URL (`lib/types.ts:327-350`). |
| Optional fields | `preferredProfileUrl` and `note` on creator claims; `note` on product claims. |
| Metrics | Claim status counts in operator/dashboard surfaces. |
| Incoming relationships | Product/Creator -> Claim by helper status functions. |
| Outgoing relationships | Claim -> Creator or Tool by join field. |
| Navigation behavior | Claim CTAs route from product/creator detail to claim forms; forms mutate local submitted state only and emit beta tracking events. |
| Empty-state behavior | Missing target product/creator claim route calls `notFound()`; operator maps placeholder request arrays. |

### NODE-15: Local Product / Local Creator

| Attribute | Current implementation |
|---|---|
| Internal name | `LocalProductRecord`, `LocalCreatorRecord`. |
| Visible name | Product asset, Creator asset, workspace profile, local product profile, local creator profile. |
| Route terminology | Dashboard routes `/dashboard`, `/dashboard/product`, `/dashboard/creator`; public fallback `/tools/[slug]` and `/creators/[id]` resolve local records by slug. |
| Aliases | Local graph, product asset, creator asset. |
| Definition | Browser-local records created through onboarding/dashboard and stored in localStorage. They preserve public page fallbacks without modifying static data. |
| Type declarations | `LocalProductRecord` in `lib/types.ts:352-367`; `LocalCreatorRecord` in `lib/types.ts:369-383`. |
| Data source | `lib/local-graph.ts:3-150`; onboarding pages create records; dashboards read latest records. |
| Primary routes | `/onboarding/product`, `/onboarding/creator`, `/dashboard`, `/dashboard/product`, `/dashboard/creator`; local public fallback variants on `/tools/[slug]` and `/creators/[id]`. |
| Secondary appearances | App shell profile chip from localStorage (`components/app-shell.tsx:51-78`). |
| Renderer components | Dashboard local cards, onboarding forms, local fallback product/creator profile scripts. |
| Identifier | `slug`; active record keys store active slug. |
| Required fields | All fields in local record type declarations are required. |
| Optional fields | None in type declarations. |
| Metrics | Dashboard counts derive number of connected tools/workflows/micro-workflows and watchlist count. |
| Incoming relationships | Onboarding save creates records; dashboard reads records; public fallback pages read by slug. |
| Outgoing relationships | Local product/creator -> tools/workflows/micro-workflows by slug arrays; external website/social URLs. |
| Navigation behavior | Onboarding confirmation links route to `/dashboard` after `saveLocalProduct` or `saveLocalCreator`; dashboard preview links route to local public fallback routes when a local record exists (`app/onboarding/product/page.tsx:41-73`; `app/onboarding/creator/page.tsx:43-74`; `app/dashboard/product/page.tsx:108-117`; `app/dashboard/creator/page.tsx:106-115`). |
| Empty-state behavior | Dashboard falls back to empty asset cards and neutral profile copy; public fallback scripts render "Product not found" or "Creator not found" if no local record matches. |

### NODE-16: Feature Flag / Ingestion Source / Canonical Alias / Narrative

| Attribute | Current implementation |
|---|---|
| Internal name | `FeatureFlag`; ingestion source inline object; canonical alias inline object; `placeholderNarratives` string array. |
| Visible name | Feature Flags, Ingestion Sources, Canonicalization, Micro Narratives. |
| Route terminology | Operator sections; `/narratives`; homepage narrative preview. |
| Aliases | Settings, import sources, narratives, theses. |
| Definition | Supporting admin/editorial records used by operator pages and narrative previews. |
| Type declarations | `FeatureFlag` in `lib/types.ts:408-414`; aliases and ingestion sources are untyped inline arrays in `lib/data.ts:645-647`; narratives are strings in `lib/placeholder-data.ts:451`. |
| Data source | `placeholderFeatureFlags`, `placeholderCanonicalAliases`, `placeholderIngestionSources`, `placeholderNarratives` (`lib/placeholder-data.ts:383-451`). |
| Primary routes | `/operator`, `/narratives`. |
| Secondary appearances | Homepage narrative preview (`app/page.tsx:76-78`), search aliases (`lib/search.ts:55-57`, `lib/search.ts:111`). |
| Renderer components | Operator `AdminList`; homepage `PreviewPanel`; narratives route local markup. |
| Identifier | Feature flag `id`/`key`; alias `slug`; ingestion source `id`; narratives use array index. |
| Required fields | Feature flag fields from `lib/types.ts:408-414`; alias/ingestion fields inferred from placeholder literals and `lib/data.ts:645-647`. |
| Optional fields | None in current literals. |
| Metrics | Import stats derived in `lib/data.ts:423-430`; feature flags expose enabled state. |
| Incoming relationships | Search uses aliases to enrich product exact matching; operator imports all arrays. |
| Outgoing relationships | Alias -> Tool by slug; ingestion sources have no active fetch wiring in UI; narrative strings do not link to nodes. |
| Navigation behavior | Operator sidebar state changes between sections; narrative page does not link individual strings. |
| Empty-state behavior | Operator maps arrays; narratives map placeholder strings. |

---

## 2. Terminology Crosswalk

| Concept ID | Internal terminology | Visible terminology | Route terminology | Component terminology | Type terminology | Main files |
|---|---|---|---|---|---|---|
| TERM-01 | `Tool` | Product, Tool | `/tools/[slug]` | `ToolTable`, `ToolLogo`, `HomeTrendingFilter`, `TrendingCard` | `Tool` | `lib/types.ts:25-111`, `lib/data.ts:432-438`, `components/tool-table.tsx`, `app/tools/[slug]/page.tsx` |
| TERM-02 | `Category` | Category | `/categories/[slug]` | `CategoryHeatmap`, category page `Metric` | `Category`, `CategoryName` | `lib/types.ts:12`, `lib/types.ts:113-123`, `app/categories/[slug]/page.tsx` |
| TERM-03 | `AttentionSubCategory` | Subcategory, Topic, tag, attention cluster | `/tags/[tag]`, `/heatmap` | `AttentionHeatmap` | `AttentionSubCategory`, search `topic` | `lib/types.ts:125-135`, `components/heatmap.tsx`, `lib/search.ts:224-277` |
| TERM-04 | `Workflow` | Workflow, stack | `/workflows`, `/workflows/[slug]` | `WorkflowStack`, `WorkflowProcessTabs` | `Workflow` | `lib/types.ts:137-151`, `app/workflows/page.tsx`, `app/workflows/[slug]/page.tsx` |
| TERM-05 | `MicroWorkflow` | Micro Workflow | `/micro-workflows/[slug]`; sometimes `/workflows/[slug]` in search | `WorkflowProcessTabs`, `MicroWorkflowCard` | `MicroWorkflow` | `lib/types.ts:153-162`, `app/micro-workflows/[slug]/page.tsx`, `lib/search.ts:304-339` |
| TERM-06 | `CreatorProfile` | Creator, Creator Graph, creator signal | `/creators`, `/creators/[id]` | `CreatorCard`, `CreatorAvatar` | `CreatorProfile` | `lib/types.ts:276-325`, `app/creators/[id]/page.tsx`, `components/creator-card.tsx` |
| TERM-07 | `CreatorToolRelationship` | tool relationship, uses, teaches, mentions | Rendered inside `/creators/[id]` and `/tools/[slug]` | `CreatorToolRow`, product-detail `CreatorCard` | `CreatorToolRelationship` | `lib/types.ts:237-249`, `lib/data.ts:477-488` |
| TERM-08 | `CreatorWorkflowRelationship` | creator-workflow relationship | `/workflows/[slug]`, `/creators/[id]` | workflow detail creator rows | `CreatorWorkflowRelationship` | `lib/types.ts:263-274`, `lib/data.ts:490-512` |
| TERM-09 | `WorkflowToolRelationship` | stack role, workflow tool relationship | `/workflows/[slug]`, `/operator` | `WorkflowStack`, process tabs | `WorkflowToolRelationship` | `lib/types.ts:251-260`, `lib/placeholder-data.ts:160-179` |
| TERM-10 | `WorkflowMicroWorkflowRelationship` | workflow breakdown step | `/workflows/[slug]` | `WorkflowProcessTabs` indirectly | `WorkflowMicroWorkflowRelationship` | `lib/types.ts:164-173`, `lib/data.ts:661-666` |
| TERM-11 | `MicroWorkflowToolRelationship` | micro-workflow tool relationship | Search and local fallback; route pair derivation differs | `MicroWorkflowCard`, search rows | `MicroWorkflowToolRelationship` | `lib/types.ts:175-184`, `lib/data.ts:667-676` |
| TERM-12 | `ToolEvidenceSource` | Proof source, public receipt, evidence, source | External source links only | product/workflow evidence cards | `ToolEvidenceSource` | `lib/types.ts:209-231`, `lib/data.ts:532-552` |
| TERM-13 | `MovementEvent` | News & Events, Movement Events | `/events` | homepage `FeedLine`, events page rows | `MovementEvent` | `lib/types.ts:186-196`, `app/events/page.tsx` |
| TERM-14 | `AttentionFeedItem` | What's Moving, live feed, Attention Feed | `/moving` | homepage `FeedLine`, moving page rows | `AttentionFeedItem` | `lib/types.ts:385-393`, `app/moving/page.tsx` |
| TERM-15 | `DiscoveryEdge` | related products/tools, paired tools | No route | heatmap paired tools, search buckets | `DiscoveryEdge` | `lib/types.ts:395-406`, `lib/data.ts:581-637` |
| TERM-16 | local watchlist arrays | Watchlist, saved, monitor | `/watchlist` | `SaveButton`, `WatchPanel` | inline state, `Kind` | `components/save-button.tsx:6-23`, `app/watchlist/page.tsx:10-30` |
| TERM-17 | compare selected slugs | Compare | `/compare` | compare page local table | inline state | `app/compare/page.tsx:9-48` |
| TERM-18 | `PromotionPlacement`, `BoostTier` | Promoted, Boost, campaign | No entity route | `PromotedMomentumRail`, `BoostPanel` | `PromotionPlacement`, `BoostTier` | `lib/types.ts:416-439`, `components/promoted-momentum-rail.tsx`, `components/boost-panel.tsx` |
| TERM-19 | `CreatorClaimRequest`, `ProductClaimRequest` | Claim Profile, claim request | `/claim/creator/[id]`, `/claim/product/[slug]`, `/operator/claims` | `ClaimStatusBadge` | claim request types | `lib/types.ts:327-350`, `app/operator/claims/page.tsx` |
| TERM-20 | `LocalProductRecord`, `LocalCreatorRecord` | local product/creator profile, workspace asset | `/dashboard`, onboarding, fallback public routes | dashboard and local fallback components | local record types | `lib/types.ts:352-383`, `lib/local-graph.ts:3-150` |

Terminology collisions:

| Collision | Evidence |
|---|---|
| Internal `Tool` is visible as Product in search and homepage, but routes remain `/tools`. | `Tool` type is declared in `lib/types.ts:25`; search emits `type: "product"` with href `/tools/${tool.slug}` in `lib/search.ts:101-120`; homepage renders "Trending Products" while passing `tools` to `ToolTable` in `app/page.tsx:23-29`. |
| `MicroWorkflow` records exist, but `/micro-workflows/[slug]` uses evidence-derived pair slugs rather than `MicroWorkflow.slug`. | `MicroWorkflow` type/data in `lib/types.ts:153-162` and `lib/data.ts:465`; route params come from `microWorkflowPairs()` in `app/micro-workflows/[slug]/page.tsx:13-19` and `app/micro-workflows/[slug]/page.tsx:102-135`. |
| Topic/tag terminology combines `AttentionSubCategory`, creator tags, and ecosystem tags under `/tags/[tag]`. | `AttentionSubCategory` data is in `lib/data.ts:442`; ecosystem tag lookup is used by tag route in `app/tags/[tag]/page.tsx:17-29`; search topic results combine attention topics and ecosystem tags in `lib/search.ts:224-277`. |
| Watchlist reads creators but `SaveButton` cannot write creator saves. | Watchlist reads `appscreener:creators` in `app/watchlist/page.tsx:16-20`; `SaveButton` kind union excludes creators in `components/save-button.tsx:6`. |
| Compare links pass query params that the compare page does not consume. | Product detail uses `/compare?tools=${tool.slug}` in `app/tools/[slug]/page.tsx:74`; compare page initializes `selected` as empty local state in `app/compare/page.tsx:18-20`. |
| Internal storage namespace still says `appscreener`. | `components/save-button.tsx:9`; `lib/local-graph.ts:3-6`; `app/watchlist/page.tsx:16-19`. |

---

## 3. Complete Route Map

| Route ID | Path | Page file | Purpose | Primary node | Secondary nodes | Parameters | Data loaders | Entry points | Exit paths | Missing-record behavior | Visible terminology |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ROUTE-01 | `/` | `app/page.tsx:15-101` | Homepage discovery dashboard with rail, trending table, heatmap preview, creator/workflow/product/event panels. | Tool/Product collection | AttentionSubCategory, Creator, Workflow, Category, AttentionFeedItem, MovementEvent, BoostTier, Narrative | None | `attentionFeed`, `attentionSubCategories`, `boostTiers`, `categories`, `creatorIntelligenceStatus`, `creators`, `movementEvents`, `tools`, `workflows`; narratives from placeholder data (`app/page.tsx:10-13`) | App shell brand/home link; direct route | `/heatmap`, `/creators`, `/workflows`, `/events`, `/tools/[slug]`, `/moving`, `/narratives` | Array maps render empty/no rows; creator graph has explicit publicReady fallback (`app/page.tsx:33-40`) | Attention Heatmap, Creator Graph, Trending Workflows, Newly Listed, Attention Rotation, What's Moving, Micro Narratives, News & Events |
| ROUTE-02 | `/tools/[slug]` | `app/tools/[slug]/page.tsx:38-90` | Product/tool detail intelligence report. | Tool/Product | Evidence, Creator, Workflow, MicroWorkflow, Category, tags, related products | `slug`; static params from `tools` (`app/tools/[slug]/page.tsx:38-40`) | `getTool`, `evidenceSourcesForTool`, `toolsForWorkflow`, `toolsForMicroWorkflow`, local helper functions (`app/tools/[slug]/page.tsx:42-53`) | Tool rows/cards/search/heatmap/dashboard/compare links | `/search`, website external, `/compare`, watchlist mutation, `/categories/[slug]`, `/tags/[tag]`, `/workflows/[slug]`, `/micro-workflows/[slug]`, `/creators/[id]`, `/claim/product/[slug]` | Missing tool renders `LocalProductProfile`; absent local record shows "Product not found" via script (`app/tools/[slug]/page.tsx:93-215`) | Product profile, Visit website, Compare, Add to watchlist, evidence/workflow/creator relationship copy |
| ROUTE-03 | `/creators` | `app/creators/page.tsx:4-16` | Public creator graph landing. | Creator collection | None beyond creator cards | None | `creators`, `creatorIntelligenceStatus` | App shell nav; homepage creator graph; search | `/creators/[id]` through `CreatorCard` | Renders `CreatorPlaceholder` if publicReady false | Creator Graph |
| ROUTE-04 | `/creators/[id]` | `app/creators/[id]/page.tsx:14-300` | Creator profile detail. | Creator | Tool, Workflow, MicroWorkflow, tags, claims | `id`; static params from `creators` (`app/creators/[id]/page.tsx:14-16`) | `getCreator`, `creatorToolRelationships`, `creatorClaimStatus`, `getTool`, `toolsForMicroWorkflow`, localStorage script | Creator cards/search/product/workflow/heatmap/dashboard links | `/claim/creator/[id]`, `/tags/[tag]`, `/workflows/[slug]`, `/tools/[slug]`, `/dashboard/creator` | Missing creator renders `LocalCreatorProfile`; absent local record shows "Creator not found" via script (`app/creators/[id]/page.tsx:119-240`) | Creator signal, Creator Snapshot, Relationship Status, Tools I Use, Tools Mentioned, Workflows I Use / Teach, Topics / Known For, Related Products |
| ROUTE-05 | `/workflows` | `app/workflows/page.tsx:9-38` | Workflow table/list. | Workflow collection | Tool stack | None | `workflows` | App shell nav, homepage preview, search, watchlist | `/workflows/[slug]` | Maps workflow array; no explicit empty state | Workflows, View workflow |
| ROUTE-06 | `/workflows/[slug]` | `app/workflows/[slug]/page.tsx:11-200` | Workflow detail with stack/process, proof, creator relationships, related workflows. | Workflow | Tool, MicroWorkflow, Creator, Evidence | `slug`; static params from `workflows` | `getWorkflow`, `toolsForWorkflow`, `creatorWorkflowRelationships`, `evidenceSourcesForTool`, helper resolvers | Workflow rows/search/product detail/category/creator links | Creator links, related workflow links, source external links, tool links through process tabs, SaveButton | Missing workflow calls `notFound()` (`app/workflows/[slug]/page.tsx:15-17`) | Workflow, Momentum Score, How This Workflow Breaks Down, Proof Sources, Creator Relationships, Related Workflows |
| ROUTE-07 | `/micro-workflows/[slug]` | `app/micro-workflows/[slug]/page.tsx:13-193` | Evidence-derived two-tool micro-workflow detail. | MicroWorkflow pair derived from Evidence and Tool | Tool, Evidence | `slug`; static params from `microWorkflowPairs()` | `tools`, `evidenceSourcesForTool`, local `microWorkflowPairs()` | Product detail graph group route | External source links; process tabs link to tool pages | Missing pair calls `notFound()` (`app/micro-workflows/[slug]/page.tsx:17-19`) | Micro Workflow, Receipts, Sources, Tools, How This Micro Workflow Breaks Down, Proof Sources |
| ROUTE-08 | `/categories/[slug]` | `app/categories/[slug]/page.tsx:13-63` | Category detail with metrics, tool table, fastest tools, heatmap, related workflows. | Category | Tool, Workflow | `slug`; static params from `categories` | `getCategory`, `categoryTools`, `workflows` | Tool table category links, search, heatmap, moving feed, homepage rotation, watchlist | `/tools/[slug]`, `/workflows/[slug]`, SaveButton | Missing category calls `notFound()` (`app/categories/[slug]/page.tsx:17-19`) | Category, Momentum Score, Products Tracked, 24h Growth, 7d Growth, Top Tools, Fastest Moving, Creator Clusters, Related Workflows |
| ROUTE-09 | `/tags/[tag]` | `app/tags/[tag]/page.tsx:13-120` | Tag/topic detail across tools, creators, categories, workflows. | Topic/tag | Tool, Creator, Category, Workflow | `tag`; static params from `ecosystemTags` | `ecosystemTagBySlug`, `tools`, `creators`, `categories`, `workflows` | Tag rails, heatmap items, search topic results | `/tools/[slug]`, `/creators/[id]`, `/categories/[slug]`, `/workflows/[slug]` | Missing tag calls `notFound()` (`app/tags/[tag]/page.tsx:17-19`) | Topic, Related Products, Creators, Categories, Workflows |
| ROUTE-10 | `/creators/tags/[tag]` | `app/creators/tags/[tag]/page.tsx:4-9` | Redirect legacy creator tag route to generic tag route. | Topic/tag | Creator taxonomy | `tag`; static params from creator specializations | `creatorSpecializations`; `redirect` | Legacy/internal links if any | `/tags/[tag]` | Always redirects for valid route function | N/A after redirect |
| ROUTE-11 | `/search` | `app/search/page.tsx:9-224` | Graph search with filters and grouped results. | SearchResult virtual node | Tool/Product, Creator, Workflow, MicroWorkflow | Query params `q`, `type` | `searchEcosystem`, `getTool`; filters inline | App shell command search, nav search, direct route | Result hrefs, related node hrefs, filter query links | Empty results render no result groups; exact/group logic handles empty arrays | Search, All, Products, Creators, Workflows, Micro Workflows, Exact match, None mapped yet |
| ROUTE-12 | `/compare` | `app/compare/page.tsx:9-48` | Client-only product/tool comparison. | Comparison item / Tool selection | Tool metrics | Query may be present but ignored; no declared params | `tools`; local `selected` state | Product detail Compare link, direct route | None from table; picker buttons mutate state | No selected tools produces metric-only table | Compare, Pick up to 4 products |
| ROUTE-13 | `/watchlist` | `app/watchlist/page.tsx:10-71` | Local saved entity dashboard. | Watchlist item | Tool, Workflow, Category, Creator | None | localStorage keys and central arrays | App shell nav, dashboard, SaveButton events | `/`, `/creators`, `/workflows`, `/heatmap`, `/breaking-out`, `/narratives` | `WatchPanel` empty state when each saved array is empty | Watchlist, Saved Products, Workflows, Categories, Creators, Monitor |
| ROUTE-14 | `/heatmap` | `app/heatmap/page.tsx:14-200` | Full ecosystem heatmap page with clusters and side intelligence cards. | Category clusters / movement graph | Tool, Workflow, Creator, DiscoveryEdge, Category | None | `placeholderCategoryNames`, `tools`, `categories`, `workflows`, `creators`, `creatorToolRelationships`, `discoveryEdges` | App shell nav, homepage heatmap panels, watchlist monitor | `/categories/[slug]`, `/tools/[slug]`, `/creators/[id]`, `/workflows/[slug]` | Maps arrays; unresolved edge pairs are filtered | Ecosystem Heatmap, Breakout velocity, Creator adoption, Workflow adds, Emerging ecosystems, Paired tools |
| ROUTE-15 | `/breaking-out` | `app/breaking-out/page.tsx:9-52` | Product/tool breakout ranking page. | Tool collection | None | None | `tools`; filters by mentions/growth | Watchlist monitor link, direct route | `/tools/[slug]` | Empty lists render no rows | Breaking Out, Emerging, Established |
| ROUTE-16 | `/moving` | `app/moving/page.tsx:4-16` | Attention feed list. | AttentionFeedItem | Tool, Workflow, Category, Creator | None | `attentionFeed` | Homepage What's Moving, direct route | Entity-specific monitor link | No explicit empty state | What's Moving, Monitor |
| ROUTE-17 | `/events` | `app/events/page.tsx:6-28` | Movement events and recent launches. | MovementEvent | Tool | None | `movementEvents`, `tools` sorted by `launchDate` | Homepage News & Events/Newly Listed, direct route | `/tools/[slug]` | No explicit empty state | News & Events, Recent launches |
| ROUTE-18 | `/narratives` | `app/narratives/page.tsx:4-27` | Narrative strings with terminal graph stats. | Narrative string | Tool, Category, Workflow counts | None | `placeholderNarratives`, `tools`, `categories`, `workflows` | Homepage Micro Narratives, watchlist monitor | None | Micro Narratives, graph context |
| ROUTE-19 | `/dashboard` | `app/dashboard/page.tsx:20-216` | Local profile dashboard. | LocalProductRecord / LocalCreatorRecord | Watchlist Tool, Workflow count | None | `latestLocalProduct`, `latestLocalCreator`, localStorage watchlist, `tools` | App shell profile/dashboard link, onboarding redirects | `/onboarding/product`, `/onboarding/creator`, `/dashboard/product`, `/dashboard/creator`, `/tools/[slug]`, `/creators/[slug]`, `/watchlist` | Empty asset cards if no local records | TikTok Shop Screener Profile, List Your Product, Match With Brands, Watchlist |
| ROUTE-20 | `/dashboard/product` | `app/dashboard/product/page.tsx:15-139` | Client product workspace that reads the latest local product, then falls back to the first product claim's tool after local graph readiness. | LocalProductRecord or Tool fallback | Workflow, MicroWorkflow, Creator, Topic, Claim | None | `latestLocalProduct`, `productClaimRequests[0]`, `getTool`, `workflows`, `microWorkflows`, `creatorToolRelationships`, `creators`, `toolsForWorkflow`, `toolsForMicroWorkflow` (`app/dashboard/product/page.tsx:7-35`) | Dashboard asset card | `/tools/[slug]` preview when a local or fallback profile exists; `/search?type=product` when no profile exists; display-only workspace buttons | Empty profile branch shows "No active product claim is selected in this static beta shell."; if local graph is ready and placeholder claim resolves, fallback profile renders (`app/dashboard/product/page.tsx:18-35`, `app/dashboard/product/page.tsx:56-118`) | Overview, Profile, Used In Workflows, Creators, Topics, Preview |
| ROUTE-21 | `/dashboard/creator` | `app/dashboard/creator/page.tsx:16-131` | Client creator workspace that reads the latest local creator, then falls back to the first creator claim's creator after local graph readiness. | LocalCreatorRecord or Creator fallback | Tool, Workflow, MicroWorkflow, Topic, Claim | None | `latestLocalCreator`, `creatorClaimRequests[0]`, `getCreator`, `getTool`, `workflows`, `microWorkflows`, `toolsForMicroWorkflow` (`app/dashboard/creator/page.tsx:7-31`) | Dashboard creator asset card | `/creators/[slug-or-id]` preview when a local or fallback profile exists; `/creators` browse link when no profile exists; display-only workspace buttons | Empty profile branch shows "No active creator claim is selected in this static beta shell."; if local graph is ready and placeholder claim resolves, fallback profile renders (`app/dashboard/creator/page.tsx:19-31`, `app/dashboard/creator/page.tsx:52-115`) | Overview, Profile, Tools I Use, Workflows I Use / Teach, Topics, Preview |
| ROUTE-22 | `/onboarding/product` | `app/onboarding/product/page.tsx:18-280` | Client onboarding form that requires an uploaded logo, builds a local product record, saves it, and shows a confirmation state. | LocalProductRecord | Category, Workflow, MicroWorkflow | Form state | `categories`, `workflows`, `microWorkflows`, `tools`, `toolsForWorkflow`, `toolsForMicroWorkflow`, `buildLocalProductRecord`, `readLocalProducts`, `saveLocalProduct` (`app/onboarding/product/page.tsx:7-62`) | Dashboard, boost panel, app shell Sign Up path | Confirmation link routes to `/dashboard`; secondary claim link routes to `/search?type=product`; graph selector dropdowns mutate local selected workflow/micro-workflow state | Form state defaults to empty selections; submit without logo sets `logoError`; storage helpers catch malformed arrays (`app/onboarding/product/page.tsx:19-62`, `lib/local-graph.ts:138-145`) | Product details, Product Logo, Product name, Website, X / social profile, Short tagline, One-sentence description, Primary category, Associated Workflows, Associated Micro Workflows |
| ROUTE-23 | `/onboarding/creator` | `app/onboarding/creator/page.tsx:23-292` | Client onboarding form that requires an uploaded profile photo, builds a local creator record, saves it, and shows a confirmation state. | LocalCreatorRecord | Tool, Workflow, MicroWorkflow | Form state | `creators`, `tools`, `workflows`, `microWorkflows`, `workflowMicroWorkflowRelationships`, `toolsForMicroWorkflow`, `buildLocalCreatorRecord`, `readLocalCreators`, `saveLocalCreator` (`app/onboarding/creator/page.tsx:8-63`) | Dashboard, boost panel, app shell Sign Up path | Confirmation link routes to `/dashboard`; secondary claim link routes to `/search?type=creator`; graph selector dropdowns mutate selected tool/workflow/micro-workflow state | Form state defaults to empty selections; submit without avatar sets `avatarError`; storage helpers catch malformed arrays (`app/onboarding/creator/page.tsx:24-63`, `lib/local-graph.ts:138-145`) | Creator details, Profile Photo, Name, X / social profile, Website, Short bio, Tools Used, Associated Workflows, Associated Micro Workflows |
| ROUTE-24 | `/claim/product/[slug]` | `app/claim/product/[slug]/page.tsx:9-96` | Product claim form driven by query-string submitted state. | ProductClaimRequest / Tool | ClaimStatus | `slug`; `submitted` query param; static params from tools (`app/claim/product/[slug]/page.tsx:9-17`) | `getTool`, `productClaimStatus`, `tools`, `displayCategory`, `betaEventBootstrapScript` | Product detail claim CTA | `View Product Profile` and confirmation back link route to `/tools/[slug]`; confirmation also links to `/dashboard/product`; form action posts/navigates to `/claim/product/[slug]?submitted=1` through hidden input behavior | Missing tool calls `notFound()` (`app/claim/product/[slug]/page.tsx:13-16`) | Product Ownership, Claim [product], Review policy, Product claim submitted |
| ROUTE-25 | `/claim/creator/[id]` | `app/claim/creator/[id]/page.tsx:8-93` | Creator claim form driven by query-string submitted state. | CreatorClaimRequest / Creator | ClaimStatus | `id`; `submitted` query param; static params from creators (`app/claim/creator/[id]/page.tsx:8-16`) | `getCreator`, `creatorClaimStatus`, `creators`, `betaEventBootstrapScript` | Creator detail claim CTA | `View Public Profile` and confirmation back link route to `/creators/[id]`; confirmation also links to `/dashboard/creator`; form action posts/navigates to `/claim/creator/[id]?submitted=1` through hidden input behavior | Missing creator calls `notFound()` (`app/claim/creator/[id]/page.tsx:12-14`) | Creator Ownership, Claim [creator], What happens next, Claim submitted |
| ROUTE-26 | `/operator` | `app/operator/page.tsx:29-143` | Password-gated operator/admin surface. | Multiple admin/support nodes | Tool, Workflow, Category, Creator, MovementEvent, AttentionFeedItem, PromotionPlacement, BoostTier, FeatureFlag, Alias, IngestionSource | Local UI state only | central arrays and policy helpers (`app/operator/page.tsx:4-8`) | Direct route | Section buttons mutate local `section`; row buttons no wired action | Locked until password matches env/default | Admin OS, Overview, Tools, Workflows, Categories, Creators, Movement Events, Signals, Attention Feed, Imports, Moderation, Logos, Promotions, Feature Flags, Rankings, Analytics, Settings |
| ROUTE-27 | `/operator/claims` | `app/operator/claims/page.tsx` | Operator claim review list. | Claim requests | Creator, Tool | None | `creatorClaimRequests`, `productClaimRequests`, `getCreator`, `getTool` | Direct route/operator workflow | Links to creator/product profile pages where present | Maps claim arrays; unresolved linked record may display absent lookup text | Creator Claims, Product Claims |
| ROUTE-28 | `/api/trending-tools` | `app/api/trending-tools/route.ts:1-6` | JSON API for first 100 tools. | Tool collection | None | None | `tools.slice(0,100)` | API consumers | N/A | Always returns JSON | generatedFrom: `local-momentum-model` |
| ROUTE-29 | `/api/breakout-tools` | `app/api/breakout-tools/route.ts:1-6` | JSON API for breakout tools. | Tool collection | None | None | `breakingOutTools` | API consumers | N/A | Always returns JSON | generatedFrom: `local-momentum-model` |
| ROUTE-30 | `/api/workflows` | `app/api/workflows/route.ts:1-6` | JSON API for workflows. | Workflow collection | None | None | `workflows` | API consumers | N/A | Always returns JSON | generatedFrom: `local-workflow-graph` |
| ROUTE-31 | `/api/heatmaps` | `app/api/heatmaps/route.ts:1-6` | JSON API for attention subcategories. | AttentionSubCategory collection | None | None | `attentionSubCategories` | API consumers | N/A | Always returns JSON | generatedFrom: `local-attention-pressure-model` |
| ROUTE-32 | `/api/creator-adoption` | `app/api/creator-adoption/route.ts:1-29` | JSON API for creators with selected source, listing, graph, scoring, and tag metadata stripped; signals is a literal empty array. | Creator collection | Empty signal array | None | `creators` mapped with destructuring omission (`app/api/creator-adoption/route.ts:4-28`) | API consumers | N/A | Always returns JSON | generatedFrom: `accepted-creator-graph` |

Global shell and metadata:

| File | Behavior |
|---|---|
| `app/layout.tsx:14-26` | Defines visible document metadata "TikTok Shop Screener" and wraps every route in `AppShell`. |
| `components/app-shell.tsx:11-44` | Provides global nav to `/search`, `/workflows`, `/creators`, `/heatmap`, and `/watchlist`; brand link routes home. |

---

## 4. Relationship & Wiring Map

| Relationship ID | Source node | Target node | Relationship name | Direction | Cardinality | Storage | Join fields | Resolver/helper | Components | Routes | Navigation behavior | Empty behavior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| REL-01 | Tool | Category | category membership | Tool -> Category; reverse derived | Many tools to one primary category; tool also has category array | `Tool.category`, `Tool.categories`; `Category.slug/name` | `Tool.category` vs `Category.name`; slugified category for route | `categoryTools(slug)` in `lib/data.ts:677`; local slugify helpers | `ToolTable`, `CategoryHeatmap`, category page | `/`, `/categories/[slug]`, `/heatmap`, `/tags/[tag]` | Category cells/links route to `/categories/${slug}` | If no matching tools, category page collections map empty |
| REL-02 | AttentionSubCategory | Tool | relatedToolSlugs | Topic -> Tool | One topic to many tools | `AttentionSubCategory.relatedToolSlugs` | tool slug array | search `topicResults()` in `lib/search.ts:224-247` | `AttentionHeatmap`, search rows | `/`, `/search`, `/tags/[tag]` | Heatmap topic links route to `/tags/[tag]`, not directly to tools | Topic can render no related products in search/tag page |
| REL-03 | Workflow | Tool | workflow stack | Workflow -> Tool | One workflow to many tools | `Workflow.toolSlugs`; also `WorkflowToolRelationship` | workflow slug, tool slug | `toolsForWorkflow` in `lib/data.ts:660`; `acceptedWorkflowToolSlugs` in `lib/data.ts:454-459` | `WorkflowStack`, `WorkflowProcessTabs`, workflow rows | `/workflows`, `/workflows/[slug]`, `/`, `/search`, `/categories/[slug]` | Workflow detail process steps can link to tool pages through step tool data | Process section hidden when stack is empty (`app/workflows/[slug]/page.tsx:53-58`) |
| REL-04 | Workflow | MicroWorkflow | workflow breakdown | Workflow -> MicroWorkflow | One workflow to many micro workflows | `WorkflowMicroWorkflowRelationship` | `workflowSlug`, `microWorkflowSlug` | `microWorkflowsForWorkflow` in `lib/data.ts:661-666` | search micro-workflow related links, local dashboard/fallback | `/workflows/[slug]`, `/search`, dashboards | Search micro-workflow href resolves to first related workflow (`lib/search.ts:304-327`) | Empty returns empty array |
| REL-05 | MicroWorkflow | Tool | micro-workflow tool stack | MicroWorkflow -> Tool | One micro workflow to many tools | `MicroWorkflowToolRelationship` | `microWorkflowSlug`, `toolSlug` | `toolsForMicroWorkflow` and `microWorkflowToolPairsForWorkflow` in `lib/data.ts:667-676` | product detail `MicroWorkflowCard`, search, local fallback | `/tools/[slug]`, `/search`, `/dashboard/*` | Product detail graph groups may route to `/micro-workflows/[pairSlug]`; search may route to workflow | Empty returns empty array |
| REL-06 | Creator | Tool | creator-tool relationship | Creator -> Tool and Tool -> Creator | Many-to-many | `CreatorToolRelationship`; `CreatorProfile.toolSlugs` | `creatorId`, `toolSlug` | `acceptedCreatorToolSlugs` in `lib/data.ts:483-488`; `creatorRelationshipsForTool` in `app/tools/[slug]/page.tsx:939-947`; `creatorToolLookupForClient` in `app/creators/[id]/page.tsx:176-180` | Creator detail rows, product detail creator cards, search related creators | `/creators/[id]`, `/tools/[slug]`, `/search` | Creator rows link to product pages; product creator cards link to creator pages | `mentions` are separated from verified `uses`/`teaches`; missing tool rows return null |
| REL-07 | Creator | Workflow | creator-workflow relationship | Creator -> Workflow and reverse derived | Many-to-many | `CreatorProfile.workflowSlugs`; derived `CreatorWorkflowRelationship` | `creatorId`, `workflowSlug`, supporting tool slugs | `creatorWorkflowRelationships` derived in `lib/data.ts:490-512` | creator detail workflow rows, workflow detail creator rows | `/creators/[id]`, `/workflows/[slug]`, `/search` | Links route to workflow or creator pages | Workflow detail shows explicit empty state if no creator relationships |
| REL-08 | Tool | Evidence | evidence sources | Tool -> Evidence | One tool to many evidence records | `ToolEvidenceSource.toolSlug` | `toolSlug` | `evidenceSourcesForTool` in `lib/data.ts:534` | product detail evidence, workflow proof, micro proof | `/tools/[slug]`, `/workflows/[slug]`, `/micro-workflows/[slug]` | Evidence source CTAs open `sourceUrl` externally | Proof sections show empty states when no matching evidence |
| REL-09 | Evidence | Workflow | stack proof | Evidence -> Workflow inferred | Many evidence records to workflow by exact matched tool set | `ToolEvidenceSource.matchedTools`; optional `workflowSlug` | normalized matched tool names vs workflow stack tool names | `evidenceForWorkflowStack` in `app/workflows/[slug]/page.tsx:115-130` | `WorkflowProofSources` | `/workflows/[slug]` | Source CTAs external | Exact stack mismatch excludes records |
| REL-10 | Evidence | MicroWorkflow pair | two-tool proof | Evidence -> pair | Many evidence records to generated pair | `matchedTools.length === 2` | normalized matched tool names to `Tool.name`; sorted pair slug | `microWorkflowPairs()` in `app/micro-workflows/[slug]/page.tsx:102-135` | micro-workflow detail route | `/micro-workflows/[slug]` | Source CTAs external; process tabs expose tool data | Missing pair calls `notFound()` |
| REL-11 | Tool | Tool | discovery edge / related products | Bidirectional in lookup; stored as directed fields | Many-to-many | `DiscoveryEdge.fromSlug`, `DiscoveryEdge.toSlug`; `Tool.relatedTools`, `Tool.competitors` | slugs | `deriveDiscoveryEdges`, `edgesForTool`, `relatedToolsFor` (`lib/data.ts:581-637`, `lib/data.ts:682`, `app/tools/[slug]/page.tsx:976-980`) | heatmap paired tools, search buckets, product cards | `/tools/[slug]`, `/heatmap`, `/search` | Clicking related product routes to `/tools/[slug]` | Unresolved endpoints filtered out |
| REL-12 | PromotionPlacement | Tool | promoted placement | PromotionPlacement -> Tool | Many placements to one tool possible | `PromotionPlacement.toolSlug` | tool slug | rail finds active placement/tool; ranking helper `boostRailScoreFor` (`lib/ranking.ts:103-117`) | `PromotedMomentumRail`, operator Promotions | `/`, `/operator` | Rail links external website or fallback internal route | Rail also falls back to top tools |
| REL-13 | ProductClaimRequest | Tool | product claim | Claim -> Tool and Tool -> status | One request per slug in helper lookup | `ProductClaimRequest.toolSlug` | tool slug | `productClaimStatus` in `lib/data.ts:566-572` | `ClaimStatusBadge`, claim page, operator claims, dashboard fallback | `/tools/[slug]`, `/claim/product/[slug]`, `/operator/claims`, `/dashboard/product` | Claim CTA routes to `/claim/product/[slug]` | Missing tool claim page calls `notFound()` |
| REL-14 | CreatorClaimRequest | Creator | creator claim | Claim -> Creator and Creator -> status | One request per creator in helper lookup | `CreatorClaimRequest.creatorId` | creator id | `creatorClaimStatus` in `lib/data.ts:558-564` | `ClaimStatusBadge`, claim page, operator claims, dashboard fallback | `/creators/[id]`, `/claim/creator/[id]`, `/operator/claims`, `/dashboard/creator` | Claim CTA routes to `/claim/creator/[id]` | Missing creator claim page calls `notFound()` |
| REL-15 | Watchlist | Tool/Workflow/Category/Creator | saved entity | Watchlist -> entity | Many saved refs by kind | Browser `localStorage` arrays | slug/id string arrays | `SaveButton` writes; watchlist filters central arrays (`components/save-button.tsx:17-23`, `app/watchlist/page.tsx:27-30`) | `SaveButton`, `WatchPanel`, dashboard summary | `/watchlist`, `/dashboard`, detail pages | Save button toggles localStorage and dispatches custom event | Unmatched saved ids disappear because central filters omit them |
| REL-16 | LocalProductRecord | Workflow/MicroWorkflow | local product links | Local product -> workflow/micro | One local product to many slugs | localStorage record arrays | `workflowSlugs`, `microWorkflowSlugs` | local fallback script lookup in `app/tools/[slug]/page.tsx:157-215` | local product page, dashboard product | `/tools/[slug]`, `/dashboard/product` | Local rows do not use Next links; script-generated cards display local graph | Empty arrays show text fallback rows |
| REL-17 | LocalCreatorRecord | Tool/Workflow/MicroWorkflow | local creator links | Local creator -> graph nodes | One local creator to many slugs | localStorage record arrays | `toolSlugs`, `workflowSlugs`, `microWorkflowSlugs` | local fallback script in `app/creators/[id]/page.tsx:182-240` | local creator page, dashboard creator | `/creators/[id]`, `/dashboard/creator` | Script-generated rows link to lookup hrefs | Empty arrays show text fallback rows |
| REL-18 | SearchResult | graph nodes | search virtual result | Search -> node href | Many results across node types | `graphSearchIndex` | result `href`, `slug`, `type` | `searchEcosystem`, `searchGraph`, `exactSearchMatch`, grouping helpers (`lib/search.ts:341-511`) | `CommandSearch`, search route | `/search`, global shell | Result links route to `result.href`; command search handles keyboard navigation | Groups can be empty; exact mode filters product exact match specially |

---

## 5. Component Map

| Component | File | Rendered node/relationship | Parent routes/components | Relevant props | Data assumptions | Interactions | Internal terminology |
|---|---|---|---|---|---|---|---|
| `AppShell` | `components/app-shell.tsx:11-78` | Global navigation, command search, local profile summary | `app/layout.tsx:19-26` | `children` | Browser localStorage may contain local product/creator records | Nav links; profile/dashboard link; listens to custom local graph events | AppShell, appscreener local keys |
| `CommandSearch` | `components/command-search.tsx:13-162` | Search results across virtual graph nodes | `AppShell` | None | Uses `searchEcosystem`; result hrefs must be routable; product results can resolve `ToolLogo`; workflow and micro-workflow results can render `WorkflowStack` | Keyboard shortcut `/`, Escape, arrow navigation, Enter sets `window.location.href`; result click uses anchor href and emits beta event | product, creator, workflow, micro_workflow |
| `HomeTrendingFilter` | `components/home-trending-filter.tsx:11-217` | Product/tool table with tabs and timeframe sorting | `app/page.tsx:23-29` | `tools`, `children` | Tools include category and metric fields; category tabs from placeholder categories | Category filter buttons; timeframe sorting | tools, categoryTabs, timeframes |
| `ToolTable` | `components/tool-table.tsx:1-128` | Tool/Product collection rows | Homepage, category, breaking-out pages | `tools`, `limit`, `showRank`, `showSource` | Tool fields and display stats exist; `tool.slug` routable | Product link, category link, SaveButton row action | ToolTable, Tool |
| `ToolLogo` | `components/tool-logo.tsx:1-36` | Logo/image slot for Tool | Product rows, details, workflows, dashboard | `officialSrc`, `src`, `faviconSrc`, `fallback`, `alt`, `size` | Fallback may be blank; component advances through src list | Image `onError` shifts to next source | tool logo |
| `CreatorAvatar` | `components/creator-avatar.tsx:1-24` | Creator avatar image/fallback | Creator cards/details/product relationships/heatmap | `name`, `src`, `size` | Name exists; src may fail | Image `onError` toggles fallback initials | creator avatar |
| `CreatorCard` | `components/creator-card.tsx:1-36` | Creator card | `/creators` | `creator` | Creator taxonomy arrays may be present | Card link to `/creators/${creator.id}`; tag links to `/tags/[tag]` | CreatorProfile |
| `SaveButton` | `components/save-button.tsx:1-34` | Save/watchlist action | Product, workflow, category pages | `kind`, `id`, `label` | `kind` limited to `tools`, `workflows`, `categories` | Reads/writes localStorage and dispatches `appscreener-watchlist` | appscreener storage |
| `AttentionHeatmap` | `components/heatmap.tsx:78-140` | Homepage attention heatmap visual clusters | Homepage `PreviewPanel` | `items` | Current implementation ignores `items` and renders hardcoded cluster model | Cluster tag links to `/tags/[tag]` | AttentionSubCategory, attentionClusters |
| `CategoryHeatmap` | `components/heatmap.tsx:32-75` | Category movement mini heatmap | Category detail | `categories` | Category metrics and slug present | Links to `/categories/[slug]` | Category |
| `PromotedMomentumRail` | `components/promoted-momentum-rail.tsx` | Promoted/fallback tool rail | Homepage | None | Uses promotion placements, boost scoring, and `tools.slice(0,8)` fallback | External/internal rail links | promoted tool, discovery slot |
| `BoostPanel` | `components/boost-panel.tsx:23-165` | Boost tier/ad package controls | Homepage | `tiers` | Boost tiers passed; local dropdown state | Select package/tier, open modal, route to onboarding | boost, ad package |
| `WorkflowStack` | `components/workflow-stack.tsx:1-18` | Tool logo stack for workflow | Workflow rows/detail/creator/category/search | `toolSlugs`, `limit` | Slugs resolve by `getTool`; unresolved filtered | None | workflow stack, toolSlugs |
| `WorkflowProcessTabs` | `components/workflow-process-tabs.tsx:7-70` | Step-by-step workflow/micro-workflow process | Workflow detail, micro-workflow detail | `steps` | Steps have tool logo fields and text fields | Step tab selection mutates local state; tool logo link routes to `/tools/[slug]` | WorkflowProcessStep |
| `MovementBadge` | `components/movement-badge.tsx` | Growth indicator | Tool/category/workflow rows | `value` | Numeric value | None | movement |
| `TimeframeToggle` | `components/timeframe-toggle.tsx:5-13` | Timeframe control | Workflow detail; compact variant | `value`, `onChange`, `compact` | If no `onChange`, display-only buttons | Calls `onChange` when provided | timeframe |
| `Chart` / `AttentionChart` | `components/chart.tsx:1-19` | Bar chart plus sparkline for numeric series | Category page and any route importing `AttentionChart` | `data`, `title` | Numeric arrays; computes `Math.max(...data)` for bar heights | None | AttentionChart |
| `Sparkline` | `components/sparkline.tsx:1-24` | SVG polyline sparkline | `AttentionChart`, table/watchlist/dashboard chart surfaces where imported | `data`, optional `width`, `height`, `tone` | Numeric arrays; empty data produces an empty points string after `Math.max`/`Math.min` | None | Sparkline |
| `ClaimStatusBadge` | `components/claims/claim-status.tsx:1-12` | Claim status badge | Product/creator detail, claim pages | `status` | Status union; both `pending` and `unclaimed` labels are mapped explicitly | None | ClaimStatus |
| `XProfileButton` / `XMarkIcon` | `components/x-profile-button.tsx:1-16` | Social/X link icon | Product/creator detail | `href`, `label`, optional `className` | Empty href returns `null`; non-empty href renders an external anchor | External profile link | X profile |
| Route-local product detail components | `app/tools/[slug]/page.tsx:232-1210` | Evidence, relationship, workflow, micro-workflow, creator, related product sections | `/tools/[slug]` | local props typed in file | Evidence matched tools must normalize to known tool names for graph groups | Links to workflows, micro-workflows, creators, products, external sources | tool intel, evidence, graph groups |
| Route-local workflow components | `app/workflows/[slug]/page.tsx:83-200` | Proof sources, metrics, process text | `/workflows/[slug]` | local props | Exact matched tool set required for proof sources | External source links | workflow proof |
| Route-local micro-workflow components | `app/micro-workflows/[slug]/page.tsx:70-193` | Pair metrics, proof, process text | `/micro-workflows/[slug]` | local pair props | Pair must be derived from exactly two matched tools | External source links; process tab links | micro workflow pair |
| Route-local operator components | `app/operator/page.tsx:94-143` | Admin lists and tool management | `/operator` | inline props | Arrays are display strings; buttons mostly unwired | Sidebar section mutation; selected tool checkbox mutation | AdminList, ToolsAdmin |

---

## 6. Field & Metric Schema

### Tool fields

Defined in `lib/types.ts:25-111`; populated by `placeholderTools` in `lib/placeholder-data.ts:42-134`; exported as `tools` in `lib/data.ts:432`.

| Field | Type | Required | Definition | Population source | Rendering locations | Behavioral purpose | Fallback behavior |
|---|---|---|---|---|---|---|---|
| `id` | string | Yes | Internal identity. | `tool_${number}` (`lib/placeholder-data.ts:49`) | Evidence optional `toolId`, admin keys | Identity/reference | None |
| `name` | string | Yes | Public display name. | `Product N` (`lib/placeholder-data.ts:50`) | Table, detail, search, cards | Display/search/sort labels | None |
| `slug` | string | Yes | Route/join identity. | `placeholder-product-N` (`lib/placeholder-data.ts:44-51`) | All product links | Navigation and relationship resolution | Missing route uses local fallback |
| `description`, `tagline`, `longDescription` | string | Yes | Descriptive copy. | Neutral `—` (`lib/placeholder-data.ts:52-54`) | Product detail/search/dashboard | Display/search | Empty string accepted but may blank UI |
| `category`, `categories`, `rawSourceCategories`, `subCategoryTags` | string/string arrays | Yes | Taxonomy membership. | Placeholder categories/subcategories (`lib/placeholder-data.ts:55-58`) | Tables, category pages, tags/search/heatmap | Filtering, links, search | Empty arrays map empty |
| `logoUrl`, `officialLogoUrl`, `faviconUrl`, `iconUrl`, `logoSource` | strings/source enum | Yes | Image/logo sources. | Placeholder fallback icon (`lib/placeholder-data.ts:59-63`) | `ToolLogo` everywhere | Image rendering, admin logo queue | `ToolLogo` advances to fallback |
| `websiteUrl`, `officialXUrl`, `company`, `creatorMetadata` | string/optional string | Mixed | External/public metadata. | Neutral values (`lib/placeholder-data.ts:64-67`) | Product detail, dashboards, admin | External links/display/search | Invalid/empty URL can produce inert or fallback link depending component |
| `pricingType`, `pricingTiers`, `pricingSummary` | enum/string[]/string | Yes | Pricing metadata. | Paid/neutral (`lib/placeholder-data.ts:68-70`) | Admin/tool detail | Badge/display | None |
| `launchDate`, `updatedAt`, `importedAt` | string | Yes | Temporal metadata. | `2026-01-01` values (`lib/placeholder-data.ts:71`, `lib/placeholder-data.ts:129-130`) | Events sorting, lifecycle/ranking helpers | Sorting, lifecycle/ranking formulas | Invalid dates can degrade date helpers |
| `tags`, `supportedPlatforms`, `integrations`, `useCases` | arrays | Yes | Search/display classification. | Neutral placeholder arrays (`lib/placeholder-data.ts:72-78`) | Search, tags, detail | Search, related edge derivation | Empty arrays map empty |
| `relatedTools`, `competitors` | string[] | Yes | Related product/tool slug lists. | Seeded then overwritten in `lib/data.ts:434-438` | Product detail/search | Related navigation | Empty arrays fall back by category in product detail helper |
| `lifecycleState`, `suppressed`, `abandoned`, `sizeClass`, `organicRankingLabel`, `listingStatus` | enums/booleans | Yes | State/classification fields. | Placeholder cycling/neutral values (`lib/placeholder-data.ts:81-108`) | Table/admin/breaking-out/search filters | Filtering/ranking/display | `listingStatus` controls search inclusion |
| `listingChecks` | object | Yes | Listing gate booleans. | `lib/placeholder-data.ts:109-120` | Admin moderation, quality | Listing score policy | None |
| `boostEligible`, `workflowEligible`, `creatorSignalEligible` | boolean | Yes | Eligibility flags. | `lib/placeholder-data.ts:121-123` | Admin, promotions | Filtering/display | None |
| `sourceUrls`, `sourceUrl`, `trustedDiscoverySources`, `verificationSignals`, `importedFrom`, `sourceConfidence` | arrays/strings/number | Mixed | Source/provenance metadata. | `lib/placeholder-data.ts:124-128` | Admin/import/search/detail | Source confidence/display | Empty arrays render blank joined strings |
| `screenshots` | string[] | Yes | Screenshot asset URLs. | Placeholder icons (`lib/placeholder-data.ts:77`) | Detail surfaces if used | Image slots | Empty arrays map empty |
| `taaftRank` | number | No | Legacy imported rank. | Not populated by placeholders | Data transform/admin if imported | Import ranking | Undefined ignored |

Tool metric fields:

| Metric | Type | Defined | Populated | Rendered/used | Derived/fallback |
|---|---|---|---|---|---|
| `attentionScore`, `momentumScore`, `creatorScore`, `workflowScore`, `breakoutScore`, `mentions24h`, `mentions7d`, `savesCount`, `growth24h`, `growth7d`, `creatorMentions`, `workflowInclusions`, `searchInterest`, `qualityScore`, `estimatedUsers`, `baselineAttention`, `relativeGrowthVsBaseline`, `recentVelocity`, `acceleration`, `organicTrendingScore`, `listingScore` | number | `lib/types.ts:59-83` | Mostly 0/neutral in `lib/placeholder-data.ts:82-106`; `organicTrendingScore` is `24 - index` | Tables, ranking, search score, compare, heatmap, admin, API | Derivation helpers remain in `lib/momentum.ts:5-57` and `lib/ranking.ts:8-132`; placeholders bypass most import derivation by direct assignment |
| `trendHistory`, `sparkline` | number[] | `lib/types.ts:109-110` | Shared zero `sparkline` (`lib/placeholder-data.ts:29`, `lib/placeholder-data.ts:131-132`) | Charts, watchlist, tables | Empty array may render empty chart |

### Category fields

Defined in `lib/types.ts:113-123`; populated by `placeholderCategories` (`lib/placeholder-data.ts:136-146`).

| Field/metric | Type | Required | Population source | Rendering locations | Behavioral purpose | Fallback behavior |
|---|---|---|---|---|---|---|
| `id`, `name`, `slug`, `description` | strings | Yes | Placeholder category map | Category page, homepage rotation, heatmap/search/table | Identity/display/navigation | Missing slug route not found |
| `momentumScore`, `growth24h`, `growth7d`, `toolsTracked` | number | Yes | Zero placeholder values | Category page metrics, heatmap, search score | Ranking/display | Zero displays neutral |
| `sparkline` | number[] | Yes | Shared zero sparkline | Category page chart/watchlist | Charting | Empty array can render blank chart |

### AttentionSubCategory fields

Defined in `lib/types.ts:125-135`; populated by `placeholderAttentionSubCategories` (`lib/placeholder-data.ts:148-158`).

| Field/metric | Type | Required | Population source | Rendering locations | Behavioral purpose | Fallback behavior |
|---|---|---|---|---|---|---|
| `id`, `slug`, `label`, `color` | strings | Yes | Placeholder subcategory map | Search topic results; API heatmaps | Identity/display/style | Homepage heatmap ignores prop items |
| `momentumScore`, `growth24h`, `growth7d`, `toolsTracked` | number | Yes | Zero placeholder values | Search score/API/category heatmaps if used | Ranking/display | Zero displays neutral |
| `relatedToolSlugs` | string[] | Yes | One placeholder tool per subcategory | Search topic resolver | Topic -> product relationship | Empty produces topic with no related products |

### Workflow fields

Defined in `lib/types.ts:137-151`; populated by `placeholderWorkflows` (`lib/placeholder-data.ts:181-203`).

| Field/metric | Type | Required | Population source | Rendering locations | Behavioral purpose | Fallback behavior |
|---|---|---|---|---|---|---|
| `id`, `name`, `slug`, `description`, `outcome` | strings | Yes | Workflow placeholders | Workflow list/detail/search/home | Identity/display/search | Missing slug route not found |
| `toolSlugs` | string[] | Yes | Derived from placeholder workflow-tool relationships or fallback one tool | `WorkflowStack`, detail process, search, category | Workflow -> tool join | Empty hides process section |
| `momentumScore`, `growth24h`, `growth7d`, `savesCount`, `creatorUsage` | number | Yes | Zero placeholder values | Workflow table/detail/search/admin | Ranking/display | Zero displays neutral |
| `sparkline` | number[] | Yes | Shared zero sparkline | Watchlist/charts if used | Charting | Empty chart if empty |
| `featured` | boolean | No | First two placeholders true | Admin/home if used | Featured selection | Undefined treated false |

### MicroWorkflow fields

Defined in `lib/types.ts:153-162`; populated by `placeholderMicroWorkflows` (`lib/placeholder-data.ts:205-214`).

| Field/metric | Type | Required | Population source | Rendering locations | Behavioral purpose | Fallback behavior |
|---|---|---|---|---|---|---|
| `id`, `name`, `slug`, `description`, `outcome` | strings | Yes | Placeholder micro workflow map | Search, local fallback, product detail cards | Identity/display/search | Dedicated route does not use `slug` directly |
| `status` | relationship status enum | Yes | `accepted` | Relationship helpers/search | Filtering | Non-accepted excluded by helpers |
| `confidence` | number | Yes | 0 | Search scoring/admin | Ranking/display | Zero score |
| `sourceType` | relationship source enum | Yes | `manual` | Display/provenance if rendered | Provenance | None |

### Relationship fields

| Type | Fields | Required | Population source | Rendering/behavior |
|---|---|---|---|---|
| `WorkflowMicroWorkflowRelationship` | `id`, `workflowSlug`, `microWorkflowSlug`, optional `position`, optional `required`, `confidence`, `status`, `sourceType` | All except `position`/`required` | `lib/placeholder-data.ts:216-225` | Filter/sort in `microWorkflowsForWorkflow` (`lib/data.ts:661-666`) |
| `MicroWorkflowToolRelationship` | `id`, `microWorkflowSlug`, `toolSlug`, optional `position`, optional `required`, `confidence`, `status`, `sourceType` | All except `position`/`required` | `lib/placeholder-data.ts:227-248` | Filter/sort in `toolsForMicroWorkflow` (`lib/data.ts:667-672`) |
| `CreatorToolRelationship` | `id`, `creatorId`, `toolSlug`, `relationshipType`, optional `validationLayer`, `confidence`, `status`, `sourceType`, optional evidence/source/date | Mixed | `lib/placeholder-data.ts:298-318` | Creator detail separates verified vs mentions; product detail includes only uses/teaches; search excludes mentions in related creators (`app/creators/[id]/page.tsx:21-25`; `app/tools/[slug]/page.tsx:935-947`; `lib/search.ts:67-74`) |
| `WorkflowToolRelationship` | `id`, `workflowSlug`, `toolSlug`, `role`, optional `position`, optional `required`, `confidence`, `status`, `sourceType` | Mixed | `lib/placeholder-data.ts:160-179` | Placeholder workflow `toolSlugs` derive from these relationships (`lib/placeholder-data.ts:181-203`); accepted sort helper exists in `lib/data.ts:454-459` |
| `CreatorWorkflowRelationship` | `id`, `creatorId`, `workflowSlug`, `relationshipType`, `confidence`, `status`, `sourceType`, optional evidence/supporting slugs | Mixed | Derived in `lib/data.ts:490-512` | Workflow detail creator rows; search related workflows |

### Creator fields

Defined in `lib/types.ts:276-325`; populated by `placeholderCreators` (`lib/placeholder-data.ts:250-296`).

| Field group | Fields | Required | Rendering locations | Behavioral purpose | Fallback behavior |
|---|---|---|---|---|---|
| Identity/social | `id`, `name`, `handle`, optional handles/URLs, `avatarUrl`, avatar source fields | Mixed | Creator cards/detail/search/dashboard/heatmap | Identity, links, image slots | `CreatorAvatar` shows initials fallback |
| Platform/classification | `platform`, `primaryPlatform`, `creatorCategory`, `niches`, specialization/type/focus/audience/influence/workflow/tool category tags | Mostly required arrays | Creator cards/detail/tag/search/operator | Search, tag route, display taxonomy | Empty arrays map empty |
| Relationship slugs | `workflowSlugs`, `toolSlugs`, `categorySlugs` | Yes | Creator detail/search/heatmap/dashboard | Joins to graph nodes | Missing joined nodes filtered/null |
| Metrics | `followers`, `followerCount`, `tagConfidence`, `creatorScore`, `rankingPosition`, `sourceConfidence` | Mixed | Creator cards/detail/search/operator | Display/ranking/search | Zero displays neutral |
| Source/listing | `status`, `listingStatus`, `sourceUrl`, `importedFrom`, `importedAt`, `verificationSignals` | Mixed | Data filter/admin | `creators` filters accepted listing status | Missing `listingStatus` would exclude if not accepted |

### Evidence/source fields

Defined in `lib/types.ts:209-231`; populated by `placeholderToolEvidenceSources` (`lib/placeholder-data.ts:320-349`).

| Field group | Fields | Required | Rendering locations | Behavioral purpose | Fallback behavior |
|---|---|---|---|---|---|
| Identity/join | `id`, optional `toolId`, `toolSlug`, optional workflow ids/slugs, `matchedTools` | Mixed | Product/workflow/micro proof | Join to tools/workflows/pairs | Matched tool names must normalize to known names for groups |
| Source metadata | `sourceType`, `sourceTitle`, `sourceAuthor`, `sourceUrl`, optional canonical/image/published/preview fields, `platformLabel` | Mixed | Evidence cards/source rows | Display and external navigation | Missing image hides image; source URL still used |
| Text/time | `snippet`, `detectedAt`, optional dates/errors | Mixed | Evidence cards/ranking | Evidence filtering/ranking/last seen | Invalid dates fallback to formatted raw/recently |

Derived evidence metrics:

| Metric/helper | Source fields | Formula/location | Rendered in | Fallback |
|---|---|---|---|---|
| Evidence tier counts | `sourceType` | `evidenceTierForSourceType` and `evidenceTierCountsForTool` (`lib/data.ts:536-552`) | Product evidence summaries | Unknown source type maps to other |
| Source mix | source type counts | `sourceMixFor` (`app/tools/[slug]/page.tsx:1136-1140`) | Product graph groups | Empty source mix array |
| Evidence strength | matched tool count, source type, text language, recency | `evidenceStrength` (`app/tools/[slug]/page.tsx:1161-1178`) | Evidence group sorting | Missing date gets recency 0 |
| Workflow proof sources | matched tool names vs exact stack | `evidenceForWorkflowStack` (`app/workflows/[slug]/page.tsx:115-130`) | Workflow detail | Non-exact match omitted |
| Micro pair receipts | `matchedTools.length === 2` and normalized known tool names | `microWorkflowPairs()` (`app/micro-workflows/[slug]/page.tsx:102-135`) | Micro-workflow route | Missing pair `notFound()` |

### Local records, claims, promotions, feed, and support schemas

| Node | Fields/type | Population source | Rendering locations | Behavioral purpose | Fallback behavior |
|---|---|---|---|---|---|
| `LocalProductRecord` | `id`, `slug`, `name`, `logoUrl`, `website`, `socialUrl`, `tagline`, `description`, `category`, workflow/micro slugs, dates, ownership (`lib/types.ts:352-367`) | `buildLocalProductRecord`/`saveLocalProduct` in `lib/local-graph.ts:55-96` | Dashboard and local product fallback | Browser-local profile graph | Read helpers catch malformed JSON and return `[]` |
| `LocalCreatorRecord` | `id`, `slug`, `name`, `avatarUrl`, `socialUrl`, `website`, `bio`, tool/workflow/micro slugs, dates, ownership (`lib/types.ts:369-383`) | `buildLocalCreatorRecord`/`saveLocalCreator` in `lib/local-graph.ts:98-136` | Dashboard and local creator fallback | Browser-local creator graph | Read helpers catch malformed JSON and return `[]` |
| `CreatorClaimRequest` | Claim request fields (`lib/types.ts:327-337`) | `placeholderCreatorClaimRequests` (`lib/placeholder-data.ts:422-434`) | Claims, operator, dashboard fallback | Ownership status | Status helper returns unclaimed if no request |
| `ProductClaimRequest` | Claim request fields (`lib/types.ts:339-350`) | `placeholderProductClaimRequests` (`lib/placeholder-data.ts:436-449`) | Claims, operator, dashboard fallback | Ownership status | Status helper returns unclaimed if no request |
| `AttentionFeedItem` | Feed fields (`lib/types.ts:385-393`) | `placeholderAttentionFeed` (`lib/placeholder-data.ts:368-373`) | Homepage, moving, operator | Entity monitor feed | No explicit empty state |
| `DiscoveryEdge` | Edge fields (`lib/types.ts:395-406`) | Placeholder plus derived edges (`lib/data.ts:628-637`) | Heatmap, search, product detail | Related product graph | Unresolved endpoints filtered |
| `FeatureFlag` | Flag fields (`lib/types.ts:408-414`) | `placeholderFeatureFlags` (`lib/placeholder-data.ts:383-386`) | Operator | Admin toggles display only | None |
| `PromotionPlacement` | Placement fields (`lib/types.ts:416-429`) | `placeholderPromotionPlacements` (`lib/placeholder-data.ts:388-401`) | Promoted rail/operator | Campaign display/ranking | Rail fallback to tools |
| `BoostTier` | Tier fields (`lib/types.ts:431-439`) | `placeholderBoostTiers` (`lib/placeholder-data.ts:403-411`) | Boost panel/operator | Tier display and modal state | None |

---

## 7. Navigation & Interaction Graph

| Interaction ID | Origin route | Component/control | Source node | Destination/state | Parameter passed | Responsible code | State mutation |
|---|---|---|---|---|---|---|---|
| INT-01 | Global | Brand link | App shell | `/` | None | `components/app-shell.tsx:24-44` | None |
| INT-02 | Global | Nav tabs | App shell | `/search`, `/workflows`, `/creators`, `/heatmap`, `/watchlist` | Path | `components/app-shell.tsx:11-17` | None |
| INT-03 | Global | Command search input/result | SearchResult | `result.href` | `href` | `components/command-search.tsx:13-224`, `lib/search.ts:444-457` | Query/open/active state; router push on Enter/click |
| INT-04 | Homepage | Trending product row | Tool | `/tools/[slug]` | `tool.slug` | `app/page.tsx:23-29`, `components/tool-table.tsx` | None |
| INT-05 | Homepage | Category tab/timeframe controls | Tool collection | Same route, filtered/sorted table | category/timeframe label | `components/home-trending-filter.tsx:92-217` | Local active tab/timeframe state |
| INT-06 | Homepage | Attention heatmap item | Attention cluster item | `/tags/[tag]` | `ecosystemTagSlug(label)` | `components/heatmap.tsx:78-140` | Hover state via CSS only |
| INT-07 | Homepage | Preview panel header/view all | Collection preview | route in `href` prop | `/heatmap`, `/creators`, etc. | `app/page.tsx:87-96` | None |
| INT-08 | Homepage | Creator mini row | Creator | `/creators/[id]` | `creator.id` | `app/page.tsx:33-40` | None |
| INT-09 | Homepage | Workflow preview row | Workflow | `/workflows/[slug]` | `workflow.slug` | `app/page.tsx:42-49` | None |
| INT-10 | Homepage | Newly listed row | Tool | `/tools/[slug]` | `tool.slug` | `app/page.tsx:51-60` | None |
| INT-11 | Product detail | Back link | Tool | `/search` | None | `app/tools/[slug]/page.tsx:61` | None |
| INT-12 | Product detail | Website button | Tool | external `websiteUrl` | URL | `app/tools/[slug]/page.tsx:73` | None |
| INT-13 | Product detail | Compare link | Tool | `/compare?tools=[slug]` | `tool.slug` query | `app/tools/[slug]/page.tsx:74` | None; compare page does not consume query |
| INT-14 | Product/workflow/category detail | SaveButton | Tool/Workflow/Category | localStorage watchlist | kind/id | `components/save-button.tsx:17-23` | Writes localStorage and dispatches event |
| INT-15 | Product detail | Tag rail category/tag | Tool taxonomy | `/categories/[slug]`, `/tags/[tag]` | slugified strings | `app/tools/[slug]/page.tsx:924-929` | None |
| INT-16 | Product detail | Creator relationship card | CreatorToolRelationship | `/creators/[id]` | `creator.id` | `app/tools/[slug]/page.tsx:874-887`, `app/tools/[slug]/page.tsx:939-947` | None |
| INT-17 | Product detail | Workflow/evidence graph group | Evidence-derived group | `/workflows/[slug]` or `/micro-workflows/[pairSlug]` | workflow slug or pair slug | `app/tools/[slug]/page.tsx:1038-1095` | None |
| INT-18 | Product detail local fallback | Client script rows | LocalProductRecord | Local DOM rows; some external website | local slug | `app/tools/[slug]/page.tsx:157-215` | Reads localStorage; mutates DOM text/rows |
| INT-19 | Creator detail | Claim CTA | Creator | `/claim/creator/[id]` | `creator.id` | `app/creators/[id]/page.tsx:47-58` | Click tracking script event |
| INT-20 | Creator detail | Tool relationship row | CreatorToolRelationship | `/tools/[slug]` | `tool.slug` | `app/creators/[id]/page.tsx:261-273` | None |
| INT-21 | Creator detail | Workflow row | Creator | `/workflows/[slug]` | workflow slug | `app/creators/[id]/page.tsx:89-95` | None |
| INT-22 | Creator detail | Tag links | Creator taxonomy | `/tags/[tag]` | creator tag slug | `app/creators/[id]/page.tsx:42-44`, `app/creators/[id]/page.tsx:96-100` | None |
| INT-23 | Workflow detail | Process tabs | Workflow stack | Same route selected step; tool page through logo link | selected index, tool slug | `components/workflow-process-tabs.tsx:21-70` | Local selectedIndex state |
| INT-24 | Workflow detail | Creator relationship row | CreatorWorkflowRelationship | `/creators/[id]` | creator id | `app/workflows/[slug]/page.tsx:60-77` | None |
| INT-25 | Workflow detail | Related workflow row | Workflow | `/workflows/[slug]` | workflow slug | `app/workflows/[slug]/page.tsx:78` | None |
| INT-26 | Workflow/micro proof | Open source | Evidence | external `sourceUrl` | URL | `app/workflows/[slug]/page.tsx:101`; `app/micro-workflows/[slug]/page.tsx:55` | None |
| INT-27 | Search | Filter rail | SearchResult collection | `/search?q=...&type=...` | query/type | `app/search/page.tsx:33-37` | Navigation reload with query params |
| INT-28 | Search | Result row/exact result | SearchResult | `result.href` | href | `app/search/page.tsx:61-127` | Beta event script can track clicks |
| INT-29 | Search | Relationship bucket link | Related node | related href | href | `app/search/page.tsx:169-173` | None |
| INT-30 | Compare | Product picker | Tool | Same route table selection | tool slug | `app/compare/page.tsx:18-35` | Local selected slugs, max four |
| INT-31 | Watchlist | Monitor links | Saved entity collections | Discovery routes | static href | `app/watchlist/page.tsx:49-54`, `app/watchlist/page.tsx:70-71` | None |
| INT-32 | Heatmap route | Cluster category/tool/creator/workflow links | Category/Tool/Creator/Workflow | respective detail routes | slug/id | `app/heatmap/page.tsx:140-178` | None |
| INT-33 | Moving route | Monitor link | AttentionFeedItem | entity route by type | `entityType`, `entitySlug` | `app/moving/page.tsx:16` | None |
| INT-34 | Dashboard | Profile/action cards | Local product/creator | onboarding/dashboard/public fallback routes | local slug | `app/dashboard/page.tsx:71-167` | None |
| INT-35 | Dashboard | Local graph reads | LocalProductRecord/LocalCreatorRecord/Watchlist | Same route state | storage keys | `app/dashboard/page.tsx:20-45`, `app/dashboard/page.tsx:198-214` | Reads localStorage and sets React state |
| INT-36 | Onboarding | Submit product/creator form | Local records | Same route confirmation state with link to `/dashboard` | generated slug and selected graph slugs | `app/onboarding/product/page.tsx:41-62`, `app/onboarding/creator/page.tsx:43-63`, `lib/local-graph.ts:29-40` | Writes localStorage active record, dispatches `appscreener:profile-updated`, sets submitted state |
| INT-37 | Boost panel | Ad package dropdown, boost modal, marketplace buttons | BoostTier / onboarding targets | Same component state or `/onboarding/product` and `/onboarding/creator` | ad package value, tier id, static route | `components/boost-panel.tsx:23-170` | Local selected/open/modal state; outside click/Escape close handlers; router push only on marketplace buttons |
| INT-38 | Operator | Password unlock | Admin surface | Same route unlocked state | password string | `app/operator/page.tsx:29-55` | Local `unlocked` state |
| INT-39 | Operator | Sidebar section | Admin support nodes | Same route section panel | section label | `app/operator/page.tsx:57-89` | Local `section` state |
| INT-40 | Operator tools | Checkbox | Tool | Selected list state | tool slug | `app/operator/page.tsx:105-134` | Local selected slug array |
| INT-41 | Claims | Submit claim form | Claim request target | Same claim route with `submitted=1`, then confirmation links to profile/dashboard | hidden `submitted` value, slug/id | `app/claim/product/[slug]/page.tsx:37-95`, `app/claim/creator/[id]/page.tsx:36-93` | Browser form navigation/query state and beta event script; no repository persistence |

---

## 8. Placeholder Coverage

| Coverage area | Placeholder IDs/labels | Routes/components exercised | Fields/relationships covered | Known gaps |
|---|---|---|---|---|
| Tools/Products | 24 tools: `tool_1..tool_24`, slugs `placeholder-product-1..24`, names `Product 1..24` (`lib/placeholder-data.ts:42-134`) | Homepage, product detail, category, search, compare, heatmap, workflows, dashboard, operator, APIs | Required Tool fields, logo fallback, category, tags, metric fields, trend/sparkline arrays, related/competitor arrays after data wiring | Optional `taaftRank` not populated; external website URL blank; source URL blank |
| Categories | 8 categories: `cat_1..cat_8`, `Category 1..8` (`lib/placeholder-data.ts:31-40`, `lib/placeholder-data.ts:136-146`) | Homepage rotation, category detail, heatmap route, search/category API | Required Category fields and metrics | `toolsTracked` remains 0 despite tool memberships |
| Attention subcategories | 18 `subcat_placeholder_N` records, labels alternating `Subcategory` and `—` (`lib/placeholder-data.ts:148-158`) | API heatmaps/search topic data; homepage heatmap shell | Type fields and related tool slugs | Homepage `AttentionHeatmap` ignores `items`, so these records do not drive visible homepage clusters |
| Workflows | 8 workflows, `placeholder-workflow-1..8` (`lib/placeholder-data.ts:181-203`) | Homepage, workflow list/detail, creator/category/search/dashboard/operator/API | Required Workflow fields, tool stack relationship slots, featured flag | Workflow metrics all zero; workflows 4-8 may rely on fallback single tool slugs if not covered by relationship list |
| Micro workflows | 8 micro workflows, `placeholder-micro-workflow-1..8` (`lib/placeholder-data.ts:205-214`) | Search, local dashboards/fallbacks, relationship helpers | Required MicroWorkflow fields | Dedicated route slugs are evidence pair slugs, not these slugs; no direct public page for each placeholder micro-workflow slug |
| Workflow-tool relationships | 8 `wtr_placeholder_N` records (`lib/placeholder-data.ts:160-179`) | Workflow stacks, placeholder workflow toolSlugs, operator/admin | Relationship role/status/position/source fields | Resolver `acceptedWorkflowToolSlugs` exists but live workflows already store `toolSlugs`; not broadly rendered as separate relationship rows |
| Workflow-micro relationships | 8 `wmwr_placeholder_N` records (`lib/placeholder-data.ts:216-225`) | Search micro-workflow related workflows, helpers | Relationship fields covered | Not all public routes display relationship metadata such as required/confidence/source |
| Micro-workflow-tool relationships | 16 `mwtr_placeholder_*` records (`lib/placeholder-data.ts:227-248`) | Search, local fallback lookups, product micro cards | Position/required/status/source fields covered | Dedicated micro-workflow route derives from evidence matched tool names instead |
| Creators | 8 creators, `creator_placeholder_1..8`, names `Creator 1..8` (`lib/placeholder-data.ts:250-296`) | Homepage Creator Graph, creators route, creator detail, product relationships, workflow relationships, heatmap, search, dashboard/operator/API | Identity/avatar/taxonomy/relationship slugs/metrics/source/listing fields | Optional social URLs mostly blank except TikTok field blank; some creator relationship types are not shown as verified usage |
| Creator-tool relationships | 7 `ctr_placeholder_N` records, one per relationship type (`lib/placeholder-data.ts:298-318`) | Creator detail verified/mentioned rows, product detail creators, search related creators | All relationshipType variants are represented | Product detail and adoption helper include only `uses`/`teaches`; other types are stored but less visible |
| Creator-workflow relationships | Derived IDs from creator-tool overlaps (`lib/data.ts:490-512`) | Workflow detail Creator Relationships, search creator/workflow context | Derived relationship fields, supportingToolSlugs | Derivation requires enough accepted tool overlap; placeholder coverage depends on current workflow stacks and creator relationships |
| Evidence sources | 10 `evidence_placeholder_N`, one per source type (`lib/placeholder-data.ts:320-349`) | Product detail, workflow proof, micro route, APIs/operator | Source type, source URL/image/title/snippet/matchedTools/platform label | `matchedTools` are visible names, so resolver depends on normalized `Tool.name`; records attach only to first 8 products |
| Movement events | 4 `event_placeholder_N` (`lib/placeholder-data.ts:351-366`) | Homepage News & Events, `/events`, operator | Event types and optional slug fields covered | `eventType` union variants `reddit_spike`, `youtube_spike`, `api_release` not covered by placeholders |
| Attention feed | 4 `feed_placeholder_N` covering entityType tool/workflow/category/creator (`lib/placeholder-data.ts:368-373`) | Homepage What's Moving, `/moving`, operator | Entity route construction for all entity types covered | No explicit empty-state branch |
| Discovery edges | 5 curated edge placeholders plus derived edges (`lib/placeholder-data.ts:375-381`, `lib/data.ts:630-637`) | Heatmap paired tools, search related products, product detail related helper | All `relationship` variants are covered in curated placeholders | Derived edges may add records based on neutral tag/category overlap |
| Feature flags | 2 flags (`lib/placeholder-data.ts:383-386`) | Operator Feature Flags | Enabled/disabled states covered | No public UI beyond operator |
| Promotions/boost tiers | 4 placements and 5 tiers (`lib/placeholder-data.ts:388-411`) | Homepage rail/boost panel/operator | Placement slots/status/tier multipliers covered | Empty website URLs can affect rail external link behavior |
| Claims | 1 creator claim, 1 product claim (`lib/placeholder-data.ts:422-449`) | Claim pages, operator claims, dashboard fallbacks, detail badges | Pending review path covered | Approved/rejected claim request states not covered by placeholders |
| Aliases/ingestion/narratives | One alias, two ingestion sources, four narrative strings (`lib/placeholder-data.ts:413-451`) | Search aliases, operator, homepage/narratives | Basic display coverage | Multiple aliases/source variants not covered |
| Local records | None pre-populated; built client-side | Onboarding, dashboard, local public fallbacks | Type shape exercised only after user creates local records | No repository seed records for local product/creator paths |

---

## 9. Repository File Index

### Types and models

| File | Responsibility |
|---|---|
| `lib/types.ts` | Defines all exported graph node, relationship, claim, local record, feed, promotion, and enum/union types. |
| `lib/creator-tags.ts` | Defines creator taxonomy/tag types, display labels, slugs, and styling helpers used by creator and tag surfaces. |

### Central data and placeholder data

| File | Responsibility |
|---|---|
| `lib/placeholder-data.ts` | Central neutral placeholder dataset for all static graph records and support records. |
| `lib/data.ts` | Exports live arrays, derives relationship helpers, applies placeholder-backed graph wiring, and exposes search/API data sources. |
| `lib/logo-assets.ts` | Empty logo asset override map used by tool import/normalization logic. |
| `lib/ecosystem-tags.ts` | Builds searchable/routable ecosystem tags from creator specializations and canonical attention subcategories. |
| `lib/attention-subcategories.ts` | Defines canonical attention subcategory labels used by ecosystem tag generation. |
| `lib/ecosystem-colors.ts` | Provides empty color map and fallback color style helpers for ecosystem/category keys. |

### Relationship, ranking, search, and formatting helpers

| File | Responsibility |
|---|---|
| `lib/search.ts` | Builds virtual graph search results and search scoring/grouping behavior for products, creators, workflows, micro-workflows, topics, and categories. |
| `lib/ranking.ts` | Contains user estimate, size class, organic trending, breakout, boost rail, and ranking mode sort formulas. |
| `lib/momentum.ts` | Contains momentum score, lifecycle, breaking-out, product name normalization, and movement class helpers. |
| `lib/listing-policy.ts` | Contains trusted source/listing check policy helpers and listing score/status calculation. |
| `lib/format.ts` | Provides `displayCategory`, currently returning the category string unchanged (`lib/format.ts:1-3`). |
| `lib/trending-table-display-stats.ts` | Defines empty display-stat maps and fallback stats for the trending table. |
| `lib/events.ts` | Provides beta event types, console tracking helper, and injected browser bootstrap script. |
| `lib/local-graph.ts` | Defines localStorage keys and helper functions for local product/creator records. |
| `lib/supabase.ts` | Provides optional Supabase client creation from public environment variables. |

### Ingestion stubs

| File | Responsibility |
|---|---|
| `lib/ingestion/normalize.ts` | Defines normalized signal shape and canonical-name normalization. |
| `lib/ingestion/index.ts` | Aggregates current and future ingestion signal fetchers. |
| `lib/ingestion/producthunt.ts` | Empty Product Hunt ingestion fetcher returning no signals. |
| `lib/ingestion/taaft.ts` | Empty TAAFT ingestion fetcher returning no signals. |
| `lib/ingestion/github.ts` | Empty GitHub ingestion fetcher returning no signals. |
| `lib/ingestion/x.ts` | Empty X ingestion fetcher returning no signals. |
| `lib/ingestion/youtube.ts` | Empty YouTube ingestion fetcher returning no signals. |
| `lib/ingestion/reddit.ts` | Empty Reddit ingestion fetcher returning no signals. |
| `lib/ingestion/rss.ts` | Empty RSS ingestion fetcher returning no signals. |

### Global app shell and styles

| File | Responsibility |
|---|---|
| `app/layout.tsx` | Defines global metadata and wraps all routes in `AppShell`. |
| `app/globals.css` | Defines all global styling, layout, responsive behavior, and component class styling. |
| `app/icon.png` | App icon asset. |
| `app/fonts/Geist-Variable.woff2` | Bundled Geist variable font. |

### Route pages

| File | Responsibility |
|---|---|
| `app/page.tsx` | Homepage discovery dashboard. |
| `app/tools/[slug]/page.tsx` | Product/tool detail route and local product fallback route. |
| `app/creators/page.tsx` | Creator graph landing route. |
| `app/creators/[id]/page.tsx` | Creator detail route and local creator fallback route. |
| `app/creators/tags/[tag]/page.tsx` | Redirect route from creator tag terminology to generic tag route. |
| `app/workflows/page.tsx` | Workflow list route. |
| `app/workflows/[slug]/page.tsx` | Workflow detail route. |
| `app/micro-workflows/[slug]/page.tsx` | Evidence-derived micro-workflow pair detail route. |
| `app/categories/[slug]/page.tsx` | Category detail route. |
| `app/tags/[tag]/page.tsx` | Topic/tag detail route. |
| `app/search/page.tsx` | Graph search route. |
| `app/compare/page.tsx` | Client-side comparison route. |
| `app/watchlist/page.tsx` | Client-side local watchlist route. |
| `app/heatmap/page.tsx` | Full heatmap/cluster intelligence route. |
| `app/breaking-out/page.tsx` | Breaking-out product/tool ranking route. |
| `app/moving/page.tsx` | Attention feed route. |
| `app/events/page.tsx` | Events and recent launch route. |
| `app/narratives/page.tsx` | Narrative summary route. |
| `app/dashboard/page.tsx` | Local profile dashboard route. |
| `app/dashboard/product/page.tsx` | Product workspace route. |
| `app/dashboard/creator/page.tsx` | Creator workspace route. |
| `app/onboarding/product/page.tsx` | Product onboarding form route. |
| `app/onboarding/creator/page.tsx` | Creator onboarding form route. |
| `app/claim/product/[slug]/page.tsx` | Product claim route. |
| `app/claim/creator/[id]/page.tsx` | Creator claim route. |
| `app/operator/page.tsx` | Password-gated operator/admin route. |
| `app/operator/claims/page.tsx` | Operator claim review route. |

### API routes

| File | Responsibility |
|---|---|
| `app/api/trending-tools/route.ts` | Returns first 100 tool/product records as JSON. |
| `app/api/breakout-tools/route.ts` | Returns `breakingOutTools` as JSON. |
| `app/api/workflows/route.ts` | Returns workflow records as JSON. |
| `app/api/heatmaps/route.ts` | Returns attention subcategory records as JSON. |
| `app/api/creator-adoption/route.ts` | Returns sanitized creator records and creator signals as JSON. |

### Node renderers and UI components

| File | Responsibility |
|---|---|
| `components/app-shell.tsx` | Global shell, navigation, search mount, and local profile chip. |
| `components/command-search.tsx` | Global command/search overlay and result navigation. |
| `components/home-trending-filter.tsx` | Homepage category/timeframe filtering and sorting wrapper for the trending table. |
| `components/tool-table.tsx` | Product/tool table rows, metrics, badges, and row actions. |
| `components/tool-logo.tsx` | Tool/product logo fallback component. |
| `components/creator-avatar.tsx` | Creator avatar fallback component. |
| `components/creator-card.tsx` | Creator card component for creator graph lists. |
| `components/heatmap.tsx` | Homepage attention heatmap and category mini heatmap components. |
| `components/promoted-momentum-rail.tsx` | Homepage promoted/fallback momentum rail. |
| `components/boost-panel.tsx` | Homepage boost/ad package panel and modal. |
| `components/save-button.tsx` | Local watchlist save/toggle button. |
| `components/workflow-stack.tsx` | Tool logo stack renderer for workflows. |
| `components/workflow-process-tabs.tsx` | Interactive workflow process step tabs. |
| `components/movement-badge.tsx` | Growth/movement badge. |
| `components/timeframe-toggle.tsx` | Timeframe segmented control. |
| `components/chart.tsx` | Chart/sparkline renderer. |
| `components/sparkline.tsx` | Sparkline renderer. |
| `components/x-profile-button.tsx` | X/social profile icon/link helpers. |
| `components/claims/claim-status.tsx` | Claim status badge. |
| `components/heatmap-coded-backup.tsx.bak` | Backup file present in repository; not used by current imports discovered in this audit. |

---

## 10. Ambiguities

| Ambiguity | Files/evidence | Why it cannot be resolved further from current code alone |
|---|---|---|
| Homepage `AttentionHeatmap` data source is ambiguous because it accepts `items` but ignores the prop. | `app/page.tsx:25-27` passes `attentionSubCategories`; `components/heatmap.tsx:78-140` includes `void items` and renders hardcoded `attentionClusters` from `components/heatmap.tsx:166-244`. | The visible homepage heatmap structure is not traceable to `placeholderAttentionSubCategories`; code proves the current UI is hardcoded, but does not state whether the prop is retained for future data wiring. |
| Micro-workflow route identity differs from `MicroWorkflow.slug`. | `lib/types.ts:153-162` defines `MicroWorkflow.slug`; `lib/data.ts:465` exports placeholder micro-workflows; `/micro-workflows/[slug]` generates slugs from evidence-derived tool pairs in `app/micro-workflows/[slug]/page.tsx:102-164`. | Current code proves both mechanisms exist but does not define which should be considered canonical for public micro-workflow route identity. |
| Compare query parameter is generated but not consumed. | Product detail link uses `/compare?tools=${tool.slug}` in `app/tools/[slug]/page.tsx:74`; compare state initializes empty and derives selection only from local state in `app/compare/page.tsx:18-35`. | Code does not indicate whether this is intentional no-op behavior or an incomplete connection. |
| Creator watchlist save path is read but no writer was found. | Watchlist reads `appscreener:creators` in `app/watchlist/page.tsx:16-20`; `SaveButton` supports only `tools`, `workflows`, and `categories` in `components/save-button.tsx:6`. | A creator save could be written by external/manual localStorage, but no current reusable save component supports it. |
| Search includes internal topic/category result types but public filtering excludes them from normal result groups. | Search type union includes `topic` and `category` (`lib/search.ts:5`); `PublicSearchResultType` excludes them (`lib/search.ts:6`); `searchGraph` filters via `publicOnly` (`lib/search.ts:407-422`). | Topic/category results exist in the index and can influence exact logic internally, but public grouping intentionally omits them; code does not document why. |
| Some import/ingestion and legacy AI-specific helper names remain structurally present while data arrays are empty. | Empty `rawTools`, `importedTools`, ingestion fetchers, and helpers exist in `lib/data.ts:151-396` and `lib/ingestion/*.ts`; `displayCategory` itself is currently a pass-through helper in `lib/format.ts:1-3`. | The audit can prove these functions are present and mostly inert with current placeholders, but cannot infer whether they are retained for compatibility or future reuse. |
| Operator/admin action buttons are mostly display-only. | `AdminList` renders action buttons from strings in `app/operator/page.tsx:137-138`; `ToolsAdmin` has selection checkboxes and an `edit metrics` button without handler in `app/operator/page.tsx:105-134`. | Code proves rendering and local selection state, but no side effects are implemented for most admin actions. |
| API route consumers are not identifiable inside the repository. | API routes exist in `app/api/*/route.ts`; no internal fetch usage was found in audited files. | The repository does not show external clients, so reachability/usage outside the app cannot be proven. |

## Verification Record

| Item | Result |
|---|---|
| Verification date | 2026-07-19 |
| Baseline commit | `c047854 - Establish TikTok Shop placeholder baseline` |
| Files read fully | `app/onboarding/product/page.tsx`, `app/onboarding/creator/page.tsx`, `app/dashboard/product/page.tsx`, `app/dashboard/creator/page.tsx`, `app/claim/product/[slug]/page.tsx`, `app/claim/creator/[id]/page.tsx`, `app/api/creator-adoption/route.ts`, `app/api/breakout-tools/route.ts`, `app/api/trending-tools/route.ts`, `app/api/workflows/route.ts`, `app/api/heatmaps/route.ts`, `lib/ingestion/normalize.ts`, `lib/ingestion/index.ts`, `lib/ingestion/producthunt.ts`, `lib/ingestion/taaft.ts`, `lib/ingestion/github.ts`, `lib/ingestion/x.ts`, `lib/ingestion/youtube.ts`, `lib/ingestion/reddit.ts`, `lib/ingestion/rss.ts`, `lib/format.ts`, `lib/events.ts`, `lib/local-graph.ts`, `lib/trending-table-display-stats.ts`, `components/app-shell.tsx`, `components/command-search.tsx`, `components/home-trending-filter.tsx`, `components/tool-table.tsx`, `components/tool-logo.tsx`, `components/creator-avatar.tsx`, `components/creator-card.tsx`, `components/heatmap.tsx`, `components/promoted-momentum-rail.tsx`, `components/boost-panel.tsx`, `components/save-button.tsx`, `components/workflow-stack.tsx`, `components/workflow-process-tabs.tsx`, `components/movement-badge.tsx`, `components/timeframe-toggle.tsx`, `components/chart.tsx`, `components/sparkline.tsx`, `components/x-profile-button.tsx`, `components/claims/claim-status.tsx` |
| Files checked partially | `docs/NODE_SYSTEM_AUDIT.md`, `app/tools/[slug]/page.tsx`, `app/creators/[id]/page.tsx`, `app/dashboard/page.tsx`, `app/operator/page.tsx`, `lib/types.ts`, `lib/placeholder-data.ts`, `lib/data.ts`, `lib/search.ts` |
| Claims corrected | 13 |
| Claims removed | 0 |
| Unresolved ambiguities | 7: homepage heatmap data prop ignored; micro-workflow route identity differs from `MicroWorkflow.slug`; compare query param not consumed; creator watchlist read path has no reusable writer; search has internal topic/category result types excluded from public groups; inert import/ingestion helpers remain present; API consumers outside the repository cannot be identified |
| Final confidence estimate | High, approximately 92%; the lower-confidence route, component, API, and helper areas from the first pass were directly verified from full source files. |
| Confirmation that no application files changed | This verification edited only `docs/NODE_SYSTEM_AUDIT.md`; application code, data, UI, routes, components, configuration, and runtime behavior were not modified. |
