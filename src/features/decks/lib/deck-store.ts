import { SEED_DECKS, type Deck } from "@/features/decks/data/decks";
import {
  deleteAccountDeck,
  fetchAccountDeck,
  fetchAccountDecks,
  getSignedInUserId,
  insertAccountDeck,
  isAccountDeckId,
  migrateLocalDecksToAccount,
  updateAccountDeck,
} from "@/features/decks/lib/account-decks";
import { getLibraryGamesByIds } from "@/features/games/lib/game-library";

const CUSTOM_DECKS_KEY = "swipy.customDecks";
const ACTIVE_DECK_KEY = "swipy.activeDeckId";
const HIDDEN_SEEDS_KEY = "swipy.hiddenSeedDeckIds";

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

function localDecks(): Deck[] {
  const custom = readCustomDecks();
  const customIds = new Set(custom.map((d) => d.id));
  const hidden = readHiddenSeeds();
  return [
    ...SEED_DECKS.filter((d) => !customIds.has(d.id) && !hidden.has(d.id)),
    ...custom,
  ];
}

export function isUserDeck(deck: Deck) {
  return !SEED_DECKS.some((seed) => seed.id === deck.id);
}

function saveLocalDeck(input: {
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
  writeCustomDecks([...readCustomDecks(), deck]);
  return deck;
}

export async function saveCustomDeck(input: {
  name: string;
  description?: string;
  gameIds: string[];
}): Promise<Deck> {
  const userId = await getSignedInUserId();
  if (userId) {
    try {
      return await insertAccountDeck(input);
    } catch {
      // Tables may not exist until the SQL migration is applied.
    }
  }
  return saveLocalDeck(input);
}

export async function listDecks(): Promise<Deck[]> {
  const custom = readCustomDecks();
  const hidden = readHiddenSeeds();
  try {
    const userId = await getSignedInUserId();
    if (userId) {
      await migrateLocalDecksToAccount(
        custom.filter((deck) => deck.id.startsWith("custom-")),
      );
      const cloud = await fetchAccountDecks();
      const overlays = custom.filter((deck) =>
        SEED_DECKS.some((seed) => seed.id === deck.id),
      );
      const overlayIds = new Set(overlays.map((deck) => deck.id));
      const seeds = SEED_DECKS.filter(
        (deck) => !hidden.has(deck.id) && !overlayIds.has(deck.id),
      );
      return [...seeds, ...overlays, ...cloud];
    }
  } catch {
    // Stay on localStorage until the account tables exist.
  }
  return localDecks();
}

export async function getDeckById(id: string): Promise<Deck | undefined> {
  const listed = await listDecks();
  const found = listed.find((deck) => deck.id === id);
  if (found) return found;
  if (!isAccountDeckId(id)) return undefined;
  try {
    return await fetchAccountDeck(id);
  } catch {
    return undefined;
  }
}

export async function updateDeck(
  id: string,
  input: { name: string; description?: string; gameIds: string[] },
): Promise<Deck> {
  if (isAccountDeckId(id) && (await getSignedInUserId())) {
    try {
      return await updateAccountDeck(id, input);
    } catch {
      // Fall through to local overlay.
    }
  }
  const deck: Deck = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    gameIds: input.gameIds,
  };
  const custom = readCustomDecks();
  const idx = custom.findIndex((item) => item.id === id);
  if (idx >= 0) {
    const next = [...custom];
    next[idx] = deck;
    writeCustomDecks(next);
  } else {
    writeCustomDecks([...custom, deck]);
  }
  return deck;
}

export async function deleteDeck(id: string): Promise<boolean> {
  if (isAccountDeckId(id) && (await getSignedInUserId())) {
    try {
      await deleteAccountDeck(id);
      return true;
    } catch {
      return false;
    }
  }
  const custom = readCustomDecks();
  if (custom.some((deck) => deck.id === id)) {
    writeCustomDecks(custom.filter((deck) => deck.id !== id));
    return true;
  }
  if (SEED_DECKS.some((deck) => deck.id === id)) {
    const hidden = readHiddenSeeds();
    hidden.add(id);
    writeHiddenSeeds(hidden);
    return true;
  }
  return false;
}

export function setActiveDeckId(id: string) {
  sessionStorage.setItem(ACTIVE_DECK_KEY, id);
}

export function getActiveDeckId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_DECK_KEY);
}

export async function getActiveDeck(): Promise<Deck | undefined> {
  const id = getActiveDeckId();
  if (id) {
    const deck = await getDeckById(id);
    if (deck) return deck;
  }
  const decks = await listDecks();
  return decks[0];
}

export async function getActiveDeckGames() {
  const deck = await getActiveDeck();
  if (!deck) return [];
  return getLibraryGamesByIds(deck.gameIds);
}
