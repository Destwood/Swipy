"use client";

import { useEffect, useState } from "react";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import type { Game } from "@/features/games/data/games";
import {
  hydrateSeedGamesFromIgdb,
  listLibraryGames,
} from "@/features/games/lib/game-library";
import { DeckSwipeStage } from "@/features/session/components/DeckSwipeStage";
import styles from "./SessionDeckClient.module.css";

export function DeckPreviewClient() {
  const [games, setGames] = useState<Game[]>([]);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void hydrateSeedGamesFromIgdb().finally(() => {
      setGames(listLibraryGames().slice(0, 16));
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <div className={styles.loading}>Loading deck…</div>;
  }

  const current = games[index];
  const next = games[index + 1];
  const remaining = games.length - index;

  function advance() {
    if (index >= games.length - 1) {
      setIndex(0);
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className={styles.root}>
      <div aria-hidden className={styles.glow} />

      <AppTopBar remainingLabel={current ? `${remaining} left` : "0 left"}>
        <div className={styles.topBarLeft}>
          <SwipyLogo size="bar" href="/" />
          <span className={styles.deckName}>Practice swipe</span>
        </div>
      </AppTopBar>

      {current ? (
        <DeckSwipeStage
          current={current}
          next={next}
          enabled
          onLike={advance}
          onSkip={advance}
        />
      ) : (
        <div className={styles.emptyPage}>
          <p className={styles.emptyText}>
            Add games to your library, then come back to practice swiping.
          </p>
        </div>
      )}
    </div>
  );
}
