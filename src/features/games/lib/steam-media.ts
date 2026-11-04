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

const inflight = new Map<string, Promise<SteamMedia | null>>();

export function loadSteamMedia(appId: string): Promise<SteamMedia | null> {
  const cached = cache.get(appId);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(appId);
  if (pending) return pending;

  const request = fetch(`/api/steam/media?appId=${appId}`)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as SteamMedia;
      cache.set(appId, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(appId);
    });
  inflight.set(appId, request);
  return request;
}
