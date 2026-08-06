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

export function collectGenreStats(
  games: Game[],
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const game of games) {
    const seen = new Set<string>();
    for (const g of game.genres) {
      if (!g) continue;
      const label = normalizeGenreLabel(g);
      if (seen.has(label)) continue;
      seen.add(label);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}
