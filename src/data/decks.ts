export interface Deck {
  id: string;
  name: string;
  description?: string;
  gameIds: string[];
}

/** Seed decks shipped with the app (hardcoded). User-created decks merge via localStorage. */
export const SEED_DECKS: Deck[] = [
  {
    id: "indie-night",
    name: "Indie Night",
    description: "Tight indie picks for a chill evening.",
    gameIds: [
      "hollow-knight",
      "hades",
      "celeste",
      "dead-cells",
      "outer-wilds",
      "stardew-valley",
    ],
  },
  {
    id: "rpg-party",
    name: "RPG Party",
    description: "Story-heavy RPGs for a longer session.",
    gameIds: [
      "elden-ring",
      "disco-elysium",
      "witcher-3",
      "cyberpunk",
      "baldurs-gate-3",
    ],
  },
  {
    id: "action-couch",
    name: "Action Couch",
    description: "High-energy action and adventure.",
    gameIds: ["god-of-war", "hades", "dead-cells", "elden-ring", "cyberpunk"],
  },
];
