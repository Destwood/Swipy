import type { Game } from "@/features/games/data/games";

/** Short display labels for noisy IGDB genre names. */
export function normalizeGenreLabel(raw: string): string {
  const t = raw.trim();
  if (
    /^role[-\s]?playing/i.test(t) ||
    /\(RPG\)$/i.test(t) ||
    t.toUpperCase() === "RPG"
  ) {
    return "RPG";
  }
  return t;
}

export function gameHasGenre(game: Game, filterLabel: string): boolean {
  if (filterLabel === "All") return true;
  return game.genres.some((g) => normalizeGenreLabel(g) === filterLabel);
}

