export interface Deck {
  id: string;
  name: string;
  description?: string;
  gameIds: string[];
}

/** Canonical IGDB game ids used by seed decks (real covers via /api/games/by-ids). */
export const SEED_IGDB_IDS = [
  14593, // Hollow Knight
  113112, // Hades
  26226, // Celeste
  26855, // Dead Cells
  11737, // Outer Wilds
  17000, // Stardew Valley
  119133, // Elden Ring
  26472, // Disco Elysium
  1942, // The Witcher 3: Wild Hunt
  1877, // Cyberpunk 2077
  119171, // Baldur's Gate III
  112875, // God of War Ragnarök
] as const;

function igdbId(id: number) {
  return `igdb-${id}`;
}

/** Seed decks shipped with the app. Covers come from IGDB after hydration. */
export const SEED_DECKS: Deck[] = [
  {
    id: "indie-night",
    name: "Indie Night",
    description: "Tight indie picks for a chill evening.",
    gameIds: [
      igdbId(14593),
      igdbId(113112),
      igdbId(26226),
      igdbId(26855),
      igdbId(11737),
      igdbId(17000),
    ],
  },
  {
    id: "rpg-party",
    name: "RPG Party",
    description: "Story-heavy RPGs for a longer session.",
    gameIds: [
      igdbId(119133),
      igdbId(26472),
      igdbId(1942),
      igdbId(1877),
      igdbId(119171),
    ],
  },
  {
    id: "action-couch",
    name: "Action Couch",
    description: "High-energy action and adventure.",
    gameIds: [
      igdbId(112875),
      igdbId(113112),
      igdbId(26855),
      igdbId(119133),
      igdbId(1877),
    ],
  },
];
