"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GameHoverPreview } from "@/features/games/components/GameHoverPreview";
import { SteamGameTile } from "@/features/games/components/SteamGameTile";
import {
  CATALOG_FILTER_SHELL,
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import { normalizeGenreLabel } from "@/features/games/lib/genre-label";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import type { SortValue } from "@/features/games/lib/sort-games";
import { useCatalogGames } from "@/features/games/lib/use-catalog-games";
import { CatalogFilterBar } from "@/shared/ui/CatalogFilterBar";
import { FadeIn } from "@/shared/ui/FadeIn";
import styles from "./page.module.css";

function SkeletonTiles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <li key={`sk-${i}`} className={styles.skeletonTile} aria-hidden>
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
  const { games, loading, loadingMore, error, hasMore, loadMore } =
    useCatalogGames(filters, sort);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);

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

  const status = loading
    ? "Loading popular games…"
    : loadingMore
      ? `Showing ${games.length}…`
      : `Showing ${games.length}`;

  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content} ref={scrollRef}>
        <div className={styles.inner}>
          <FadeIn className={styles.toolbar}>
            <CatalogFilterBar
              filters={filters}
              onChange={setFilters}
              genres={CATALOG_FILTER_SHELL.genres}
              modes={CATALOG_FILTER_SHELL.modes}
              players={CATALOG_FILTER_SHELL.players}
              platforms={CATALOG_FILTER_SHELL.platforms}
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
            <ul className={styles.grid} aria-busy={loadingMore}>
              {games.map((game, i) => (
                <FadeIn
                  key={game.id}
                  as="li"
                  delayMs={i < 24 ? Math.min(i, 16) * 28 : 0}
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
                          unoptimized={
                            game.image.includes("igdb") ||
                            game.image.includes("rawg")
                          }
                        />
                        {game.metacritic != null ? (
                          <span className={styles.score}>{game.metacritic}</span>
                        ) : null}
                      </div>
                      <div className={styles.tileBody}>
                        <h2 className={styles.gameTitle}>{game.title}</h2>
                        <p className={styles.gameMeta}>
                          {game.year || "—"}
                          {game.genres[0]
                            ? ` · ${normalizeGenreLabel(game.genres[0])}`
                            : ""}
                          {game.steamAppId ? " · Steam" : ""}
                        </p>
                      </div>
                    </SteamGameTile>
                  </GameHoverPreview>
                </FadeIn>
              ))}
              {loadingMore ? <SkeletonTiles count={8} /> : null}
              {hasMore ? (
                <li ref={sentinelRef} className={styles.sentinel} aria-hidden />
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
