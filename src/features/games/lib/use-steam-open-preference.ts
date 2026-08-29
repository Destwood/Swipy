"use client";

import { useEffect, useState } from "react";
import {
  getSteamOpenTarget,
  setSteamOpenTarget,
  subscribeSteamOpenTarget,
  type SteamOpenTarget,
} from "@/features/games/lib/steam";

export function useSteamOpenPreference() {
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState<SteamOpenTarget>("web");

  useEffect(() => {
    setTarget(getSteamOpenTarget());
    setReady(true);
    return subscribeSteamOpenTarget(setTarget);
  }, []);

  function setOpenInSteam(enabled: boolean) {
    const next: SteamOpenTarget = enabled ? "app" : "web";
    setTarget(next);
    setSteamOpenTarget(next);
  }

  return {
    ready,
    target,
    openInSteam: target === "app",
    setOpenInSteam,
  };
}
