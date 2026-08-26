"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { catalogSearchParams } from "@/features/games/lib/catalog-query";
import { sortGames, type SortValue } from "@/features/games/lib/sort-games";
import { saveCustomDeck, updateDeck, getDeckById } from "@/features/decks/lib/deck-store";
import { FadeIn } from "@/shared/ui/FadeIn";
import { CatalogFilterBar } from "@/shared/ui/CatalogFilterBar";
import { HoverLift } from "@/shared/ui/HoverLift";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import { steamStoreAppUrl } from "@/features/games/lib/steam";
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
  const [results, setResults] = useState<Game[]>([]);
  const [draftQuery, setDraftQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiHint, setApiHint] = useState<string | null>(null);
  const [ready, setReady] = useState(!isEdit);
  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTERS);
  const [sort, setSort] = useState<SortValue>("popular");

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
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setApiHint(null);
      try {
        const params = catalogSearchParams({
          filters,
          sort,
          page: 1,
          pageSize: 48,
          q: activeQuery,
        });
        const res = await fetch(`/api/games?${params.toString()}`);
        const data = (await res.json()) as {
          results?: Game[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setApiHint(data.error ?? "IGDB unavailable");
          setResults([]);
          return;
        }
        const games = data.results ?? [];
        setResults(games);
        upsertGames(games);
      } catch {
        if (!cancelled) {
          setApiHint("Network error");
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeQuery, filters, sort]);

  function runSearch() {
    setActiveQuery(draftQuery.trim());
  }

  function clearSearch() {
    setDraftQuery("");
    setActiveQuery("");
  }

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

  const catalog = useMemo(
    () => (activeQuery ? sortGames(results, sort) : results),
    [results, activeQuery, sort],
  );

  const selectedCount = selected.length;

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
        <div className={styles.searchRow}>
          <input
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runSearch();
              }
            }}
            placeholder="Search games…"
            className={styles.searchInput}
            aria-label="Search games"
          />
          <Button
            type="button"
            onClick={runSearch}
            disabled={loading}
            variant={ButtonVariant.Soft}
            size={ButtonSize.Sm}
          >
            {loading ? "…" : "Search"}
          </Button>
          {activeQuery ? (
            <Button
              type="button"
              onClick={clearSearch}
              variant={ButtonVariant.Dark}
              size={ButtonSize.Sm}
            >
              Clear
            </Button>
          ) : null}
        </div>

        <div className={styles.filterToolbar}>
          <CatalogFilterBar
            filters={filters}
            onChange={setFilters}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        <span className={styles.catalogMeta}>
          {loading
            ? "Loading popular games…"
            : activeQuery
              ? `${catalog.length} results`
              : `${catalog.length} popular`}
        </span>
      </div>

      {apiHint && <p className={styles.apiHint}>{apiHint}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && catalog.length === 0 ? (
        <p className={styles.empty}>No games found. Try another search.</p>
      ) : (
        <ul className={styles.catalogGrid}>
          {catalog.map((game, i) => {
            const isOn = selected.includes(game.id);
            return (
              <FadeIn key={game.id} as="li" delayMs={Math.min(i, 20) * 22}>
                <HoverLift amount="sm" press>
                  <button
                    type="button"
                    onClick={(e) => {
                      if ((e.metaKey || e.ctrlKey) && game.steamAppId) {
                        e.preventDefault();
                        window.location.href = steamStoreAppUrl(game.steamAppId);
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
                          game.image.includes("igdb") || game.image.includes("rawg")
                        }
                      />
                      <span
                        className={`${styles.check} ${isOn ? styles.checkOn : ""}`}
                        aria-hidden
                      >
                        {isOn && <CheckIcon className={styles.checkIcon} />}
                      </span>
                      <div className={styles.cardFade} />
                      <span className={styles.cardTitle}>{game.title}</span>
                    </div>
                  </button>
                </HoverLift>
              </FadeIn>
            );
          })}
        </ul>
      )}
    </form>
  );
}
