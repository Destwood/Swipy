import type { Game } from "@/features/games/data/games";

export const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name" },
  { value: "year", label: "Year" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function sortGames(list: Game[], sort: SortValue): Game[] {
  const next = [...list];
  next.sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "year") return (b.year || 0) - (a.year || 0);
    if (sort === "rating") {
      const scoreA = a.metacritic ?? -1;
      const scoreB = b.metacritic ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
    }
    const popA = a.ratingCount ?? -1;
    const popB = b.ratingCount ?? -1;
    if (popB !== popA) return popB - popA;
    return (b.metacritic ?? 0) - (a.metacritic ?? 0);
  });
  return next;
}
