"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { LikedRow } from "@/features/games/components/LikedRow";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import type { Game } from "@/features/games/data/games";
import {
  listFavoriteGameIds,
  toggleFavoriteGame,
} from "@/features/games/lib/game-favorites";
import { getLibraryGamesByIds } from "@/features/games/lib/game-library";
import styles from "./page.module.css";

export default function LikedPage() {
  const [games, setGames] = useState<Game[]>([]);

  function reload() {
    setGames(getLibraryGamesByIds(listFavoriteGameIds()));
  }

  useEffect(() => {
    reload();
  }, []);

  function onRemove(id: string) {
    toggleFavoriteGame(id);
    reload();
  }

  return (
    <div className={styles.root}>
      <AppTopBar
        right={
          <span className={styles.countBadge}>
            {games.length} {games.length === 1 ? "favorite" : "favorites"}
          </span>
        }
      >
        <div className={styles.topBarLeft}>
          <Link
            href="/decks"
            aria-label="Back to decks"
            className={styles.backLink}
          >
            <ChevronLeftIcon width={14} height={14} aria-hidden />
            Back
          </Link>
          <div className={styles.divider} />
          <SwipyLogo size="bar" />
        </div>
      </AppTopBar>

      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <h1 className={styles.title}>Favorites</h1>
            <span className={styles.count}>
              {games.length} {games.length === 1 ? "game" : "games"}
            </span>
          </div>

          {games.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No favorites yet</p>
              <p className={styles.emptyText}>
                Star games while browsing or after a session to keep them here.
              </p>
              <Link href="/library" className={styles.emptyLink}>
                Browse games
              </Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {games.map((game) => (
                <LikedRow
                  key={game.id}
                  game={game}
                  onRemove={() => onRemove(game.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
