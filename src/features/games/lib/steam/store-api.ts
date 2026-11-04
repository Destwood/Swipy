import type { Game } from "@/features/games/data/games";
import {
  gameMatchesCatalogFilters,
  type ExtraFilters,
} from "@/features/games/lib/catalog-filters";
import type { SortValue } from "@/features/games/lib/sort-games";
import {
  buildSteamQueryInput,
  needsPricePostFilter,
  steamPriceBounds,
} from "./catalog-query";
import { mapSteamItem, type SteamStoreItem } from "./map-item";

const API = "https://api.steampowered.com";
const REVALIDATE_SEC = 3600;
const ITEMS_CHUNK = 50;
const CROSSPLAY_OVERSAMPLE = 4;
const DEMO_OVERSAMPLE = 6;
const MIN_SEARCH_LENGTH = 2;

const COUNTRY = (process.env.STEAM_STORE_CC?.trim() || "ua").toUpperCase();

const CONTEXT = { language: "english", country_code: COUNTRY };

const DATA_REQUEST = {
  include_basic_info: true,
  include_release: true,
  include_reviews: true,
  include_assets: true,
  include_screenshots: true,
  include_tag_count: 20,
};

export type SteamCatalogRequest = ExtraFilters & {
  q: string;
  page: number;
  pageSize: number;
  sort: SortValue;
  genres: string[];
  mode: string;
  players: string;
  crossplay: boolean;
};

function itemHasDemo(item: SteamStoreItem): boolean {
  const related = item.related_items;
  return Boolean(
    related?.demo_appid?.length || related?.standalone_demo_appid?.length,
  );
}

async function steamJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SEC } });
  if (!res.ok) throw new Error(`Steam store unavailable (${res.status})`);
  return (await res.json()) as T;
}

function inputUrl(path: string, input: unknown): string {
  return `${API}/${path}?input_json=${encodeURIComponent(JSON.stringify(input))}`;
}

export async function fetchSteamGamesByAppIds(appIds: string[]): Promise<Game[]> {
  const unique = [...new Set(appIds.filter((id) => /^\d+$/.test(id)))];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += ITEMS_CHUNK) {
    chunks.push(unique.slice(i, i + ITEMS_CHUNK));
  }

  const responses = await Promise.all(
    chunks.map((chunk) =>
      steamJson<{ response?: { store_items?: SteamStoreItem[] } }>(
        inputUrl("IStoreBrowseService/GetItems/v1/", {
          ids: chunk.map((appid) => ({ appid: Number(appid) })),
          context: CONTEXT,
          data_request: DATA_REQUEST,
        }),
      ),
    ),
  );

  const byId = new Map<string, Game>();
  for (const response of responses) {
    for (const item of response.response?.store_items ?? []) {
      const game = mapSteamItem(item);
      if (game?.steamAppId) byId.set(game.steamAppId, game);
    }
  }
  return unique
    .map((id) => byId.get(id))
    .filter((game): game is Game => Boolean(game));
}

async function searchSteamGames(request: SteamCatalogRequest): Promise<Game[]> {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
    request.q,
  )}&cc=${COUNTRY.toLowerCase()}&l=english`;
  const data = await steamJson<{ items?: { id?: number; type?: string }[] }>(url);
  const appIds = (data.items ?? [])
    .filter((item) => item.type === "app" && item.id)
    .map((item) => String(item.id));
  const games = await fetchSteamGamesByAppIds(appIds);
  const filters = {
    genre: request.genres[0] ?? "All",
    mode: request.mode,
    players: request.players,
    platform: "All",
    crossplayOnly: request.crossplay,
    priceMin: request.priceMin,
    priceMax: request.priceMax,
    onSale: request.onSale,
    reviews: request.reviews,
    era: request.era,
    yearMin: request.yearMin,
    yearMax: request.yearMax,
    multi: request.multi,
    vibe: request.vibe,
    deck: request.deck,
    demo: request.demo,
  };
  return games.filter((game) => gameMatchesCatalogFilters(game, filters));
}

export async function fetchSteamCatalog(
  request: SteamCatalogRequest,
): Promise<{ games: Game[]; hasNext: boolean }> {
  if (request.q.trim().length >= MIN_SEARCH_LENGTH) {
    if (request.page > 1) return { games: [], hasNext: false };
    return { games: await searchSteamGames(request), hasNext: false };
  }

  const postFilterPrice = needsPricePostFilter(request);
  const count = request.demo
    ? request.pageSize * DEMO_OVERSAMPLE
    : request.crossplay || postFilterPrice
      ? request.pageSize * CROSSPLAY_OVERSAMPLE
      : request.pageSize;
  const query = buildSteamQueryInput({
    genres: request.genres,
    mode: request.mode,
    players: request.players,
    sort: request.sort,
    priceMin: request.priceMin,
    priceMax: request.priceMax,
    onSale: request.onSale,
    reviews: request.reviews,
    era: request.era,
    yearMin: request.yearMin,
    yearMax: request.yearMax,
    multi: request.multi,
    vibe: request.vibe,
    deck: request.deck,
    demo: request.demo,
    start: (request.page - 1) * count,
    count,
  });

  const data = await steamJson<{
    response?: { ids?: { appid?: number }[]; store_items?: SteamStoreItem[] };
  }>(
    inputUrl("IStoreQueryService/Query/v1/", {
      query,
      context: CONTEXT,
      data_request: DATA_REQUEST,
    }),
  );

  const items = data.response?.store_items ?? [];
  const { minCents, maxCents } = steamPriceBounds(request);
  const games = items
    .filter((item) => !request.demo || itemHasDemo(item))
    .filter((item) => {
      if (!postFilterPrice) return true;
      const cents = item.is_free
        ? 0
        : Number(item.best_purchase_option?.final_price_in_cents);
      return Number.isFinite(cents) && cents >= minCents && cents <= maxCents;
    })
    .map(mapSteamItem)
    .filter((game): game is Game => Boolean(game))
    .filter((game) => !request.crossplay || game.crossplay);

  return { games, hasNext: items.length >= count };
}
