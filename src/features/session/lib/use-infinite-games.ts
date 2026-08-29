"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/features/games/data/games";
import { CATALOG_PAGE_SIZE } from "@/features/games/lib/catalog-query";
import { upsertGames } from "@/features/games/lib/game-library";
import {
  EMPTY_IGNORE_LIST,
  gameIsIgnored,
  readIgnoreList,
  subscribeIgnoreList,
  type IgnoreList,
} from "@/features/games/lib/ignore-list";
import {
  EMPTY_INFINITE_FILTERS,
  gameMatchesInfiniteFilters,
  infiniteFilterSearchParams,
  readInfiniteFilters,
  subscribeInfiniteFilters,
  type InfiniteFilterState,
} from "@/features/session/lib/infinite-filters";

type CatalogResponse = {
  results?: Game[];
  next?: boolean;
  error?: string;
};

function filterGames(
  games: Game[],
  infinite: InfiniteFilterState,
  ignore: IgnoreList,
  banned: Set<string>,
) {
  return games.filter(
    (game) =>
      !banned.has(game.id) &&
      !gameIsIgnored(game, ignore) &&
      gameMatchesInfiniteFilters(game, infinite),
  );
}

export function useInfiniteGames(bannedIds: string[]) {
  const [filters, setFilters] = useState<InfiniteFilterState>(
    EMPTY_INFINITE_FILTERS,
  );
  const [ignore, setIgnore] = useState<IgnoreList>(EMPTY_IGNORE_LIST);
  const [rawGames, setRawGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);
  const bannedKey = bannedIds.join(",");

  useEffect(() => {
    setFilters(readInfiniteFilters());
    setIgnore(readIgnoreList());
    const unsubFilters = subscribeInfiniteFilters(setFilters);
    const unsubIgnore = subscribeIgnoreList(setIgnore);
    return () => {
      unsubFilters();
      unsubIgnore();
    };
  }, []);

  const games = filterGames(
    rawGames,
    filters,
    ignore,
    new Set(bannedIds),
  );

  useEffect(() => {
    const controller = new AbortController();
    setRawGames([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);
    loadingMoreRef.current = false;

    void (async () => {
      try {
        const params = infiniteFilterSearchParams(
          filters,
          1,
          CATALOG_PAGE_SIZE,
        );
        const res = await fetch(`/api/games?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as CatalogResponse;
        if (!res.ok) {
          setError(data.error ?? "Could not load games");
          setRawGames([]);
          setHasMore(false);
          return;
        }
        const results = data.results ?? [];
        upsertGames(results);
        setRawGames(results);
        setHasMore(Boolean(data.next));
      } catch {
        if (controller.signal.aborted) return;
        setError("Network error — could not load games");
        setRawGames([]);
        setHasMore(false);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [filters, ignore.genres, ignore.platforms]);

  const loadMore = useCallback(() => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    void (async () => {
      try {
        const params = infiniteFilterSearchParams(
          filters,
          nextPage,
          CATALOG_PAGE_SIZE,
        );
        const res = await fetch(`/api/games?${params.toString()}`);
        const data = (await res.json()) as CatalogResponse;
        if (!res.ok) {
          setError(data.error ?? "Could not load more games");
          setHasMore(false);
          return;
        }
        const results = data.results ?? [];
        upsertGames(results);
        setRawGames((prev) => {
          const seen = new Set(prev.map((game) => game.id));
          return [...prev, ...results.filter((game) => !seen.has(game.id))];
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
  }, [filters, page, hasMore, loading]);

  return {
    games,
    filters,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  };
}
