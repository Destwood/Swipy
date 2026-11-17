"use client";

import { useSteamBackgroundSync } from "@/features/steam/lib/use-steam";

export function SteamBackgroundSync() {
  useSteamBackgroundSync();
  return null;
}
