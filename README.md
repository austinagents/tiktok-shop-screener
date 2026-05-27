# AppScreener

AppScreener is the live screener for AI products. It tracks where AI attention is moving across tools, workflows, categories, creator signals, and movement events.

## What is included

- Next.js app with Vercel-ready routes
- Dense dark terminal UI for discovery, tool details, categories, workflows, heatmap, compare, watchlist, and admin
- Seeded local data plus a generated TAAFT import artifact for the expanded MVP tool universe
- Momentum scoring, lifecycle logic, breaking-out logic, and product name canonicalization
- MVP listing policy: products must be discoverable on Product Hunt or TAAFT before acceptance
- Size-normalized organic ranking so smaller breakout apps can outrank majors in Trending without affecting paid rail placement
- LocalStorage watchlist for tools, workflows, and categories
- Supabase schema migration under `supabase/migrations`
- TAAFT import script, logo validation, and placeholder adapters for Product Hunt, GitHub, Reddit, X, YouTube, and RSS
- Future API-ready routes for trending tools, breakout tools, workflows, creator adoption, and heatmaps

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill values when ready.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_PASSWORD=appscreener-admin
```

If Supabase env vars are missing, the app uses local seeded data so the MVP works immediately.

## Admin

Go directly to the private operator route and unlock with `NEXT_PUBLIC_ADMIN_PASSWORD`. The MVP admin is intentionally simple: it shows seeded records, ingestion sources, stats, movement events, and a recompute action placeholder. This password check is MVP-only and should move server-side before serious production use.

## TAAFT Import

Run the current MVP import with:

```bash
npm run import:taaft
```

The importer targets the top 500 product universe, imports the accessible TAAFT product cards, downloads local logos into `public/logos/tools`, writes normalized products to `data/taaft-tools.json`, and writes the QA report to `data/taaft-import-report.json`. TAAFT provenance stays backend/admin-only and should not be exposed as public frontend copy.

## MVP Listing Policy

For the initial MVP, AppScreener only accepts products that are already discoverable on at least one trusted AI/product discovery platform:

- Product Hunt
- TAAFT (There’s An AI For That)

Accepted products must also have a working product/site/demo, identifiable branding or logo, a clear AI/software use case, non-malicious/non-spam behavior, and a usable public product page. Once accepted, a product is permanently listable, searchable, rankable, boost eligible, workflow eligible, and creator-signal eligible.

Future source candidates such as Futurepedia, GitHub, Hugging Face, AI newsletters, manual submissions, creator discovery, and trending social discovery are intentionally disabled for MVP acceptance.

## Ranking Logic

Listing and ranking answer different questions:

- Listing: is this product real enough to track?
- Organic Trending: is this product moving unusually fast right now?
- Sponsored Momentum Rail: who is paying to amplify visibility?

Organic discovery uses size classes (`Micro`, `Emerging`, `Growth`, `Major`, `Mega`) and dampeners only for Trending/Breaking Out style surfaces. This prevents large incumbents from permanently owning organic discovery while still allowing them to lead Most Used or Blue Chips views.

The Sponsored Momentum Rail uses paid boost priority first. If paid slots are unfilled, open slots are backfilled with top organic normalized movers so the rail never feels empty or inactive.

## Ingestion

Adapters live in `lib/ingestion`. Product Hunt and TAAFT are the active trusted MVP acceptance sources. Other adapters return normalized mocked signals for future expansion, but they are not enabled as MVP listing gates yet. The product moat is in canonicalizing products and ranking by live momentum, creator adoption, workflow usage, and attention movement.

## Local API Preview

- `/api/trending-tools`
- `/api/breakout-tools`
- `/api/workflows`
- `/api/creator-adoption`
- `/api/heatmaps`

## Supabase

Run the SQL in `supabase/migrations/001_initial_schema.sql` in a Supabase project to create the MVP tables.
