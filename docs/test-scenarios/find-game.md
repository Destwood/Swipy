# "Find a game" flow — test scenarios

Entry point: home `/`, button **Find a game** (`HomeFindGame`) opens `UseInSessionDialog` with `source="home"`.

## Flow map

```
/  ── Find a game ──► dialog "Find a game" (Choose a mode.)
                       ├─ Solo ─────► /session/pick-deck?intent=solo
                       │                └─ pick a deck ─► /deck  (solo swipe: Like / Dislike / Undo / Ignore / sidebar toggle)
                       └─ Together ─► /session  (CreateSessionForm)
                                        ├─ Select deck / Change deck ─► /session/pick-deck ─ pick ─► /session
                                        ├─ "Or create a new deck →" ─► /decks/new
                                        ├─ Open lobby ─► /session/lobby/[code]
                                        │                  ├─ View games (dialog)
                                        │                  ├─ copy invite (SessionCodeCopy)
                                        │                  └─ Start session swipe (host only) ─► /session/deck
                                        └─ Join lobby ─► /session/join
```

Dialog closes on: Escape, click on the overlay, or after choosing a mode. While `busy` all three are ignored and both mode buttons are disabled.

## Buttons

| Screen | Button | Result |
|---|---|---|
| `/` | Find a game | opens dialog |
| `/` | Infinite mode | opens `InfiniteModeDialog` (separate flow) |
| `/` | Join lobby | `/session/join` |
| dialog | Solo | label "Starting…", closes, `/session/pick-deck?intent=solo` |
| dialog | Together | label "Opening…", closes, `/session` |
| pick-deck (solo) | deck card | `setActiveDeckId`, `/deck` |
| pick-deck (solo) | ← Home | `/` |
| pick-deck (together) | deck card | `setSessionCreateDeckId`, `/session` |
| pick-deck (together) | ← Session | `/session` |
| `/session` | Select deck / Change deck | `/session/pick-deck` |
| `/session` | Open lobby | disabled until deck + code + name ready; "Creating…"; `/session/lobby/<CODE>` |
| `/session` | Join lobby | `/session/join` |
| lobby | View games | opens `SessionGamesDialog` |
| lobby | Start session swipe | host only; "Starting…"; `/session/deck` |
| lobby (guest) | Join lobby / Try again | joins as guest |
| swipe | Like / Dislike (`aria-label`) | records vote, next card |
| swipe | Undo chip, `Backspace` / `U` | restores previous card |
| swipe | `ArrowRight` / `L`, `ArrowLeft` / `A` | like / dislike (session deck) |
| swipe | sidebar toggle | opens or closes game info |

## Scenarios

Format: Given / When / Then. Same steps, same result every run.

### A. Dialog (component-level, no network)

| ID | Scenario |
|---|---|
| A1 | Given home. When click **Find a game**. Then dialog with title "Find a game", text "Choose a mode.", buttons Solo and Together; no Cancel button. |
| A2 | Given dialog open. When press Escape. Then dialog is gone, `body` overflow restored. |
| A3 | Given dialog open. When mouse down on the overlay (outside the card). Then dialog closes. |
| A4 | Given dialog open. When mouse down inside the card. Then dialog stays open. |
| A5 | Given dialog open. When click Solo. Then `router.push("/session/pick-deck?intent=solo")` called once and dialog closed. |
| A6 | Given dialog open. When click Together. Then `router.push("/session")` called once and dialog closed. |
| A7 | Given dialog open. When click Solo twice quickly. Then `push` called once. |
| A8 | Given dialog open. Then `body` has `overflow: hidden`; after close it is back to the previous value. |
| A9 | Given dialog closed then reopened. Then no stale "Starting…" label or error. |

### B. Solo path (E2E)

| ID | Scenario |
|---|---|
| B1 | Home → Find a game → Solo → URL is `/session/pick-deck?intent=solo`, hint "Pick one deck to play alone.", back link "← Home". |
| B2 | Pick first deck → URL is `/deck`; `localStorage["swipy.activeDeckId"]` equals the picked id; first card of that deck is shown. |
| B3 | On `/deck` click Like → card changes, Undo chip becomes enabled. Click Undo → previous card returns, Undo disabled. |
| B4 | On `/deck` click Dislike → card changes. |
| B5 | Open `/session/pick-deck?intent=solo`, click back link → `/`. |

### C. Together path (E2E, needs Supabase test project or mocked `createGuestSession`)

| ID | Scenario |
|---|---|
| C1 | Home → Find a game → Together → URL `/session`; **Open lobby** is disabled while no deck is selected. |
| C2 | On `/session` click Select deck → pick a deck → back on `/session` with deck name shown, button now says "Change deck", **Open lobby** enabled. |
| C3 | Click Open lobby → URL matches `/session/lobby/<CODE>`; deck label shows `<name> · <n> games`; host sees "Start session swipe". |
| C4 | In lobby click View games → dialog lists the deck games; Escape closes it. |
| C5 | Host clicks Start session swipe → `/session/deck` and first card is shown. |
| C6 | Second browser context opens the invite link → asks name (guest) → Join lobby → appears in host member list; sees "Waiting for host to start…" and no Start button. |
| C7 | Open lobby with a deck of zero games → error "Pick a deck with at least one game." and the button is enabled again. |
| C8 | Open `/session/lobby/ZZZZZZ` (unknown code) → "Lobby not found. Check the link or code." |

### D. Regression traps

| ID | Scenario |
|---|---|
| D1 | After a failed Open lobby (C7) retry works; code is not reused after a successful create (`clearSessionCreateCode`). |
| D2 | Back from `/session` to `/` and Find a game again → dialog opens fresh. |
| D3 | Reload `/session` after picking a deck → selected deck is restored from `session-create-deck`. |

## How to automate

Current setup: `vitest` with `environment: "node"` and `include: src/**/*.test.ts` — only pure logic can be tested today.

| Layer | Covers | Needs |
|---|---|---|
| Vitest + `@testing-library/react` + `jsdom` | A1–A9 (mock `next/navigation`) | add `jsdom`, `@testing-library/react`, `@testing-library/user-event`; component tests as `*.test.tsx` with `// @vitest-environment jsdom`; extend `include` to `*.test.tsx` |
| Playwright | B, C, D | add `@playwright/test`, `npm run build && npm start` as `webServer`, Supabase test project or `page.route` mocks for `sessions`/`members` |

Suggested stable selectors (use `getByRole` first; add `data-testid` only where the name is dynamic): `getByRole("button", { name: "Find a game" })`, `getByRole("dialog", { name: "Find a game" })`, `getByRole("button", { name: "Like" })`, `getByRole("button", { name: "Dislike" })`.
