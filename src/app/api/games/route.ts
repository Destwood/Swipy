import { NextResponse } from "next/server";
import { isSteamPlatforms } from "@/features/games/lib/catalog-filters";
import { igdbQuery } from "@/features/games/lib/igdb/client";
import { fetchSteamCatalog } from "@/features/games/lib/steam/store-api";
import {
  CATALOG_SEARCH_FIELDS,
  buildIgdbCatalogQuery,
  cleanCatalogQuery,
  buildInfiniteCatalogQuery,
  parseCatalogFilters,
  parseCatalogSort,
  parseInfiniteFilterParams,
} from "@/features/games/lib/igdb/catalog-query";
import { mapIgdbGame, type IgdbGame } from "@/features/games/lib/igdb/map-game";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(searchParams.get("page_size") ?? "24") || 24),
    );
    const filters = parseCatalogFilters(searchParams);
    const sort = parseCatalogSort(searchParams.get("sort"));
    const infinite = searchParams.get("infinite") === "1";
    const infiniteFilters = parseInfiniteFilterParams(searchParams);

    if (
      infinite
        ? isSteamPlatforms(infiniteFilters.platforms)
        : isSteamPlatforms([filters.platform])
    ) {
      const { games, hasNext: steamHasNext } = await fetchSteamCatalog({
        q: infinite ? "" : q,
        page,
        pageSize,
        sort: infinite ? "popular" : sort,
        genres: infinite
          ? infiniteFilters.genres
          : filters.genre === "All"
            ? []
            : [filters.genre],
        mode: infinite ? infiniteFilters.mode : filters.mode,
        players: infinite ? infiniteFilters.players : filters.players,
        crossplay: infinite ? infiniteFilters.crossplayOnly : filters.crossplayOnly,
        ...(infinite
          ? infiniteFilters.extra
          : {
              priceMin: filters.priceMin,
              priceMax: filters.priceMax,
              onSale: filters.onSale,
              reviews: filters.reviews,
              era: filters.era,
              yearMin: filters.yearMin,
              yearMax: filters.yearMax,
              multi: filters.multi,
              vibe: filters.vibe,
              deck: filters.deck,
              demo: filters.demo,
            }),
      });
      return NextResponse.json({
        count: games.length,
        next: steamHasNext,
        results: games,
      });
    }

    let results: IgdbGame[];
    let hasNext: boolean;

    if (infinite) {
      results = await igdbQuery<IgdbGame[]>(
        buildInfiniteCatalogQuery({
          page,
          pageSize,
          filters: infiniteFilters,
        }),
      );
      hasNext = results.length >= pageSize;
    } else if (cleanCatalogQuery(q).length >= 2) {
      const fields = CATALOG_SEARCH_FIELDS.filter(
        (field) => field !== "summary" || cleanCatalogQuery(q).length >= 3,
      );
      const groups = await Promise.allSettled(
        fields.map((field) =>
          igdbQuery<IgdbGame[]>(
            buildIgdbCatalogQuery({ q, page, pageSize, filters, sort, field }),
          ),
        ),
      );
      const [byName] = groups;
      if (byName.status === "rejected") throw byName.reason;

      const seen = new Set<number>();
      results = [];
      hasNext = false;
      for (const group of groups) {
        if (group.status !== "fulfilled") continue;
        if (group.value.length >= pageSize) hasNext = true;
        for (const game of group.value) {
          if (seen.has(game.id)) continue;
          seen.add(game.id);
          results.push(game);
        }
      }
    } else {
      results = await igdbQuery<IgdbGame[]>(
        buildIgdbCatalogQuery({ q, page, pageSize, filters, sort }),
      );
      hasNext = results.length >= pageSize;
    }

    return NextResponse.json({
      count: results.length,
      next: hasNext,
      results: results.map(mapIgdbGame),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog error";
    const status = message.includes("Missing IGDB_") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
