import type { Game } from "@/features/games/data/games";

export type SteamLibraryMode =
  | "all"
  | "hide-owned"
  | "only-owned"
  | "only-wishlist";

export const STEAM_LIBRARY_MODES: readonly SteamLibraryMode[] = [
  "all",
  "hide-owned",
  "only-owned",
  "only-wishlist",
];

export type LibraryFilter = {
  mode: SteamLibraryMode;
  owned: ReadonlySet<string>;
  wishlist: ReadonlySet<string>;
};

export const EMPTY_LIBRARY_FILTER: LibraryFilter = {
  mode: "all",
  owned: new Set(),
  wishlist: new Set(),
};

export function isSteamLibraryMode(value: unknown): value is SteamLibraryMode {
  return STEAM_LIBRARY_MODES.includes(value as SteamLibraryMode);
}

/** A mode with no Steam data behind it (not linked, private) is a no-op. */
export function gameMatchesLibraryFilter(
  game: Game,
  filter: LibraryFilter,
): boolean {
  const appId = game.steamAppId;
  switch (filter.mode) {
    case "hide-owned":
      return !appId || !filter.owned.has(appId);
    case "only-owned":
      if (filter.owned.size === 0) return true;
      return Boolean(appId && filter.owned.has(appId));
    case "only-wishlist":
      if (filter.wishlist.size === 0) return true;
      return Boolean(appId && filter.wishlist.has(appId));
    default:
      return true;
  }
}
