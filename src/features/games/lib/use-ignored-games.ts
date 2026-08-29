"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";
import {
  hydrateIgnoredGames,
  ignoreGame,
  readIgnoredGames,
  restoreIgnoredGame,
  subscribeIgnoredGames,
  type IgnoredGameEntry,
} from "@/features/games/lib/ignored-games";

export function useIgnoredGames() {
  const [entries, setEntries] = useState<IgnoredGameEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(readIgnoredGames());
    setReady(true);
    const unsub = subscribeIgnoredGames(setEntries);
    void hydrateIgnoredGames().then(setEntries);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void hydrateIgnoredGames().then(setEntries);
    });
    return () => {
      unsub();
      subscription.unsubscribe();
    };
  }, []);

  const ids = new Set(entries.map((row) => row.gameId));

  return {
    ready,
    entries,
    ids,
    has: (gameId: string) => ids.has(gameId),
    ignore: (gameId: string) => ignoreGame(gameId),
    restore: (gameId: string) => restoreIgnoredGame(gameId),
  };
}
