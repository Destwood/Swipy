import type { Game } from "@/features/games/data/games";
import {
  CATALOG_FILTER_OPTIONS,
  DEFAULT_PLATFORM,
  EMPTY_EXTRA_FILTERS,
  extraFiltersActive,
  isPriceRangeActive,
  isSteamPlatforms,
  parseExtraFilters,
  priceRangeLabel,
  setExtraFilterParams,
  yearRangeLabel,
  type ExtraFilters,
} from "@/features/games/lib/catalog-filters";
import { IGNORE_GENRE_OPTIONS } from "@/features/games/lib/ignore-list";
import { gameHasGenre } from "@/features/games/lib/genre-label";

export type InfiniteFilterState = {
  genres: string[];
  platforms: string[];
  mode: string;
  players: string;
  crossplayOnly: boolean;
  skipSeen: boolean;
  extra: ExtraFilters;
};

export const INFINITE_GENRE_OPTIONS = IGNORE_GENRE_OPTIONS;

export const EMPTY_INFINITE_FILTERS: InfiniteFilterState = {
  genres: [],
  platforms: [DEFAULT_PLATFORM],
  mode: "All",
  players: "All",
  crossplayOnly: false,
  skipSeen: false,
  extra: EMPTY_EXTRA_FILTERS,
};

const STORAGE_KEY = "swipy.infiniteFilters";
const CHANGE_EVENT = "swipy:infinite-filters";

function matchesPlayers(game: Game, players: string): boolean {
  if (players === "All") return true;
  const max = game.coopMaxPlayers ?? 0;
  if (players === "2") return max === 2;
  if (players === "3–4") return max >= 3 && max <= 4;
  if (players === "5+") return max >= 5;
  return true;
}

function parseExtra(value: unknown): ExtraFilters {
  if (!value || typeof value !== "object") return EMPTY_EXTRA_FILTERS;
  const params = new URLSearchParams();
  setExtraFilterParams(params, {
    ...EMPTY_EXTRA_FILTERS,
    ...(value as Partial<ExtraFilters>),
  });
  return parseExtraFilters(params);
}

export function normalizeInfiniteFilters(
  filters: InfiniteFilterState,
): InfiniteFilterState {
  return isSteamPlatforms(filters.platforms)
    ? filters
    : { ...filters, extra: EMPTY_EXTRA_FILTERS };
}

function parse(raw: string | null): InfiniteFilterState {
  if (!raw) return EMPTY_INFINITE_FILTERS;
  try {
    const parsed = JSON.parse(raw) as Partial<InfiniteFilterState>;
    const genres = Array.isArray(parsed.genres)
      ? parsed.genres.filter((g): g is string => typeof g === "string")
      : [];
    const platforms = Array.isArray(parsed.platforms)
      ? parsed.platforms.filter((p): p is string => typeof p === "string")
      : [];
    const mode =
      typeof parsed.mode === "string" && parsed.mode.trim()
        ? parsed.mode
        : "All";
    const players =
      mode === "Co-op" &&
      typeof parsed.players === "string" &&
      parsed.players.trim()
        ? parsed.players
        : "All";
    return {
      genres,
      platforms,
      mode,
      players,
      crossplayOnly: parsed.crossplayOnly === true,
      skipSeen: parsed.skipSeen === true,
      extra: parseExtra(parsed.extra),
    };
  } catch {
    return EMPTY_INFINITE_FILTERS;
  }
}

