import type { Game } from "@/features/games/data/games";

const ASSET_BASE = "https://shared.akamai.steamstatic.com/store_item_assets/";

export const STEAM_GENRE_TAGS: Record<string, number[]> = {
  Action: [19],
  Adventure: [21],
  Arcade: [1773],
  "Card & Board Game": [1666, 1770],
  Fighting: [1743],
  "Hack and slash/Beat 'em up": [1646, 4158],
  Indie: [492],
  MOBA: [1718],
  Music: [1621, 1752],
  Pinball: [6621],
  Platform: [1625],
  "Point-and-click": [1698],
  Puzzle: [1664],
  "Quiz/Trivia": [10437],
  Racing: [699],
  "Real Time Strategy (RTS)": [1676],
  RPG: [122],
  Shooter: [1774],
  Simulator: [599],
  Sport: [701],
  Strategy: [9],
  Tactical: [1708],
  "Turn-based strategy (TBS)": [1741],
  "Visual Novel": [3799],
};

export const TAG_SINGLEPLAYER = 4182;
export const TAG_MULTIPLAYER = 3859;
export const TAGS_COOP = [1685, 3843, 3841];
export const TAG_FOUR_PLAYER_LOCAL = 4840;
export const TAG_MASSIVELY_MULTIPLAYER = 128;

export const STEAM_MULTI_TAGS: Record<string, number[]> = {
  online: [3843],
  local: [3841, 7368, 10816],
  pvp: [1775],
};

export const STEAM_VIBE_TAGS: Record<string, number[]> = {
  cozy: [97376, 1654],
  story: [1742],
  hard: [4026, 29482],
  short: [4234],
  atmospheric: [4166],
};

const CATEGORY_SINGLE = [2];
const CATEGORY_MULTI = [1, 20, 36, 37, 47, 49];
const CATEGORY_COOP = [9, 38, 39, 48];
const CATEGORY_CROSSPLAY = 27;

type SteamAsset = { filename?: string };

export type SteamStoreItem = {
  appid?: number;
  name?: string;
  type?: number;
  success?: number;
  visible?: boolean;
  tagids?: number[];
  related_items?: {
    demo_appid?: number[];
    standalone_demo_appid?: number[];
  };
  is_free?: boolean;
  best_purchase_option?: { final_price_in_cents?: string };
  categories?: { supported_player_categoryids?: number[] };
  reviews?: { summary_filtered?: { review_count?: number } };
  basic_info?: {
    short_description?: string;
    developers?: { name?: string }[];
  };
  release?: { steam_release_date?: number };
  assets?: {
    asset_url_format?: string;
    library_capsule?: string;
    header?: string;
  };
  screenshots?: { all_ages_screenshots?: SteamAsset[] };
};

function hasAny(list: number[] | undefined, wanted: readonly number[]) {
  return Boolean(list?.some((id) => wanted.includes(id)));
}

function assetUrl(item: SteamStoreItem, file?: string): string | null {
  const format = item.assets?.asset_url_format;
  if (!format || !file) return null;
  return ASSET_BASE + format.replace("${FILENAME}", file);
}

const GENRE_BY_TAG = new Map<number, string>(
  Object.entries(STEAM_GENRE_TAGS).flatMap(([label, ids]) =>
    ids.map((id): [number, string] => [id, label]),
  ),
);

function deriveGenres(tags: number[]): string[] {
  const labels = tags
    .map((id) => GENRE_BY_TAG.get(id))
    .filter((label): label is string => Boolean(label));
  return [...new Set(labels)].slice(0, 3);
}

function deriveModes(tags: number[], categories: number[]): string[] {
  const modes: string[] = [];
  if (hasAny(categories, CATEGORY_SINGLE) || tags.includes(TAG_SINGLEPLAYER)) {
    modes.push("Single");
  }
  if (hasAny(categories, CATEGORY_MULTI) || tags.includes(TAG_MULTIPLAYER)) {
    modes.push("Multiplayer");
  }
  if (hasAny(categories, CATEGORY_COOP) || hasAny(tags, TAGS_COOP)) {
    modes.push("Co-op");
  }
  return modes;
}

function deriveCoopMax(tags: number[], isCoop: boolean): number | undefined {
  if (!isCoop) return undefined;
  if (tags.includes(TAG_MASSIVELY_MULTIPLAYER)) return 8;
  if (tags.includes(TAG_FOUR_PLAYER_LOCAL)) return 4;
  return 2;
}

export function mapSteamItem(item: SteamStoreItem): Game | null {
  if (item.success !== 1 || item.visible === false) return null;
  if (item.type !== 0 || !item.appid || !item.name) return null;

  const appId = String(item.appid);
  const tags = item.tagids ?? [];
  const categories = item.categories?.supported_player_categoryids ?? [];
  const modes = deriveModes(tags, categories);
  const releaseSec = item.release?.steam_release_date;
  const released = releaseSec ? new Date(releaseSec * 1000) : null;
  const year = released ? released.getUTCFullYear() : 0;

  const image =
    assetUrl(item, item.assets?.library_capsule) ??
    assetUrl(item, item.assets?.header) ??
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

  const screenshots = (item.screenshots?.all_ages_screenshots ?? [])
    .map((s) => (s.filename ? ASSET_BASE + s.filename : null))
    .filter((url): url is string => Boolean(url))
    .slice(0, 6);

  return {
    id: `steam-${appId}`,
    title: item.name,
    developer: item.basic_info?.developers?.[0]?.name ?? "Unknown",
    year,
    releaseDate: released ? released.toISOString().slice(0, 10) : undefined,
    genres: deriveGenres(tags),
    description:
      item.basic_info?.short_description?.trim().slice(0, 600) ||
      (year ? `${item.name} (${year}) on Steam.` : `${item.name} on Steam.`),
    image,
    ratingCount: item.reviews?.summary_filtered?.review_count || undefined,
    steamAppId: appId,
    modes,
    platforms: ["PC"],
    coopMaxPlayers: deriveCoopMax(tags, modes.includes("Co-op")),
    crossplay: categories.includes(CATEGORY_CROSSPLAY),
    screenshots,
  };
}
