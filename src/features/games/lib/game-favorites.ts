import { getSignedInUserId } from "@/features/decks/lib/account-decks";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";

const FAVORITES_KEY = "swipy.favoriteGameIds";
const CHANGE_EVENT = "swipy:favorite-games";

function readLocalIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeLocalIds(ids: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function isFavoriteGame(id: string): boolean {
  return readLocalIds().has(id);
}

/** Returns whether the game is a favorite after the toggle. */
export function toggleFavoriteGame(id: string): boolean {
  const ids = readLocalIds();
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  writeLocalIds(ids);
  void syncFavoriteToggle(id, ids.has(id));
  return ids.has(id);
}

export function listFavoriteGameIds(): string[] {
  return [...readLocalIds()];
}

async function syncFavoriteToggle(gameId: string, added: boolean) {
  const userId = await getSignedInUserId();
  if (!userId) return;
  const supabase = createBrowserSupabaseClient();
  if (added) {
    const { error } = await supabase.from("favorite_games").upsert(
      { user_id: userId, game_id: gameId },
      { onConflict: "user_id,game_id" },
    );
    if (error) console.warn("favorite_games upsert failed", error.message);
    return;
  }
  const { error } = await supabase
    .from("favorite_games")
    .delete()
    .eq("user_id", userId)
    .eq("game_id", gameId);
  if (error) console.warn("favorite_games delete failed", error.message);
}

export async function hydrateFavoriteGames(): Promise<string[]> {
  const userId = await getSignedInUserId();
  if (!userId) return listFavoriteGameIds();

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("favorite_games")
    .select("game_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return listFavoriteGameIds();

  const remoteIds = (data ?? []).map((row) => row.game_id);
  const remoteSet = new Set(remoteIds);
  const pending = listFavoriteGameIds().filter((id) => !remoteSet.has(id));

  if (pending.length > 0) {
    await supabase.from("favorite_games").upsert(
      pending.map((gameId) => ({ user_id: userId, game_id: gameId })),
      { onConflict: "user_id,game_id" },
    );
  }

  const merged = [...new Set([...pending, ...remoteIds])];
  writeLocalIds(new Set(merged));
  return merged;
}

export function subscribeFavoriteGames(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/** Drop legacy key after DB migration (optional cleanup). */
export function purgeLegacyFavoriteStorage() {
  /* keep local as L1 cache — no purge */
}
