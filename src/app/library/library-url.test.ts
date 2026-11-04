import { describe, expect, it } from "vitest";
import { EMPTY_CATALOG_FILTERS } from "@/features/games/lib/catalog-filters";
import { parseLibraryUrl, serializeLibraryUrl } from "./library-url";

describe("library url state", () => {
  it("falls back to defaults for an empty query string", () => {
    expect(parseLibraryUrl("")).toEqual({
      filters: EMPTY_CATALOG_FILTERS,
      sort: "popular",
      query: "",
    });
  });

  it("serializes defaults to an empty string", () => {
    expect(
      serializeLibraryUrl({
        filters: EMPTY_CATALOG_FILTERS,
        sort: "popular",
        query: "  ",
      }),
    ).toBe("");
  });

  it("round-trips a full state", () => {
    const state = {
      filters: {
        genre: "RPG",
        mode: "Co-op",
        players: "3–4",
        platform: "Xbox",
        crossplayOnly: true,
        priceMin: 100,
        priceMax: 600,
        onSale: true,
        reviews: "very",
        era: "range",
        yearMin: 2010,
        yearMax: 2020,
        multi: ["online", "pvp"],
        vibe: ["cozy", "short"],
        deck: true,
        demo: true,
      },
      sort: "year" as const,
      query: "elden ring",
    };
    expect(parseLibraryUrl(serializeLibraryUrl(state))).toEqual(state);
  });

  it("keeps an explicit all-platforms choice", () => {
    const state = parseLibraryUrl("platform=All");
    expect(state.filters.platform).toBe("All");
    expect(
      serializeLibraryUrl({ ...state, filters: { ...state.filters } }),
    ).toBe("platform=All");
  });

  it("ignores unknown values and players outside co-op", () => {
    const state = parseLibraryUrl(
      "genre=Nope&mode=Single&players=2&platform=Atari&sort=weird",
    );
    expect(state.filters).toEqual({
      ...EMPTY_CATALOG_FILTERS,
      mode: "Single",
      players: "All",
    });
    expect(state.sort).toBe("popular");
  });

  it("drops unknown extra filter values", () => {
    const state = parseLibraryUrl(
      "pmin=abc&pmax=&ymin=x&reviews=meh&era=2030&multi=bogus&vibe=nope&sale=0&deck=2",
    );
    expect(state.filters).toEqual(EMPTY_CATALOG_FILTERS);
  });

  it("clamps and orders range values", () => {
    const state = parseLibraryUrl("pmin=900&pmax=100&ymin=2030&ymax=1900");
    expect(state.filters.priceMin).toBe(100);
    expect(state.filters.priceMax).toBe(900);
    expect(state.filters.yearMin).toBe(1995);
    expect(state.filters.era).toBe("range");
  });

  it("keeps the upcoming and last-month presets", () => {
    expect(parseLibraryUrl("era=upcoming").filters.era).toBe("upcoming");
    expect(parseLibraryUrl("era=month").filters.era).toBe("month");
    expect(serializeLibraryUrl(parseLibraryUrl("era=month"))).toBe("era=month");
  });

  it("truncates very long queries", () => {
    expect(parseLibraryUrl(`q=${"a".repeat(200)}`).query).toHaveLength(80);
  });
});
