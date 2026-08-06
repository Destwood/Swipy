"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Deck } from "@/features/decks/data/decks";
import { deleteDeck, getDeckById } from "@/features/decks/lib/deck-store";
import type { Game } from "@/features/games/data/games";
import {
  ensureSeedLibrary,
  getLibraryGamesByIds,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import { FadeIn } from "@/shared/ui/FadeIn";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { UseInSessionDialog } from "@/features/session/components/UseInSessionDialog";
import { SteamGameTile } from "@/features/games/components/SteamGameTile";
import { normalizeGenreLabel } from "@/features/games/lib/genre-label";
import styles from "./DeckDetail.module.css";

type Props = {
  deckId: string;
};

export function DeckDetail({ deckId }: Props) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null | undefined>(undefined);
  const [games, setGames] = useState<Game[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await hydrateSeedGamesFromIgdb();
      if (cancelled) return;
      ensureSeedLibrary();
      const found = getDeckById(deckId);
      setDeck(found ?? null);
      setGames(found ? getLibraryGamesByIds(found.gameIds) : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  function onConfirmDelete() {
    if (!deck) return;
    if (!deleteDeck(deck.id)) return;
    setConfirmOpen(false);
    router.push("/decks");
  }

  if (deck === undefined) {
    return (
      <div className={styles.page}>
        <p className={styles.meta}>Loading…</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className={styles.page}>
        <Link href="/decks" className={styles.backLink}>
          ← Decks
        </Link>
        <div className={styles.missing}>
          <h1 className={styles.missingTitle}>Deck not found</h1>
          <p className={styles.missingText}>
            It may have been deleted or the link is outdated.
          </p>
          <Link href="/decks" className={styles.secondaryButton}>
            Back to decks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/decks" className={styles.backLink}>
        ← Decks
      </Link>

      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{deck.name}</h1>
          <p className={styles.meta}>
            {deck.gameIds.length} {deck.gameIds.length === 1 ? "game" : "games"}
            {deck.id.startsWith("custom-") ? " · custom" : " · seed"}
          </p>
          {deck.description ? (
            <p className={styles.description}>{deck.description}</p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => setUseOpen(true)} className={styles.primaryButton}>
            Use in session
          </button>
          <Link
            href={`/decks/${encodeURIComponent(deck.id)}/edit`}
            className={styles.secondaryButton}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={styles.dangerButton}
          >
            Delete
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete “${deck.name}”?`}
        description="This cannot be undone. The deck will be removed from your list."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
      />
      <UseInSessionDialog
        open={useOpen}
        deckId={deck.id}
        deckName={deck.name}
        onClose={() => setUseOpen(false)}
      />

      <h2 className={styles.sectionTitle}>Games in this deck</h2>

      {games.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No games yet</p>
          <p className={styles.emptyText}>Add games from the catalog to fill this deck.</p>
          <Link
            href={`/decks/${encodeURIComponent(deck.id)}/edit`}
            className={styles.secondaryButton}
          >
            Edit deck
          </Link>
        </div>
      ) : (
        <ul className={styles.grid}>
          {games.map((game, i) => (
            <FadeIn key={game.id} as="li" delayMs={Math.min(i, 16) * 28}>
              <SteamGameTile game={game} className={styles.tile}>
                <div className={styles.coverWrap}>
                  <Image
                    src={game.image}
                    alt=""
                    fill
                    className={styles.coverImage}
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
                    unoptimized={
                      game.image.includes("igdb") || game.image.includes("rawg")
                    }
                  />
                </div>
                <div className={styles.tileBody}>
                  <h3 className={styles.gameTitle}>{game.title}</h3>
                  <p className={styles.gameMeta}>
                    {game.year || "—"}
                    {game.genres[0]
                      ? ` · ${normalizeGenreLabel(game.genres[0])}`
                      : ""}
                    {game.steamAppId ? " · Steam" : ""}
                  </p>
                  <div className={styles.tileFooter}>
                    {game.genres[0] ? (
                      <span className={styles.tag}>
                        {normalizeGenreLabel(game.genres[0])}
                      </span>
                    ) : (
                      <span />
                    )}
                    {game.metacritic != null ? (
                      <span className={styles.score}>{game.metacritic}</span>
                    ) : null}
                  </div>
                </div>
              </SteamGameTile>
            </FadeIn>
          ))}
        </ul>
      )}
    </div>
  );
}
