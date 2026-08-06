import type { Game } from "@/features/games/data/games";
import {
  collectGenreStats,
  gameHasGenre,
} from "@/features/games/lib/genre-label";

export type CatalogFilterState = {
  genre: string;
  mode: string;
  players: string;
  platform: string;
  crossplayOnly: boolean;
};

export const EMPTY_CATALOG_FILTERS: CatalogFilterState = {
  genre: "All",
  mode: "All",
  players: "All",
  platform: "All",
  crossplayOnly: false,
};

export type ChipStat = { label: string; count: number };

export function playersBucket(max?: number): string | null {
  if (!max || max < 2) return null;
  if (max === 2) return "2";
  if (max <= 4) return "3–4";
  return "5+";
}

function matchesPlayers(game: Game, players: string): boolean {
  if (players === "All") return true;
  const max = game.coopMaxPlayers ?? 0;
  if (players === "2") return max === 2;
  if (players === "3–4") return max >= 3 && max <= 4;
  if (players === "5+") return max >= 5;
  return true;
}

export function gameMatchesCatalogFilters(
  game: Game,
  filters: CatalogFilterState,
): boolean {
  if (!gameHasGenre(game, filters.genre)) return false;
  if (filters.mode !== "All" && !(game.modes ?? []).includes(filters.mode)) {
    return false;
  }
  if (filters.mode === "Co-op" && !matchesPlayers(game, filters.players)) {
    return false;
  }
  if (
    filters.platform !== "All" &&
    !(game.platforms ?? []).includes(filters.platform)
  ) {
    return false;
  }
  if (filters.crossplayOnly && !game.crossplay) return false;
  return true;
}

function countBy(
  games: Game[],
  pick: (g: Game) => string[],
): ChipStat[] {
  const counts = new Map<string, number>();
  for (const game of games) {
    const seen = new Set<string>();
    for (const label of pick(game)) {
      if (!label || seen.has(label)) continue;
      seen.add(label);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

/** Stats for cascade chips, computed against games that already match upstream filters. */
export function collectCatalogFilterStats(
  games: Game[],
  filters: CatalogFilterState,
) {
  const afterGenre = games.filter((g) => gameHasGenre(g, filters.genre));
  const modeCounts = countBy(afterGenre, (g) => g.modes ?? []);
  const modeMap = new Map(modeCounts.map((m) => [m.label, m.count]));
  const modes: ChipStat[] = ["Single", "Multiplayer", "Co-op"]
    .map((label) => ({ label, count: modeMap.get(label) ?? 0 }))
    .filter((m) => m.count > 0);

  const afterMode =
    filters.mode === "All"
      ? afterGenre
      : afterGenre.filter((g) => (g.modes ?? []).includes(filters.mode));

  const playerCounts = new Map<string, number>();
  for (const game of afterMode) {
    const bucket = playersBucket(game.coopMaxPlayers);
    if (!bucket) continue;
    playerCounts.set(bucket, (playerCounts.get(bucket) ?? 0) + 1);
  }
  const players: ChipStat[] = ["2", "3–4", "5+"]
    .map((label) => ({ label, count: playerCounts.get(label) ?? 0 }))
    .filter((x) => x.count > 0);

  const afterPlayers =
    filters.mode === "Co-op"
      ? afterMode.filter((g) => matchesPlayers(g, filters.players))
      : afterMode;

  const platformOrder = ["PC", "PlayStation", "Xbox", "Nintendo"];
  const platformCounts = countBy(afterPlayers, (g) => g.platforms ?? []);
  const platformMap = new Map(platformCounts.map((p) => [p.label, p.count]));
  const platforms: ChipStat[] = platformOrder
    .map((label) => ({ label, count: platformMap.get(label) ?? 0 }))
    .filter((p) => p.count > 0);

  const crossplayCount = afterPlayers.filter((g) => g.crossplay).length;

  return {
    genres: collectGenreStats(games),
    modes,
    players,
    platforms,
    crossplayCount,
  };
}
