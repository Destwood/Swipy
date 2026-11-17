const API_ORIGIN = "https://api.steampowered.com";
const TIMEOUT_MS = 15_000;

export type SteamOwnedGame = { appId: string; playtimeMinutes: number };
export type SteamWishlistItem = { appId: string; addedAt: string | null };
export type SteamPlayerSummary = {
  personaName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
};

function apiKey(): string {
  const key = process.env.STEAM_API_KEY?.trim();
  if (!key) throw new Error("Missing STEAM_API_KEY");
  return key;
}

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(path, API_ORIGIN);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Steam API ${res.status}`);
  return (await res.json()) as T;
}

type OwnedGamesResponse = {
  response?: {
    game_count?: number;
    games?: { appid: number; playtime_forever?: number }[];
  };
};

/** `private` when Steam hides the library (profile / game details not public). */
export async function fetchOwnedGames(
  steamId: string,
): Promise<{ status: "ok" | "private"; games: SteamOwnedGame[] }> {
  const data = await getJson<OwnedGamesResponse>(
    "/IPlayerService/GetOwnedGames/v1/",
    {
      key: apiKey(),
      steamid: steamId,
      include_played_free_games: "1",
    },
  );
  const response = data.response;
  if (!response || typeof response.game_count !== "number") {
    return { status: "private", games: [] };
  }
  return {
    status: "ok",
    games: (response.games ?? []).map((game) => ({
      appId: String(game.appid),
      playtimeMinutes: game.playtime_forever ?? 0,
    })),
  };
}

type WishlistResponse = {
  response?: { items?: { appid: number; date_added?: number }[] };
};

/** Steam returns an empty body both for an empty and for a hidden wishlist. */
export async function fetchWishlist(
  steamId: string,
): Promise<{ status: "ok" | "empty"; items: SteamWishlistItem[] }> {
  const data = await getJson<WishlistResponse>(
    "/IWishlistService/GetWishlist/v1/",
    { steamid: steamId },
  );
  const items = (data.response?.items ?? []).map((item) => ({
    appId: String(item.appid),
    addedAt:
      typeof item.date_added === "number" && item.date_added > 0
        ? new Date(item.date_added * 1000).toISOString()
        : null,
  }));
  return { status: items.length > 0 ? "ok" : "empty", items };
}

type PlayerSummariesResponse = {
  response?: {
    players?: { personaname?: string; avatarfull?: string; profileurl?: string }[];
  };
};

export async function fetchPlayerSummary(
  steamId: string,
): Promise<SteamPlayerSummary | null> {
  const data = await getJson<PlayerSummariesResponse>(
    "/ISteamUser/GetPlayerSummaries/v2/",
    { key: apiKey(), steamids: steamId },
  );
  const player = data.response?.players?.[0];
  if (!player) return null;
  return {
    personaName: player.personaname ?? null,
    avatarUrl: player.avatarfull ?? null,
    profileUrl: player.profileurl ?? null,
  };
}
