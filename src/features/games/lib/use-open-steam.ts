"use client";

import { useCallback } from "react";
import {
  openSteamStore,
  type SteamOpenTarget,
} from "@/features/games/lib/steam";

/** Stable callback that opens Steam per current preference (web tab for now). */
export function useOpenSteam() {
  return useCallback(
    (appId: string, options?: { target?: SteamOpenTarget }) => {
      openSteamStore(appId, options);
    },
    [],
  );
}
