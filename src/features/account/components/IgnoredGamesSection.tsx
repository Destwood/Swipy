"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GameListRowSkeleton } from "@/features/games/components/GameListRowSkeleton";
import { IgnoredRow } from "@/features/games/components/IgnoredRow";
import type { Game } from "@/features/games/data/games";
import {
  ensureGamesInLibrary,
  getLibraryGamesByIds,
} from "@/features/games/lib/game-library";
import { useIgnoredGames } from "@/features/games/lib/use-ignored-games";
import styles from "./IgnoredGamesSection.module.css";

export function IgnoredGamesSection() {
  const ignored = useIgnoredGames();
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!ignored.ready) return;
    const ids = ignored.entries.map((row) => row.gameId);
    if (ids.length === 0) {
      setGames([]);
      setGamesLoading(false);
      return;
    }
    let cancelled = false;
    setGamesLoading(true);
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
      setGamesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ignored.entries, ignored.ready]);

  const loading = !ignored.ready || gamesLoading;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((game) => game.title.toLowerCase().includes(q));
  }, [games, query]);

  if (loading && ignored.entries.length > 0) {
    return (
      <ul
        className={styles.list}
        aria-busy="true"
        aria-label="Loading ignored games"
      >
        {Array.from({ length: Math.min(ignored.entries.length, 6) }, (_, i) => (
          <GameListRowSkeleton key={`sk-${i}`} showAction />
        ))}
      </ul>
    );
  }

  if (games.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ignored games…"
          aria-label="Search ignored games"
          className={styles.search}
          autoComplete="off"
        />
        <span className={styles.count}>
          {visible.length === games.length
            ? `${games.length} ${games.length === 1 ? "game" : "games"}`
            : `${visible.length} of ${games.length}`}
        </span>
      </div>
      {visible.length === 0 ? (
        <p className={styles.noMatches}>No ignored games match “{query.trim()}”.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((game) => (
            <IgnoredRow
              key={game.id}
              game={game}
              onRestore={() => void ignored.restore(game.id)}
            />
          ))}
        </ul>
      )}
    </>
  );
}
