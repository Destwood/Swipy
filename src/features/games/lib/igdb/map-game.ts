import type { Game } from "@/features/games/data/games";

/** IGDB external_game_source: 1 = Steam */
const STEAM_SOURCE = 1;

export type IgdbExternalGame = {
  uid?: string;
  external_game_source?: number;
  category?: number;
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
};

export function igdbCoverUrl(imageId: string, size: "cover_big" | "cover_small" = "cover_big") {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export function extractSteamAppId(externalGames?: IgdbExternalGame[]): string | undefined {
  if (!externalGames?.length) return undefined;
  const steam = externalGames.find((g) => {
    const source = g.external_game_source ?? g.category;
    return source === STEAM_SOURCE && Boolean(g.uid) && /^\d+$/.test(g.uid!);
  });
  return steam?.uid;
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

export function mapIgdbGame(game: IgdbGame): Game {
  const year = game.first_release_date
    ? new Date(game.first_release_date * 1000).getUTCFullYear()
    : 0;
  const image = game.cover?.image_id
    ? igdbCoverUrl(game.cover.image_id)
    : "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=820&fit=crop&auto=format";

  return {
    id: `igdb-${game.id}`,
    title: game.name,
    developer: "IGDB",
    year,
    genres: (game.genres ?? [])
      .map((g) => g.name)
      .filter((n): n is string => Boolean(n))
      .slice(0, 3),
    description:
      game.summary?.slice(0, 280) ||
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
  };
}
