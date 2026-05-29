# AppScreener Project Status

Last synced: 2026-05-28

## Current Platform State

AppScreener is an AI ecosystem intelligence MVP, not just a homepage MVP. It currently includes:

- homepage intelligence command center
- tool intelligence profile pages
- category and tag exploration
- workflow intelligence surfaces
- creator taxonomy and accepted-only creator public UI
- dedicated heatmap exploration page
- watchlist, compare, moving/events/narratives/breaking-out surfaces
- private operator route
- TAAFT product ingestion artifacts
- creator ingestion/tagging foundation
- shared ecosystem color and tag systems

## Latest Completed Changes

- `/tools/[slug]` was hard-reset into a tool intelligence profile architecture.
- Tool profile pages now use:
  - local left sidebar
  - hero/tool identity card
  - Trending on AppScreener card
  - Why is this trending?
  - Who is using this?
  - Popular in these workflows
  - Recent mentions
  - About metadata rail
  - Related tags
  - Tools often used with
  - Trending nearby
- Removed the local top search/action bar from `/tools/[slug]`.
- Removed the local AppScreener brand block from the `/tools/[slug]` sidebar.
- Tightened `/tools/[slug]` spacing and expanded page width usage.
- Adjusted `/tools/[slug]` sidebar vertical alignment.
- Homepage Trending timeframe toggles were removed because 7D/30D were not backed by independent ranking logic.
- Boost CTA arrows were removed; CTA buttons were subtly polished.
- Dedicated `/heatmap` page was created as a separate exploration surface from the homepage Attention Heatmap.
- Shared ecosystem tag directory was created through `lib/ecosystem-tags.ts`.

## Current Active Architecture

### Frontend

- Next.js App Router
- Global styling in `app/globals.css`
- Reusable components under `components/`
- Local MVP data in `lib/data.ts`
- Static generation for tool/category/creator/tag/workflow pages

### Data

- Local seeded data drives the MVP.
- TAAFT import artifacts expand the tool universe.
- Supabase schema exists but Supabase is not required for local runtime.
- Creator import architecture exists, but pending-review creators stay hidden publicly.

### Tag/Category Logic

- Broad categories remain top-level category concepts.
- Creator specialization tags and heatmap attention tags resolve through the shared ecosystem tag directory.
- Canonical tag route: `/tags/[tag]`.
- Homepage Attention Heatmap uses locked visual cluster colors and should not inherit destination tag colors.

## Runtime Behavior

Local dev:

```bash
npm start
```

Build:

```bash
npm run build
```

Typecheck:

```bash
npm run typecheck
```

The app builds without Supabase env vars by using local seeded data.

## Active Routes / Pages

- `/`
- `/tools/[slug]`
- `/tags/[tag]`
- `/categories/[slug]`
- `/workflows`
- `/workflows/[slug]`
- `/creators`
- `/creators/[id]`
- `/creators/tags/[tag]`
- `/heatmap`
- `/breaking-out`
- `/moving`
- `/events`
- `/narratives`
- `/compare`
- `/watchlist`
- `/operator`

API preview routes:

- `/api/trending-tools`
- `/api/breakout-tools`
- `/api/workflows`
- `/api/creator-adoption`
- `/api/heatmaps`

## Current Ecosystem / Tag / Workflow Logic

- `lib/ecosystem-tags.ts` unifies creator and attention tags.
- `lib/attention-subcategories.ts` contains canonical attention subcategory tags:
  - Trading Bots
  - Prediction Markets
  - Market Analysis
  - Whale Tracking
  - Mass Email
  - Lead Generation
  - Cold Outreach
  - Web Scraping
  - Daily Buzz
  - Thumbnails
  - Websites
  - Vibe Coding
  - Debugging
  - 3D Assets
  - Research Agents
  - AI Employees
  - Video Editing
  - Automation
- `lib/creator-tags.ts` contains approved creator taxonomy.
- `lib/ecosystem-colors.ts` is the shared color foundation for ecosystem categories.
- Workflow relationships currently come from local workflow/tool/creator data in `lib/data.ts`.

## Known Issues

- The Codex desktop UI sometimes displays `{"detail":"Bad Request"}` after tool calls. This has been a tool transport/UI issue, not necessarily an app failure. Verify with typecheck/build and file diffs.
- Some `/tools/[slug]` pages have sparse creator/workflow/mention data. Empty states are intentional and trust-safe.
- `npm run build` may show autoprefixer warnings about `start` support in CSS. Builds have still completed successfully.
- Current ranking data is local/static seed logic. It is not true independent live timeframe aggregation.
- `/tools/[slug]` left sidebar alignment was adjusted via route-specific CSS and may need a final visual check in browser.

## Pending UX Cleanup Items

- Final visual QA for `/tools/[slug]` across multiple tool slugs.
- Continue refining `/tools/[slug]` only if screenshots show spacing issues.
- Confirm sidebar top alignment against hero/trending card top edge after latest offset.
- Review mobile behavior for `/tools/[slug]`.
- Review dedicated `/heatmap` page for density and interaction readiness.
- Add real data sources for creator mentions and workflow adoption before surfacing stronger social proof.

## Next Recommended Priorities

1. Visually verify `/tools/[slug]` pages locally across several slugs.
2. Run `npm run typecheck` and `npm run build` after the latest docs/state sync.
3. Add real creator-tool/workflow relationships before expanding social proof modules.
4. Build tag destination pages into stronger ecosystem hubs.
5. Continue ingestion readiness without exposing backend provenance publicly.
6. Eventually move admin/password protection server-side.

## Current Deployment / Runtime Workflow

Safe local validation:

```bash
npm run typecheck
npm run build
```

Safe deploy flow:

```bash
git status
git add .
git commit -m "Describe change"
git push
```

Vercel is connected through GitHub. Avoid force-pushing unless the remote history is confirmed disposable.

## Recent Structural Decisions

- Homepage Attention Heatmap / Daily Buzz section is locked.
- Homepage master module grid is locked unless explicitly unlocked by the user.
- `/heatmap` page is a separate exploration engine, not an enlarged homepage widget.
- `/tools/[slug]` is the canonical AppScreener tool intelligence profile route.
- `/tags/[tag]` is the canonical shared ecosystem tag route.
- Public UI must not expose raw backend provenance labels.
- Use trust-safe empty states instead of fake creator usage, fake mentions, or fake workflow claims.
