import { describe, expect, it, vi } from "vitest";
import type { Game } from "@/features/games/data/games";
import type { SessionMember } from "@/features/session/data/session";
import type { DbVote } from "@/features/session/lib/session-context";

const library = vi.hoisted(() => ({ games: {} as Record<string, unknown> }));

vi.mock("@/features/games/lib/game-library", () => ({
  getLibraryGameById: (id: string) => library.games[id],
}));

import {
  AGREEMENT_TIERS,
  agreementPct,
  buildAgreementSections,
  countLikesByGame,
  flattenAgreementGames,
  gamesLikedByMember,
  gamesRejectedByMember,
  votersForGame,
} from "@/features/session/lib/match-results";

function game(id: string, title: string): Game {
  return {
    id,
    title,
    developer: "",
    year: 2020,
    genres: [],
    description: "",
    image: "",
  };
}

function member(id: string): SessionMember {
  return { id } as SessionMember;
}

let seq = 0;
function vote(memberId: string, gameId: string, value: DbVote["value"]): DbVote {
  seq += 1;
  return {
    id: `v${seq}`,
    session_id: "s1",
    member_id: memberId,
    game_id: gameId,
    value,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function seed(...games: Game[]) {
  library.games = Object.fromEntries(games.map((g) => [g.id, g]));
}

describe("agreementPct", () => {
  it("returns 0 when there are no members", () => {
    expect(agreementPct(3, 0)).toBe(0);
    expect(agreementPct(3, -2)).toBe(0);
  });

  it("rounds to the nearest integer", () => {
    expect(agreementPct(1, 3)).toBe(33);
    expect(agreementPct(2, 3)).toBe(67);
    expect(agreementPct(1, 1)).toBe(100);
    expect(agreementPct(0, 4)).toBe(0);
  });
});

describe("countLikesByGame", () => {
  it("counts only likes, per game", () => {
    const votes = [
      vote("m1", "a", "like"),
      vote("m2", "a", "like"),
      vote("m3", "a", "dislike"),
      vote("m1", "b", "dislike"),
    ];
    expect(countLikesByGame(votes)).toEqual({ a: 2 });
  });

  it("returns an empty object for empty votes", () => {
    expect(countLikesByGame([])).toEqual({});
  });
});

describe("votersForGame", () => {
  it("maps every member to their vote or null", () => {
    const members = [member("m1"), member("m2"), member("m3")];
    const votes = [
      vote("m1", "a", "like"),
      vote("m2", "a", "dislike"),
      vote("m1", "b", "dislike"),
    ];
    expect(votersForGame("a", members, votes)).toEqual([
      { member: members[0], vote: "like" },
      { member: members[1], vote: "dislike" },
      { member: members[2], vote: null },
    ]);
  });

  it("uses the latest vote when a member voted twice", () => {
    const members = [member("m1")];
    const votes = [vote("m1", "a", "like"), vote("m1", "a", "dislike")];
    expect(votersForGame("a", members, votes)[0].vote).toBe("dislike");
  });
});

describe("buildAgreementSections", () => {
  it("returns no sections for zero members or no likes", () => {
    seed(game("a", "A"));
    expect(buildAgreementSections({ a: 1 }, 0)).toEqual([]);
    expect(buildAgreementSections({}, 3)).toEqual([]);
    expect(buildAgreementSections({ a: 0 }, 3)).toEqual([]);
  });

  it("buckets games into tiers by agreement percentage", () => {
    seed(game("a", "A"), game("b", "B"), game("c", "C"), game("d", "D"));
    const sections = buildAgreementSections({ a: 4, b: 3, c: 2, d: 1 }, 4);
    expect(
      sections.map((s) => [s.tier.key, s.games.map((g) => g.game.id)]),
    ).toEqual([
      ["full", ["a"]],
      ["high", ["b"]],
      ["mid", ["c"]],
    ]);
  });

  it("drops games below the lowest tier (25% of 4)", () => {
    seed(game("d", "D"));
    expect(buildAgreementSections({ d: 1 }, 4)).toEqual([]);
  });

  it("keeps 33% in the 30% tier", () => {
    seed(game("a", "A"));
    const [section] = buildAgreementSections({ a: 1 }, 3);
    expect(section.tier.key).toBe("low");
    expect(section.games[0].pct).toBe(33);
  });

  it("single player: a like is a 100% match", () => {
    seed(game("a", "A"));
    const [section] = buildAgreementSections({ a: 1 }, 1);
    expect(section.tier.key).toBe("full");
  });

  it("skips games missing from the library", () => {
    seed(game("a", "A"));
    const sections = buildAgreementSections({ a: 2, ghost: 2 }, 2);
    expect(sections[0].games.map((g) => g.game.id)).toEqual(["a"]);
  });

  it("sorts by likes desc, then title", () => {
    seed(game("a", "Zelda"), game("b", "Alpha"), game("c", "Beta"));
    const sections = buildAgreementSections({ a: 3, b: 3, c: 3 }, 4);
    expect(sections[0].games.map((g) => g.game.title)).toEqual([
      "Alpha",
      "Beta",
      "Zelda",
    ]);
  });

  it("includes voter breakdown only when requested", () => {
    seed(game("a", "A"));
    const members = [member("m1"), member("m2")];
    const votes = [vote("m1", "a", "like"), vote("m2", "a", "like")];
    const [without] = buildAgreementSections({ a: 2 }, 2);
    expect(without.games[0].voters).toEqual([]);
    const [withBreakdown] = buildAgreementSections({ a: 2 }, 2, {
      members,
      votes,
    });
    expect(withBreakdown.games[0].voters).toHaveLength(2);
    expect(withBreakdown.games[0].likes).toBe(2);
    expect(withBreakdown.games[0].members).toBe(2);
  });

  it("orders tiers from strongest to weakest", () => {
    expect(AGREEMENT_TIERS.map((t) => t.minPct)).toEqual([100, 75, 50, 30]);
  });
});

describe("flattenAgreementGames", () => {
  it("flattens sections in order and dedupes by game id", () => {
    seed(game("a", "A"), game("b", "B"));
    const sections = buildAgreementSections({ a: 2, b: 1 }, 2);
    const withDuplicate = [
      sections[0],
      {
        ...sections[1],
        games: [...sections[1].games, sections[0].games[0]],
      },
    ];
    expect(flattenAgreementGames(withDuplicate).map((g) => g.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("returns an empty list for no sections", () => {
    expect(flattenAgreementGames([])).toEqual([]);
  });
});

describe("gamesLikedByMember / gamesRejectedByMember", () => {
  it("filters by member and vote, sorts by title, skips unknown games", () => {
    seed(game("a", "Zed"), game("b", "Alpha"), game("c", "Mid"));
    const votes = [
      vote("m1", "a", "like"),
      vote("m1", "b", "like"),
      vote("m1", "c", "dislike"),
      vote("m1", "ghost", "like"),
      vote("m2", "c", "like"),
    ];
    expect(gamesLikedByMember(votes, "m1").map((g) => g.title)).toEqual([
      "Alpha",
      "Zed",
    ]);
    expect(gamesRejectedByMember(votes, "m1").map((g) => g.title)).toEqual([
      "Mid",
    ]);
  });

  it("excludes the given game ids from rejected", () => {
    seed(game("c", "Mid"), game("d", "Other"));
    const votes = [vote("m1", "c", "dislike"), vote("m1", "d", "dislike")];
    expect(
      gamesRejectedByMember(votes, "m1", new Set(["c"])).map((g) => g.id),
    ).toEqual(["d"]);
  });
});
