import { createGuestDataClient } from "@/shared/supabase/client";
import type { VoteValue } from "@/shared/supabase/database.types";
import {
  createGuestToken,
  generateSessionCode,
  getMembershipByCode,
  normalizeCode,
  setActiveSession,
  type ActiveSession,
  type DbMember,
  type DbSession,
  type DbVote,
} from "@/features/session/lib/session-context";

export async function createGuestSession(input: {
  deckId: string;
  displayName: string;
  code?: string;
}): Promise<ActiveSession> {
  const supabase = createGuestDataClient();
  const guestToken = createGuestToken();
  const code = normalizeCode(input.code ?? generateSessionCode());

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      code,
      deck_id: input.deckId,
      status: "lobby",
      match_rule: "all",
    })
    .select()
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message ?? "Failed to create session");
  }

  const { data: member, error: memberError } = await supabase
    .from("session_members")
    .insert({
      session_id: session.id,
      display_name: input.displayName.trim() || "Host",
      guest_token: guestToken,
      is_host: true,
      status: "ready",
    })
    .select()
    .single();

  if (memberError || !member) {
    // Avoid orphan sessions when member insert fails
    await supabase.from("sessions").delete().eq("id", session.id);
    throw new Error(memberError?.message ?? "Failed to create host member");
  }

  const active: ActiveSession = {
    sessionId: session.id,
    memberId: member.id,
    code: session.code,
    deckId: session.deck_id,
    isHost: true,
    displayName: member.display_name,
    guestToken,
  };
  setActiveSession(active);
  return active;
}

export async function joinGuestSession(input: {
  code: string;
  displayName: string;
}): Promise<ActiveSession> {
  const supabase = createGuestDataClient();
  const code = normalizeCode(input.code);

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select()
    .eq("code", code)
    .maybeSingle();

  if (sessionError) throw new Error(sessionError.message);
  if (!session) throw new Error("Session not found. Check the code.");

  const cached = getMembershipByCode(code);
  if (cached && cached.sessionId === session.id) {
    const active: ActiveSession = {
      sessionId: session.id,
      memberId: cached.memberId,
      code: session.code,
      deckId: session.deck_id,
      isHost: cached.isHost,
      displayName: cached.displayName,
      guestToken: cached.guestToken,
    };
    setActiveSession(active);
    return active;
  }

  const guestToken = createGuestToken();

  const { data: created, error: memberError } = await supabase
    .from("session_members")
    .insert({
      session_id: session.id,
      display_name: input.displayName.trim() || "Guest",
      guest_token: guestToken,
      is_host: false,
      status: "ready",
    })
    .select()
    .single();

  if (memberError || !created) {
    throw new Error(memberError?.message ?? "Failed to join session");
  }

  const active: ActiveSession = {
    sessionId: session.id,
    memberId: created.id,
    code: session.code,
    deckId: session.deck_id,
    isHost: created.is_host,
    displayName: created.display_name,
    guestToken,
  };
  setActiveSession(active);
  return active;
}

export async function fetchSession(sessionId: string): Promise<DbSession> {
  const supabase = createGuestDataClient();
  const { data, error } = await supabase
    .from("sessions")
    .select()
    .eq("id", sessionId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Session not found");
  return data;
}

export async function fetchMembers(sessionId: string): Promise<DbMember[]> {
  const supabase = createGuestDataClient();
  const { data, error } = await supabase
    .from("session_members")
    .select()
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function startSessionSwiping(sessionId: string) {
  const supabase = createGuestDataClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "swiping" })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  await supabase
    .from("session_members")
    .update({ status: "swiping" })
    .eq("session_id", sessionId);
}

export async function castVote(input: {
  sessionId: string;
  memberId: string;
  gameId: string;
  value: VoteValue;
}) {
  const supabase = createGuestDataClient();
  const { error } = await supabase.from("votes").upsert(
    {
      session_id: input.sessionId,
      member_id: input.memberId,
      game_id: input.gameId,
      value: input.value,
    },
    { onConflict: "session_id,member_id,game_id" },
  );
  if (error) throw new Error(error.message);
}

export async function fetchVotes(sessionId: string): Promise<DbVote[]> {
  const supabase = createGuestDataClient();
  const { data, error } = await supabase
    .from("votes")
    .select()
    .eq("session_id", sessionId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markMemberDone(memberId: string) {
  const supabase = createGuestDataClient();
  const { error } = await supabase
    .from("session_members")
    .update({ status: "done" })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
}

export function computeMatchGameIds(
  votes: DbVote[],
  memberCount: number,
  rule: "all" | "majority" | "half" = "all",
): string[] {
  if (memberCount <= 0) return [];

  const likes = new Map<string, number>();
  for (const vote of votes) {
    if (vote.value !== "like") continue;
    likes.set(vote.game_id, (likes.get(vote.game_id) ?? 0) + 1);
  }

  const needed =
    rule === "all"
      ? memberCount
      : rule === "majority"
        ? Math.floor(memberCount / 2) + 1
        : Math.ceil(memberCount / 2);

  return [...likes.entries()]
    .filter(([, count]) => count >= needed)
    .sort((a, b) => b[1] - a[1])
    .map(([gameId]) => gameId);
}

export function subscribeToMembers(
  sessionId: string,
  onChange: () => void,
) {
  const supabase = createGuestDataClient();
  const channel = supabase
    .channel(`members:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "session_members",
        filter: `session_id=eq.${sessionId}`,
      },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "sessions",
        filter: `id=eq.${sessionId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
