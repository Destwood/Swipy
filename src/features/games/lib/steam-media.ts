export type SteamMediaMovie = {
  name: string;
  thumbnail: string;
  mp4: string;
};

export type SteamMedia = {
  about?: string;
  screenshots: { thumb: string; full: string }[];
  movies: SteamMediaMovie[];
};

const cache = new Map<string, SteamMedia>();

export function getCachedSteamMedia(appId: string) {
  return cache.get(appId);
}

export function setCachedSteamMedia(appId: string, media: SteamMedia) {
  cache.set(appId, media);
}
