"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import StarIcon from "@/assets/icons/star.svg";
import StarOutlineIcon from "@/assets/icons/star-outline.svg";
import SteamIcon from "@/assets/icons/steam.svg";
import type { Game } from "@/features/games/data/games";
import {
  isFavoriteGame,
  toggleFavoriteGame,
} from "@/features/games/lib/game-favorites";
import { steamStoreWebUrl } from "@/features/games/lib/steam";
import {
  getCachedSteamMedia,
  setCachedSteamMedia,
  type SteamMedia,
} from "@/features/games/lib/steam-media";
import { ScreenshotGallery } from "@/features/session/components/ScreenshotGallery";
import styles from "./GameInfoSidebar.module.css";

type Props = {
  game: Game;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function GameInfoSidebar({ game }: Props) {
  const [steam, setSteam] = useState<SteamMedia | null>(null);
  const [steamReady, setSteamReady] = useState(!game.steamAppId);
  const [favorite, setFavorite] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  useEffect(() => {
    setFavorite(isFavoriteGame(game.id));
    setGalleryIndex(null);
  }, [game.id]);

  useEffect(() => {
    if (!game.steamAppId) {
      setSteam(null);
      setSteamReady(true);
      return;
    }

    const appId = game.steamAppId;
    const cached = getCachedSteamMedia(appId);
    if (cached) {
      setSteam(cached);
      setSteamReady(true);
      return;
    }

    setSteam(null);
    setSteamReady(false);
    let cancelled = false;

    void fetch(`/api/steam/media?appId=${appId}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as SteamMedia;
      })
      .then((data) => {
        if (data) setCachedSteamMedia(appId, data);
        if (!cancelled) {
          setSteam(data);
          setSteamReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSteam(null);
          setSteamReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [game.id, game.steamAppId]);

  const shots = useMemo(() => {
    if (game.steamAppId && !steamReady) return [];
    const urls = [
      ...(steam?.screenshots.map((s) => s.full) ?? []),
      ...(game.screenshots ?? []),
    ];
    return [...new Set(urls)].slice(0, 6);
  }, [steam, steamReady, game.steamAppId, game.screenshots]);

  const about = stripHtml(steam?.about || game.description);
  const tags = game.genres.length > 0 ? game.genres : (game.modes ?? []);
  const studio =
    game.developer &&
    game.developer !== "Unknown" &&
    game.developer !== "IGDB"
      ? game.developer
      : null;
  const byline = [studio, game.year || null].filter(Boolean).join(" • ");

  return (
    <aside className={styles.root} aria-label={`${game.title} details`}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{game.title}</h2>
        <button
          type="button"
          className={`${styles.favorite} ${favorite ? styles.favoriteOn : ""}`}
          aria-pressed={favorite}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => setFavorite(toggleFavoriteGame(game.id))}
        >
          {favorite ? (
            <StarIcon width={14} height={14} className={styles.favoriteIcon} />
          ) : (
            <StarOutlineIcon
              width={14}
              height={14}
              className={styles.favoriteIcon}
            />
          )}
        </button>
      </div>

      <div className={styles.scroll}>
        {byline ? <p className={styles.byline}>{byline}</p> : null}

        {tags.length > 0 ? (
          <ul className={styles.tags}>
            {tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        {shots.length > 0 ? (
          <div className={styles.shots}>
            {shots.map((src, i) => (
              <button
                key={src}
                type="button"
                className={styles.shot}
                onClick={() => setGalleryIndex(i)}
                aria-label={`${game.title} screenshot ${i + 1}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className={styles.shotImage}
                  sizes="150px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        ) : null}

        {about ? <p className={styles.about}>{about}</p> : null}
      </div>

      {game.steamAppId ? (
        <a
          href={steamStoreWebUrl(game.steamAppId)}
          className={styles.steam}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Steam"
        >
          <SteamIcon width={18} height={18} className={styles.steamIcon} />
          Open in Steam
        </a>
      ) : null}

      {galleryIndex != null && shots[galleryIndex] ? (
        <ScreenshotGallery
          title={game.title}
          images={shots}
          index={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onIndex={setGalleryIndex}
        />
      ) : null}
    </aside>
  );
}
