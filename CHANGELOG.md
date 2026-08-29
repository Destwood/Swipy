# Changelog

All notable changes to Swipy are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/) when we start tagging releases.

How to use:
1. While working, add bullets under **[Unreleased]**.
2. Before merging / pushing to `main`, move those bullets into a new dated version section.
3. Write for humans (what changed in the product), not file lists.

## [Unreleased]

### Roadmap (4.0)

Full **Steam account linking**, library sync, and deeper store integration — building on the Steam prices / Open in Steam work in 0.4.x.

## [0.4.1] - 2026-08-29

Patch release: infinite-mode session continuity, swipe history, lobby invites, match-results polish, and Steam metadata fixes.

### Added

- **Swipe history** at `/history` (all modes) and `/infinite/history` (solo runs): grouped by day, copy link, transform to deck, **delete** from the ··· menu
- **Infinite match results** at `/infinite/matches` with liked hero cards and compact rejected rows
- **Infinite session popover** (Matches chip): live liked/skipped list, **return to swipe list** (back arrow), Finish / View results
- **Lobby invite link** on session create (**Copy lobby link**); guests open `/session/lobby/[code]` — nickname for guests, auto-join when signed in
- **Page loading skeletons** (history, matches, swipe deck, account, liked/ignored lists) with header kept visible via `PageLoadingShell`
- **`PlayThisButton`**: disabled **No Steam** state keeps row layout when a game has no store listing
- Cloud **cached games** + **swipe history** Supabase tables (SQL in `supabase/`)

### Changed

- Home secondary action: **Join lobby** (was Manage decks); create-session secondary button matches
- Infinite mode **persists swipe session** in `localStorage` (position, votes, loaded catalog) — returning from results restores the deck where you left off
- Each **Finish** creates a new history entry; **View results** reopens the last snapshot without losing active swipes
- Match results: **Copy link** in toolbar; rejected-row prices vertically centered; history/match rows use matching **Open** / **···** button sizes
- History row menus: solid opaque dropdown, correct z-index when open
- Requeue control in infinite Matches popover: back arrow + “Return to swipe list” copy
- Join page copy unified to **Join lobby**

### Fixed

- **Steam app id** parsing when IGDB returns `external_game_source` as an object; stale library entries re-fetch from IGDB (e.g. Red Dead Redemption)
- Infinite **session restore** race (empty filters on mount no longer wipe votes or reset stream index)
- Swipe deck skeleton CSS `@reference` path (broke infinite mode on filter load)
- Match row / popover **cursor-pointer** and chrome z-index for Matches chip
- Global toast cap (**max 3**); share/copy no longer flickers disabled state on click
- Co-op history item cover ids (`game_id` vs `gameId`)

### Deploy notes (0.4.1)

1. **Supabase SQL** (if not applied): `supabase/swipe_history.sql`, `supabase/cached_games.sql`, `supabase/swipe_history_active.sql` — run in SQL editor; verify with `supabase/verify_schema.sql`.
2. **Build**: `npm ci && npm run build`.
3. **Prod**: merge to `main` and push; smoke-test `/infinite` → swipe → results → back, lobby link join (guest + signed-in), and `/history`.

## [0.4.0] - 2026-08-29

Infinite mode, swipe polish, account UX, Steam pricing, and ignored-games sync.

### Added

- **Infinite mode** at `/infinite`: endless IGDB catalog stream with filters before start (platforms, all genres, crossplay); active chips float to the top; filter chips scroll inside the dialog
- Infinite-mode **trash** (bottom-left): permanently hide a game; manage the list at `/ignored` (newest first, Restore / Remove on hover)
- **Undo last swipe** (`← Previous`, up to 5 games back) under the page-back chip
- **Ignore list** in Preferences: hide games that include a chosen genre, or that are exclusive to a chosen platform
- **Account** area with sidebar: Profile, Preferences, Integrations; header menu links to Account / Preferences / Integrations / Ignored games
- **Custom cursor** toggle (Preferences + auth menu); **Open Steam in browser** preference
- Steam **prices** on catalog / deck tiles / swipe sidebar / hover preview (UAH); sale percent when discounted
- **Metacritic** badge on cover tiles (green 80+ / yellow 75+ / red)
- **Auth**: Google sign-in with `?next=` return path; avatar in account shell
- Join session: **paste** clipboard code; empty field (placeholder only)
- Steam price API resolves **regional app IDs** (e.g. Dishonored `205100` → `217980` in UA) so local prices match the store

### Changed

