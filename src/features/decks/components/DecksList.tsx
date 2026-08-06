"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HeartIcon from "@/assets/icons/heart.svg";
import SearchIcon from "@/assets/icons/search.svg";
import type { Deck } from "@/features/decks/data/decks";
import { deleteDeck, listDecks } from "@/features/decks/lib/deck-store";
import {
  ensureSeedLibrary,
  getLibraryGamesByIds,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import { FadeIn } from "@/shared/ui/FadeIn";
import { FilterChip } from "@/shared/ui/FilterChip";
import { HoverLift } from "@/shared/ui/HoverLift";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { UseInSessionDialog } from "@/features/session/components/UseInSessionDialog";
import styles from "./DecksList.module.css";

const FAVORITES_KEY = "swipy.favoriteDeckIds";
const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop&auto=format";

type FilterTab = "all" | "favorites";

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

export function DecksList() {
  const [decks, setDecks] = useState<DeckView[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [hydrating, setHydrating] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<DeckView | null>(null);
  const [pendingUse, setPendingUse] = useState<DeckView | null>(null);

  function reload() {
    ensureSeedLibrary();
    setDecks(listDecks().map(toDeckView));
    setFavorites(readFavorites());
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await hydrateSeedGamesFromIgdb();
      if (cancelled) return;
      reload();
      setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  function onDelete(id: string) {
    if (!deleteDeck(id)) return;
    setPendingDelete(null);
    reload();
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
        open={Boolean(pendingUse)}
        deckId={pendingUse?.id ?? null}
        deckName={pendingUse?.name}
        onClose={() => setPendingUse(null)}
      />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Decks</h1>
          <p className={styles.subtitle}>
            {hydrating
              ? "Loading games from IGDB…"
              : `${decks.length} ${decks.length === 1 ? "deck" : "decks"} · ${totalGames} games total`}
          </p>
        </div>
        <Link href="/decks/new" className={styles.newButton}>
          <span className={styles.plusIcon} aria-hidden>
            +
          </span>
          New deck
        </Link>
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

      {filtered.length === 0 && search ? (
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
                onToggleFav={() => toggleFav(deck.id)}
                onDelete={() => setPendingDelete(deck)}
                onUse={() => setPendingUse(deck)}
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
  onToggleFav,
  onDelete,
  onUse,
}: {
  deck: DeckView;
  isFavorite: boolean;
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
          <button type="button" onClick={onUse} className={styles.useButton}>
            Use in session
          </button>
        </div>

        <div className={styles.cardActions}>
          <button
            type="button"
            aria-label={isFavorite ? "Unfavorite" : "Favorite"}
            onClick={onToggleFav}
            className={`${styles.iconButton} ${isFavorite ? styles.iconButtonFav : ""}`}
          >
            <HeartIcon className={styles.heartIcon} />
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
        <div className={styles.titleRow}>
          <h3 className={styles.cardTitle}>{deck.name}</h3>
          {isFavorite ? <HeartIcon className={styles.favDot} /> : null}
        </div>

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

        <div className={styles.cardFooter}>
          <span className={styles.meta}>
            {deck.gameIds.length} games
            {deck.id.startsWith("custom-") ? " · custom" : " · seed"}
          </span>
        </div>
      </Link>
    </HoverLift>
  );
}
