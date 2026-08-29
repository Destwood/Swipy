"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/features/games/data/games";
import { CATALOG_PAGE_SIZE } from "@/features/games/lib/catalog-query";
import {
  ensureGamesInLibrary,
  upsertGames,
} from "@/features/games/lib/game-library";
import {
  EMPTY_IGNORE_LIST,
  gameIsIgnored,
  readIgnoreList,
  subscribeIgnoreList,
  type IgnoreList,
} from "@/features/games/lib/ignore-list";
import {
  EMPTY_INFINITE_FILTERS,
  filtersToKey,
  gameMatchesInfiniteFilters,
  infiniteFilterSearchParams,
  readInfiniteFilters,
  subscribeInfiniteFilters,
  type InfiniteFilterState,
} from "@/features/session/lib/infinite-filters";
import {
  patchInfiniteSession,
  readInfiniteSession,
} from "@/features/session/lib/infinite-session";

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
  const [filters, setFilters] = useState<InfiniteFilterState>(() =>
    typeof window !== "undefined" ? readInfiniteFilters() : EMPTY_INFINITE_FILTERS,
  );
  const [ignore, setIgnore] = useState<IgnoreList>(() =>
    typeof window !== "undefined" ? readIgnoreList() : EMPTY_IGNORE_LIST,
  );
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
      const filterKey = filtersToKey(filters);
      const saved = readInfiniteSession();
      const restoreIds =
        saved && saved.loadedGameIds.length > 0
          ? saved.loadedGameIds
          : saved?.votes.map((vote) => vote.gameId) ?? [];
      const hasSavedProgress = Boolean(
        saved &&
          (saved.votes.length > 0 ||
            saved.streamIndex > 0 ||
            saved.loadedGameIds.length > 0),
      );
      const canRestore =
        saved &&
        restoreIds.length > 0 &&
        (saved.filterKey === filterKey || hasSavedProgress);

      if (canRestore) {
        try {
          const loaded = await ensureGamesInLibrary(restoreIds);
          const byId = new Map(loaded.map((game) => [game.id, game]));
          const ordered = restoreIds
            .map((id) => byId.get(id))
            .filter((game): game is Game => Boolean(game));
          if (!controller.signal.aborted && ordered.length > 0) {
            setRawGames(ordered);
            setPage(saved.catalogPage ?? 1);
            setHasMore(saved.catalogHasMore ?? true);
            setLoading(false);
            return;
          }
        } catch {
          /* fall through to network fetch */
        }
      }

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
        patchInfiniteSession({
          catalogPage: 1,
          catalogHasMore: Boolean(data.next),
        });
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
        patchInfiniteSession({
          catalogPage: nextPage,
          catalogHasMore: Boolean(data.next) && results.length > 0,
        });
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
