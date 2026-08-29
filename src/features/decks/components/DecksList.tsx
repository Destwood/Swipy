"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import SearchIcon from "@/assets/icons/search.svg";
import StarIcon from "@/assets/icons/star.svg";
import StarOutlineIcon from "@/assets/icons/star-outline.svg";
import type { Deck } from "@/features/decks/data/decks";
import { deleteDeck, isUserDeck, listDecks } from "@/features/decks/lib/deck-store";
import { useAuthUser } from "@/features/auth/lib/use-auth-user";
import {
  ensureSeedLibrary,
  ensureGamesInLibrary,
  getLibraryGamesByIds,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import { FadeIn } from "@/shared/ui/FadeIn";
import { FilterChip } from "@/shared/ui/FilterChip";
import { HoverLift } from "@/shared/ui/HoverLift";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { toast } from "@/shared/ui/toast";
import { UseInSessionDialog } from "@/features/session/components/UseInSessionDialog";
import styles from "./DecksList.module.css";

const FAVORITES_KEY = "swipy.favoriteDeckIds";
const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop&auto=format";

type FilterTab = "all" | "favorites";

type DecksListProps = {
  mode?: "browse" | "pick";
  onPick?: (deckId: string) => void;
  pickHint?: string;
  back?: ReactNode;
};

type DeckView = Deck & {
  covers: string[];
  genres: string[];
};

function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeFavorites(ids: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
}

function toDeckView(deck: Deck): DeckView {
  const games = getLibraryGamesByIds(deck.gameIds);
  const byPopularity = [...games].sort((a, b) => {
    const scoreA = a.metacritic ?? -1;
    const scoreB = b.metacritic ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.title.localeCompare(b.title);
  });
  const covers = byPopularity.slice(0, 4).map((g) => g.image);
  while (covers.length < 4) covers.push(PLACEHOLDER_COVER);
  const genres = [
    ...new Set(byPopularity.flatMap((g) => g.genres).filter(Boolean)),
  ].slice(0, 3);
  return { ...deck, covers, genres };
}

export function DecksList({
  mode = "browse",
  onPick,
  pickHint,
  back,
}: DecksListProps) {
  const pickMode = mode === "pick";
  const { user, ready: authReady } = useAuthUser();
  const [decks, setDecks] = useState<DeckView[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [hydrating, setHydrating] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<DeckView | null>(null);
  const [pendingUse, setPendingUse] = useState<DeckView | null>(null);

  async function reload() {
    ensureSeedLibrary();
    const list = await listDecks();
    const allIds = [...new Set(list.flatMap((d) => d.gameIds))];
    if (allIds.length > 0) await ensureGamesInLibrary(allIds);
    setDecks(list.map(toDeckView));
    setFavorites(readFavorites());
  }

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    setHydrating(true);
    void (async () => {
      await hydrateSeedGamesFromIgdb();
      if (cancelled) return;
      await reload();
      if (!cancelled) setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id]);

  const totalGames = decks.reduce((n, d) => n + d.gameIds.length, 0);

  const filtered = useMemo(() => {
    let list = decks;
    if (filter === "favorites") {
      list = list.filter((d) => favorites.has(d.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.genres.some((g) => g.toLowerCase().includes(q)) ||
          (d.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [decks, filter, search, favorites]);

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeFavorites(next);
      return next;
    });
  }

  async function onDelete(id: string) {
    try {
      if (!(await deleteDeck(id))) {
        toast("Could not delete deck");
        return;
      }
      setPendingDelete(null);
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not delete deck");
    }
  }

  return (
    <div className={styles.page}>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete “${pendingDelete.name}”?` : "Delete deck?"}
        description="This cannot be undone. The deck will be removed from your list."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
        }}
      />
      <UseInSessionDialog
        open={!pickMode && Boolean(pendingUse)}
        deckId={pendingUse?.id ?? null}
        deckName={pendingUse?.name}
        onClose={() => setPendingUse(null)}
      />
      <div className={styles.header}>
        <div>
          {back}
          <h1 className={styles.title}>
            {pickMode ? "Select a deck" : "Decks"}
          </h1>
          <p className={styles.subtitle}>
            {hydrating
              ? "Loading games from IGDB…"
              : pickMode
                ? (pickHint ?? "Pick one deck for this session.")
                : `${decks.length} ${decks.length === 1 ? "deck" : "decks"} · ${totalGames} games total`}
          </p>
        </div>
        <Button href="/decks/new" variant={ButtonVariant.Accent}>
          <span className={styles.plusIcon} aria-hidden>
            +
          </span>
          New deck
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {(
            [
              { id: "all", label: "All decks" },
              { id: "favorites", label: "Favorites" },
            ] as const
          ).map((tab) => (
            <FilterChip
              key={tab.id}
              active={filter === tab.id}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
              {tab.id === "favorites" && favorites.size > 0 ? (
                <span className={styles.tabCount}>{favorites.size}</span>
              ) : null}
            </FilterChip>
          ))}
        </div>

        <label className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} aria-hidden />
          <input
            type="search"
            placeholder="Search decks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </label>
      </div>

      {hydrating || !authReady ? (
        <ul className={styles.grid} aria-busy="true" aria-label="Loading decks">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={`sk-${i}`} className={styles.skeletonCard} aria-hidden>
              <div className={styles.skeletonMosaic}>
                <div className={`${styles.skeletonCell} sw-shimmer`} />
                <div className={`${styles.skeletonCell} sw-shimmer`} />
                <div className={`${styles.skeletonCell} sw-shimmer`} />
                <div className={`${styles.skeletonCell} sw-shimmer`} />
              </div>
              <div className={styles.skeletonBody}>
                <div className={`${styles.skeletonTitle} sw-shimmer`} />
                <div className={styles.skeletonTags}>
                  <div className={`${styles.skeletonTag} sw-shimmer`} />
                  <div className={`${styles.skeletonTag} sw-shimmer`} />
                </div>
                <div className={`${styles.skeletonMeta} sw-shimmer`} />
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 && search ? (
        <div className={styles.emptySearch}>
          <p className={styles.emptyTitle}>No decks match “{search}”</p>
          <p className={styles.emptyText}>Try a different name or genre.</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className={styles.clearSearch}
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {filtered.map((deck, i) => (
            <FadeIn key={deck.id} as="li" delayMs={Math.min(i, 12) * 40}>
              <DeckCard
                deck={deck}
                isFavorite={favorites.has(deck.id)}
                ctaLabel={pickMode ? "Select" : "Use in session"}
                onToggleFav={() => toggleFav(deck.id)}
                onDelete={() => setPendingDelete(deck)}
                onUse={() => {
                  if (pickMode) {
                    onPick?.(deck.id);
                    return;
                  }
                  setPendingUse(deck);
                }}
              />
            </FadeIn>
          ))}
          {!search ? (
            <FadeIn as="li" delayMs={Math.min(filtered.length, 12) * 40}>
              <HoverLift amount="md" className={styles.createLift}>
                <Link href="/decks/new" className={styles.createCard}>
                  <span className={styles.createIcon}>+</span>
                  <span className={styles.createTitle}>New deck</span>
                  <span className={styles.createHint}>Pick games from the catalog</span>
                </Link>
              </HoverLift>
            </FadeIn>
          ) : null}
        </ul>
      )}
    </div>
  );
}

function DeckCard({
  deck,
  isFavorite,
  ctaLabel,
  onToggleFav,
  onDelete,
  onUse,
}: {
  deck: DeckView;
  isFavorite: boolean;
  ctaLabel: string;
  onToggleFav: () => void;
  onDelete: () => void;
  onUse: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <HoverLift
      as="article"
      amount="md"
      className={styles.card}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div className={styles.mosaic}>
        {deck.covers.map((src, i) => (
          <div key={`${deck.id}-${i}`} className={styles.mosaicCell}>
            <Image
              src={src}
              alt=""
              fill
              className={styles.mosaicImage}
              sizes="160px"
              unoptimized={src.includes("igdb") || src.includes("rawg")}
            />
          </div>
        ))}

        <div className={styles.hoverCta}>
          <Button
            type="button"
            onClick={onUse}
            variant={ButtonVariant.Accent}
            size={ButtonSize.Sm}
            className={styles.useButton}
          >
            {ctaLabel}
          </Button>
        </div>

        <div className={styles.cardActions}>
          <button
            type="button"
            aria-label={isFavorite ? "Unfavorite" : "Favorite"}
            onClick={onToggleFav}
            className={`${styles.iconButton} ${styles.favButton} ${isFavorite ? styles.iconButtonFav : ""}`}
          >
            {isFavorite ? (
              <StarIcon className={styles.favIcon} />
            ) : (
              <StarOutlineIcon className={styles.favIcon} />
            )}
          </button>

          <div className={styles.menuWrap}>
            <button
              type="button"
              aria-label="More"
              onClick={() => setMenuOpen((v) => !v)}
              className={styles.iconButton}
            >
              ···
            </button>
            {menuOpen ? (
              <div className={styles.menu}>
                <Link
                  href={`/decks/${encodeURIComponent(deck.id)}`}
                  className={styles.menuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  Open
                </Link>
                <Link
                  href={`/decks/${encodeURIComponent(deck.id)}/edit`}
                  className={styles.menuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className={styles.menuDanger}
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Link
        href={`/decks/${encodeURIComponent(deck.id)}`}
        className={styles.cardBody}
      >
        <div className={styles.titleSlot}>
          <div className={styles.titleRow}>
            <h3 className={styles.cardTitle}>{deck.name}</h3>
            {isFavorite ? <StarIcon className={styles.favDot} /> : null}
          </div>
        </div>

        <div className={styles.tagsSlot}>
          {deck.genres.length > 0 ? (
            <div className={styles.tags}>
              {deck.genres.map((g, i) => (
                <span
                  key={g}
                  className={`${styles.tag} ${i === 0 ? styles.tagAccent : ""}`}
                >
                  {g}
                </span>
              ))}
            </div>
          ) : deck.description ? (
            <p className={styles.cardDesc}>{deck.description}</p>
          ) : null}
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.meta}>
            {deck.gameIds.length} games
            {isUserDeck(deck) ? " · custom" : " · seed"}
          </span>
        </div>
      </Link>
    </HoverLift>
  );
}
