import { NextResponse } from "next/server";
import { igdbQuery } from "@/features/games/lib/igdb/client";
import { mapIgdbGame, type IgdbGame } from "@/features/games/lib/igdb/map-game";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("ids")?.trim() ?? "";
    const ids = [
      ...new Set(
        raw
          .split(",")
          .map((v) => Number(v.trim()))
          .filter((n) => Number.isFinite(n) && n > 0),
      ),
    ].slice(0, 50);

    if (ids.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const body = [
      "fields name, summary, first_release_date, aggregated_rating, total_rating_count, cover.image_id, genres.name, game_modes.name, platforms.name, platforms.abbreviation, multiplayer_modes.campaigncoop, multiplayer_modes.offlinecoop, multiplayer_modes.onlinecoop, multiplayer_modes.lancoop, multiplayer_modes.splitscreen, multiplayer_modes.offlinecoopmax, multiplayer_modes.onlinecoopmax, multiplayer_modes.onlinemax, multiplayer_modes.offlinemax, keywords.name, external_games.uid, external_games.external_game_source, external_games.category, screenshots.image_id, videos.video_id, involved_companies.developer, involved_companies.company.name;",
      `where id = (${ids.join(",")});`,
      `limit ${ids.length};`,
    ].join(" ");

    const results = await igdbQuery<IgdbGame[]>(body);
    const byId = new Map(results.map((g) => [g.id, mapIgdbGame(g)]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((g): g is NonNullable<typeof g> => Boolean(g));

    return NextResponse.json({
      count: ordered.length,
      results: ordered,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IGDB error";
    const status = message.includes("Missing IGDB_") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
