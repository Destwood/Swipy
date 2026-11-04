"use client";

import Image from "next/image";
import { GameFavoriteButton } from "@/features/games/components/GameFavoriteButton";
import { GameHoverPreview } from "@/features/games/components/GameHoverPreview";
import type { Game } from "@/features/games/data/games";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import { openSteamStore } from "@/features/games/lib/steam";
import { useSteamPrices } from "@/features/games/lib/use-steam-prices";
import { HoverLift } from "@/shared/ui/HoverLift";
import styles from "./page.module.css";

function PriceOverlay({ appId }: { appId?: string }) {
  const prices = useSteamPrices(appId ? [appId] : []);
  const price = appId ? (prices[appId] ?? null) : null;
  if (!price) return null;

  if (price.free) {
    return <span className={`${styles.price} ${styles.priceFree}`}>Free</span>;
  }

  const discounted = price.discountPercent > 0;
  return (
    <span className={styles.price}>
      {discounted ? (
        <span className={styles.priceDiscount}>−{price.discountPercent}%</span>
      ) : null}
      {discounted && price.originalFormatted ? (
        <span className={styles.priceOriginal}>{price.originalFormatted}</span>
      ) : null}
      <span className={styles.priceAmount}>{price.formatted}</span>
    </span>
  );
}

export function LibraryCard({
  game,
  priority,
}: {
  game: Game;
  priority: boolean;
}) {
  const hasArtTitle = game.id.startsWith("steam-");
  const appId = game.steamAppId;

  const content = (
    <>
      <Image
        src={gameCoverSrc(game.image, "tile")}
        alt=""
        fill
        className={styles.coverImage}
        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw"
        priority={priority}
        unoptimized={game.image.includes("igdb") || game.image.includes("rawg")}
      />
      {hasArtTitle ? (
        <span className={styles.srOnly}>{game.title}</span>
      ) : (
        <span className={styles.caption}>
          <span className={styles.captionTitle}>{game.title}</span>
          {game.year ? (
            <span className={styles.captionMeta}>{game.year}</span>
          ) : null}
        </span>
      )}
      <span className={styles.priceSlot}>
        <PriceOverlay appId={appId} />
      </span>
    </>
  );

  return (
    <GameHoverPreview game={game}>
      <HoverLift amount="sm" className={styles.card}>
        {appId ? (
          <button
            type="button"
            className={styles.tile}
            onClick={() => openSteamStore(appId)}
            aria-label={`Open ${game.title} in Steam`}
          >
            {content}
          </button>
        ) : (
          <div className={styles.tile}>{content}</div>
        )}
        <GameFavoriteButton gameId={game.id} className={styles.favorite} />
      </HoverLift>
    </GameHoverPreview>
  );
}
