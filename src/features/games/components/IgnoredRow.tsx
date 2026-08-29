"use client";

import Image from "next/image";
import type { Game } from "@/features/games/data/games";
import { GamePriceBadge } from "./GamePriceBadge";
import { GenreTag } from "./GenreTag";
import styles from "./IgnoredRow.module.css";

type Props = {
  game: Game;
  onRestore: () => void;
};

export function IgnoredRow({ game, onRestore }: Props) {
  return (
    <li className={styles.row}>
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
        <span className={styles.title}>{game.title}</span>
        <div className={styles.metaRow}>
          {game.genres.filter(Boolean).map((g, i) => (
            <GenreTag key={g} label={g} accent={i === 0} />
          ))}
          <span className={styles.developer}>
            {game.developer} · {game.year}
            {game.metacritic != null ? ` · MC ${game.metacritic}` : ""}
          </span>
        </div>
      </div>

      <div className={styles.price}>
        <GamePriceBadge appId={game.steamAppId} size="sm" />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.restore}
          aria-label={`Restore ${game.title}`}
          onClick={onRestore}
        >
          Restore
        </button>
        <button
          type="button"
          className={styles.remove}
          aria-label={`Remove ${game.title} from ignored games`}
          onClick={onRestore}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
