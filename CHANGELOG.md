# Changelog

All notable changes to Swipy are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/) when we start tagging releases.

How to use:
1. While working, add bullets under **[Unreleased]**.
2. Before merging / pushing to `main`, move those bullets into a new dated version section.
3. Write for humans (what changed in the product), not file lists.

## [Unreleased]

Work on the `dev` branch — not on `main` yet.

### Added

- Practice swipe on `/deck` with real drag, like/skip, and a right-hand game info panel
- Game info panel: title, developer/year, genres, 2×3 screenshots, description, framed favorite star
- Screenshot lightbox with prev/next, Escape, and pointer cursor on controls
- Steam screenshots via `/api/steam/media`; **Open in Steam** control (recessed Steam chrome, official mark, white label)
- Personal favorite games in `localStorage` (`swipy.favoriteGameIds`) — distinct from session likes
- Home page always shows the same top bar as the rest of the app (Decks / Games / account)

### Changed

- Denser layout for ~1440×900 notebooks: fluid swipe card, tighter pages, smaller favorite control
- IGDB covers load at higher resolution (hero/tile sizes) so library and cards stay sharp
- Session names: solo never asks; co-op asks guests only; signed-in players use Google/email name
- Logged-in name is preferred over a leftover guest nickname
- Profile nickname editor is planned later (account page), not built yet

### Fixed

- Sidebar no longer paints IGDB shots first, then replaces them with Steam (one load, cached by app id)
- Extra gap between the like button and the info panel on swipe

### Removed

- Floating home-only auth chip (replaced by the shared top bar)
- Session name field on solo start and on co-op when already signed in

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
- Hardcoded Unsplash seed game images
