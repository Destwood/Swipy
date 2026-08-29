"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { IgnoredRow } from "@/features/games/components/IgnoredRow";
import type { Game } from "@/features/games/data/games";
import {
  ensureGamesInLibrary,
  getLibraryGamesByIds,
} from "@/features/games/lib/game-library";
import { useIgnoredGames } from "@/features/games/lib/use-ignored-games";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import styles from "./page.module.css";

export default function IgnoredGamesPage() {
  const ignored = useIgnoredGames();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const ids = ignored.entries.map((row) => row.gameId);
    if (ids.length === 0) {
      setGames([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      await ensureGamesInLibrary(ids);
      if (cancelled) return;
      const byId = new Map(
        getLibraryGamesByIds(ids).map((game) => [game.id, game]),
      );
      setGames(
        ignored.entries
          .map((row) => byId.get(row.gameId))
          .filter((game): game is Game => game != null),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [ignored.entries]);

  return (
    <div className={styles.root}>
      <AppTopBar />

      <div className={styles.content}>
        <div className={styles.inner}>
          <PageBackLink href="/">← Home</PageBackLink>
          <div className={styles.header}>
            <h1 className={styles.title}>Ignored games</h1>
            <span className={styles.count}>
              {games.length} {games.length === 1 ? "game" : "games"}
            </span>
          </div>

          {games.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Nothing ignored yet</p>
              <p className={styles.emptyText}>
                In Infinite mode, use the trash button to hide a game. You can
                restore it from this list.
              </p>
              <Link href="/infinite" className={styles.emptyLink}>
                Open Infinite mode
              </Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {games.map((game) => (
                <IgnoredRow
                  key={game.id}
                  game={game}
                  onRestore={() => void ignored.restore(game.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
