import type { Game } from "@/features/games/data/games";
import { IGNORE_GENRE_OPTIONS } from "@/features/games/lib/ignore-list";
import { gameHasGenre } from "@/features/games/lib/genre-label";

export type InfiniteFilterState = {
  genres: string[];
  platforms: string[];
  crossplayOnly: boolean;
};

export const INFINITE_GENRE_OPTIONS = IGNORE_GENRE_OPTIONS;

export const EMPTY_INFINITE_FILTERS: InfiniteFilterState = {
  genres: [],
  platforms: [],
  crossplayOnly: false,
};

const STORAGE_KEY = "swipy.infiniteFilters";
const CHANGE_EVENT = "swipy:infinite-filters";

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
    return {
      genres,
      platforms,
      crossplayOnly: parsed.crossplayOnly === true,
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
    filters.platforms.length > 0 ||
    filters.crossplayOnly
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
  if (filters.crossplayOnly && !game.crossplay) return false;
  return true;
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
  if (filters.crossplayOnly) params.set("crossplay", "1");
  return params;
}
