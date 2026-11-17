"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import type { Game } from "@/features/games/data/games";
import {
  EMPTY_CATALOG_FILTERS,
  catalogFiltersActive,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import type { SortValue } from "@/features/games/lib/sort-games";
import { useCatalogGames } from "@/features/games/lib/use-catalog-games";
import { FadeIn } from "@/shared/ui/FadeIn";
import { useLoadingMoreSkeletonCount } from "@/shared/ui/use-loading-more-skeleton-count";
import { FiltersPanel } from "@/app/library/LibraryFilters";
import { LibraryCard } from "@/app/library/LibraryCard";
import { LibraryToolbar } from "@/app/library/LibraryToolbar";
import { parseLibraryUrl, serializeLibraryUrl } from "@/app/library/library-url";
import styles from "@/app/library/page.module.css";

function SkeletonTiles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <li key={`sk-${i}`} className={`${styles.gridItem} ${styles.skeletonTile} sw-shimmer`} aria-hidden />
      ))}
    </>
  );
}

const PIN_KEY = "swipy:library-filters-pinned";
const DESKTOP_QUERY = "(min-width: 1024px)";

function readPinned(): boolean {
  try {
    return window.localStorage.getItem(PIN_KEY) === "1";
  } catch {
    return false;
  }
}

function writePinned(value: boolean) {
  try {
    window.localStorage.setItem(PIN_KEY, value ? "1" : "0");
  } catch {}
}

function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

export function LibraryCatalog({
  syncUrl = false,
  renderCard,
}: {
  syncUrl?: boolean;
  renderCard?: (game: Game, index: number) => ReactNode;
}) {
  const [initial] = useState(() =>
    parseLibraryUrl(syncUrl ? window.location.search : ""),
  );
  const [filters, setFilters] = useState<CatalogFilterState>(initial.filters);
  const [sort, setSort] = useState<SortValue>(initial.sort);
  const [query, setQuery] = useState(initial.query);
  const [showTop, setShowTop] = useState(false);
  const [pinned, setPinned] = useState(readPinned);
  const isDesktop = useIsDesktop();
  const docked = pinned && isDesktop;
  const { games, loading, loadingMore, error, hasMore, loadMore } =
    useCatalogGames(filters, sort, query);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const moreSkeletonCount = useLoadingMoreSkeletonCount(
    gridRef,
    games.length,
    loadingMore,
  );

  useEffect(() => {
    if (!syncUrl) return;
    const search = serializeLibraryUrl({ filters, sort, query });
    const url = window.location.pathname + (search ? `?${search}` : "");
    window.history.replaceState(window.history.state, "", url);
  }, [filters, sort, query, syncUrl]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    function onScroll() {
      setShowTop(root!.scrollTop > 480);
    }

    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || !hasMore || loading || loadingMore || error) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { root, rootMargin: "800px 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [hasMore, loadMore, loading, loadingMore, error, games.length]);

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function togglePin() {
    const next = !pinned;
    setPinned(next);
    writePinned(next);
  }

  function resetAll() {
    setFilters(EMPTY_CATALOG_FILTERS);
    setQuery("");
  }

  const status = query
    ? loading
      ? `Searching “${query}”…`
      : `${games.length} results for “${query}”`
    : null;

  return (
    <>
      <div className={styles.body}>
      <div className={styles.content} ref={scrollRef}>
        <div className={styles.inner}>
          <div className={styles.toolbar}>
            <LibraryToolbar
              query={query}
              onQueryChange={setQuery}
              filters={filters}
              onFiltersChange={setFilters}
              sort={sort}
              onSortChange={setSort}
              disabled={loading && !loadingMore}
              resultCount={games.length}
              resultHasMore={hasMore}
              resultLoading={loading}
              docked={docked}
              canPin={isDesktop}
              onTogglePin={togglePin}
            />
          </div>

          {status ? <p className={styles.count}>{status}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          {loading ? (
            <ul
              className={`${styles.grid} ${docked ? styles.gridDocked : ""}`}
              aria-busy="true"
              aria-label="Loading games"
            >
              <SkeletonTiles count={24} />
            </ul>
          ) : games.length === 0 && !hasMore && !error ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No games found</p>
              <p className={styles.emptyText}>
                Try different filters or search words.
              </p>
              {catalogFiltersActive(filters) || query ? (
                <button
                  type="button"
                  className={styles.emptyAction}
                  onClick={resetAll}
                >
                  Reset filters
                </button>
              ) : null}
            </div>
          ) : (
            <ul
              ref={gridRef}
              className={`${styles.grid} ${docked ? styles.gridDocked : ""}`}
              aria-busy={loadingMore}
            >
              {games.map((game, i) => (
                <FadeIn
                  key={game.id}
                  as="li"
                  className={styles.gridItem}
                  delayMs={
                    loadingMore || i >= 24 ? 0 : Math.min(i, 12) * 18
                  }
                >
                  {renderCard ? (
                    renderCard(game, i)
                  ) : (
                    <LibraryCard game={game} priority={i < 8} />
                  )}
                </FadeIn>
              ))}
              {loadingMore ? <SkeletonTiles count={moreSkeletonCount} /> : null}
              {hasMore ? (
                <li ref={sentinelRef} className={styles.sentinel} aria-hidden />
              ) : null}
            </ul>
          )}
        </div>
      </div>
      {docked ? (
        <aside className={styles.dock} aria-label="Filters">
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            docked
            canPin
            onTogglePin={togglePin}
          />
        </aside>
      ) : null}
      </div>

      {showTop ? (
        <button
          type="button"
          className={styles.toTop}
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ChevronLeftIcon className={styles.toTopIcon} aria-hidden />
        </button>
      ) : null}
    </>
  );
}
