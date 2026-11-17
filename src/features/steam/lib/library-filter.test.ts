import { describe, expect, it } from "vitest";
import type { Game } from "@/features/games/data/games";
import {
  EMPTY_LIBRARY_FILTER,
  gameMatchesLibraryFilter,
  type LibraryFilter,
} from "@/features/steam/lib/library-filter";

function game(steamAppId?: string): Game {
  return {
    id: "g",
    title: "Game",
    developer: "",
    year: 2020,
    genres: [],
    description: "",
    image: "",
    steamAppId,
  };
}

const filter = (overrides: Partial<LibraryFilter>): LibraryFilter => ({
  ...EMPTY_LIBRARY_FILTER,
  owned: new Set(["10"]),
  wishlist: new Set(["20"]),
  ...overrides,
});

describe("gameMatchesLibraryFilter", () => {
  it("keeps everything in all mode", () => {
    expect(gameMatchesLibraryFilter(game("10"), filter({ mode: "all" }))).toBe(true);
  });

  it("hides owned games and keeps games without a Steam id", () => {
    const f = filter({ mode: "hide-owned" });
    expect(gameMatchesLibraryFilter(game("10"), f)).toBe(false);
    expect(gameMatchesLibraryFilter(game("11"), f)).toBe(true);
    expect(gameMatchesLibraryFilter(game(), f)).toBe(true);
  });

  it("shows only owned games", () => {
    const f = filter({ mode: "only-owned" });
    expect(gameMatchesLibraryFilter(game("10"), f)).toBe(true);
    expect(gameMatchesLibraryFilter(game("11"), f)).toBe(false);
    expect(gameMatchesLibraryFilter(game(), f)).toBe(false);
  });

  it("shows only wishlisted games", () => {
    const f = filter({ mode: "only-wishlist" });
    expect(gameMatchesLibraryFilter(game("20"), f)).toBe(true);
    expect(gameMatchesLibraryFilter(game("10"), f)).toBe(false);
  });

  it("is a no-op when there is no Steam data", () => {
    const empty = { owned: new Set<string>(), wishlist: new Set<string>() };
    expect(
      gameMatchesLibraryFilter(game("11"), filter({ mode: "only-owned", ...empty })),
    ).toBe(true);
    expect(
      gameMatchesLibraryFilter(game("11"), filter({ mode: "only-wishlist", ...empty })),
    ).toBe(true);
  });
});
