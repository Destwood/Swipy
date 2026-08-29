"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Deck } from "@/features/decks/data/decks";
import { deleteDeck, getDeckById, isUserDeck } from "@/features/decks/lib/deck-store";
import type { Game } from "@/features/games/data/games";
import {
  ensureSeedLibrary,
  ensureGamesInLibrary,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import { FadeIn } from "@/shared/ui/FadeIn";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { toast } from "@/shared/ui/toast";
import { UseInSessionDialog } from "@/features/session/components/UseInSessionDialog";
import { GamePriceBadge } from "@/features/games/components/GamePriceBadge";
import { MetacriticBadge } from "@/features/games/components/MetacriticBadge";
import { SteamGameTile } from "@/features/games/components/SteamGameTile";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import { normalizeGenreLabel } from "@/features/games/lib/genre-label";
import styles from "./DeckDetail.module.css";

type Props = {
  deckId: string;
};

function GamesSkeleton({ count }: { count: number }) {
  return (
    <ul className={styles.grid} aria-busy="true" aria-label="Loading games">
      {Array.from({ length: count }, (_, i) => (
        <li key={`sk-${i}`} className={styles.skeletonTile} aria-hidden>
          <div className={`${styles.skeletonCover} sw-shimmer`} />
          <div className={styles.tileBody}>
            <div className={`${styles.skeletonTitle} sw-shimmer`} />
            <div className={`${styles.skeletonMeta} sw-shimmer`} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DeckDetail({ deckId }: Props) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null | undefined>(undefined);
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDeck(undefined);
    setGames([]);
    setGamesLoading(true);

    void (async () => {
      await hydrateSeedGamesFromIgdb();
      if (cancelled) return;
      ensureSeedLibrary();
      const found = await getDeckById(deckId);
      if (cancelled) return;

      if (!found) {
        setDeck(null);
        setGames([]);
        setGamesLoading(false);
        return;
      }

      setDeck(found);
      const loaded = await ensureGamesInLibrary(found.gameIds);
      if (cancelled) return;
      setGames(loaded);
      setGamesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [deckId]);

  async function onConfirmDelete() {
    if (!deck) return;
    try {
      if (!(await deleteDeck(deck.id))) {
        toast("Could not delete deck");
        return;
      }
      setConfirmOpen(false);
      router.push("/decks");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not delete deck");
    }
  }

  if (deck === undefined) {
    return (
      <div className={styles.page}>
        <Link href="/decks" className={styles.backLink}>
          ← Decks
        </Link>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <div className={`${styles.skeletonHeading} sw-shimmer`} />
            <div className={`${styles.skeletonSub} sw-shimmer`} />
          </div>
        </div>
        <h2 className={styles.sectionTitle}>Games in this deck</h2>
        <GamesSkeleton count={16} />
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
          <Button href="/decks" variant={ButtonVariant.Dark} size={ButtonSize.Sm}>
            Back to decks
          </Button>
        </div>
      </div>
    );
  }

  const skeletonCount = Math.min(24, Math.max(8, deck.gameIds.length || 12));

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
            {isUserDeck(deck) ? " · custom" : " · seed"}
          </p>
          {deck.description ? (
            <p className={styles.description}>{deck.description}</p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <Button
            type="button"
            onClick={() => setUseOpen(true)}
            variant={ButtonVariant.Accent}
            size={ButtonSize.Sm}
          >
            Use in session
          </Button>
          <Button
            href={`/decks/${encodeURIComponent(deck.id)}/edit`}
            variant={ButtonVariant.Dark}
            size={ButtonSize.Sm}
          >
            Edit
          </Button>
          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            variant={ButtonVariant.Danger}
            size={ButtonSize.Sm}
          >
            Delete
          </Button>
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

      {gamesLoading ? (
        <GamesSkeleton count={skeletonCount} />
      ) : games.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No games yet</p>
          <p className={styles.emptyText}>
            Add games from the catalog to fill this deck.
          </p>
          <Button
            href={`/decks/${encodeURIComponent(deck.id)}/edit`}
            variant={ButtonVariant.Dark}
            size={ButtonSize.Sm}
          >
            Edit deck
          </Button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {games.map((game, i) => (
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
                    <MetacriticBadge score={game.metacritic} />
                  ) : null}
                </div>
                <div className={styles.tileBody}>
                  <h3 className={styles.gameTitle}>{game.title}</h3>
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
            </FadeIn>
          ))}
        </ul>
      )}
    </div>
  );
}
