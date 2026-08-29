"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_IGNORE_LIST,
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
    return subscribeIgnoreList(setList);
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
