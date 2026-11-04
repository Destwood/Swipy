"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GameFavoriteButton } from "@/features/games/components/GameFavoriteButton";
import { GamePriceBadge } from "@/features/games/components/GamePriceBadge";
import { SteamStoreButton } from "@/features/games/components/SteamStoreButton";
import type { Game } from "@/features/games/data/games";
import {
  getCachedSteamMedia,
  loadSteamMedia,
  type SteamMedia,
} from "@/features/games/lib/steam-media";
import { ScreenshotGallery } from "@/features/session/components/ScreenshotGallery";
import styles from "./GameInfoSidebar.module.css";

type Props = {
  game: Game;
  compact?: boolean;
  headerAction?: ReactNode;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function GameInfoSidebar({
  game,
  compact = false,
  headerAction,
}: Props) {
  const [steam, setSteam] = useState<SteamMedia | null>(null);
  const [steamReady, setSteamReady] = useState(!game.steamAppId);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  useEffect(() => {
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

    void loadSteamMedia(appId).then((data) => {
      if (!cancelled) {
        setSteam(data);
        setSteamReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [game.id, game.steamAppId]);

  const shots = useMemo(() => {
    if (game.steamAppId && !steamReady) return [];
    const list = [
      ...(steam?.screenshots ?? []),
      ...(game.screenshots ?? []).map((url) => ({ thumb: url, full: url })),
    ];
    const seen = new Set<string>();
    return list
      .filter((s) => !seen.has(s.full) && seen.add(s.full))
      .slice(0, 6);
  }, [steam, steamReady, game.steamAppId, game.screenshots]);
  const fullShots = useMemo(() => shots.map((s) => s.full), [shots]);

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
    <aside
      className={`${styles.root}${compact ? ` ${styles.compact}` : ""}`}
      aria-label={`${game.title} details`}
    >
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{game.title}</h2>
        {headerAction}
      </div>

      <div className={styles.scroll}>
        <div className={styles.metaRow}>
          {byline ? <p className={styles.byline}>{byline}</p> : null}
          <GameFavoriteButton
            gameId={game.id}
            size={14}
            className={styles.favorite}
          />
        </div>

        {tags.length > 0 ? (
          <ul className={styles.tags}>
            {tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        {game.steamAppId && !steamReady ? (
          <div className={styles.shots} aria-hidden>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={styles.shot}>
                <div className={`${styles.shotSkeleton} sw-shimmer`} />
              </div>
            ))}
          </div>
        ) : null}

        {shots.length > 0 ? (
          <div className={styles.shots}>
            {shots.map(({ thumb, full }, i) => (
              <button
                key={full}
                type="button"
                className={styles.shot}
                onClick={() => setGalleryIndex(i)}
                aria-label={`${game.title} screenshot ${i + 1}`}
              >
                <div className={`${styles.shotSkeleton} sw-shimmer`} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={(el) => {
                    if (el?.complete && el.naturalWidth > 0) {
                      el.dataset.loaded = "";
                    }
                  }}
                  src={thumb}
                  alt=""
                  className={styles.shotImage}
                  onLoad={(e) => {
                    e.currentTarget.dataset.loaded = "";
                  }}
                />
              </button>
            ))}
          </div>
        ) : null}

        {about ? <p className={styles.about}>{about}</p> : null}
      </div>

      {game.steamAppId ? (
        <div className={styles.footer}>
          <div className={styles.buy}>
            <div className={styles.price}>
              <GamePriceBadge appId={game.steamAppId} variant="buy" />
            </div>
            <SteamStoreButton appId={game.steamAppId} className={styles.steam} />
          </div>
        </div>
      ) : null}

      {galleryIndex != null && shots[galleryIndex] ? (
        <ScreenshotGallery
          title={game.title}
          images={fullShots}
          index={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onIndex={setGalleryIndex}
        />
      ) : null}
    </aside>
  );
}
