import { describe, expect, it } from "vitest";
import type { Game } from "@/features/games/data/games";
import {
  EMPTY_CATALOG_FILTERS,
  catalogFiltersActive,
  gameMatchesCatalogFilters,
  playersBucket,
} from "@/features/games/lib/catalog-filters";

function game(overrides: Partial<Game> = {}): Game {
  return {
    id: "1",
    title: "Game",
    developer: "",
    year: 2020,
    genres: ["Action"],
    description: "",
    image: "",
    ...overrides,
  };
}

describe("catalogFiltersActive", () => {
  it("is false for the empty filters", () => {
    expect(catalogFiltersActive(EMPTY_CATALOG_FILTERS)).toBe(false);
  });

  it.each([
    { genre: "RPG" },
    { priceMax: 500 },
    { priceMin: 50 },
    { onSale: true },
    { reviews: "top" },
    { era: "upcoming" },
    { era: "range", yearMin: 2010 },
    { multi: ["local"] },
    { vibe: ["cozy"] },
    { deck: true },
    { mode: "Co-op" },
    { players: "2" },
    { platform: "Xbox" },
    { platform: "All" },
    { crossplayOnly: true },
  ])("is true when %o is set", (patch) => {
    expect(catalogFiltersActive({ ...EMPTY_CATALOG_FILTERS, ...patch })).toBe(
      true,
    );
  });
});

describe("playersBucket", () => {
  it("returns null for missing or fewer than 2 players", () => {
    expect(playersBucket(undefined)).toBeNull();
    expect(playersBucket(0)).toBeNull();
    expect(playersBucket(1)).toBeNull();
  });

  it("buckets by max players", () => {
    expect(playersBucket(2)).toBe("2");
    expect(playersBucket(3)).toBe("3–4");
    expect(playersBucket(4)).toBe("3–4");
    expect(playersBucket(5)).toBe("5+");
    expect(playersBucket(64)).toBe("5+");
  });
});

const ANY_PLATFORM = { ...EMPTY_CATALOG_FILTERS, platform: "All" };

describe("gameMatchesCatalogFilters", () => {
  it("matches everything with empty filters", () => {
    expect(gameMatchesCatalogFilters(game(), ANY_PLATFORM)).toBe(true);
  });

  it("filters by genre, normalizing IGDB role-playing labels", () => {
    const rpg = game({ genres: ["Role-playing (RPG)"] });
    expect(
      gameMatchesCatalogFilters(rpg, { ...ANY_PLATFORM, genre: "RPG" }),
    ).toBe(true);
    expect(
      gameMatchesCatalogFilters(rpg, {
        ...ANY_PLATFORM,
        genre: "Action",
      }),
    ).toBe(false);
  });

  it("filters by mode and treats missing modes as empty", () => {
    const filters = { ...ANY_PLATFORM, mode: "Co-op" };
    expect(gameMatchesCatalogFilters(game({ modes: ["Co-op"] }), filters)).toBe(
      true,
    );
    expect(gameMatchesCatalogFilters(game({ modes: ["Single"] }), filters)).toBe(
      false,
    );
    expect(gameMatchesCatalogFilters(game(), filters)).toBe(false);
  });

  it("applies the players filter only in Co-op mode", () => {
    const base = { ...ANY_PLATFORM, players: "5+" };
    const twoPlayer = game({ modes: ["Co-op"], coopMaxPlayers: 2 });
    expect(gameMatchesCatalogFilters(twoPlayer, base)).toBe(true);
    expect(
      gameMatchesCatalogFilters(twoPlayer, { ...base, mode: "Co-op" }),
    ).toBe(false);
  });

  it.each([
    ["2", 2, true],
    ["2", 3, false],
    ["3–4", 3, true],
    ["3–4", 4, true],
    ["3–4", 5, false],
    ["5+", 5, true],
    ["5+", 4, false],
  ])("co-op players %s with coopMaxPlayers %i -> %s", (players, max, expected) => {
    const g = game({ modes: ["Co-op"], coopMaxPlayers: max });
    expect(
      gameMatchesCatalogFilters(g, {
        ...ANY_PLATFORM,
        mode: "Co-op",
        players,
      }),
    ).toBe(expected);
  });

  it("treats unknown coopMaxPlayers as 0", () => {
    const g = game({ modes: ["Co-op"] });
    expect(
      gameMatchesCatalogFilters(g, {
        ...ANY_PLATFORM,
        mode: "Co-op",
        players: "2",
      }),
    ).toBe(false);
  });

  it("filters by platform", () => {
    const filters = { ...EMPTY_CATALOG_FILTERS, platform: "PC" };
    expect(
      gameMatchesCatalogFilters(game({ platforms: ["PC", "Xbox"] }), filters),
    ).toBe(true);
    expect(
      gameMatchesCatalogFilters(game({ platforms: ["Xbox"] }), filters),
    ).toBe(false);
    expect(gameMatchesCatalogFilters(game(), filters)).toBe(false);
  });

  it("crossplayOnly requires crossplay === true", () => {
    const filters = { ...ANY_PLATFORM, crossplayOnly: true };
    expect(gameMatchesCatalogFilters(game({ crossplay: true }), filters)).toBe(
      true,
    );
    expect(gameMatchesCatalogFilters(game({ crossplay: false }), filters)).toBe(
      false,
    );
    expect(gameMatchesCatalogFilters(game(), filters)).toBe(false);
  });

  it("combines filters with AND", () => {
    const g = game({
      genres: ["Shooter"],
      modes: ["Multiplayer"],
      platforms: ["PC"],
      crossplay: true,
    });
    expect(
      gameMatchesCatalogFilters(g, {
        ...EMPTY_CATALOG_FILTERS,
        genre: "Shooter",
        mode: "Multiplayer",
        players: "All",
        platform: "PC",
        crossplayOnly: true,
      }),
    ).toBe(true);
    expect(
      gameMatchesCatalogFilters(g, {
        ...EMPTY_CATALOG_FILTERS,
        genre: "Shooter",
        mode: "Multiplayer",
        players: "All",
        platform: "Xbox",
        crossplayOnly: true,
      }),
    ).toBe(false);
  });
});
