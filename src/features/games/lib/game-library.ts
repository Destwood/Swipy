import { SEED_IGDB_IDS } from "@/features/decks/data/decks";
import { type Game } from "@/features/games/data/games";

const LIBRARY_KEY = "swipy.gamesLibrary";
const SEED_HYDRATE_KEY = "swipy.seedIgdb.v7";

function readLibrary(): Record<string, Game> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Game>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLibrary(map: Record<string, Game>) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(map));
}

function purgeLegacyUnsplashSeeds(map: Record<string, Game>) {
  let changed = false;
  for (const [id, game] of Object.entries(map)) {
    const isLegacySlug = !id.startsWith("igdb-") && !id.startsWith("rawg-");
    const isUnsplash = game.image.includes("unsplash.com");
    if (isLegacySlug && isUnsplash) {
      delete map[id];
      changed = true;
    }
  }
  return changed;
}

/** @deprecated no-op — seed games hydrate from IGDB. */
export function ensureSeedLibrary() {
  const map = readLibrary();
  if (purgeLegacyUnsplashSeeds(map)) writeLibrary(map);
}

export function upsertGames(games: Game[]) {
  const map = readLibrary();
  for (const game of games) {
    map[game.id] = game;
  }
  writeLibrary(map);
}

export function listLibraryGames(): Game[] {
  ensureSeedLibrary();
  return Object.values(readLibrary()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

export function getLibraryGameById(id: string): Game | undefined {
  ensureSeedLibrary();
  return readLibrary()[id];
}

export function getLibraryGamesByIds(ids: string[]): Game[] {
  return ids
    .map((id) => getLibraryGameById(id))
    .filter((g): g is Game => g !== undefined);
}

export async function ensureGamesInLibrary(ids: string[]): Promise<Game[]> {
  const present = new Set(getLibraryGamesByIds(ids).map((game) => game.id));
  const missing = ids.filter((id) => !present.has(id));
  const igdbIds = [
    ...new Set(
      missing
        .map((id) => (id.startsWith("igdb-") ? Number(id.slice(5)) : NaN))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];

  for (let i = 0; i < igdbIds.length; i += 50) {
    const chunk = igdbIds.slice(i, i + 50);
    try {
      const res = await fetch(`/api/games/by-ids?ids=${chunk.join(",")}`);
      const data = (await res.json()) as { results?: Game[] };
      if (res.ok && data.results?.length) upsertGames(data.results);
    } catch {
      // Keep whatever is already cached.
    }
  }

  return getLibraryGamesByIds(ids);
}

function missingSeedIds(): number[] {
  const map = readLibrary();
  return SEED_IGDB_IDS.filter((id) => !map[`igdb-${id}`]);
}

/** Pull canonical seed games (covers + metadata) from IGDB into local library. */
export async function hydrateSeedGamesFromIgdb(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (typeof window === "undefined") return { ok: false, error: "ssr" };

  ensureSeedLibrary();
  const missing = missingSeedIds();
  const already = localStorage.getItem(SEED_HYDRATE_KEY) === "1";
  if (already && missing.length === 0) return { ok: true };

  try {
    const ids = missing.length > 0 ? missing : [...SEED_IGDB_IDS];
    const res = await fetch(`/api/games/by-ids?ids=${ids.join(",")}`);
    const data = (await res.json()) as { results?: Game[]; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "IGDB unavailable" };
    }
    const games = data.results ?? [];
    if (games.length > 0) upsertGames(games);
    if (missingSeedIds().length === 0) {
      localStorage.setItem(SEED_HYDRATE_KEY, "1");
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error" };
  }
}
