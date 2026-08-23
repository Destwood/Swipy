import type { CatalogFilterState } from "@/features/games/lib/catalog-filters";
import type { SortValue } from "@/features/games/lib/sort-games";

const GAME_FIELDS =
  "fields name, summary, first_release_date, aggregated_rating, total_rating_count, cover.image_id, genres.name, game_modes.name, platforms.name, platforms.abbreviation, multiplayer_modes.campaigncoop, multiplayer_modes.offlinecoop, multiplayer_modes.onlinecoop, multiplayer_modes.lancoop, multiplayer_modes.splitscreen, multiplayer_modes.offlinecoopmax, multiplayer_modes.onlinecoopmax, multiplayer_modes.onlinemax, multiplayer_modes.offlinemax, keywords.name, external_games.uid, external_games.external_game_source, screenshots.image_id, videos.video_id, involved_companies.developer, involved_companies.company.name;";

const GENRE_WHERE: Record<string, string> = {
  Action: "themes = 1",
  Adventure: "genres = 31",
  RPG: "genres = 12",
  Shooter: "genres = 5",
  Strategy: "genres = (11,15,16)",
  Simulator: "genres = 13",
  Indie: "genres = 32",
  Puzzle: "genres = 9",
};

const MODE_WHERE: Record<string, string> = {
  Single: "game_modes = 1",
  Multiplayer: "game_modes = 2",
  "Co-op":
    "(game_modes = 3 | multiplayer_modes.onlinecoop = true | multiplayer_modes.offlinecoop = true | multiplayer_modes.campaigncoop = true | multiplayer_modes.lancoop = true | multiplayer_modes.splitscreen = true)",
};

const PLAYERS_WHERE: Record<string, string> = {
  "2": "(multiplayer_modes.onlinecoopmax = 2 | multiplayer_modes.offlinecoopmax = 2)",
  "3–4":
    "((multiplayer_modes.onlinecoopmax >= 3 & multiplayer_modes.onlinecoopmax <= 4) | (multiplayer_modes.offlinecoopmax >= 3 & multiplayer_modes.offlinecoopmax <= 4))",
  "5+":
    "(multiplayer_modes.onlinecoopmax >= 5 | multiplayer_modes.offlinecoopmax >= 5)",
};

const PLATFORM_IDS: Record<string, number[]> = {
  PC: [6, 14, 3],
  PlayStation: [48, 167, 9, 8, 7, 46, 38],
  Xbox: [49, 169, 12, 11],
  Nintendo: [130, 41, 37, 5, 21, 4, 18, 19, 20, 22, 24, 33, 137],
};

const CONSOLE_IDS = [
  ...PLATFORM_IDS.PlayStation,
  ...PLATFORM_IDS.Xbox,
  ...PLATFORM_IDS.Nintendo,
];

const SORT_CLAUSE: Record<SortValue, string> = {
  popular: "sort total_rating_count desc;",
  rating: "sort aggregated_rating desc;",
  name: "sort name asc;",
  year: "sort first_release_date desc;",
};

function hasFilters(filters: CatalogFilterState): boolean {
  return (
    filters.genre !== "All" ||
    filters.mode !== "All" ||
    filters.players !== "All" ||
    filters.platform !== "All" ||
    filters.crossplayOnly
  );
}

export function parseCatalogFilters(
  searchParams: URLSearchParams,
): CatalogFilterState {
  return {
    genre: searchParams.get("genre") || "All",
    mode: searchParams.get("mode") || "All",
    players: searchParams.get("players") || "All",
    platform: searchParams.get("platform") || "All",
    crossplayOnly: searchParams.get("crossplay") === "1",
  };
}

export function parseCatalogSort(raw: string | null): SortValue {
  if (raw === "rating" || raw === "name" || raw === "year" || raw === "popular") {
    return raw;
  }
  return "popular";
}

function whereClauses(filters: CatalogFilterState): string[] {
  const clauses = ["cover != null", "game_type = 0"];
  clauses.push(
    hasFilters(filters) ? "total_rating_count >= 10" : "total_rating_count >= 500",
  );

  const genre = GENRE_WHERE[filters.genre];
  if (genre) clauses.push(genre);

  const mode = MODE_WHERE[filters.mode];
  if (mode) clauses.push(mode);

  if (filters.mode === "Co-op") {
    const players = PLAYERS_WHERE[filters.players];
    if (players) clauses.push(players);
  }

  const platforms = PLATFORM_IDS[filters.platform];
  if (platforms) clauses.push(`platforms = (${platforms.join(",")})`);

  if (filters.crossplayOnly) {
    clauses.push(`platforms = (${PLATFORM_IDS.PC.join(",")})`);
    clauses.push(`platforms = (${CONSOLE_IDS.join(",")})`);
    clauses.push(
      "(multiplayer_modes.onlinemax > 1 | multiplayer_modes.onlinecoop = true)",
    );
  }

  return clauses;
}

export function buildIgdbCatalogQuery(input: {
  q: string;
  page: number;
  pageSize: number;
  filters: CatalogFilterState;
  sort: SortValue;
}): string {
  const offset = (input.page - 1) * input.pageSize;
  const limit = `limit ${input.pageSize}; offset ${offset};`;
  const where = `where ${whereClauses(input.filters).join(" & ")};`;
  const q = input.q.replace(/"/g, "").trim();

  if (q) {
    return `search "${q}"; ${GAME_FIELDS} ${where} ${limit}`;
  }

  return `${GAME_FIELDS} ${where} ${SORT_CLAUSE[input.sort]} ${limit}`;
}
