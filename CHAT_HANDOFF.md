# Chat Handoff

Last synced: 2026-05-28

## Current Working Context

The current active work is AppScreener MVP UI/product refinement. The latest focus has been the `/tools/[slug]` route, which was hard-reset into the canonical Tool Intelligence Profile page.

The user is highly sensitive to accidental changes outside the requested scope. The homepage Attention Heatmap / Daily Buzz design and homepage master module grid are locked.

## Immediate Next Priorities

1. Visually inspect `/tools/[slug]` after the latest sidebar alignment and spacing changes.
2. If needed, make only route-specific CSS adjustments under `.toolIntel*`.
3. Run `npm run typecheck` after any implementation.
4. Run `npm run build` after substantial route or architecture changes.
5. Keep this file and `PROJECT_STATUS.md` updated after meaningful work.

## Current Design Direction

AppScreener should feel like:

- AI ecosystem intelligence
- creator/tool/workflow discovery
- operational taxonomy and relationship mapping
- dense premium terminal UI
- Bloomberg/DexScreener/Linear/Vercel-like restraint

Avoid:

- generic SaaS landing page patterns
- Product Hunt clone behavior
- fake analytics
- bright neon/glossy UI
- oversized empty cards
- fabricated social proof

## Important Constraints

- Do not touch homepage Attention Heatmap / Daily Buzz unless explicitly asked.
- Do not touch homepage master grid/module layout unless explicitly asked.
- Do not change global nav unless explicitly asked.
- Do not fabricate creator-tool usage, mentions, quotes, endorsements, or unsupported metrics.
- Public UI must not expose TAAFT/Favikon/Product Hunt provenance labels.
- Pending-review creators must remain hidden publicly.
- If a requested change would violate a locked area, stop and explain that it is restricted.

## Active UI Philosophy

Use compact, high-signal modules:

- thin borders
- dark fills
- subtle low-opacity glow
- tight spacing rhythm
- dense metadata rows
- compact cards
- clickable discovery loops

Prefer making existing information more usable over adding new content.

## Current Unresolved Issues

- `/tools/[slug]` sidebar alignment needs final visual confirmation after latest CSS offset.
- Some tool pages have sparse center-column content because creator/workflow/mention relationships are not fully real yet.
- Empty states should remain compact and professional.
- The Codex app may show `{"detail":"Bad Request"}` after tools; verify actual work with files/typecheck/build instead of assuming app failure.

## Exact Current Focus Areas

Current route under active refinement:

- `/tools/[slug]`

Current relevant files:

- `app/tools/[slug]/page.tsx`
- `app/globals.css`

Current route-specific CSS namespace:

- `.toolIntel*`

Do not use broad global selectors for tool-profile changes.

## Known Codex Workflow Constraints

- The app has repeatedly shown `{"detail":"Bad Request"}` after tool calls. This appears to be a Codex app/tool transport display issue.
- Continue by checking actual filesystem state, typecheck, and build.
- Avoid unnecessary tool calls when the user is asking for very small changes.
- Use `apply_patch` for file edits.
- Prefer `rg` and quoted paths, especially for routes like `app/tools/[slug]/page.tsx`.

## Important Implementation Notes For Next Session

- `PROJECT_STATUS.md` and `CHAT_HANDOFF.md` are now required state sync files.
- After meaningful implementation:
  1. Update the feature/system itself.
  2. Update `PROJECT_STATUS.md`.
  3. Update `README.md` if architecture/product capabilities changed.
  4. Update `CHAT_HANDOFF.md` with latest operational context.
- Current modified files before this doc sync included:
  - `app/globals.css`
  - `app/heatmap/page.tsx`
  - `app/tools/[slug]/page.tsx`
- Check `git status` before assuming clean state.

## Current Product Decisions To Preserve

- Homepage Attention Heatmap clusters:
  - Trading & Markets
  - Growth & Sales
  - Daily Buzz
  - Builder Tools
  - Automation & Ops
- Daily Buzz color system is locked.
- `/tools/[slug]` should remain the canonical product intelligence profile page.
- `/heatmap` should remain a separate exploration page.
- `/tags/[tag]` should be the unified ecosystem tag destination.
- Public creator pages should only show accepted creators.
