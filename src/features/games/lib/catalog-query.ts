import type { CatalogFilterState } from "@/features/games/lib/catalog-filters";
import type { SortValue } from "@/features/games/lib/sort-games";

export const CATALOG_PAGE_SIZE = 24;

export function catalogSearchParams(input: {
  filters: CatalogFilterState;
  sort: SortValue;
  page: number;
  pageSize?: number;
  q?: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(input.page));
  params.set("page_size", String(input.pageSize ?? CATALOG_PAGE_SIZE));
  params.set("sort", input.sort);
  const q = input.q?.trim();
  if (q) params.set("q", q);
  if (input.filters.genre !== "All") params.set("genre", input.filters.genre);
  if (input.filters.mode !== "All") params.set("mode", input.filters.mode);
  if (input.filters.players !== "All") params.set("players", input.filters.players);
  if (input.filters.platform !== "All") params.set("platform", input.filters.platform);
  if (input.filters.crossplayOnly) params.set("crossplay", "1");
  return params;
}
