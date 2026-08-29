import type { Game } from "@/features/games/data/games";
import { getSignedInUserId } from "@/features/decks/lib/account-decks";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";

export async function upsertCachedGamesToDb(games: Game[]) {
  if (games.length === 0) return;
  const userId = await getSignedInUserId();
  if (!userId) return;

  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("cached_games").upsert(
    games.map((game) => ({
      game_id: game.id,
      data: game as unknown as Record<string, unknown>,
      cached_at: new Date().toISOString(),
    })),
    { onConflict: "game_id" },
  );
  if (error) console.warn("cached_games upsert failed", error.message);
}

export async function fetchCachedGamesFromDb(ids: string[]): Promise<Game[]> {
  if (ids.length === 0) return [];
  const userId = await getSignedInUserId();
  if (!userId) return [];

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("cached_games")
    .select("game_id, data")
    .in("game_id", ids);
  if (error) {
    console.warn("cached_games fetch failed", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => row.data as unknown as Game)
    .filter((game): game is Game => Boolean(game?.id && game?.title));
}
