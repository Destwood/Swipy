import { SEED_DECKS, type Deck } from "@/data/decks";
import { getGamesByIds } from "@/data/games";

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

export function listDecks(): Deck[] {
  const custom = readCustomDecks();
  const customIds = new Set(custom.map((d) => d.id));
  return [...SEED_DECKS.filter((d) => !customIds.has(d.id)), ...custom];
}

export function getDeckById(id: string): Deck | undefined {
  return listDecks().find((d) => d.id === id);
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
  return getGamesByIds(deck.gameIds);
}
