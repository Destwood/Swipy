import type { Game } from "@/features/games/data/games";
import { gameHasGenre } from "@/features/games/lib/genre-label";

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

/** Fixed catalog filter options (UI labels = filter values). */
export const CATALOG_FILTER_OPTIONS = {
  genres: [
    "Action",
    "Adventure",
    "RPG",
    "Shooter",
    "Strategy",
    "Simulator",
    "Indie",
    "Puzzle",
  ],
  modes: [
    { value: "Single", label: "Solo" },
    { value: "Multiplayer", label: "Multiplayer" },
    { value: "Co-op", label: "Co-op" },
  ],
  players: [
    { value: "2", label: "2 players" },
    { value: "3–4", label: "3–4" },
    { value: "5+", label: "5+" },
  ],
  platforms: ["PC", "PlayStation", "Xbox", "Nintendo"],
} as const;

export function catalogFiltersActive(filters: CatalogFilterState): boolean {
  return (
    filters.genre !== "All" ||
    filters.mode !== "All" ||
    filters.players !== "All" ||
    filters.platform !== "All" ||
    filters.crossplayOnly
  );
}

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
