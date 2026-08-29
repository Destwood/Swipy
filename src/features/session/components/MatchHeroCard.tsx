"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import SteamDbIcon from "@/assets/icons/steamdb-light.svg";
import { GameFavoriteButton } from "@/features/games/components/GameFavoriteButton";
import { GamePriceBadge } from "@/features/games/components/GamePriceBadge";
import { GenreTag } from "@/features/games/components/GenreTag";
import { SteamStoreButton } from "@/features/games/components/SteamStoreButton";
import type { Game } from "@/features/games/data/games";
import { steamDbUrl } from "@/features/games/lib/steam";
import {
  getCachedSteamMedia,
  setCachedSteamMedia,
  type SteamMedia,
} from "@/features/games/lib/steam-media";
import { ScreenshotGallery } from "@/features/session/components/ScreenshotGallery";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./SessionMatchesClient.module.css";

type Props = {
  game: Game;
  rank?: number;
  voteMeta?: ReactNode;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function realDescription(text: string) {
  const cleaned = stripHtml(text).trim();
  if (!cleaned || cleaned.endsWith("from IGDB.")) return null;
  return cleaned;
}

export function MatchHeroCard({ game, rank, voteMeta }: Props) {
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

  const about =
    realDescription(steam?.about || "") ||
    realDescription(game.description) ||
    null;
  const studio =
    game.developer &&
    game.developer !== "Unknown" &&
    game.developer !== "IGDB"
      ? game.developer
      : null;
  const byline = [
    studio,
    game.year || null,
    game.metacritic != null ? `MC ${game.metacritic}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className={styles.heroItem}>
      <article className={styles.heroCard}>
        <div className={styles.heroCover}>
          <Image
            src={game.image}
            alt={`${game.title} cover`}
            fill
            className={styles.cover}
            sizes="(max-width: 768px) 100vw, 280px"
            unoptimized={
              game.image.includes("igdb") || game.image.includes("rawg")
            }
          />
          {rank != null ? (
            <span className={styles.heroRank}>{rank}</span>
          ) : null}
        </div>

        <div className={styles.heroBody}>
          <div className={styles.heroTitleRow}>
            <h3 className={styles.heroTitle}>{game.title}</h3>
            <GameFavoriteButton gameId={game.id} className={styles.heroFav} />
          </div>
          {byline ? <p className={styles.heroByline}>{byline}</p> : null}

          {game.genres.length > 0 ? (
            <div className={styles.metaRow}>
              {game.genres.slice(0, 4).map((g, i) => (
                <GenreTag key={g} label={g} accent={i === 0} />
              ))}
            </div>
          ) : null}

          {about ? <p className={styles.heroAbout}>{about}</p> : null}

          {shots.length > 0 ? (
            <div className={styles.heroShots}>
              {shots.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={styles.heroShot}
                  onClick={() => setGalleryIndex(i)}
                  aria-label={`${game.title} screenshot ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className={styles.heroShotImage}
                    sizes="140px"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.heroBottomRow}>
            <div className={styles.heroActions}>
              {game.steamAppId ? (
                <>
                  <SteamStoreButton appId={game.steamAppId} size="row" />
                  <Button
                    href={steamDbUrl(game.steamAppId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant={ButtonVariant.Soft}
                    size={ButtonSize.Sm}
                    className={styles.heroSteamDb}
                  >
                    <SteamDbIcon
                      width={15}
                      height={15}
                      className={styles.heroSteamIcon}
                      aria-hidden
                    />
                    Open in SteamDB
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  disabled
                  variant={ButtonVariant.Dark}
                  size={ButtonSize.Sm}
                  className={styles.noSteamBtn}
                  aria-disabled
                >
                  No Steam
                </Button>
              )}
            </div>
            {game.steamAppId ? (
              <div className={styles.heroPrice}>
                <GamePriceBadge appId={game.steamAppId} size="lg" />
              </div>
            ) : null}
          </div>

          {voteMeta ? <div className={styles.heroVotes}>{voteMeta}</div> : null}
        </div>
      </article>

      {galleryIndex != null && shots[galleryIndex] ? (
        <ScreenshotGallery
          title={game.title}
          images={shots}
          index={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onIndex={setGalleryIndex}
        />
      ) : null}
    </li>
  );
}
