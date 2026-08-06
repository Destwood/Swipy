import { NextResponse } from "next/server";
import { igdbQuery } from "@/features/games/lib/igdb/client";
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
    const offset = (page - 1) * pageSize;

    const fields =
      "fields name, summary, first_release_date, aggregated_rating, total_rating_count, cover.image_id, genres.name, game_modes.name, platforms.name, platforms.abbreviation, multiplayer_modes.campaigncoop, multiplayer_modes.offlinecoop, multiplayer_modes.onlinecoop, multiplayer_modes.lancoop, multiplayer_modes.splitscreen, multiplayer_modes.offlinecoopmax, multiplayer_modes.onlinecoopmax, multiplayer_modes.onlinemax, multiplayer_modes.offlinemax, keywords.name, external_games.uid, external_games.external_game_source;";
    const limit = `limit ${pageSize}; offset ${offset};`;

    // Default catalog: by popularity (rating volume). Search uses IGDB relevance.
    const body = q
      ? `search "${q.replace(/"/g, "")}"; ${fields} where game_type = 0 & cover != null; ${limit}`
      : `${fields} where cover != null & game_type = 0 & total_rating_count >= 500; sort total_rating_count desc; ${limit}`;

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
