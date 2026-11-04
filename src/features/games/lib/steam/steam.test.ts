import { describe, expect, it } from "vitest";
import {
  buildSteamQueryInput,
  needsPricePostFilter,
  steamPriceBounds,
  type SteamCatalogInput,
} from "./catalog-query";
import { EMPTY_EXTRA_FILTERS } from "@/features/games/lib/catalog-filters";
import { mapSteamItem, type SteamStoreItem } from "./map-item";

const base: SteamCatalogInput = {
  ...EMPTY_EXTRA_FILTERS,
  genres: [],
  mode: "All",
  players: "All",
  sort: "popular",
  start: 0,
  count: 20,
};

function item(overrides: Partial<SteamStoreItem> = {}): SteamStoreItem {
  return {
    appid: 1245620,
    name: "ELDEN RING",
    type: 0,
    success: 1,
    visible: true,
    tagids: [19, 122, 1685, 3843],
    categories: { supported_player_categoryids: [2, 1, 9, 38, 27] },
    reviews: { summary_filtered: { review_count: 900000 } },
    basic_info: {
      short_description: "Rise, Tarnished.",
      developers: [{ name: "FromSoftware" }],
    },
    release: { steam_release_date: 1645744078 },
    assets: {
      asset_url_format: "steam/apps/1245620/${FILENAME}?t=1",
      library_capsule: "library_600x900.jpg",
    },
    screenshots: { all_ages_screenshots: [{ filename: "steam/apps/1/ss.jpg" }] },
    ...overrides,
  };
}

describe("mapSteamItem", () => {
  it("maps a Steam game into a PC Game", () => {
    const game = mapSteamItem(item());
    expect(game).toMatchObject({
      id: "steam-1245620",
      steamAppId: "1245620",
      developer: "FromSoftware",
      year: 2022,
      platforms: ["PC"],
      crossplay: true,
      coopMaxPlayers: 2,
    });
    expect(game?.genres).toEqual(["Action", "RPG"]);
    expect(game?.modes).toEqual(["Single", "Multiplayer", "Co-op"]);
    expect(game?.image).toBe(
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900.jpg?t=1",
    );
  });

  it.each([
    { type: 4 },
    { success: 15 },
    { visible: false },
    { name: undefined },
  ])("skips non-purchasable or non-game items %o", (patch) => {
    expect(mapSteamItem(item(patch))).toBeNull();
  });

  it("derives larger co-op sizes from tags", () => {
    expect(mapSteamItem(item({ tagids: [1685, 4840] }))?.coopMaxPlayers).toBe(4);
    expect(mapSteamItem(item({ tagids: [1685, 128] }))?.coopMaxPlayers).toBe(8);
  });
});

describe("buildSteamQueryInput", () => {
  it("always restricts to released games and quality-gates them", () => {
    const query = buildSteamQueryInput(base);
    expect(query.sort).toBe(11);
    expect(query.filters).toMatchObject({
      released_only: true,
      type_filters: { include_games: true },
      review_score_filter: { min_score: 5, allow_unreviewed: false },
    });
    expect(query.filters.tagids_must_match).toBeUndefined();
  });

  it("ORs genres in one tag group and ANDs the play mode", () => {
    const query = buildSteamQueryInput({
      ...base,
      genres: ["Action", "RPG"],
      mode: "Co-op",
      players: "3–4",
    });
    expect(query.filters.tagids_must_match).toEqual([
      { tagids: [19, 122] },
      { tagids: [1685, 3843, 3841] },
      { tagids: [4840] },
    ]);
  });

  it("excludes bigger groups for two-player co-op", () => {
    const query = buildSteamQueryInput({ ...base, mode: "Co-op", players: "2" });
    expect(query.filters.tagids_exclude).toEqual([4840, 128]);
  });

  it("maps sorts to Steam sort ids", () => {
    expect(buildSteamQueryInput({ ...base, sort: "year" }).sort).toBe(20);
    expect(buildSteamQueryInput({ ...base, sort: "rating" }).sort).toBe(21);
    expect(buildSteamQueryInput({ ...base, sort: "name" }).sort).toBe(1);
  });

  it("maps price, sale, reviews, era and Deck to Steam filters", () => {
    const now = Date.UTC(2026, 10, 4, 15) ;
    const query = buildSteamQueryInput(
      {
        ...base,
        priceMax: 0,
        onSale: true,
        reviews: "top",
        era: "month",
        deck: true,
      },
      now,
    );
    expect(query.filters).toMatchObject({
      price_filters: { only_free_items: true, min_discount_percent: 1 },
      review_score_filter: { min_score: 9 },
      release_date_filter: {
        release_date_type: 1,
        start_date: Date.UTC(2026, 9, 5) / 1000,
      },
      compatibility_filter: { device: 1, categories: [2, 3] },
    });
  });

  it("keeps the stricter of sort and review thresholds", () => {
    const query = buildSteamQueryInput({ ...base, sort: "rating", reviews: "positive" });
    expect(query.filters).toMatchObject({ review_score_filter: { min_score: 8 } });
  });

  it("ANDs each vibe and ORs the multiplayer kinds", () => {
    const query = buildSteamQueryInput({
      ...base,
      multi: ["online", "local"],
      vibe: ["cozy", "short"],
    });
    expect(query.filters.tagids_must_match).toEqual([
      { tagids: [3843, 3841, 7368, 10816] },
      { tagids: [97376, 1654] },
      { tagids: [4234] },
    ]);
  });

  it("limits a year range to whole calendar years", () => {
    const query = buildSteamQueryInput({
      ...base,
      era: "range",
      yearMin: 2010,
      yearMax: 2012,
    });
    expect(query.filters).toMatchObject({
      released_only: true,
      release_date_filter: {
        release_date_type: 1,
        start_date: Date.UTC(2010, 0, 1) / 1000,
        end_date: Date.UTC(2013, 0, 1) / 1000 - 1,
      },
    });
  });

  it("asks for unreleased games without a review gate", () => {
    const query = buildSteamQueryInput({ ...base, era: "upcoming", sort: "name" });
    expect(query.filters.coming_soon_only).toBe(true);
    expect(query.filters.released_only).toBeUndefined();
    expect(query.filters.review_score_filter).toBeUndefined();
    expect(query.sort).toBe(11);
  });

  it("uses server price filters only at the free edges", () => {
    expect(
      buildSteamQueryInput({ ...base, priceMin: 100 }).filters.price_filters,
    ).toEqual({ exclude_free_items: true });
    expect(
      buildSteamQueryInput({ ...base, priceMax: 300 }).filters.price_filters,
    ).toBeUndefined();
    expect(needsPricePostFilter({ ...base, priceMax: 300 })).toBe(true);
    expect(needsPricePostFilter({ ...base, priceMax: 0 })).toBe(false);
    expect(needsPricePostFilter(base)).toBe(false);
    expect(steamPriceBounds({ ...base, priceMin: 100, priceMax: 300 })).toEqual({
      minCents: 10000,
      maxCents: 30000,
    });
  });
});
