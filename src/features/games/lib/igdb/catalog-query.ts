import type { CatalogFilterState } from "@/features/games/lib/catalog-filters";
import type { InfiniteFilterState } from "@/features/session/lib/infinite-filters";
import type { SortValue } from "@/features/games/lib/sort-games";

const GAME_FIELDS =
  "fields name, summary, first_release_date, aggregated_rating, total_rating_count, cover.image_id, genres.name, game_modes.name, platforms.name, platforms.abbreviation, multiplayer_modes.campaigncoop, multiplayer_modes.offlinecoop, multiplayer_modes.onlinecoop, multiplayer_modes.lancoop, multiplayer_modes.splitscreen, multiplayer_modes.offlinecoopmax, multiplayer_modes.onlinecoopmax, multiplayer_modes.onlinemax, multiplayer_modes.offlinemax, keywords.name, external_games.uid, external_games.external_game_source, screenshots.image_id, videos.video_id, involved_companies.developer, involved_companies.company.name;";

const GENRE_WHERE: Record<string, string> = {
  Action: "themes = (1)",
  Adventure: "genres = (31)",
  Arcade: "genres = (33)",
  "Card & Board Game": "genres = (35)",
  Fighting: "genres = (4)",
  "Hack and slash/Beat 'em up": "genres = (25)",
  Indie: "genres = (32)",
  MOBA: "genres = (36)",
  Music: "genres = (7)",
  Pinball: "genres = (30)",
  Platform: "genres = (8)",
  "Point-and-click": "genres = (2)",
  Puzzle: "genres = (9)",
  "Quiz/Trivia": "genres = (26)",
  Racing: "genres = (10)",
  "Real Time Strategy (RTS)": "genres = (11)",
  RPG: "genres = (12)",
  Shooter: "genres = (5)",
  Simulator: "genres = (13)",
  Sport: "genres = (14)",
  Strategy: "genres = (11,15,16)",
  Tactical: "genres = (24)",
  "Turn-based strategy (TBS)": "genres = (16)",
  "Visual Novel": "genres = (34)",
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

export function parseInfiniteFilterParams(
  searchParams: URLSearchParams,
): InfiniteFilterState {
  const genres =
    searchParams
      .get("genres")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  const platforms =
    searchParams
      .get("platforms")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  return {
    genres,
    platforms,
    crossplayOnly: searchParams.get("crossplay") === "1",
  };
}

function crossplayClauses(): string[] {
  return [
    `platforms = (${PLATFORM_IDS.PC.join(",")})`,
    `platforms = (${CONSOLE_IDS.join(",")})`,
    "(multiplayer_modes.onlinemax > 1 | multiplayer_modes.onlinecoop = true)",
  ];
}

function infiniteWhereClauses(filters: InfiniteFilterState): string[] {
  const clauses = ["cover != null", "game_type = 0", "total_rating_count >= 10"];

  const genreParts = filters.genres
    .map((genre) => GENRE_WHERE[genre])
    .filter(Boolean);
  if (genreParts.length === 1) clauses.push(genreParts[0]!);
  else if (genreParts.length > 1) {
    clauses.push(`(${genreParts.join(" | ")})`);
  }

  const platformIds = [
    ...new Set(
      filters.platforms.flatMap((platform) => PLATFORM_IDS[platform] ?? []),
    ),
  ];
  if (platformIds.length > 0) {
    clauses.push(`platforms = (${platformIds.join(",")})`);
  }

  if (filters.crossplayOnly) clauses.push(...crossplayClauses());

  return clauses;
}

export function buildInfiniteCatalogQuery(input: {
  page: number;
  pageSize: number;
  filters: InfiniteFilterState;
}): string {
  const offset = (input.page - 1) * input.pageSize;
  const where = `where ${infiniteWhereClauses(input.filters).join(" & ")};`;
  return `${GAME_FIELDS} ${where} ${SORT_CLAUSE.popular} limit ${input.pageSize}; offset ${offset};`;
}

function whereClauses(
  filters: CatalogFilterState,
  options?: { searching?: boolean },
): string[] {
  const clauses = ["cover != null", "game_type = 0"];
  if (options?.searching) {
    // Prefix / contains search — keep threshold low so short queries still hit.
    clauses.push("total_rating_count >= 5");
  } else {
    clauses.push(
      hasFilters(filters) ? "total_rating_count >= 10" : "total_rating_count >= 500",
    );
  }

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
    clauses.push(...crossplayClauses());
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
  // IGDB `search "..."` is poor for short prefixes (e.g. "Por" → 0 hits).
  // `name ~ *"por"*` does case-insensitive contains and works for autocomplete.
  const q = input.q.replace(/["\\*]/g, "").trim();

  if (q) {
    // Prefer prefix match so short autocomplete ("Por") hits Portal, not "Sports".
    const nameClause = q.includes(" ")
      ? `name ~ *"${q}"*`
      : `name ~ "${q}"*`;
    const where = `where ${[
      ...whereClauses(input.filters, { searching: true }),
      nameClause,
    ].join(" & ")};`;
    return `${GAME_FIELDS} ${where} ${SORT_CLAUSE[input.sort]} ${limit}`;
  }

  const where = `where ${whereClauses(input.filters).join(" & ")};`;
  return `${GAME_FIELDS} ${where} ${SORT_CLAUSE[input.sort]} ${limit}`;
}
