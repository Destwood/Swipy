import { describe, expect, it } from "vitest";
import { buildSteamQueryInput } from "@/features/games/lib/steam/catalog-query";
import { EMPTY_EXTRA_FILTERS } from "@/features/games/lib/catalog-filters";
import {
  EMPTY_INFINITE_FILTERS,
  filtersToKey,
  infiniteFilterLabel,
  infiniteFilterSearchParams,
  normalizeInfiniteFilters,
  type InfiniteFilterState,
} from "./infinite-filters";

const withExtra = (
  patch: Partial<InfiniteFilterState["extra"]>,
  base: Partial<InfiniteFilterState> = {},
): InfiniteFilterState => ({
  ...EMPTY_INFINITE_FILTERS,
  ...base,
  extra: { ...EMPTY_EXTRA_FILTERS, ...patch },
});

describe("infinite filters extras", () => {
  it("builds the same key regardless of selection order", () => {
    const a = withExtra({ vibe: ["cozy", "story"], multi: ["pvp", "online"] });
    const b = withExtra({ vibe: ["story", "cozy"], multi: ["online", "pvp"] });
    expect(filtersToKey(a)).toBe(filtersToKey(b));
    expect(filtersToKey(a)).not.toBe(filtersToKey(EMPTY_INFINITE_FILTERS));
  });

  it("sends extras only for PC-only selections", () => {
    const steam = infiniteFilterSearchParams(withExtra({ onSale: true }), 1, 20);
    expect(steam.get("sale")).toBe("1");
    const console = infiniteFilterSearchParams(
      withExtra({ onSale: true }, { platforms: ["PlayStation"] }),
      1,
      20,
    );
    expect(console.get("sale")).toBeNull();
  });

  it("drops extras when PC is not the only platform", () => {
    const next = normalizeInfiniteFilters(
      withExtra({ onSale: true }, { platforms: ["PC", "Xbox"] }),
    );
    expect(next.extra).toEqual(EMPTY_EXTRA_FILTERS);
  });

  it("mentions extras in the label", () => {
    const label = infiniteFilterLabel(withExtra({ onSale: true, deck: true }));
    expect(label).toContain("On sale");
    expect(label).toContain("Steam Deck");
  });
});

describe("infinite filters release and demo", () => {
  it("combines last month and upcoming into one release window", () => {
    const query = buildSteamQueryInput(
      {
        ...EMPTY_EXTRA_FILTERS,
        era: "recent",
        genres: [],
        mode: "All",
        players: "All",
        sort: "popular",
        start: 0,
        count: 20,
      },
      Date.UTC(2026, 5, 15),
    );
    expect(query.filters.coming_soon_only).toBeUndefined();
    expect(query.filters.released_only).toBeUndefined();
    expect(query.filters.release_date_filter).toMatchObject({
      start_date: Date.UTC(2026, 4, 16) / 1000,
    });
  });

  it("serialises the demo flag and era", () => {
    const params = infiniteFilterSearchParams(
      withExtra({ demo: true, era: "recent" }),
      1,
      20,
    );
    expect(params.get("demo")).toBe("1");
    expect(params.get("era")).toBe("recent");
    expect(infiniteFilterLabel(withExtra({ demo: true }))).toContain("Has demo");
  });
});

describe("infinite filters skip viewed", () => {
  it("changes the key and label but is not sent to the server", () => {
    const on = { ...EMPTY_INFINITE_FILTERS, skipSeen: true };
    expect(filtersToKey(on)).not.toBe(filtersToKey(EMPTY_INFINITE_FILTERS));
    expect(infiniteFilterLabel(on)).toContain("Skip viewed");
    expect(infiniteFilterSearchParams(on, 1, 20).has("skipSeen")).toBe(false);
  });
});
