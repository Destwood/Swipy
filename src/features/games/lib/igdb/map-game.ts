import type { Game } from "@/features/games/data/games";
import { igdbCoverUrl } from "./image";

export { igdbCoverUrl } from "./image";

/** IGDB external_game_source: 1 = Steam */
const STEAM_SOURCE = 1;

export type IgdbExternalGame = {
  uid?: string;
  external_game_source?: number | { id?: number };
  /** Legacy IGDB field — same enum as external_game_source (Steam = 1). */
  category?: number | { id?: number };
};

export type IgdbMultiplayerMode = {
  campaigncoop?: boolean;
  offlinecoop?: boolean;
  onlinecoop?: boolean;
  lancoop?: boolean;
  splitscreen?: boolean;
  offlinecoopmax?: number;
  onlinecoopmax?: number;
  onlinemax?: number;
  offlinemax?: number;
};

export type IgdbGame = {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number;
  aggregated_rating?: number;
  total_rating_count?: number;
  cover?: { image_id?: string };
  genres?: { name?: string }[];
  game_modes?: { name?: string }[];
  platforms?: { name?: string; abbreviation?: string }[];
  multiplayer_modes?: IgdbMultiplayerMode[];
  keywords?: { name?: string }[];
  external_games?: IgdbExternalGame[];
  screenshots?: { image_id?: string }[];
  videos?: { video_id?: string }[];
  involved_companies?: {
    developer?: boolean;
    company?: { name?: string };
  }[];
};

export function extractSteamAppId(externalGames?: IgdbExternalGame[]): string | undefined {
  if (!externalGames?.length) return undefined;
  const steam = externalGames.find((g) => {
    const source =
      externalSourceId(g.external_game_source) ??
      externalSourceId(g.category);
    return (
      source === STEAM_SOURCE &&
      Boolean(g.uid) &&
      /^\d+$/.test(String(g.uid))
    );
  });
  return steam?.uid ? String(steam.uid) : undefined;
}

function externalSourceId(
  source: number | { id?: number } | undefined,
): number | undefined {
  if (source == null) return undefined;
  if (typeof source === "number") return source;
  if (typeof source === "object" && typeof source.id === "number") {
    return source.id;
  }
  return undefined;
}

function normalizeMode(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("co-op") || n.includes("coop") || n.includes("co-operative")) {
    return "Co-op";
  }
  if (n.includes("multi")) return "Multiplayer";
  if (n.includes("single")) return "Single";
  return null;
}

function platformBucket(p: { name?: string; abbreviation?: string }): string | null {
  const hay = `${p.name ?? ""} ${p.abbreviation ?? ""}`.toLowerCase();
  if (hay.includes("windows") || hay === "pc" || hay.startsWith("pc ")) return "PC";
  if (hay.includes("mac") || hay.includes("linux")) return "PC";
  if (hay.includes("playstation") || hay.includes("ps4") || hay.includes("ps5") || hay.includes("ps3")) {
    return "PlayStation";
  }
  if (hay.includes("xbox") || hay.includes("series")) return "Xbox";
  if (hay.includes("switch") || hay.includes("nintendo")) return "Nintendo";
  return null;
}

function deriveModes(game: IgdbGame): string[] {
  const modes = new Set<string>();
  for (const m of game.game_modes ?? []) {
    if (!m.name) continue;
    const normalized = normalizeMode(m.name);
    if (normalized) modes.add(normalized);
  }
  const mp = game.multiplayer_modes ?? [];
  if (
    mp.some(
      (m) =>
        m.onlinecoop ||
        m.offlinecoop ||
        m.campaigncoop ||
        m.lancoop ||
        m.splitscreen,
    )
  ) {
    modes.add("Co-op");
  }
  if (mp.some((m) => (m.onlinemax ?? 0) > 1 || (m.offlinemax ?? 0) > 1)) {
    modes.add("Multiplayer");
  }
  return [...modes];
}

function deriveCoopMax(game: IgdbGame): number | undefined {
  let max = 0;
  for (const m of game.multiplayer_modes ?? []) {
    const isCoop =
      m.onlinecoop || m.offlinecoop || m.campaigncoop || m.lancoop || m.splitscreen;
    if (!isCoop) continue;
    max = Math.max(
      max,
      m.onlinecoopmax ?? 0,
      m.offlinecoopmax ?? 0,
      m.onlinemax ?? 0,
      m.offlinemax ?? 0,
    );
  }
  return max > 0 ? max : undefined;
}

function derivePlatforms(game: IgdbGame): string[] {
  const set = new Set<string>();
  for (const p of game.platforms ?? []) {
    const bucket = platformBucket(p);
    if (bucket) set.add(bucket);
  }
  return [...set];
}

function deriveCrossplay(game: IgdbGame): boolean {
  const keywords = game.keywords ?? [];
  if (
    keywords.some((k) => {
      const n = (k.name ?? "").toLowerCase();
      return (
        n.includes("crossplay") ||
        n.includes("cross-play") ||
        n.includes("cross play") ||
        n.includes("cross-platform multiplayer") ||
        n.includes("cross platform multiplayer")
      );
    })
  ) {
    return true;
  }
  // Soft signal: online multi + PC + at least one console family
  const platforms = derivePlatforms(game);
  const hasOnline = (game.multiplayer_modes ?? []).some(
    (m) => m.onlinecoop || (m.onlinemax ?? 0) > 1,
  );
  const hasConsole = platforms.some((p) => p !== "PC");
  return hasOnline && platforms.includes("PC") && hasConsole;
}

function deriveDeveloper(game: IgdbGame): string {
  const dev = game.involved_companies?.find(
    (c) => c.developer && c.company?.name,
  );
  return dev?.company?.name ?? "Unknown";
}

export function mapIgdbGame(game: IgdbGame): Game {
  const released = game.first_release_date
    ? new Date(game.first_release_date * 1000)
    : null;
  const year = released ? released.getUTCFullYear() : 0;
  const releaseDate = released
    ? released.toISOString().slice(0, 10)
    : undefined;
  const image = game.cover?.image_id
    ? igdbCoverUrl(game.cover.image_id, "cover_big_2x")
    : "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=820&fit=crop&auto=format";

  const screenshots = (game.screenshots ?? [])
    .map((s) => (s.image_id ? igdbCoverUrl(s.image_id, "720p") : null))
    .filter((url): url is string => Boolean(url))
    .slice(0, 6);

  return {
    id: `igdb-${game.id}`,
    title: game.name,
    developer: deriveDeveloper(game),
    year,
    releaseDate,
    genres: (game.genres ?? [])
      .map((g) => g.name)
      .filter((n): n is string => Boolean(n))
      .slice(0, 5),
    description:
      game.summary?.slice(0, 600) ||
      (year ? `${game.name} (${year}) from IGDB.` : `${game.name} from IGDB.`),
    image,
    metacritic: game.aggregated_rating
      ? Math.round(game.aggregated_rating)
      : undefined,
    ratingCount: game.total_rating_count ?? undefined,
    steamAppId: extractSteamAppId(game.external_games),
    modes: deriveModes(game),
    platforms: derivePlatforms(game),
    coopMaxPlayers: deriveCoopMax(game),
    crossplay: deriveCrossplay(game),
    screenshots,
    youtubeId: game.videos?.find((v) => v.video_id)?.video_id,
  };
}
