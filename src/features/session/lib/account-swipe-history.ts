import type { SwipeRunMode, SwipeVote } from "@/features/session/lib/swipe-run";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";
import { getSignedInUserId } from "@/features/decks/lib/account-decks";

type HistoryRow = {
  id: string;
  mode: SwipeRunMode;
  label: string;
  saved: boolean;
  deck_id: string | null;
  created_at: string;
};

type VoteRow = {
  history_id: string;
  game_id: string;
  value: "like" | "dislike";
  position: number;
};

export type CloudSwipeHistoryEntry = {
  id: string;
  mode: SwipeRunMode;
  label: string;
  votes: SwipeVote[];
  saved: boolean;
  deckId?: string;
  createdAt: string;
};

export async function insertCloudSwipeHistory(input: {
  mode: SwipeRunMode;
  label: string;
  votes: SwipeVote[];
  saved?: boolean;
}): Promise<CloudSwipeHistoryEntry> {
  const userId = await getSignedInUserId();
  if (!userId) throw new Error("Sign in to sync swipe history.");

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("swipe_history")
    .insert({
      user_id: userId,
      mode: input.mode,
      label: input.label.trim(),
      saved: input.saved ?? false,
    })
    .select("id, mode, label, saved, deck_id, created_at")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save swipe history.");
  }

  await replaceHistoryVotes(data.id, input.votes);
  return rowToEntry(data, input.votes);
}

export async function fetchCloudSwipeHistory(): Promise<CloudSwipeHistoryEntry[]> {
  const supabase = createBrowserSupabaseClient();
  const { data: rows, error } = await supabase
    .from("swipe_history")
    .select("id, mode, label, saved, deck_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!rows?.length) return [];

  const ids = rows.map((row) => row.id);
  const { data: votes, error: votesError } = await supabase
    .from("swipe_history_votes")
    .select("history_id, game_id, value, position")
    .in("history_id", ids)
    .order("position", { ascending: true });
  if (votesError) throw new Error(votesError.message);

  const byHistory = groupVotes(votes ?? []);
  return rows.map((row) =>
    rowToEntry(row, byHistory.get(row.id) ?? []),
  );
}

export async function markCloudSwipeHistorySaved(id: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from("swipe_history")
    .update({ saved: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setCloudSwipeHistoryDeckId(
  id: string,
  deckId: string,
): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from("swipe_history")
    .update({ deck_id: deckId, saved: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCloudSwipeHistory(id: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("swipe_history").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function replaceHistoryVotes(historyId: string, votes: SwipeVote[]) {
  const supabase = createBrowserSupabaseClient();
  const { error: deleteError } = await supabase
    .from("swipe_history_votes")
    .delete()
    .eq("history_id", historyId);
  if (deleteError) throw new Error(deleteError.message);
  if (votes.length === 0) return;

  const { error } = await supabase.from("swipe_history_votes").insert(
    votes.map((vote, position) => ({
      history_id: historyId,
      game_id: vote.gameId,
      value: vote.value,
      position,
    })),
  );
  if (error) throw new Error(error.message);
}

function groupVotes(rows: VoteRow[]): Map<string, SwipeVote[]> {
  const map = new Map<string, SwipeVote[]>();
  for (const row of rows) {
    const list = map.get(row.history_id) ?? [];
    list.push({ gameId: row.game_id, value: row.value });
    map.set(row.history_id, list);
  }
  return map;
}

function rowToEntry(row: HistoryRow, votes: SwipeVote[]): CloudSwipeHistoryEntry {
  return {
    id: row.id,
    mode: row.mode,
    label: row.label,
    votes,
    saved: row.saved,
    deckId: row.deck_id ?? undefined,
    createdAt: row.created_at,
  };
}
