import { saveCustomDeck } from "@/features/decks/lib/deck-store";
import { buildLobbyInviteUrl } from "@/features/session/lib/session-invite";
import { buildResultsDeckNameFromHistory } from "@/features/session/lib/swipe-run";
import {
  computeMatchGameIds,
  fetchMembers,
  fetchVotes,
} from "@/features/session/lib/sessions";

export async function convertCoopSessionToDeck(input: {
  sessionId: string;
  deckLabel: string;
  completedAt: string;
}) {
  const [members, votes] = await Promise.all([
    fetchMembers(input.sessionId),
    fetchVotes(input.sessionId),
  ]);

  const matched = computeMatchGameIds(votes, members.length, "all");
  const gameIds =
    matched.length > 0
      ? matched
      : [
          ...new Set(
            votes.filter((vote) => vote.value === "like").map((vote) => vote.game_id),
          ),
        ];

  if (gameIds.length === 0) {
    throw new Error("Like at least one game before creating a deck.");
  }

  return saveCustomDeck({
    name: buildResultsDeckNameFromHistory(input.deckLabel, input.completedAt),
    gameIds,
  });
}

export function buildHistoryShareUrl(item: {
  kind: "solo" | "coop";
  id: string;
  coopCode?: string;
}): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://swipy.app";
  if (item.kind === "coop" && item.coopCode) {
    return buildLobbyInviteUrl(item.coopCode, origin);
  }
  return `${origin}/infinite/matches?session=${encodeURIComponent(item.id)}`;
}