- Home: **Find a game** opens Solo / Together; **Infinite mode** opens a filter dialog then `/infinite`; `/deck` swipes the active deck
- Swipe **like / skip** full-height side rails with soft color wash (~65% fade), slow card lean toward hovered side, subtle cursor pull on the **top card only** (stack behind stays put)
- Swipe **sidebar** buy block: price right-aligned above full-width Open in Steam; **no price on the swipe card** itself
- Screenshot gallery prev / next aligned to outer edges of wide hit zones
- Signed-in custom decks migrate to Supabase; create/update/delete errors surface in UI instead of silent localStorage fallback
- Catalog genre chips match games that **include** the genre (not exclusive-only)

### Fixed

- Header account menu stacks above catalog filters on Decks / Games
- Swipe sidebar price aligns with Steam button padding
- Swipe side rails sit above the card row so like / skip hover and clicks work
- Swipe card width no longer collapses to 0px when magnet wrapper inherits `--sw-card-w`
- **Card drag** restored on the interactive layer; pointer release outside the browser window ends the swipe
- Steam prices for titles with a separate regional store listing (e.g. Dishonored in Ukraine)

### Deploy notes (0.4.0)

1. **Env** (see `.env.example`): `NEXT_PUBLIC_SUPABASE_*`, `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET`, `NEXT_PUBLIC_SITE_URL`; Google OAuth in Supabase dashboard.
2. **Supabase SQL**: run `supabase/ignored_games.sql` in the SQL editor if `ignored_games` is not applied yet (signed-in ignore sync).
3. **Build**: `npm ci && npm run build` (uses `next build --webpack`).
4. **Prod**: push `main` (or merge PR) so Vercel deploys; confirm `/infinite`, swipe, and a priced game (e.g. Dishonored **260₴**) after deploy.

## [0.3.0] - 2026-08-26

Session lobby polish, richer match results, catalog UX, and production cleanup.

### Added

- Lobby URLs at `/session/lobby/[code]` — share a link; guests can join from the page
- Session create: pick-deck flow, sunken code copy control, toast on copy
- Match results: agreement tiers (100% / 75% / 50% / 30%), rejected list, vote avatars with who liked/skipped
- Top-agreement hero cards with cover, screenshots, Steam + SteamDB buttons, favorite star
- Compact match rows with hover preview and favorite
- Catalog filters redesigned (Genre / Play / Platform), sticky + collapsible bar, scroll-to-top on Games
- Favorites page wired to starred games (`/liked`); Favorites link in the top bar
- Lightweight toast host for copy / small confirmations

### Changed

- Session code collisions retry with a fresh code; create-form code clears after a successful lobby open
- Lobby members refresh live (realtime + short poll)
- Deck cards reserve title/tag slots so short tag lists no longer push titles down
- Library tiles equal-height titles; hover preview images clipped to the card

### Fixed

- Duplicate `sessions_code_key` when re-opening a lobby with a cached code
- Matches row hover no longer stacking library-tile glow on list rows

### Removed

- Layout-preview routes (`/end`, `/liked/empty`, `/deck/empty|loading|error`)
- Sample/hardcoded session members and empty `SAMPLE_LIKED` / `GAMES` helpers
- Unused SteamDB icon variants (kept light SVG only)

## [0.2.0] - 2026-08-06

First product cut beyond the initial Next.js scaffold: real sessions, IGDB catalog, decks UX, auth, and session start flow.

### Added

- Guest friend sessions via Supabase: create/join by code, lobby with realtime members, swipe votes, matches
- Google sign-in (Supabase Auth); guest sessions still work without an account
- IGDB-backed game catalog (`/library`) with popular games (min rating count 500)
- Shared catalog filters: genre → mode → co-op players → platform → crossplay; sort; Steam open via `steam://`
- Decks UI: mosaic cards, favorites, search, create/edit, deck detail with games grid
- Seed decks hydrated from real IGDB games (no Unsplash placeholders)
- **Use in session** dialog: Solo (straight to swipe) or Together (create-session flow)
- Session display names from account, or one of 16 fun random nicknames (editable per session)
- Matches: **Play this** opens Steam when a Steam app id is known
- **Share with friends** on matches — 7-day link (`/share/matches`) with the same results
- Shared UI: `ConfirmDialog`, `CatalogFilterBar`, `FilterChip`, `FadeIn`, `HoverLift`

### Changed

- App shell: Decks / Games in top bar; FrameNav / layout-preview chrome removed
- Create-deck and library share the same filter bar; genres collapse to one chip + expand
- Wider layouts (~1200px) for decks, library, lobby, and related views
- Feature-based folder layout (`features/`, `shared/`)

### Fixed

- Create-deck catalog no longer flashes A–Z library before popular IGDB results
- Deck mosaic covers use top games by Metacritic, not list order
- Session swipe / lobby redirect loops around logo navigation
- Guest join duplicate `guest_token` / orphan session edge cases
- New deck create card height matches deck cards in the grid
- Signed-in users can create/join sessions (guest session API uses anon client; avoids RLS 403)

### Removed

- FrameNav and “static layout preview” home copy
