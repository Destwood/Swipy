"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";
import {
  EMPTY_IGNORE_LIST,
  hydrateIgnoreList,
  readIgnoreList,
  subscribeIgnoreList,
  toggleIgnoredGenre,
  toggleIgnoredPlatform,
  writeIgnoreList,
  type IgnoreList,
} from "@/features/games/lib/ignore-list";

export function useIgnoreList() {
  const [list, setList] = useState<IgnoreList>(EMPTY_IGNORE_LIST);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setList(readIgnoreList());
    setReady(true);
    const unsub = subscribeIgnoreList(setList);
    void hydrateIgnoreList().then(setList);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void hydrateIgnoreList().then(setList);
    });
    return () => {
      unsub();
      subscription.unsubscribe();
    };
  }, []);

  function setNext(next: IgnoreList) {
    setList(next);
    writeIgnoreList(next);
  }

  return {
    ...list,
    ready,
    toggleGenre: (genre: string) => setNext(toggleIgnoredGenre(list, genre)),
    togglePlatform: (platform: string) =>
      setNext(toggleIgnoredPlatform(list, platform)),
  };
}
