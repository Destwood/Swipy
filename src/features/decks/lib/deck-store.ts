import { SEED_DECKS, type Deck } from "@/features/decks/data/decks";
import { getLibraryGamesByIds } from "@/features/games/lib/game-library";

const CUSTOM_DECKS_KEY = "swipy.customDecks";
const ACTIVE_DECK_KEY = "swipy.activeDeckId";

function readCustomDecks(): Deck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_DECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Deck[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomDecks(decks: Deck[]) {
  localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(decks));
}

export function saveCustomDeck(input: {
  name: string;
  description?: string;
  gameIds: string[];
}): Deck {
  const deck: Deck = {
    id: `custom-${Date.now()}`,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    gameIds: input.gameIds,
  };
  const next = [...readCustomDecks(), deck];
  writeCustomDecks(next);
  return deck;
}

const HIDDEN_SEEDS_KEY = "swipy.hiddenSeedDeckIds";

function readHiddenSeeds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(HIDDEN_SEEDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeHiddenSeeds(ids: Set<string>) {
  localStorage.setItem(HIDDEN_SEEDS_KEY, JSON.stringify([...ids]));
}

export function listDecks(): Deck[] {
  const custom = readCustomDecks();
  const customIds = new Set(custom.map((d) => d.id));
  const hidden = readHiddenSeeds();
  return [
    ...SEED_DECKS.filter((d) => !customIds.has(d.id) && !hidden.has(d.id)),
    ...custom,
  ];
}

export function getDeckById(id: string): Deck | undefined {
  return listDecks().find((d) => d.id === id);
}

export function updateDeck(
  id: string,
  input: { name: string; description?: string; gameIds: string[] },
): Deck {
  const deck: Deck = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    gameIds: input.gameIds,
  };
  const custom = readCustomDecks();
  const idx = custom.findIndex((d) => d.id === id);
  if (idx >= 0) {
    const next = [...custom];
    next[idx] = deck;
    writeCustomDecks(next);
  } else {
    writeCustomDecks([...custom, deck]);
  }
  return deck;
}

export function deleteDeck(id: string): boolean {
  const custom = readCustomDecks();
  if (custom.some((d) => d.id === id)) {
    writeCustomDecks(custom.filter((d) => d.id !== id));
    return true;
  }
  if (SEED_DECKS.some((d) => d.id === id)) {
    const hidden = readHiddenSeeds();
    hidden.add(id);
    writeHiddenSeeds(hidden);
    return true;
  }
  return false;
}

/** @deprecated use deleteDeck */
export function deleteCustomDeck(id: string): boolean {
  return deleteDeck(id);
}

export function setActiveDeckId(id: string) {
  sessionStorage.setItem(ACTIVE_DECK_KEY, id);
}

export function getActiveDeckId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_DECK_KEY);
}

export function getActiveDeck(): Deck | undefined {
  const id = getActiveDeckId();
  if (id) {
    const deck = getDeckById(id);
    if (deck) return deck;
  }
  return listDecks()[0];
}

export function getActiveDeckGames() {
  const deck = getActiveDeck();
  if (!deck) return [];
  return getLibraryGamesByIds(deck.gameIds);
}
