export interface Game {
  id: string;
  title: string;
  developer: string;
  year: number;
  genres: string[];
  description: string;
  image: string;
  metacritic?: number;
  /** IGDB total_rating_count — popularity proxy */
  ratingCount?: number;
  /** Steam store app id from IGDB external_games */
  steamAppId?: string;
  /** Normalized play modes: Single, Multiplayer, Co-op */
  modes?: string[];
  /** Platform buckets: PC, PlayStation, Xbox, Nintendo */
  platforms?: string[];
  /** Max co-op players when known */
  coopMaxPlayers?: number;
  /** Cross-play support (keywords / heuristic) */
  crossplay?: boolean;
}

/** @deprecated Hardcoded catalog removed — games come from IGDB into local library. */
export const GAMES: Game[] = [];

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGamesByIds(ids: string[]): Game[] {
  return ids
    .map((id) => getGameById(id))
    .filter((g): g is Game => g !== undefined);
}

/** Static sample for Liked / result layout placeholders. */
export const SAMPLE_LIKED: Game[] = [];

export const HERO_IMG =
  "https://images.unsplash.com/photo-1773615098146-2341d1b72997?w=1600&h=1000&fit=crop&auto=format";
