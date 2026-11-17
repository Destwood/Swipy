export type SteamLibraryStatus = "pending" | "ok" | "private" | "error";
export type SteamWishlistStatus = "pending" | "ok" | "empty" | "error";

export type SteamLink = {
  steamId: string;
  personaName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  libraryStatus: SteamLibraryStatus;
  wishlistStatus: SteamWishlistStatus;
  lastSyncedAt: string | null;
};

export const STEAM_SYNC_COOLDOWN_MS = 60_000;
export const STEAM_AUTO_SYNC_AFTER_MS = 12 * 60 * 60 * 1000;
