import type { Game } from "@/features/games/data/games";
import { gameHasGenre } from "@/features/games/lib/genre-label";

export type CatalogFilterState = {
  genre: string;
  mode: string;
  players: string;
  platform: string;
  crossplayOnly: boolean;
  priceMin: number;
  priceMax: number;
  onSale: boolean;
  reviews: string;
  era: string;
  yearMin: number;
  yearMax: number;
  multi: string[];
  vibe: string[];
  deck: boolean;
  demo: boolean;
};

export type ExtraFilters = Pick<
  CatalogFilterState,
  | "priceMin"
  | "priceMax"
  | "onSale"
  | "reviews"
  | "era"
  | "yearMin"
  | "yearMax"
  | "multi"
  | "vibe"
  | "deck"
  | "demo"
>;

export const DEFAULT_PLATFORM = "PC";

export const PRICE_MIN = 0;
export const PRICE_MAX = 2000;
export const PRICE_STEP = 50;
export const PRICE_SYMBOL = "₴";
export const YEAR_MIN = 1995;
export const YEAR_MAX = new Date().getFullYear();

export const EMPTY_EXTRA_FILTERS: ExtraFilters = {
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  onSale: false,
  reviews: "any",
  era: "any",
  yearMin: YEAR_MIN,
  yearMax: YEAR_MAX,
  multi: [],
  vibe: [],
  deck: false,
  demo: false,
};

export const EMPTY_CATALOG_FILTERS: CatalogFilterState = {
  genre: "All",
  mode: "All",
  players: "All",
  platform: DEFAULT_PLATFORM,
  crossplayOnly: false,
  ...EMPTY_EXTRA_FILTERS,
};

/** PC-only selections are served from the Steam store, everything else from IGDB. */
export function isSteamPlatforms(platforms: readonly string[]): boolean {
  return platforms.length === 1 && platforms[0] === DEFAULT_PLATFORM;
}

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
  reviews: [
    { value: "any", label: "Any" },
    { value: "positive", label: "Good+" },
    { value: "very", label: "Great+" },
    { value: "top", label: "Top" },
  ],
  eras: [
    { value: "month", label: "Last month" },
    { value: "upcoming", label: "Upcoming" },
    { value: "any", label: "All time" },
  ],
  multi: [
    { value: "online", label: "Online co-op" },
    { value: "local", label: "Local / split-screen" },
    { value: "pvp", label: "PvP" },
  ],
  vibes: [
    { value: "cozy", label: "Cozy" },
    { value: "story", label: "Story-rich" },
    { value: "hard", label: "Challenging" },
    { value: "short", label: "Short" },
    { value: "atmospheric", label: "Atmospheric" },
  ],
} as const;

const ERA_VALUES: readonly { value: string }[] = [
  ...CATALOG_FILTER_OPTIONS.eras,
  { value: "recent" },
];

function pickOption(
  value: string | null,
  options: readonly { value: string }[],
): string {
  return options.find((o) => o.value === value)?.value ?? "any";
}

function pickNumber(
  raw: string | null,
  min: number,
  max: number,
  fallback: number,
): number {
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function priceLabel(value: number): string {
  if (value === PRICE_MIN) return "Free";
  return `${PRICE_SYMBOL}${value}${value >= PRICE_MAX ? "+" : ""}`;
}

export function priceRangeLabel(min: number, max: number): string {
  if (max === PRICE_MIN) return "Free only";
  if (min === PRICE_MIN && max >= PRICE_MAX) return "Any price";
  return `${min === PRICE_MIN ? `${PRICE_SYMBOL}0` : priceLabel(min)} – ${priceLabel(max)}`;
}

export function yearRangeLabel(min: number, max: number): string {
  return min === max ? String(min) : `${min} – ${max}`;
}

export function isPriceRangeActive(filters: ExtraFilters): boolean {
  return filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX;
}

export function isYearRangeActive(filters: ExtraFilters): boolean {
  return filters.yearMin > YEAR_MIN || filters.yearMax < YEAR_MAX;
}

function pickList(
  raw: string | null,
  options: readonly { value: string }[],
): string[] {
  const wanted = (raw ?? "").split(",");
  return options.map((o) => o.value).filter((v) => wanted.includes(v));
}

export function parseExtraFilters(
  params: URLSearchParams,
): ExtraFilters {
  const priceMin = pickNumber(params.get("pmin"), PRICE_MIN, PRICE_MAX, PRICE_MIN);
  const priceMax = pickNumber(params.get("pmax"), PRICE_MIN, PRICE_MAX, PRICE_MAX);
  const yearMin = pickNumber(params.get("ymin"), YEAR_MIN, YEAR_MAX, YEAR_MIN);
  const yearMax = pickNumber(params.get("ymax"), YEAR_MIN, YEAR_MAX, YEAR_MAX);
  const preset = pickOption(params.get("era"), ERA_VALUES);
  const hasYears = yearMin > YEAR_MIN || yearMax < YEAR_MAX;
  return {
    priceMin: Math.min(priceMin, priceMax),
    priceMax: Math.max(priceMin, priceMax),
    onSale: params.get("sale") === "1",
    reviews: pickOption(params.get("reviews"), CATALOG_FILTER_OPTIONS.reviews),
    era: preset !== "any" ? preset : hasYears ? "range" : "any",
    yearMin: Math.min(yearMin, yearMax),
    yearMax: Math.max(yearMin, yearMax),
    multi: pickList(params.get("multi"), CATALOG_FILTER_OPTIONS.multi),
    vibe: pickList(params.get("vibe"), CATALOG_FILTER_OPTIONS.vibes),
    deck: params.get("deck") === "1",
    demo: params.get("demo") === "1",
  };
}

export function setExtraFilterParams(
  params: URLSearchParams,
  filters: ExtraFilters,
): void {
  if (filters.priceMin > PRICE_MIN) params.set("pmin", String(filters.priceMin));
  if (filters.priceMax < PRICE_MAX) params.set("pmax", String(filters.priceMax));
  if (filters.onSale) params.set("sale", "1");
  if (filters.reviews !== "any") params.set("reviews", filters.reviews);
  if (
    filters.era === "month" ||
    filters.era === "upcoming" ||
    filters.era === "recent"
  ) {
    params.set("era", filters.era);
  } else if (filters.era === "range") {
    if (filters.yearMin > YEAR_MIN) params.set("ymin", String(filters.yearMin));
    if (filters.yearMax < YEAR_MAX) params.set("ymax", String(filters.yearMax));
  }
  if (filters.multi.length > 0) params.set("multi", filters.multi.join(","));
  if (filters.vibe.length > 0) params.set("vibe", filters.vibe.join(","));
  if (filters.deck) params.set("deck", "1");
  if (filters.demo) params.set("demo", "1");
}

export function catalogFiltersActive(filters: CatalogFilterState): boolean {
  return (
    filters.genre !== "All" ||
    filters.mode !== "All" ||
    filters.players !== "All" ||
    filters.platform !== DEFAULT_PLATFORM ||
    filters.crossplayOnly ||
    extraFiltersActive(filters)
  );
}

export function extraFiltersActive(filters: ExtraFilters): boolean {
  return (
    isPriceRangeActive(filters) ||
    filters.onSale ||
    filters.reviews !== "any" ||
    filters.era !== "any" ||
    filters.multi.length > 0 ||
    filters.vibe.length > 0 ||
    filters.deck ||
    filters.demo
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
