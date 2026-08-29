"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GameHoverPreview } from "@/features/games/components/GameHoverPreview";
import { GamePriceBadge } from "@/features/games/components/GamePriceBadge";
import { MetacriticBadge } from "@/features/games/components/MetacriticBadge";
import { SteamGameTile } from "@/features/games/components/SteamGameTile";
import {
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import { normalizeGenreLabel } from "@/features/games/lib/genre-label";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import type { SortValue } from "@/features/games/lib/sort-games";
import { useCatalogGames } from "@/features/games/lib/use-catalog-games";
import { CatalogFilterBar } from "@/shared/ui/CatalogFilterBar";
import { CatalogSearch } from "@/shared/ui/CatalogSearch";
import { FadeIn } from "@/shared/ui/FadeIn";
import { useLoadingMoreSkeletonCount } from "@/shared/ui/use-loading-more-skeleton-count";
import styles from "./page.module.css";

function SkeletonTiles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <li key={`sk-${i}`} className={`${styles.gridItem} ${styles.skeletonTile}`} aria-hidden>
          <div className={`${styles.skeletonCover} sw-shimmer`} />
          <div className={styles.tileBody}>
            <div className={`${styles.skeletonTitle} sw-shimmer`} />
            <div className={`${styles.skeletonMeta} sw-shimmer`} />
          </div>
        </li>
      ))}
    </>
  );
}

export default function LibraryPage() {
  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTERS);
  const [sort, setSort] = useState<SortValue>("popular");
  const [query, setQuery] = useState("");
  const [showTop, setShowTop] = useState(false);
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
    if (!root || !target || !hasMore || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { root, rootMargin: "800px 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [hasMore, loadMore, loading, games.length]);

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const status = loading
    ? query
      ? `Searching “${query}”…`
      : "Loading popular games…"
    : loadingMore
      ? `Showing ${games.length}…`
      : query
        ? `${games.length} results for “${query}”`
        : `Showing ${games.length}`;

  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content} ref={scrollRef}>
        <div className={styles.inner}>
          <FadeIn className={styles.toolbar}>
            <CatalogSearch
              value={query}
              onChange={setQuery}
              filters={filters}
              sort={sort}
              disabled={loading && !loadingMore}
            />
            <CatalogFilterBar
              filters={filters}
              onChange={setFilters}
              sort={sort}
              onSortChange={setSort}
            />
          </FadeIn>

          <p className={styles.count}>{status}</p>
          {error ? <p className={styles.error}>{error}</p> : null}

          {loading ? (
            <ul className={styles.grid} aria-busy="true" aria-label="Loading games">
              <SkeletonTiles count={24} />
            </ul>
          ) : games.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No games found</p>
              <p className={styles.emptyText}>
                Try another filter, or check IGDB credentials.
              </p>
            </div>
          ) : (
            <ul ref={gridRef} className={styles.grid} aria-busy={loadingMore}>
              {games.map((game, i) => (
                <FadeIn
                  key={game.id}
                  as="li"
                  className={styles.gridItem}
                  delayMs={
                    loadingMore || i >= 24 ? 0 : Math.min(i, 12) * 18
                  }
                >
                  <GameHoverPreview game={game}>
                    <SteamGameTile game={game} className={styles.tile}>
                      <div className={styles.coverWrap}>
                        <Image
                          src={gameCoverSrc(game.image, "tile")}
                          alt=""
                          fill
                          className={styles.coverImage}
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw"
                          priority={i < 8}
                          unoptimized={
                            game.image.includes("igdb") ||
                            game.image.includes("rawg")
                          }
                        />
                        {game.metacritic != null ? (
                          <MetacriticBadge score={game.metacritic} />
                        ) : null}
                      </div>
                      <div className={styles.tileBody}>
                        <h2 className={styles.gameTitle}>{game.title}</h2>
                        <div className={styles.metaRow}>
                          <p className={styles.gameMeta}>
                            {game.year || "—"}
                            {game.genres[0]
                              ? ` · ${normalizeGenreLabel(game.genres[0])}`
                              : ""}
                          </p>
                          <GamePriceBadge appId={game.steamAppId} size="xs" />
                        </div>
                      </div>
                    </SteamGameTile>
                  </GameHoverPreview>
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
    </div>
  );
}
