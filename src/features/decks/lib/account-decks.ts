import type { Deck } from "@/features/decks/data/decks";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DeckRow = { id: string; name: string; description: string | null };
type DeckGameRow = { deck_id: string; game_id: string; position: number };

export function isAccountDeckId(id: string) {
  return UUID_RE.test(id);
}

export async function getSignedInUserId(): Promise<string | null> {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function toDecks(rows: DeckRow[], games: DeckGameRow[]): Deck[] {
  const byDeck = new Map<string, string[]>();
  const ordered = [...games].sort((a, b) => a.position - b.position);
  for (const row of ordered) {
    const list = byDeck.get(row.deck_id) ?? [];
    list.push(row.game_id);
    byDeck.set(row.deck_id, list);
  }
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    gameIds: byDeck.get(row.id) ?? [],
  }));
}

export async function fetchAccountDecks(): Promise<Deck[]> {
  const supabase = createBrowserSupabaseClient();
  const { data: decks, error } = await supabase
    .from("decks")
    .select("id, name, description")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  if (!decks?.length) return [];

  const { data: games, error: gamesError } = await supabase
    .from("deck_games")
    .select("deck_id, game_id, position")
    .in(
      "deck_id",
      decks.map((deck) => deck.id),
    );
  if (gamesError) throw new Error(gamesError.message);
  return toDecks(decks, games ?? []);
}

export async function fetchAccountDeck(id: string): Promise<Deck | undefined> {
  const supabase = createBrowserSupabaseClient();
  const { data: deck, error } = await supabase
    .from("decks")
    .select("id, name, description")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!deck) return undefined;

  const { data: games, error: gamesError } = await supabase
    .from("deck_games")
    .select("deck_id, game_id, position")
    .eq("deck_id", id)
    .order("position", { ascending: true });
  if (gamesError) throw new Error(gamesError.message);

  return toDecks([deck], games ?? [])[0];
}

async function replaceDeckGames(deckId: string, gameIds: string[]) {
  const supabase = createBrowserSupabaseClient();
  const { error: deleteError } = await supabase
    .from("deck_games")
    .delete()
    .eq("deck_id", deckId);
  if (deleteError) throw new Error(deleteError.message);
  if (gameIds.length === 0) return;

  const { error } = await supabase.from("deck_games").insert(
    gameIds.map((gameId, position) => ({
      deck_id: deckId,
      game_id: gameId,
      position,
    })),
  );
  if (error) throw new Error(error.message);
}

export async function insertAccountDeck(input: {
  name: string;
  description?: string;
  gameIds: string[];
}): Promise<Deck> {
  const userId = await getSignedInUserId();
  if (!userId) throw new Error("Sign in to save this deck to your account.");

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("decks")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select("id, name, description")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to save deck");

  await replaceDeckGames(data.id, input.gameIds);
  return {
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    gameIds: input.gameIds,
  };
}

export async function updateAccountDeck(
  id: string,
  input: { name: string; description?: string; gameIds: string[] },
): Promise<Deck> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("decks")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .eq("id", id)
    .select("id, name, description")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update deck");

  await replaceDeckGames(id, input.gameIds);
  return {
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    gameIds: input.gameIds,
  };
}

export async function deleteAccountDeck(id: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function migrateLocalDecksToAccount(local: Deck[]) {
  const userId = await getSignedInUserId();
  if (!userId || local.length === 0) return;

  const flag = `swipy.decksMigrated.${userId}`;
  if (localStorage.getItem(flag)) return;

  const existing = await fetchAccountDecks();
  if (existing.length === 0) {
    for (const deck of local) {
      await insertAccountDeck({
        name: deck.name,
        description: deck.description,
        gameIds: deck.gameIds,
      });
    }
  }
  localStorage.setItem(flag, "1");
}
