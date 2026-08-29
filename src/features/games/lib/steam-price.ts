export type SteamPrice = {
  free: boolean;
  formatted: string;
  discountPercent: number;
  originalFormatted?: string;
};

export type SteamPriceOverview = {
  currency?: string;
  initial?: number;
  final?: number;
  discount_percent?: number;
  final_formatted?: string;
  initial_formatted?: string;
};

function tidy(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

export function uniqueSteamAppIds(
  ids: Array<string | undefined | null>,
): string[] {
  const set = new Set<string>();
  for (const id of ids) {
    if (id && /^\d+$/.test(id)) set.add(id);
  }
  return [...set].sort((a, b) => Number(a) - Number(b));
}

export function steamPriceFromAppData(data?: {
  is_free?: boolean;
  price_overview?: SteamPriceOverview;
}): SteamPrice | null {
  if (!data || Array.isArray(data)) return null;
  if (data.is_free) {
    return { free: true, formatted: "Free", discountPercent: 0 };
  }
  const overview = data.price_overview;
  if (!overview) return null;
  const formatted = tidy(overview.final_formatted);
  if (!formatted) return null;
  const discountPercent =
    typeof overview.discount_percent === "number"
      ? overview.discount_percent
      : 0;
  const original = tidy(overview.initial_formatted);
  return {
    free: false,
    formatted,
    discountPercent,
    originalFormatted:
      discountPercent > 0 && original && original !== formatted
        ? original
        : undefined,
  };
}
