import { getSignedInUserId } from "@/features/decks/lib/account-decks";
import {
  EMPTY_LIBRARY_FILTER,
  isSteamLibraryMode,
  type LibraryFilter,
  type SteamLibraryMode,
} from "@/features/steam/lib/library-filter";
import {
  STEAM_AUTO_SYNC_AFTER_MS,
  type SteamLibraryStatus,
  type SteamLink,
  type SteamWishlistStatus,
} from "@/features/steam/lib/types";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";

const CACHE_KEY = "swipy.steamLibrary";
const MODE_KEY = "swipy.steamLibraryMode";
const CHANGE_EVENT = "swipy:steam-library";
const PAGE = 1000;

type Cache = { owned: string[]; wishlist: string[] };

function readCache(): Cache {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as
      | Partial<Cache>
      | null;
    const strings = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
    return { owned: strings(parsed?.owned), wishlist: strings(parsed?.wishlist) };
  } catch {
    return { owned: [], wishlist: [] };
  }
}

function emitChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function writeCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  emitChange();
}

function readMode(): SteamLibraryMode {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    return isSteamLibraryMode(raw) ? raw : "all";
  } catch {
    return "all";
  }
}

export function setSteamLibraryMode(mode: SteamLibraryMode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* ignore */
  }
  emitChange();
}

export function readLibraryFilter(): LibraryFilter {
  if (typeof window === "undefined") return EMPTY_LIBRARY_FILTER;
  const cache = readCache();
  return {
    mode: readMode(),
    owned: new Set(cache.owned),
    wishlist: new Set(cache.wishlist),
  };
}

export function subscribeLibraryFilter(onChange: (filter: LibraryFilter) => void) {
  function notify() {
    onChange(readLibraryFilter());
  }
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

async function selectAllAppIds(
  table: "steam_library" | "steam_wishlist",
  userId: string,
): Promise<string[] | null> {
  const supabase = createBrowserSupabaseClient();
  const ids: string[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("app_id")
      .eq("user_id", userId)
      .order("app_id")
      .range(from, from + PAGE - 1);
    if (error) return null;
    ids.push(...data.map((row) => row.app_id));
    if (data.length < PAGE) return ids;
  }
}

export async function fetchSteamLink(): Promise<SteamLink | null> {
  const userId = await getSignedInUserId();
  if (!userId) return null;
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("steam_links")
    .select(
      "steam_id, persona_name, avatar_url, profile_url, library_status, wishlist_status, last_synced_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    steamId: data.steam_id,
    personaName: data.persona_name,
    avatarUrl: data.avatar_url,
    profileUrl: data.profile_url,
    libraryStatus: data.library_status as SteamLibraryStatus,
    wishlistStatus: data.wishlist_status as SteamWishlistStatus,
    lastSyncedAt: data.last_synced_at,
  };
}

export async function hydrateSteamLibrary(): Promise<void> {
  const userId = await getSignedInUserId();
  if (!userId) {
    writeCache({ owned: [], wishlist: [] });
    return;
  }
  const [owned, wishlist] = await Promise.all([
    selectAllAppIds("steam_library", userId),
    selectAllAppIds("steam_wishlist", userId),
  ]);
  if (!owned || !wishlist) return;
  writeCache({ owned, wishlist });
}

export async function syncSteamNow(): Promise<boolean> {
  try {
    const res = await fetch("/api/steam/sync", { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function disconnectSteam(): Promise<boolean> {
  const userId = await getSignedInUserId();
  if (!userId) return false;
  const supabase = createBrowserSupabaseClient();
  const results = await Promise.all([
    supabase.from("steam_library").delete().eq("user_id", userId),
    supabase.from("steam_wishlist").delete().eq("user_id", userId),
  ]);
  if (results.some((result) => result.error)) return false;
  const { error } = await supabase
    .from("steam_links")
    .delete()
    .eq("user_id", userId);
  if (error) return false;
  writeCache({ owned: [], wishlist: [] });
  return true;
}

let autoSync: Promise<void> | null = null;

export function autoSyncSteamIfStale(): Promise<void> {
  autoSync ??= (async () => {
    const link = await fetchSteamLink();
    if (!link) return;
    const last = link.lastSyncedAt ? Date.parse(link.lastSyncedAt) : 0;
    if (Date.now() - last < STEAM_AUTO_SYNC_AFTER_MS) return;
    if (await syncSteamNow()) await hydrateSteamLibrary();
  })().finally(() => {
    autoSync = null;
  });
  return autoSync;
}
