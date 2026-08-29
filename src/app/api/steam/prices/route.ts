import { NextResponse } from "next/server";
import {
  steamPriceFromAppData,
  uniqueSteamAppIds,
  type SteamPrice,
  type SteamPriceOverview,
} from "@/features/games/lib/steam-price";
import { resolveRegionalSteamAppId } from "@/features/games/lib/steam-regional-app";

const PRIMARY_CC = process.env.STEAM_STORE_CC?.trim() || "ua";
const FALLBACK_CC = process.env.STEAM_STORE_FALLBACK_CC?.trim() || "us";
const STORE_CCS = [...new Set([PRIMARY_CC, FALLBACK_CC].filter(Boolean))];
const MAX_IDS = 48;
const CONCURRENCY = 6;
const REVALIDATE_SEC = 21_600;

type SteamAppDetails = {
  success?: boolean;
  data?: {
    is_free?: boolean;
    price_overview?: SteamPriceOverview;
  };
};

function appDetailsUrl(appId: string, cc: string, filters?: string) {
  const url = new URL("https://store.steampowered.com/api/appdetails");
  url.searchParams.set("appids", appId);
  url.searchParams.set("cc", cc);
  url.searchParams.set("l", "english");
  if (filters) url.searchParams.set("filters", filters);
  return url.toString();
}

async function steamAppDetails(
  appId: string,
  cc: string,
  filters?: string,
): Promise<SteamAppDetails | null> {
  const res = await fetch(appDetailsUrl(appId, cc, filters), {
    next: { revalidate: REVALIDATE_SEC },
  });
  if (!res.ok) return null;
  const raw = (await res.json()) as Record<string, SteamAppDetails>;
  return raw[appId] ?? null;
}

async function priceForRegion(
  appId: string,
  cc: string,
): Promise<SteamPrice | null> {
  const overview = await steamAppDetails(appId, cc, "price_overview");
  if (!overview?.success) return null;
  const fromOverview = steamPriceFromAppData(overview.data);
  if (fromOverview) return fromOverview;
  const full = await steamAppDetails(appId, cc);
  if (!full?.success) return null;
  return steamPriceFromAppData(full.data);
}

async function priceForApp(appId: string): Promise<SteamPrice | null> {
  for (const cc of STORE_CCS) {
    const direct = await priceForRegion(appId, cc);
    if (direct) return direct;

    const regionalId = await resolveRegionalSteamAppId(appId, cc);
    if (regionalId) {
      const regional = await priceForRegion(regionalId, cc);
      if (regional) return regional;
    }
  }
  return null;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      out[index] = await fn(items[index]);
    }
  }
  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = uniqueSteamAppIds(raw.split(",")).slice(0, MAX_IDS);
  if (ids.length === 0) {
    return NextResponse.json({ prices: {} as Record<string, SteamPrice | null> });
  }

  try {
    const results = await mapPool(ids, CONCURRENCY, priceForApp);
    const prices: Record<string, SteamPrice | null> = {};
    ids.forEach((id, i) => {
      prices[id] = results[i] ?? null;
    });
    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ error: "Steam request failed" }, { status: 502 });
  }
}
