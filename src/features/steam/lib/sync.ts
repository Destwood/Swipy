import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/supabase/database.types";
import {
  fetchOwnedGames,
  fetchPlayerSummary,
  fetchWishlist,
  type SteamOwnedGame,
  type SteamWishlistItem,
} from "@/features/steam/lib/steam-web-api";
import type {
  SteamLibraryStatus,
  SteamWishlistStatus,
} from "@/features/steam/lib/types";

const CHUNK = 500;

type Client = SupabaseClient<Database>;

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
}

async function replaceLibrary(
  supabase: Client,
  userId: string,
  games: SteamOwnedGame[],
  syncedAt: string,
) {
  for (const part of chunks(games)) {
    const { error } = await supabase.from("steam_library").upsert(
      part.map((game) => ({
        user_id: userId,
        app_id: game.appId,
        playtime_minutes: game.playtimeMinutes,
        synced_at: syncedAt,
      })),
      { onConflict: "user_id,app_id" },
    );
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase
    .from("steam_library")
    .delete()
    .eq("user_id", userId)
    .lt("synced_at", syncedAt);
  if (error) throw new Error(error.message);
}

async function replaceWishlist(
  supabase: Client,
  userId: string,
  items: SteamWishlistItem[],
  syncedAt: string,
) {
  for (const part of chunks(items)) {
    const { error } = await supabase.from("steam_wishlist").upsert(
      part.map((item) => ({
        user_id: userId,
        app_id: item.appId,
        added_at: item.addedAt,
        synced_at: syncedAt,
      })),
      { onConflict: "user_id,app_id" },
    );
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase
    .from("steam_wishlist")
    .delete()
    .eq("user_id", userId)
    .lt("synced_at", syncedAt);
  if (error) throw new Error(error.message);
}

export async function clearSteamData(supabase: Client, userId: string) {
  await supabase.from("steam_library").delete().eq("user_id", userId);
  await supabase.from("steam_wishlist").delete().eq("user_id", userId);
}

export async function syncSteamAccount(
  supabase: Client,
  userId: string,
  steamId: string,
) {
  const startedAt = new Date().toISOString();
  const [owned, wishlist, summary] = await Promise.allSettled([
    fetchOwnedGames(steamId),
    fetchWishlist(steamId),
    fetchPlayerSummary(steamId),
  ]);

  let libraryStatus: SteamLibraryStatus = "error";
  if (owned.status === "fulfilled") {
    try {
      await replaceLibrary(supabase, userId, owned.value.games, startedAt);
      libraryStatus = owned.value.status;
    } catch {
      libraryStatus = "error";
    }
  }

  let wishlistStatus: SteamWishlistStatus = "error";
  if (wishlist.status === "fulfilled") {
    try {
      await replaceWishlist(supabase, userId, wishlist.value.items, startedAt);
      wishlistStatus = wishlist.value.status;
    } catch {
      wishlistStatus = "error";
    }
  }

  const profile = summary.status === "fulfilled" ? summary.value : null;
  const { error } = await supabase
    .from("steam_links")
    .update({
      library_status: libraryStatus,
      wishlist_status: wishlistStatus,
      last_synced_at: new Date().toISOString(),
      ...(profile
        ? {
            persona_name: profile.personaName,
            avatar_url: profile.avatarUrl,
            profile_url: profile.profileUrl,
          }
        : {}),
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  return { libraryStatus, wishlistStatus };
}