export function readInfiniteFilters(): InfiniteFilterState {
  if (typeof window === "undefined") return EMPTY_INFINITE_FILTERS;
  try {
    return parse(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_INFINITE_FILTERS;
  }
}

export function writeInfiniteFilters(next: InfiniteFilterState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
}

export function subscribeInfiniteFilters(
  onChange: (next: InfiniteFilterState) => void,
) {
  function fromEvent(e: Event) {
    const detail = (e as CustomEvent<InfiniteFilterState>).detail;
    onChange(detail ?? readInfiniteFilters());
  }
  window.addEventListener(CHANGE_EVENT, fromEvent);
  return () => window.removeEventListener(CHANGE_EVENT, fromEvent);
}

export function sortActiveFirst<T extends string>(
  options: readonly T[],
  selected: readonly T[],
): T[] {
  const picked = new Set(selected);
  const active = options.filter((option) => picked.has(option));
  const inactive = options.filter((option) => !picked.has(option));
  return [...active, ...inactive];
}

export function infiniteFiltersActive(filters: InfiniteFilterState): boolean {
  return (
    filters.genres.length > 0 ||
    !isSteamPlatforms(filters.platforms) ||
    filters.mode !== "All" ||
    filters.players !== "All" ||
    filters.crossplayOnly ||
    filters.skipSeen ||
    extraFiltersActive(filters.extra)
  );
}

/** Match if the game lists any selected genre and any selected platform (OR within each group). */
export function gameMatchesInfiniteFilters(
  game: Game,
  filters: InfiniteFilterState,
): boolean {
  if (
    filters.genres.length > 0 &&
    !filters.genres.some((genre) => gameHasGenre(game, genre))
  ) {
    return false;
  }
  if (filters.platforms.length > 0) {
    const platforms = game.platforms ?? [];
    if (!filters.platforms.some((platform) => platforms.includes(platform))) {
      return false;
    }
  }
  if (filters.mode !== "All" && !(game.modes ?? []).includes(filters.mode)) {
    return false;
  }
  if (filters.mode === "Co-op" && !matchesPlayers(game, filters.players)) {
    return false;
  }
  if (filters.crossplayOnly && !game.crossplay) return false;
  return true;
}

export function filtersToKey(filters: InfiniteFilterState): string {
  const extra = new URLSearchParams();
  setExtraFilterParams(extra, {
    ...filters.extra,
    multi: [...filters.extra.multi].sort(),
    vibe: [...filters.extra.vibe].sort(),
  });
  extra.sort();
  return JSON.stringify({
    g: [...filters.genres].sort(),
    p: [...filters.platforms].sort(),
    m: filters.mode,
    n: filters.players,
    c: filters.crossplayOnly,
    k: filters.skipSeen,
    x: extra.toString(),
  });
}

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function extraLabelParts(extra: ExtraFilters): string[] {
  const parts: string[] = [];
  for (const value of extra.multi) {
    parts.push(optionLabel(CATALOG_FILTER_OPTIONS.multi, value));
  }
  for (const value of extra.vibe) {
    parts.push(optionLabel(CATALOG_FILTER_OPTIONS.vibes, value));
  }
  if (isPriceRangeActive(extra)) {
    parts.push(priceRangeLabel(extra.priceMin, extra.priceMax));
  }
  if (extra.onSale) parts.push("On sale");
  if (extra.reviews !== "any") {
    parts.push(optionLabel(CATALOG_FILTER_OPTIONS.reviews, extra.reviews));
  }
  if (extra.era === "range") {
    parts.push(yearRangeLabel(extra.yearMin, extra.yearMax));
  } else if (extra.era === "recent") {
    parts.push("New & upcoming");
  } else if (extra.era !== "any") {
    parts.push(optionLabel(CATALOG_FILTER_OPTIONS.eras, extra.era));
  }
  if (extra.demo) parts.push("Has demo");
  if (extra.deck) parts.push("Steam Deck");
  return parts;
}

export function infiniteFilterLabel(filters: InfiniteFilterState): string | null {
  if (!infiniteFiltersActive(filters)) return null;
  const parts: string[] = [];
  if (filters.mode !== "All") {
    const mode = CATALOG_FILTER_OPTIONS.modes.find(
      (item) => item.value === filters.mode,
    );
    parts.push(mode?.label ?? filters.mode);
  }
  if (filters.players !== "All") {
    const players = CATALOG_FILTER_OPTIONS.players.find(
      (item) => item.value === filters.players,
    );
    parts.push(players?.label ?? filters.players);
  }
  parts.push(...filters.platforms);
  if (filters.crossplayOnly) parts.push("Crossplay");
  if (filters.skipSeen) parts.push("Skip viewed");
  parts.push(...extraLabelParts(filters.extra));
  parts.push(...filters.genres);
  return parts.join(" · ");
}

export function infiniteFilterSearchParams(
  filters: InfiniteFilterState,
  page: number,
  pageSize: number,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("infinite", "1");
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  if (filters.genres.length > 0) {
    params.set("genres", filters.genres.join(","));
  }
  if (filters.platforms.length > 0) {
    params.set("platforms", filters.platforms.join(","));
  }
  if (filters.mode !== "All") params.set("mode", filters.mode);
  if (filters.mode === "Co-op" && filters.players !== "All") {
    params.set("players", filters.players);
  }
  if (filters.crossplayOnly) params.set("crossplay", "1");
  if (isSteamPlatforms(filters.platforms)) {
    setExtraFilterParams(params, filters.extra);
  }
  return params;
}
