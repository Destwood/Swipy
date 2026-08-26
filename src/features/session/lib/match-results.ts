import type { Game } from "@/features/games/data/games";
import { getLibraryGameById } from "@/features/games/lib/game-library";
import type { SessionMember } from "@/features/session/data/session";
import type { DbVote } from "@/features/session/lib/session-context";

export type AgreementTierKey = "full" | "high" | "mid" | "low";

export type AgreementTier = {
  key: AgreementTierKey;
  label: string;
  minPct: number;
};

export const AGREEMENT_TIERS: readonly AgreementTier[] = [
  { key: "full", label: "100% match", minPct: 100 },
  { key: "high", label: "75% match", minPct: 75 },
  { key: "mid", label: "50% match", minPct: 50 },
  { key: "low", label: "30% match", minPct: 30 },
] as const;

export type GameVoter = {
  member: SessionMember;
  vote: "like" | "dislike" | null;
};

export type RankedGame = {
  game: Game;
  likes: number;
  members: number;
  pct: number;
  voters: GameVoter[];
};

export type AgreementSection = {
  tier: AgreementTier;
  games: RankedGame[];
};

export function countLikesByGame(votes: DbVote[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const vote of votes) {
    if (vote.value !== "like") continue;
    counts[vote.game_id] = (counts[vote.game_id] ?? 0) + 1;
  }
  return counts;
}

export function agreementPct(likes: number, members: number): number {
  if (members <= 0) return 0;
  return Math.round((likes / members) * 100);
}

function tierForPct(pct: number): AgreementTier | null {
  for (const tier of AGREEMENT_TIERS) {
    if (pct >= tier.minPct) return tier;
  }
  return null;
}

export function votersForGame(
  gameId: string,
  members: SessionMember[],
  votes: DbVote[],
): GameVoter[] {
  const byMember = new Map<string, "like" | "dislike">();
  for (const vote of votes) {
    if (vote.game_id !== gameId) continue;
    byMember.set(vote.member_id, vote.value);
  }
  return members.map((member) => ({
    member,
    vote: byMember.get(member.id) ?? null,
  }));
}

export function buildAgreementSections(
  likeCounts: Record<string, number>,
  memberCount: number,
  breakdown?: { members: SessionMember[]; votes: DbVote[] },
): AgreementSection[] {
  if (memberCount <= 0) return [];

  const buckets = new Map<AgreementTierKey, RankedGame[]>();
  for (const tier of AGREEMENT_TIERS) {
    buckets.set(tier.key, []);
  }

  for (const [gameId, likes] of Object.entries(likeCounts)) {
    if (likes <= 0) continue;
    const pct = agreementPct(likes, memberCount);
    const tier = tierForPct(pct);
    if (!tier) continue;
    const game = getLibraryGameById(gameId);
    if (!game) continue;
    buckets.get(tier.key)?.push({
      game,
      likes,
      members: memberCount,
      pct,
      voters: breakdown
        ? votersForGame(gameId, breakdown.members, breakdown.votes)
        : [],
    });
  }

  return AGREEMENT_TIERS.map((tier) => {
    const games = (buckets.get(tier.key) ?? []).sort((a, b) => {
      if (b.likes !== a.likes) return b.likes - a.likes;
      return a.game.title.localeCompare(b.game.title);
    });
    return { tier, games };
  }).filter((section) => section.games.length > 0);
}

export function gamesLikedByMember(votes: DbVote[], memberId: string): Game[] {
  return votes
    .filter((v) => v.member_id === memberId && v.value === "like")
    .map((v) => getLibraryGameById(v.game_id))
    .filter((g): g is Game => Boolean(g))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function gamesRejectedByMember(
  votes: DbVote[],
  memberId: string,
  excludeIds?: Set<string>,
): Game[] {
  return votes
    .filter((v) => v.member_id === memberId && v.value === "dislike")
    .map((v) => getLibraryGameById(v.game_id))
    .filter((g): g is Game => Boolean(g))
    .filter((g) => !excludeIds?.has(g.id))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function flattenAgreementGames(sections: AgreementSection[]): Game[] {
  const seen = new Set<string>();
  const out: Game[] = [];
  for (const section of sections) {
    for (const ranked of section.games) {
      if (seen.has(ranked.game.id)) continue;
      seen.add(ranked.game.id);
      out.push(ranked.game);
    }
  }
  return out;
}
