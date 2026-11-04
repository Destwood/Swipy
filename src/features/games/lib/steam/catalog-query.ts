import {
  PRICE_MAX,
  isPriceRangeActive,
  type ExtraFilters,
} from "@/features/games/lib/catalog-filters";
import type { SortValue } from "@/features/games/lib/sort-games";
import {
  STEAM_GENRE_TAGS,
  STEAM_MULTI_TAGS,
  STEAM_VIBE_TAGS,
  TAGS_COOP,
  TAG_FOUR_PLAYER_LOCAL,
  TAG_MASSIVELY_MULTIPLAYER,
  TAG_MULTIPLAYER,
  TAG_SINGLEPLAYER,
} from "./map-item";

export type SteamCatalogInput = ExtraFilters & {
  genres: string[];
  mode: string;
  players: string;
  sort: SortValue;
  start: number;
  count: number;
};

const REVIEW_SCORE: Record<string, number> = {
  positive: 7,
  very: 8,
  top: 9,
};

const DAY_SEC = 86_400;
const STEAM_RELEASE_DATE_TYPE = 1;
const STEAM_DECK_DEVICE = 1;
const STEAM_DECK_PLAYABLE = 2;
const STEAM_DECK_VERIFIED = 3;

function releaseDateFilter(input: SteamCatalogInput, nowMs: number) {
  if (input.era === "month" || input.era === "recent") {
    const today = Math.floor(nowMs / 1000 / DAY_SEC) * DAY_SEC;
    return { release_date_type: STEAM_RELEASE_DATE_TYPE, start_date: today - 30 * DAY_SEC };
  }
  if (input.era === "range") {
    return {
      release_date_type: STEAM_RELEASE_DATE_TYPE,
      start_date: Date.UTC(input.yearMin, 0, 1) / 1000,
      end_date: Date.UTC(input.yearMax + 1, 0, 1) / 1000 - 1,
    };
  }
  return null;
}

export function steamPriceBounds(input: ExtraFilters) {
  return {
    minCents: input.priceMin * 100,
    maxCents: input.priceMax >= PRICE_MAX ? Infinity : input.priceMax * 100,
  };
}

export function needsPricePostFilter(input: ExtraFilters): boolean {
  return isPriceRangeActive(input) && input.priceMax !== 0;
}

const SORT_ID: Record<SortValue, number> = {
  popular: 11,
  rating: 21,
  name: 1,
  year: 20,
};

const MIN_REVIEW_SCORE: Record<SortValue, number> = {
  popular: 5,
  rating: 8,
  name: 7,
  year: 5,
};

type TagGroup = { tagids: number[] };

function tagGroups(input: SteamCatalogInput): TagGroup[] {
  const groups: TagGroup[] = [];

  const genreTags = [
    ...new Set(input.genres.flatMap((genre) => STEAM_GENRE_TAGS[genre] ?? [])),
  ];
  if (genreTags.length > 0) groups.push({ tagids: genreTags });

  const multiTags = [
    ...new Set(input.multi.flatMap((key) => STEAM_MULTI_TAGS[key] ?? [])),
  ];
  if (multiTags.length > 0) groups.push({ tagids: multiTags });

  for (const key of input.vibe) {
    const tags = STEAM_VIBE_TAGS[key];
    if (tags) groups.push({ tagids: [...tags] });
  }

  if (input.mode === "Single") groups.push({ tagids: [TAG_SINGLEPLAYER] });
  if (input.mode === "Multiplayer") groups.push({ tagids: [TAG_MULTIPLAYER] });
  if (input.mode === "Co-op") {
    groups.push({ tagids: [...TAGS_COOP] });
    if (input.players === "3–4") groups.push({ tagids: [TAG_FOUR_PLAYER_LOCAL] });
    if (input.players === "5+") {
      groups.push({ tagids: [TAG_MASSIVELY_MULTIPLAYER] });
    }
  }
  return groups;
}

export function buildSteamQueryInput(input: SteamCatalogInput, nowMs = Date.now()) {
  const upcoming = input.era === "upcoming";
  const recent = input.era === "recent";
  const filters: Record<string, unknown> = {
    type_filters: { include_games: true },
    content_descriptors_excluded: [3, 4],
  };
  if (upcoming) {
    filters.coming_soon_only = true;
  } else if (!recent) {
    filters.released_only = true;
    filters.review_score_filter = {
      min_score: Math.max(MIN_REVIEW_SCORE[input.sort], REVIEW_SCORE[input.reviews] ?? 0),
      allow_unreviewed: false,
    };
  }

  const priceFilters: Record<string, unknown> = {};
  if (input.priceMax === 0) priceFilters.only_free_items = true;
  else if (input.priceMin > 0) priceFilters.exclude_free_items = true;
  if (input.onSale) priceFilters.min_discount_percent = 1;
  if (Object.keys(priceFilters).length > 0) filters.price_filters = priceFilters;

  const releaseDate = releaseDateFilter(input, nowMs);
  if (releaseDate) filters.release_date_filter = releaseDate;

  if (input.deck) {
    filters.compatibility_filter = {
      device: STEAM_DECK_DEVICE,
      categories: [STEAM_DECK_PLAYABLE, STEAM_DECK_VERIFIED],
    };
  }

  const groups = tagGroups(input);
  if (groups.length > 0) filters.tagids_must_match = groups;
  if (input.mode === "Co-op" && input.players === "2") {
    filters.tagids_exclude = [TAG_FOUR_PLAYER_LOCAL, TAG_MASSIVELY_MULTIPLAYER];
  }

  return {
    start: input.start,
    count: input.count,
    sort: upcoming || recent ? SORT_ID.popular : SORT_ID[input.sort],
    filters,
  };
}
