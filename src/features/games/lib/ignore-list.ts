import type { Game } from "@/features/games/data/games";
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
