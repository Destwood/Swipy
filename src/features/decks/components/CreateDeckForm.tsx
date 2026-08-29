"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CheckIcon from "@/assets/icons/check.svg";
import type { Game } from "@/features/games/data/games";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import {
  ensureSeedLibrary,
  getLibraryGamesByIds,
  upsertGames,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import {
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import { useCatalogGames } from "@/features/games/lib/use-catalog-games";
import type { SortValue } from "@/features/games/lib/sort-games";
import { saveCustomDeck, updateDeck, getDeckById } from "@/features/decks/lib/deck-store";
import { FadeIn } from "@/shared/ui/FadeIn";
import { CatalogFilterBar } from "@/shared/ui/CatalogFilterBar";
import { CatalogSearch } from "@/shared/ui/CatalogSearch";
import { HoverLift } from "@/shared/ui/HoverLift";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import { GamePriceBadge } from "@/features/games/components/GamePriceBadge";
import { normalizeGenreLabel } from "@/features/games/lib/genre-label";
import { openSteamStore } from "@/features/games/lib/steam";
import { useLoadingMoreSkeletonCount } from "@/shared/ui/use-loading-more-skeleton-count";
import styles from "./CreateDeckForm.module.css";

type Props = {
  deckId?: string;
};

export function CreateDeckForm({ deckId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(deckId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<Record<string, Game>>({});
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!isEdit);
  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTERS);
  const [sort, setSort] = useState<SortValue>("popular");
  const {
    games: catalog,
    loading,
    loadingMore,
    error: catalogError,
    hasMore,
    loadMore,
  } = useCatalogGames(filters, sort, activeQuery);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const moreSkeletonCount = useLoadingMoreSkeletonCount(
    gridRef,
    catalog.length,
    loadingMore,
  );

  useEffect(() => {
    ensureSeedLibrary();
    void hydrateSeedGamesFromIgdb();

    if (!deckId) return;

    let cancelled = false;
    void (async () => {
      const deck = await getDeckById(deckId);
      if (cancelled) return;
      if (!deck) {
        setError("Deck not found.");
        setReady(true);
        return;
      }
      setName(deck.name);
      setDescription(deck.description ?? "");
      setSelected(deck.gameIds);
      const games = getLibraryGamesByIds(deck.gameIds);
      const map: Record<string, Game> = {};
      for (const g of games) map[g.id] = g;
      setSelectedGames(map);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore || loading) return;

    const root =
      target.closest<HTMLElement>("[data-deck-catalog-scroll]") ?? null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { root, rootMargin: "600px 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [hasMore, loadMore, loading, catalog.length]);

  function toggle(game: Game) {
    setSelected((prev) => {
      const on = prev.includes(game.id);
      if (on) {
        setSelectedGames((map) => {
          const next = { ...map };
          delete next[game.id];
          return next;
        });
        return prev.filter((x) => x !== game.id);
      }
      upsertGames([game]);
      setSelectedGames((map) => ({ ...map, [game.id]: game }));
      return [...prev, game.id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the deck a name.");
      return;
    }
    if (selected.length < 2) {
      setError("Pick at least 2 games.");
      return;
    }

    upsertGames(Object.values(selectedGames));
    try {
      if (deckId) {
        await updateDeck(deckId, { name, description, gameIds: selected });
        router.push(`/decks?updated=${deckId}`);
        return;
      }
      const deck = await saveCustomDeck({
        name,
        description,
        gameIds: selected,
      });
      router.push(`/decks?created=${deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the deck.");
    }
  }

  const selectedCount = selected.length;
  const status = loading
    ? activeQuery
      ? `Searching “${activeQuery}”…`
      : "Loading games…"
    : loadingMore
      ? `Showing ${catalog.length}…`
      : activeQuery
        ? `${catalog.length} results`
        : `${catalog.length} games`;

  if (!ready) {
    return <p className={styles.apiHint}>Loading deck…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Link href="/decks" className={styles.backLink}>
            ← Decks
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Deck name"
            className={styles.nameInput}
            aria-label="Deck name"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className={styles.descInput}
            aria-label="Description"
          />
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.selectedCount}>
            {selectedCount} selected
          </span>
          <Button type="submit" variant={ButtonVariant.Accent} size={ButtonSize.Sm}>
            {isEdit ? "Save changes" : "Save deck"}
          </Button>
        </div>
      </div>

      <div className={styles.searchBlock}>
        <CatalogSearch
          value={activeQuery}
          onChange={setActiveQuery}
          filters={filters}
          sort={sort}
          disabled={loading && !loadingMore}
        />

        <div className={styles.filterToolbar}>
          <CatalogFilterBar
            filters={filters}
            onChange={setFilters}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        <span className={styles.catalogMeta}>{status}</span>
      </div>

      {catalogError ? <p className={styles.apiHint}>{catalogError}</p> : null}
      {error && <p className={styles.error}>{error}</p>}

      {loading && catalog.length === 0 ? (
        <ul
          className={styles.catalogGrid}
          aria-busy="true"
          aria-label="Loading games"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <li
              key={`sk-${i}`}
              className={`${styles.skeletonCard} sw-shimmer`}
              aria-hidden
            />
          ))}
        </ul>
      ) : !loading && catalog.length === 0 ? (
        <p className={styles.empty}>No games found. Try another search.</p>
      ) : (
        <ul
          ref={gridRef}
          className={styles.catalogGrid}
          aria-busy={loading || loadingMore}
        >
          {catalog.map((game, i) => {
            const isOn = selected.includes(game.id);
            return (
              <FadeIn
                key={game.id}
                as="li"
                delayMs={loadingMore || i >= 24 ? 0 : Math.min(i, 12) * 18}
              >
                <HoverLift amount="sm" press>
                  <button
                    type="button"
                    onClick={(e) => {
                      if ((e.metaKey || e.ctrlKey) && game.steamAppId) {
                        e.preventDefault();
                        openSteamStore(game.steamAppId);
                        return;
                      }
                      toggle(game);
                    }}
                    aria-pressed={isOn}
                    aria-label={`${isOn ? "Remove" : "Add"} ${game.title}`}
                    title={
                      game.steamAppId
                        ? "Click to select · Ctrl/Cmd+click to open in Steam"
                        : undefined
                    }
                    className={`${styles.card} ${isOn ? styles.cardSelected : ""}`}
                  >
                    <div className={styles.coverWrap}>
                      <Image
                        src={gameCoverSrc(game.image, "tile")}
                        alt=""
                        fill
                        className={styles.cover}
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 12vw"
                        unoptimized={
                          game.image.includes("igdb") ||
                          game.image.includes("rawg")
                        }
                      />
                      <span
                        className={`${styles.check} ${isOn ? styles.checkOn : ""}`}
                        aria-hidden
                      >
                        {isOn && <CheckIcon className={styles.checkIcon} />}
                      </span>
                      <div className={styles.cardFade} />
                      <div className={styles.coverMeta}>
                        <span className={styles.cardTitle}>{game.title}</span>
                        <div className={styles.coverRow}>
                          <span className={styles.cardGenre}>
                            {game.genres[0]
                              ? normalizeGenreLabel(game.genres[0])
                              : ""}
                          </span>
                          <GamePriceBadge appId={game.steamAppId} size="xs" />
                        </div>
                      </div>
                    </div>
                  </button>
                </HoverLift>
              </FadeIn>
            );
          })}
          {loadingMore
            ? Array.from({ length: moreSkeletonCount }, (_, i) => (
                <li
                  key={`sk-${i}`}
                  className={`${styles.skeletonCard} sw-shimmer`}
                  aria-hidden
                />
              ))
            : null}
          {hasMore ? (
            <li ref={sentinelRef} className={styles.sentinel} aria-hidden />
          ) : null}
        </ul>
      )}
    </form>
  );
}
