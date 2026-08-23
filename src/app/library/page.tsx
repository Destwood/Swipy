"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import type { Game } from "@/features/games/data/games";
import { upsertGames } from "@/features/games/lib/game-library";
import {
  collectCatalogFilterStats,
  EMPTY_CATALOG_FILTERS,
  gameMatchesCatalogFilters,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import { normalizeGenreLabel } from "@/features/games/lib/genre-label";
import { sortGames, type SortValue } from "@/features/games/lib/sort-games";
import { SteamGameTile } from "@/features/games/components/SteamGameTile";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import { CatalogFilterBar } from "@/shared/ui/CatalogFilterBar";
import { FadeIn } from "@/shared/ui/FadeIn";
import styles from "./page.module.css";

export default function LibraryPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTERS);
  const [sort, setSort] = useState<SortValue>("popular");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page_size: "48" });
        const res = await fetch(`/api/games?${params.toString()}`);
        const data = (await res.json()) as { results?: Game[]; error?: string };
        if (!res.ok) {
          if (!cancelled) {
            setError(data.error ?? "Could not load popular games");
            setGames([]);
          }
          return;
        }
        const results = data.results ?? [];
        upsertGames(results);
        if (!cancelled) setGames(results);
      } catch {
        if (!cancelled) {
          setError("Network error — could not load games");
          setGames([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => collectCatalogFilterStats(games, filters),
    [games, filters],
  );

  const filtered = useMemo(() => {
    const base = games.filter((g) => gameMatchesCatalogFilters(g, filters));
    return sortGames(base, sort);
  }, [games, filters, sort]);

  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content}>
        <div className={styles.inner}>
          <FadeIn className={styles.toolbar}>
            <CatalogFilterBar
              filters={filters}
              onChange={setFilters}
              genres={stats.genres}
              modes={stats.modes}
              players={stats.players}
              platforms={stats.platforms}
              crossplayCount={stats.crossplayCount}
              totalCount={games.length}
              sort={sort}
              onSortChange={setSort}
            />
          </FadeIn>

          <p className={styles.count}>
            {loading
              ? "Loading popular games…"
              : `${filtered.length} ${filtered.length === 1 ? "game" : "games"}`}
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}

          {!loading && filtered.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No games found</p>
              <p className={styles.emptyText}>
                Try another filter, or check IGDB credentials.
              </p>
            </div>
          ) : (
            <ul className={styles.grid}>
              {filtered.map((game, i) => (
                <FadeIn key={game.id} as="li" delayMs={Math.min(i, 16) * 28}>
                  <SteamGameTile game={game} className={styles.tile}>
                    <div className={styles.coverWrap}>
                      <Image
                        src={gameCoverSrc(game.image, "tile")}
                        alt=""
                        fill
                        className={styles.coverImage}
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw"
                        unoptimized={
                          game.image.includes("igdb") || game.image.includes("rawg")
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
                </FadeIn>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
