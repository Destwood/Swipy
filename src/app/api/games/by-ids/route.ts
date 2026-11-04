import { NextResponse } from "next/server";
import type { Game } from "@/features/games/data/games";
import { igdbQuery } from "@/features/games/lib/igdb/client";
import { mapIgdbGame, type IgdbGame } from "@/features/games/lib/igdb/map-game";
import { fetchSteamGamesByAppIds } from "@/features/games/lib/steam/store-api";

const MAX_IDS = 50;

function parseIds(raw: string): { igdb: number[]; steam: string[]; order: string[] } {
  const igdb: number[] = [];
  const steam: string[] = [];
  const order: string[] = [];
  for (const token of raw.split(",").map((v) => v.trim())) {
    const steamMatch = /^steam-(\d+)$/.exec(token);
    const igdbMatch = /^(?:igdb-)?(\d+)$/.exec(token);
    let key: string | null = null;
    if (steamMatch) {
      key = `steam-${steamMatch[1]}`;
      if (!steam.includes(steamMatch[1])) steam.push(steamMatch[1]);
    } else if (igdbMatch && Number(igdbMatch[1]) > 0) {
      key = `igdb-${Number(igdbMatch[1])}`;
      if (!igdb.includes(Number(igdbMatch[1]))) igdb.push(Number(igdbMatch[1]));
    }
    if (key && !order.includes(key)) order.push(key);
  }
  return { igdb, steam, order: order.slice(0, MAX_IDS) };
}

async function fetchIgdbGames(ids: number[]): Promise<Game[]> {
  if (ids.length === 0) return [];
  const body = [
    "fields name, summary, first_release_date, aggregated_rating, total_rating_count, cover.image_id, genres.name, game_modes.name, platforms.name, platforms.abbreviation, multiplayer_modes.campaigncoop, multiplayer_modes.offlinecoop, multiplayer_modes.onlinecoop, multiplayer_modes.lancoop, multiplayer_modes.splitscreen, multiplayer_modes.offlinecoopmax, multiplayer_modes.onlinecoopmax, multiplayer_modes.onlinemax, multiplayer_modes.offlinemax, keywords.name, external_games.uid, external_games.external_game_source, external_games.category, screenshots.image_id, videos.video_id, involved_companies.developer, involved_companies.company.name;",
    `where id = (${ids.join(",")});`,
    `limit ${ids.length};`,
  ].join(" ");
  const results = await igdbQuery<IgdbGame[]>(body);
  return results.map(mapIgdbGame);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseIds(searchParams.get("ids")?.trim() ?? "");
    const wanted = new Set(parsed.order);
    const igdbIds = parsed.igdb.filter((id) => wanted.has(`igdb-${id}`));
    const steamIds = parsed.steam.filter((id) => wanted.has(`steam-${id}`));

    if (wanted.size === 0) {
      return NextResponse.json({ results: [] });
    }

    const [igdbGames, steamGames] = await Promise.all([
      fetchIgdbGames(igdbIds),
      fetchSteamGamesByAppIds(steamIds),
    ]);
    const byId = new Map([...igdbGames, ...steamGames].map((g) => [g.id, g]));
    const ordered = parsed.order
      .map((id) => byId.get(id))
      .filter((g): g is Game => Boolean(g));

    return NextResponse.json({
      count: ordered.length,
      results: ordered,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog error";
    const status = message.includes("Missing IGDB_") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
