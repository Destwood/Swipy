/** IGDB CDN size tokens. `cover_big` is only 264×374 — too soft for swipe cards. */
export type IgdbImageSize =
  | "cover_small"
  | "cover_big"
  | "cover_big_2x"
  | "720p"
  | "1080p"
  | "screenshot_huge";

const SIZE_IN_PATH = /\/t_[a-z0-9_]+\//i;

export function igdbCoverUrl(
  imageId: string,
  size: IgdbImageSize = "cover_big_2x",
): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export function igdbImageVariant(url: string, size: IgdbImageSize): string {
  if (!url.includes("images.igdb.com") || !SIZE_IN_PATH.test(url)) return url;
  return url.replace(SIZE_IN_PATH, `/t_${size}/`);
}

export function gameCoverSrc(url: string, usage: "hero" | "tile"): string {
  return igdbImageVariant(url, usage === "hero" ? "1080p" : "cover_big");
}
