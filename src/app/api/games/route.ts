import { NextResponse } from "next/server";
import { igdbQuery } from "@/features/games/lib/igdb/client";
import {
  buildIgdbCatalogQuery,
  parseCatalogFilters,
  parseCatalogSort,
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
    const body = buildIgdbCatalogQuery({ q, page, pageSize, filters, sort });
    const results = await igdbQuery<IgdbGame[]>(body);

    return NextResponse.json({
      count: results.length,
      next: results.length >= pageSize,
      results: results.map(mapIgdbGame),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IGDB error";
    const status = message.includes("Missing IGDB_") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
