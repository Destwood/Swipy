import type { Game } from "@/features/games/data/games";
import { getSignedInUserId } from "@/features/decks/lib/account-decks";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";
import { gameHasGenre } from "@/features/games/lib/genre-label";

export type IgnoreList = {
  genres: string[];
  platforms: string[];
};

export const EMPTY_IGNORE_LIST: IgnoreList = {
  genres: [],
  platforms: [],
};

export const IGNORE_GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Arcade",
  "Card & Board Game",
  "Fighting",
  "Hack and slash/Beat 'em up",
  "Indie",
  "MOBA",
  "Music",
  "Pinball",
  "Platform",
  "Point-and-click",
  "Puzzle",
  "Quiz/Trivia",
  "Racing",
  "Real Time Strategy (RTS)",
  "RPG",
  "Shooter",
  "Simulator",
  "Sport",
  "Strategy",
  "Tactical",
  "Turn-based strategy (TBS)",
  "Visual Novel",
] as const;

export const IGNORE_PLATFORM_OPTIONS = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo",
] as const;

const STORAGE_KEY = "swipy.ignoreList";
const CHANGE_EVENT = "swipy:ignore-list";

function parseList(raw: string | null): IgnoreList {
  if (!raw) return EMPTY_IGNORE_LIST;
  try {
    const parsed = JSON.parse(raw) as Partial<IgnoreList>;
    const genres = Array.isArray(parsed.genres)
      ? parsed.genres.filter((g): g is string => typeof g === "string")
      : [];
    const platforms = Array.isArray(parsed.platforms)
      ? parsed.platforms.filter((p): p is string => typeof p === "string")
      : [];
    return { genres, platforms };
  } catch {
    return EMPTY_IGNORE_LIST;
  }
}

export function readIgnoreList(): IgnoreList {
  if (typeof window === "undefined") return EMPTY_IGNORE_LIST;
  try {
    return parseList(localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_IGNORE_LIST;
  }
}

export function writeIgnoreList(next: IgnoreList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  void syncIgnoreListToDb(next);
}

async function syncIgnoreListToDb(list: IgnoreList) {
  const userId = await getSignedInUserId();
  if (!userId) return;
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      ignored_genres: list.genres,
      ignored_platforms: list.platforms,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) console.warn("user_preferences upsert failed", error.message);
}

export async function hydrateIgnoreList(): Promise<IgnoreList> {
  const local = readIgnoreList();
  const userId = await getSignedInUserId();
  if (!userId) return local;

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("ignored_genres, ignored_platforms")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return local;

  if (!data) {
    if (local.genres.length > 0 || local.platforms.length > 0) {
      await syncIgnoreListToDb(local);
    }
    return local;
  }

  const remote: IgnoreList = {
    genres: data.ignored_genres ?? [],
    platforms: data.ignored_platforms ?? [],
  };
  const remoteEmpty = remote.genres.length === 0 && remote.platforms.length === 0;
  const localHasData = local.genres.length > 0 || local.platforms.length > 0;
  if (remoteEmpty && localHasData) {
    await syncIgnoreListToDb(local);
    return local;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: remote }));
  return remote;
}

export function subscribeIgnoreList(onChange: (next: IgnoreList) => void) {
  function fromStorage() {
    onChange(readIgnoreList());
  }
  function fromEvent(e: Event) {
    const detail = (e as CustomEvent<IgnoreList>).detail;
    onChange(detail ?? readIgnoreList());
  }
  window.addEventListener("storage", fromStorage);
  window.addEventListener(CHANGE_EVENT, fromEvent);
  return () => {
    window.removeEventListener("storage", fromStorage);
    window.removeEventListener(CHANGE_EVENT, fromEvent);
  };
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function toggleIgnoredGenre(current: IgnoreList, genre: string): IgnoreList {
  return { ...current, genres: toggleValue(current.genres, genre) };
}

export function toggleIgnoredPlatform(
  current: IgnoreList,
  platform: string,
): IgnoreList {
  return { ...current, platforms: toggleValue(current.platforms, platform) };
}

/** Genre: hide if the game lists that genre. Platform: hide only exclusives. */
export function gameIsIgnored(game: Game, ignore: IgnoreList): boolean {
  if (ignore.genres.some((genre) => gameHasGenre(game, genre))) return true;

  const platforms = game.platforms ?? [];
  if (platforms.length === 0 || ignore.platforms.length === 0) return false;
  const blocked = new Set(ignore.platforms);
  return platforms.every((platform) => blocked.has(platform));
}
