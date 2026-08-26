"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { GameFavoriteButton } from "@/features/games/components/GameFavoriteButton";
import { GameHoverPreview } from "@/features/games/components/GameHoverPreview";
import { GenreTag } from "@/features/games/components/GenreTag";
import type { Game } from "@/features/games/data/games";
import { steamStoreAppUrl } from "@/features/games/lib/steam";
import { MatchHeroCard } from "@/features/session/components/MatchHeroCard";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./SessionMatchesClient.module.css";

type Props = {
  game: Game;
  rank?: number;
  meta?: ReactNode;
  voteMeta?: ReactNode;
  action?: ReactNode;
  variant?: "compact" | "hero";
};

export function MatchGameRow({
  game,
  rank,
  meta,
  voteMeta,
  action,
  variant = "compact",
}: Props) {
  const steamHref = game.steamAppId ? steamStoreAppUrl(game.steamAppId) : null;

  function openSteam() {
    if (!steamHref) return;
    window.location.href = steamHref;
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
    action ??
    (steamHref ? (
      <Button
        type="button"
        onClick={openSteam}
        variant={ButtonVariant.Soft}
        size={ButtonSize.Sm}
      >
        Play this
      </Button>
    ) : (
      <span className={styles.noSteam}>No Steam</span>
    ));

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
              <a href={steamHref} className={styles.previewHit}>
                {compactBody}
              </a>
            ) : (
              <div className={styles.previewHit}>{compactBody}</div>
            )}
          </GameHoverPreview>
        </div>
        {voteMeta ? <div className={styles.voteMeta}>{voteMeta}</div> : null}
        <GameFavoriteButton gameId={game.id} className={styles.rowFav} />
        {defaultAction}
      </div>
    </li>
  );
}
