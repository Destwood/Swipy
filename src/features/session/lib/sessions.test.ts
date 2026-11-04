import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/decks/lib/deck-store", () => ({ getDeckById: vi.fn() }));
vi.mock("@/shared/supabase/client", () => ({ createGuestDataClient: vi.fn() }));

import { computeMatchGameIds } from "@/features/session/lib/sessions";
import type { DbVote } from "@/features/session/lib/session-context";

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

function likes(gameId: string, memberIds: string[]): DbVote[] {
  return memberIds.map((m) => vote(m, gameId, "like"));
}

describe("computeMatchGameIds", () => {
  it("returns nothing for empty votes", () => {
    expect(computeMatchGameIds([], 3, "all")).toEqual([]);
    expect(computeMatchGameIds([], 3, "majority")).toEqual([]);
    expect(computeMatchGameIds([], 3, "half")).toEqual([]);
  });

  it("returns nothing when there are no members", () => {
    expect(computeMatchGameIds(likes("a", ["m1"]), 0, "all")).toEqual([]);
    expect(computeMatchGameIds(likes("a", ["m1"]), -1, "half")).toEqual([]);
  });

  it("defaults to the all rule", () => {
    const votes = likes("a", ["m1", "m2"]);
    expect(computeMatchGameIds(votes, 3)).toEqual([]);
    expect(computeMatchGameIds(votes, 2)).toEqual(["a"]);
  });

  it("single player: every rule matches on one like", () => {
    const votes = likes("a", ["m1"]);
    for (const rule of ["all", "majority", "half"] as const) {
      expect(computeMatchGameIds(votes, 1, rule)).toEqual(["a"]);
    }
  });

  it("ignores dislikes", () => {
    const votes = [
      vote("m1", "a", "like"),
      vote("m2", "a", "dislike"),
      vote("m3", "a", "dislike"),
    ];
    expect(computeMatchGameIds(votes, 3, "all")).toEqual([]);
    expect(computeMatchGameIds(votes, 3, "majority")).toEqual([]);
    expect(computeMatchGameIds(votes, 3, "half")).toEqual([]);
    expect(computeMatchGameIds(votes, 1, "all")).toEqual(["a"]);
  });

  describe("all rule", () => {
    it("requires every member to like", () => {
      const votes = [
        ...likes("a", ["m1", "m2", "m3"]),
        ...likes("b", ["m1", "m2"]),
      ];
      expect(computeMatchGameIds(votes, 3, "all")).toEqual(["a"]);
    });
  });

  describe("majority rule (strictly more than half)", () => {
    it("odd count: 2 of 3", () => {
      const votes = likes("a", ["m1", "m2"]);
      expect(computeMatchGameIds(votes, 3, "majority")).toEqual(["a"]);
    });

    it("odd count: 2 of 5 is not enough, 3 of 5 is", () => {
      expect(
        computeMatchGameIds(likes("a", ["m1", "m2"]), 5, "majority"),
      ).toEqual([]);
      expect(
        computeMatchGameIds(likes("a", ["m1", "m2", "m3"]), 5, "majority"),
      ).toEqual(["a"]);
    });

    it("even count: an exact tie (2 of 4) is not a majority", () => {
      expect(
        computeMatchGameIds(likes("a", ["m1", "m2"]), 4, "majority"),
      ).toEqual([]);
      expect(
        computeMatchGameIds(likes("a", ["m1", "m2", "m3"]), 4, "majority"),
      ).toEqual(["a"]);
    });

    it("two players: needs both", () => {
      expect(computeMatchGameIds(likes("a", ["m1"]), 2, "majority")).toEqual(
        [],
      );
      expect(
        computeMatchGameIds(likes("a", ["m1", "m2"]), 2, "majority"),
      ).toEqual(["a"]);
    });
  });

  describe("half rule (at least half)", () => {
    it("even count: an exact tie (2 of 4) matches", () => {
      expect(
        computeMatchGameIds(likes("a", ["m1", "m2"]), 4, "half"),
      ).toEqual(["a"]);
      expect(computeMatchGameIds(likes("a", ["m1"]), 4, "half")).toEqual([]);
    });

    it("odd count rounds up: 1 of 3 no, 2 of 3 yes", () => {
      expect(computeMatchGameIds(likes("a", ["m1"]), 3, "half")).toEqual([]);
      expect(
        computeMatchGameIds(likes("a", ["m1", "m2"]), 3, "half"),
      ).toEqual(["a"]);
    });

    it("two players: one like is enough", () => {
      expect(computeMatchGameIds(likes("a", ["m1"]), 2, "half")).toEqual([
        "a",
      ]);
    });
  });

  it("sorts matches by like count, highest first", () => {
    const votes = [
      ...likes("low", ["m1", "m2"]),
      ...likes("top", ["m1", "m2", "m3", "m4"]),
      ...likes("mid", ["m1", "m2", "m3"]),
    ];
    expect(computeMatchGameIds(votes, 4, "half")).toEqual([
      "top",
      "mid",
      "low",
    ]);
  });
});
