"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GameListRowSkeleton } from "@/features/games/components/GameListRowSkeleton";
import { LikedRow } from "@/features/games/components/LikedRow";
import type { Game } from "@/features/games/data/games";
import {
  hydrateFavoriteGames,
  listFavoriteGameIds,
  subscribeFavoriteGames,
  toggleFavoriteGame,
} from "@/features/games/lib/game-favorites";
import { getLibraryGamesByIds } from "@/features/games/lib/game-library";
import { gameIsIgnored } from "@/features/games/lib/ignore-list";
import { useIgnoreList } from "@/features/games/lib/use-ignore-list";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import styles from "./page.module.css";

export default function LikedPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [ready, setReady] = useState(false);
  const ignore = useIgnoreList();

  function reload() {
    setGames(
      getLibraryGamesByIds(listFavoriteGameIds()).filter(
        (game) =>
          !gameIsIgnored(game, {
            genres: ignore.genres,
            platforms: ignore.platforms,
          }),
      ),
    );
  }

  useEffect(() => {
    if (!ignore.ready) return;
    let cancelled = false;
    reload();
    void hydrateFavoriteGames().then(() => {
      if (cancelled) return;
      reload();
      setReady(true);
    });
    const unsub = subscribeFavoriteGames(reload);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void hydrateFavoriteGames().then(() => reload());
    });
    return () => {
      cancelled = true;
      unsub();
      subscription.unsubscribe();
    };
  }, [ignore.ready, ignore.genres, ignore.platforms]);

  function onRemove(id: string) {
    toggleFavoriteGame(id);
    reload();
  }

  return (
    <div className={styles.root}>
      <AppTopBar />

      <div className={styles.content}>
        <div className={styles.inner}>
          <PageBackLink href="/decks">← Decks</PageBackLink>
          <div className={styles.header}>
            <h1 className={styles.title}>Favorites</h1>
            <span className={styles.count}>
              {games.length} {games.length === 1 ? "game" : "games"}
            </span>
          </div>

          {(!ready || !ignore.ready) && games.length === 0 ? (
            <ul className={styles.list} aria-busy="true" aria-label="Loading favorites">
              {Array.from({ length: 6 }, (_, i) => (
                <GameListRowSkeleton key={`sk-${i}`} showAction />
              ))}
            </ul>
          ) : games.length === 0 ? (
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
