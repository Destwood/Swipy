"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/features/games/data/games";
import type { CatalogFilterState } from "@/features/games/lib/catalog-filters";
import {
  CATALOG_PAGE_SIZE,
  catalogSearchParams,
} from "@/features/games/lib/catalog-query";
import { upsertGames } from "@/features/games/lib/game-library";
import type { SortValue } from "@/features/games/lib/sort-games";

type CatalogResponse = {
  results?: Game[];
  next?: boolean;
  error?: string;
};

export function useCatalogGames(
  filters: CatalogFilterState,
  sort: SortValue,
  query = "",
) {
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setGames([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);
    loadingMoreRef.current = false;

    void (async () => {
      try {
        const params = catalogSearchParams({
          filters,
          sort,
          page: 1,
          q: query,
        });
        const res = await fetch(`/api/games?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as CatalogResponse;
        if (!res.ok) {
          setError(data.error ?? "Could not load games");
          setGames([]);
          setHasMore(false);
          return;
        }
        const results = data.results ?? [];
        upsertGames(results);
        setGames(results);
        setHasMore(Boolean(data.next));
      } catch {
        if (controller.signal.aborted) return;
        setError("Network error — could not load games");
        setGames([]);
        setHasMore(false);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [filters, sort, query]);

  const loadMore = useCallback(() => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    void (async () => {
      try {
        const params = catalogSearchParams({
          filters,
          sort,
          page: nextPage,
          q: query,
        });
        const res = await fetch(`/api/games?${params.toString()}`);
        const data = (await res.json()) as CatalogResponse;
        if (!res.ok) {
          setError(data.error ?? "Could not load more games");
          setHasMore(false);
          return;
        }
        const results = data.results ?? [];
        upsertGames(results);
        setGames((prev) => {
          const seen = new Set(prev.map((g) => g.id));
          return [...prev, ...results.filter((g) => !seen.has(g.id))];
        });
        setPage(nextPage);
        setHasMore(Boolean(data.next) && results.length > 0);
      } catch {
        setError("Network error — could not load more games");
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    })();
  }, [filters, sort, query, page, hasMore, loading]);

  return { games, loading, loadingMore, error, hasMore, loadMore };
}
