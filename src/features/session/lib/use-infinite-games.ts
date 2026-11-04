"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/features/games/data/games";
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
  writeInfiniteFilters,
  type InfiniteFilterState,
} from "@/features/session/lib/infinite-filters";
import {
  patchInfiniteSession,
  readInfiniteSession,
} from "@/features/session/lib/infinite-session";
import { readSeenSkipSet } from "@/features/session/lib/seen-games";

export const INFINITE_PAGE_SIZE = 20;
export const INFINITE_PREFETCH_REMAINING = 10;

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
  frozen: Set<string>,
  skip: Set<string>,
) {
  return games.filter(
    (game) =>
      !banned.has(game.id) &&
      !gameIsIgnored(game, ignore) &&
      (frozen.has(game.id) ||
        (!skip.has(game.id) && gameMatchesInfiniteFilters(game, infinite))),
  );
}

function readSkipIds(filters: InfiniteFilterState): Set<string> {
  if (!filters.skipSeen) return new Set();
  return readSeenSkipSet(readInfiniteSession()?.id ?? "");
}

function readFrozenIds(): Set<string> {
  const saved = readInfiniteSession();
  if (!saved) return new Set();
  return new Set(saved.loadedGameIds.slice(0, saved.frozenCount ?? 0));
}

export function useInfiniteGames(bannedIds: string[]) {
  const [filters, setFilters] = useState<InfiniteFilterState>(() =>
    typeof window !== "undefined" ? readInfiniteFilters() : EMPTY_INFINITE_FILTERS,
  );
  const [ignore, setIgnore] = useState<IgnoreList>(() =>
    typeof window !== "undefined" ? readIgnoreList() : EMPTY_IGNORE_LIST,
  );
  const [frozen, setFrozen] = useState<Set<string>>(() =>
    typeof window !== "undefined" ? readFrozenIds() : new Set(),
  );
  const [skipIds, setSkipIds] = useState<Set<string>>(() =>
    typeof window !== "undefined" ? readSkipIds(readInfiniteFilters()) : new Set(),
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
    frozen,
    skipIds,
  );

  useEffect(() => {
    const controller = new AbortController();
    setSkipIds(readSkipIds(filters));
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
            setFrozen(
              new Set(restoreIds.slice(0, saved.frozenCount ?? 0)),
            );
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
          INFINITE_PAGE_SIZE,
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
        setFrozen(new Set());
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
          INFINITE_PAGE_SIZE,
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

  const applyFilters = useCallback(
    (next: InfiniteFilterState, seenIds: string[]) => {
      setFrozen(new Set(seenIds));
      setSkipIds(readSkipIds(next));
      setRawGames([]);
      setLoading(true);
      writeInfiniteFilters(next);
    },
    [],
  );

  return {
    games,
    filters,
    applyFilters,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  };
}
