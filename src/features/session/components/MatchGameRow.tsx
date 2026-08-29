"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { GameFavoriteButton } from "@/features/games/components/GameFavoriteButton";
import { GameHoverPreview } from "@/features/games/components/GameHoverPreview";
import { GamePriceBadge } from "@/features/games/components/GamePriceBadge";
import { GenreTag } from "@/features/games/components/GenreTag";
import { PlayThisButton } from "@/features/games/components/PlayThisButton";
import type { Game } from "@/features/games/data/games";
import { openSteamStore, steamStoreUrl } from "@/features/games/lib/steam";
import { MatchHeroCard } from "@/features/session/components/MatchHeroCard";
import styles from "./SessionMatchesClient.module.css";

type Props = {
  game: Game;
  rank?: number;
  meta?: ReactNode;
  voteMeta?: ReactNode;
  action?: ReactNode;
  variant?: "compact" | "hero";
  priceAlign?: "foot" | "center";
};

export function MatchGameRow({
  game,
  rank,
  meta,
  voteMeta,
  action,
  variant = "compact",
  priceAlign = "foot",
}: Props) {
  const steamHref = game.steamAppId ? steamStoreUrl(game.steamAppId) : null;

  function openSteam() {
    if (!game.steamAppId) return;
    openSteamStore(game.steamAppId);
  }

  if (variant === "hero") {
    return <MatchHeroCard game={game} rank={rank} voteMeta={voteMeta} />;
  }

  const genres = (
    <div className={styles.metaRow}>
      {game.genres.slice(0, 2).map((g, i) => (
        <GenreTag key={g} label={g} accent={i === 0} />
      ))}
      {meta}
    </div>
  );

  const defaultAction =
    action ?? <PlayThisButton steamAppId={game.steamAppId} />;

  const priceCentered = priceAlign === "center";
  const priceBadge = game.steamAppId ? (
    <GamePriceBadge appId={game.steamAppId} size="lg" />
  ) : null;

  const compactBody = (
    <>
      <div className={styles.thumbnail}>
        <Image
          src={game.image}
          alt={`${game.title} cover`}
          fill
          className={styles.cover}
          sizes="72px"
          unoptimized={
            game.image.includes("igdb") || game.image.includes("rawg")
          }
        />
      </div>
      <div className={styles.content}>
        <div className={styles.gameTitle}>{game.title}</div>
        {genres}
        {!priceCentered || voteMeta ? (
          <div className={styles.contentFoot}>
            {voteMeta ? <div className={styles.voteMeta}>{voteMeta}</div> : <span />}
            {!priceCentered && priceBadge ? (
              <div className={styles.price}>{priceBadge}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <li className={styles.row}>
      <div className={styles.rowInner}>
        {rank != null ? <span className={styles.rank}>{rank}</span> : null}
        <div className={styles.previewWrap}>
          <GameHoverPreview
            game={game}
            variant="inline"
            className={styles.previewAnchor}
          >
            {steamHref ? (
              <a
                href={steamHref}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.previewHit}
                onClick={(e) => {
                  e.preventDefault();
                  openSteam();
                }}
              >
                {compactBody}
              </a>
            ) : (
              <div className={styles.previewHit}>{compactBody}</div>
            )}
          </GameHoverPreview>
        </div>
        {priceCentered && priceBadge ? (
          <div className={styles.priceSide}>{priceBadge}</div>
        ) : null}
        <GameFavoriteButton gameId={game.id} className={styles.rowFav} />
        <div className={styles.rowAction}>{defaultAction}</div>
      </div>
    </li>
  );
}
