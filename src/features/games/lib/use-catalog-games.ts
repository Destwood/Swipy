"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/features/games/data/games";
import type { CatalogFilterState } from "@/features/games/lib/catalog-filters";
import { catalogSearchParams } from "@/features/games/lib/catalog-query";
import { upsertGames } from "@/features/games/lib/game-library";
import {
  EMPTY_IGNORE_LIST,
  gameIsIgnored,
  readIgnoreList,
  subscribeIgnoreList,
  type IgnoreList,
} from "@/features/games/lib/ignore-list";
import type { SortValue } from "@/features/games/lib/sort-games";
import { gameMatchesLibraryFilter } from "@/features/steam/lib/library-filter";
import { useLibraryFilter } from "@/features/steam/lib/use-steam";

type CatalogResponse = {
  results?: Game[];
  next?: boolean;
  error?: string;
};

const LOAD_TARGET = 15;
const MAX_ROUNDS = 6;
const LIBRARY_PAGES_PER_BATCH = 4;

export function useCatalogGames(
  filters: CatalogFilterState,
  sort: SortValue,
  query = "",
) {
  const [games, setGames] = useState<Game[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ignore, setIgnore] = useState<IgnoreList>(EMPTY_IGNORE_LIST);
  const libraryFilter = useLibraryFilter();
  const filterCtxRef = useRef({ ignore, libraryFilter });
  const cursorRef = useRef({ games: [] as Game[], page: 0, more: true, failed: false });
  const controllerRef = useRef<AbortController | null>(null);
  const criteriaRef = useRef<{ filters: CatalogFilterState; sort: SortValue; query: string } | null>(null);
  const effective = libraryFilter.mode === "hide-owned" ||
    (libraryFilter.mode === "only-owned" && libraryFilter.owned.size > 0) ||
    (libraryFilter.mode === "only-wishlist" && libraryFilter.wishlist.size > 0);
  const batch = effective && (
    libraryFilter.mode === "only-owned" || libraryFilter.mode === "only-wishlist"
  ) ? LIBRARY_PAGES_PER_BATCH : 1;

  const libraryKey = effective
    ? `${libraryFilter.mode}:${libraryFilter.owned.size}:${libraryFilter.wishlist.size}`
    : "off";

  useEffect(() => {
    filterCtxRef.current = { ignore, libraryFilter };
  }, [ignore, libraryFilter]);

  useEffect(() => {
    setIgnore(readIgnoreList());
    return subscribeIgnoreList(setIgnore);
  }, []);

  const matches = useCallback((game: Game) => {
    const ctx = filterCtxRef.current;
    return !gameIsIgnored(game, ctx.ignore) &&
      gameMatchesLibraryFilter(game, ctx.libraryFilter);
  }, []);

  const load = useCallback((target = LOAD_TARGET) => {
    const cursor = cursorRef.current;
    if (controllerRef.current || !cursor.more || cursor.failed) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const initial = cursor.page === 0;
    setLoading(initial);
    setLoadingMore(!initial);
    const before = cursor.games.filter(matches).length;

    void (async () => {
      try {
        for (let round = 0; round < (effective ? MAX_ROUNDS : 1); round++) {
          const pages = Array.from({ length: batch }, (_, i) => cursor.page + 1 + i);
          const responses = await Promise.allSettled(pages.map(async (page) => {
            const params = catalogSearchParams({ filters, sort, page, q: query });
            const res = await fetch(`/api/games?${params.toString()}`, {
              signal: controller.signal,
            });
            const data = (await res.json()) as CatalogResponse;
            if (!res.ok) throw new Error(data.error ?? "Could not load games");
            return { page, data };
          }));
          if (controller.signal.aborted) return;
          for (const response of responses) {
            if (response.status === "rejected") throw response.reason;
            const { page, data } = response.value;
            const results = data.results ?? [];
            const seen = new Set(cursor.games.map((game) => game.id));
            const unique = results.filter((game) => {
              if (seen.has(game.id)) return false;
              seen.add(game.id);
              return true;
            });
            upsertGames(results);
            cursor.games = [...cursor.games, ...unique];
            cursor.page = page;
            cursor.more = Boolean(data.next);
            setGames(cursor.games);
            setHasMore(cursor.more);
            if (!cursor.more) break;
          }
          if (!cursor.more || cursor.games.filter(matches).length - before >= target) break;
        }
      } catch (cause) {
        if (controller.signal.aborted) return;
        cursor.failed = true;
        setError(cause instanceof Error ? cause.message : "Network error - could not load games");
        controller.abort();
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    })();
  }, [filters, sort, query, effective, batch, matches]);

  useEffect(() => {
    const previous = criteriaRef.current;
    const reset = !previous || previous.filters !== filters || previous.sort !== sort || previous.query !== query;
    criteriaRef.current = { filters, sort, query };
    if (reset) {
      cursorRef.current = { games: [], page: 0, more: true, failed: false };
      setGames([]);
      setHasMore(true);
      setError(null);
      load();
    } else {
      setLoading(false);
      setLoadingMore(false);
      const visible = cursorRef.current.games.filter(matches).length;
      if (cursorRef.current.page === 0 || (effective && visible < LOAD_TARGET)) {
        load(LOAD_TARGET - visible);
      }
    }
    return () => {
      const controller = controllerRef.current;
      controllerRef.current = null;
      controller?.abort();
    };
  }, [filters, sort, query, libraryKey, effective, load, matches]);

  const loadMore = useCallback(() => load(), [load]);

  return {
    games: games.filter((game) =>
      !gameIsIgnored(game, ignore) && gameMatchesLibraryFilter(game, libraryFilter),
    ),
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  };
}
