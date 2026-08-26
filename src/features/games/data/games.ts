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
  /** ISO date (YYYY-MM-DD) from IGDB first_release_date */
  releaseDate?: string;
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
  /** IGDB screenshot URLs (fallback when Steam media is missing). */
  screenshots?: string[];
  /** First IGDB YouTube video id, if any. */
  youtubeId?: string;
}

/** Home / hero atmospheric background. */
export const HERO_IMG =
  "https://images.unsplash.com/photo-1773615098146-2341d1b72997?w=1600&h=1000&fit=crop&auto=format";
