import {
  CATALOG_FILTER_OPTIONS,
  DEFAULT_PLATFORM,
  EMPTY_CATALOG_FILTERS,
  parseExtraFilters,
  setExtraFilterParams,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import { SORT_OPTIONS, type SortValue } from "@/features/games/lib/sort-games";

export type LibraryUrlState = {
  filters: CatalogFilterState;
  sort: SortValue;
  query: string;
};

const DEFAULT_SORT: SortValue = "popular";
const MAX_QUERY_LENGTH = 80;

function pick(
  value: string | null,
  allowed: readonly string[],
  fallback: string,
): string {
  return value !== null && allowed.includes(value) ? value : fallback;
}

export function parseLibraryUrl(search: string): LibraryUrlState {
  const params = new URLSearchParams(search);
  const mode = pick(
    params.get("mode"),
    CATALOG_FILTER_OPTIONS.modes.map((m) => m.value),
    "All",
  );
  const players =
    mode === "Co-op"
      ? pick(
          params.get("players"),
          CATALOG_FILTER_OPTIONS.players.map((p) => p.value),
          "All",
        )
      : "All";

  return {
    filters: {
      genre: pick(params.get("genre"), CATALOG_FILTER_OPTIONS.genres, "All"),
      mode,
      players,
      platform: pick(
        params.get("platform"),
        ["All", ...CATALOG_FILTER_OPTIONS.platforms],
        DEFAULT_PLATFORM,
      ),
      crossplayOnly: params.get("crossplay") === "1",
      ...parseExtraFilters(params),
    },
    sort: pick(
      params.get("sort"),
      SORT_OPTIONS.map((o) => o.value),
      DEFAULT_SORT,
    ) as SortValue,
    query: (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH),
  };
}

export function serializeLibraryUrl(state: LibraryUrlState): string {
  const { filters, sort, query } = state;
  const params = new URLSearchParams();
  const q = query.trim();
  if (q) params.set("q", q);
  if (filters.genre !== EMPTY_CATALOG_FILTERS.genre) {
    params.set("genre", filters.genre);
  }
  if (filters.mode !== EMPTY_CATALOG_FILTERS.mode) {
    params.set("mode", filters.mode);
  }
  if (filters.mode === "Co-op" && filters.players !== EMPTY_CATALOG_FILTERS.players) {
    params.set("players", filters.players);
  }
  if (filters.platform !== DEFAULT_PLATFORM) {
    params.set("platform", filters.platform);
  }
  if (filters.crossplayOnly) params.set("crossplay", "1");
  setExtraFilterParams(params, filters);
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  return params.toString();
}
