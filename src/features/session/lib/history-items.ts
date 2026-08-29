import {
  ensureGamesInLibrary,
  getLibraryGamesByIds,
} from "@/features/games/lib/game-library";
import { padCovers } from "@/features/session/components/HistoryRow";
import type { SwipeHistoryEntry } from "@/features/session/lib/swipe-history";
import type { DbVote } from "@/features/session/lib/session-context";

export type HistoryListItem = {
  id: string;
  kind: "solo" | "coop";
  title: string;
  completedAt: string;
  covers: string[];
  tags: [string, string, string];
  stats: string;
  href: string;
  coopCode?: string;
  sessionId?: string;
  likeCount: number;
  deckId?: string;
};

function pickCoverIds(gameIds: string[], limit = 4): string[] {
  return [...new Set(gameIds)].slice(0, limit);
}

async function resolveCovers(gameIds: string[]): Promise<string[]> {
  const ids = pickCoverIds(gameIds);
  if (ids.length === 0) return padCovers([]);
  await ensureGamesInLibrary(ids);
  const games = getLibraryGamesByIds(ids);
  return padCovers(games.map((game) => game.image));
}

function topGenre(gameIds: string[]): string | null {
  const games = getLibraryGamesByIds(gameIds);
  for (const game of games) {
    const genre = game.genres.find(Boolean);
    if (genre) return genre;
  }
  return null;
}

function latestIso(dates: string[]): string {
  if (dates.length === 0) return new Date().toISOString();
  return dates.reduce((latest, value) =>
    new Date(value).getTime() > new Date(latest).getTime() ? value : latest,
  );
}

export async function buildSoloHistoryItem(
  entry: SwipeHistoryEntry,
): Promise<HistoryListItem> {
  const likedIds = entry.votes
    .filter((vote) => vote.value === "like")
    .map((vote) => vote.gameId);
  const coverIds =
    likedIds.length > 0
      ? pickCoverIds(likedIds)
      : pickCoverIds(entry.votes.map((vote) => vote.gameId));
  const covers = await resolveCovers(coverIds);
  const likes = entry.votes.filter((vote) => vote.value === "like").length;
  const genre = topGenre(coverIds);

  return {
    id: entry.id,
    kind: "solo",
    title: entry.label,
    completedAt: entry.createdAt,
    covers,
    tags: [
      "Solo",
      entry.mode === "infinite" ? "Infinite" : "Deck",
      genre ?? `${likes} liked`,
    ],
    stats: `${entry.votes.length} swipes · ${likes} liked`,
    href: `/infinite/matches?session=${encodeURIComponent(entry.id)}`,
    likeCount: likes,
    deckId: entry.deckId,
  };
}

export async function buildCoopHistoryItem(input: {
  code: string;
  sessionId: string;
  deckName: string;
  memberCount: number;
  votes: DbVote[];
  gameIds: string[];
  sessionCreatedAt: string;
}): Promise<HistoryListItem> {
  const likedIds = input.votes
    .filter((vote) => vote.value === "like")
    .map((vote) => vote.game_id);
  const coverIds =
    likedIds.length > 0
      ? pickCoverIds(likedIds)
      : pickCoverIds(input.gameIds);
  const covers = await resolveCovers(coverIds);
  const genre = topGenre(coverIds.length > 0 ? coverIds : input.gameIds);
  const completedAt = latestIso(
    input.votes.map((vote) => vote.created_at).concat(input.sessionCreatedAt),
  );

  return {
    id: input.sessionId,
    kind: "coop",
    title: input.deckName,
    completedAt,
    covers,
    tags: [
      "With friends",
      "Deck",
      genre ?? `${input.memberCount} players`,
    ],
    stats: `${input.code} · ${input.memberCount} players · ${input.votes.length} votes`,
    href: "/session/matches",
    coopCode: input.code,
    sessionId: input.sessionId,
    likeCount: likedIds.length,
  };
}

export function sortHistoryItems(items: HistoryListItem[]): HistoryListItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatHistoryDayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameCalendarDay(date, today)) return "Today";
  if (sameCalendarDay(date, yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

export type HistoryDayGroup = {
  dayKey: string;
  label: string;
  items: HistoryListItem[];
};

export function groupHistoryByDay(items: HistoryListItem[]): HistoryDayGroup[] {
  const sorted = sortHistoryItems(items);
  const groups: HistoryDayGroup[] = [];
  for (const item of sorted) {
    const key = dayKey(item.completedAt);
    const last = groups[groups.length - 1];
    if (last?.dayKey === key) {
      last.items.push(item);
      continue;
    }
    groups.push({
      dayKey: key,
      label: formatHistoryDayLabel(item.completedAt),
      items: [item],
    });
  }
  return groups;
}
