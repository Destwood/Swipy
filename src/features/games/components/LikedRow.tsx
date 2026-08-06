import Image from "next/image";
import CloseIcon from "@/assets/icons/close.svg";
import type { Game } from "@/features/games/data/games";
import { GenreTag } from "./GenreTag";
import styles from "./LikedRow.module.css";

export function LikedRow({ game }: { game: Game }) {
  return (
    <li className={styles.row}>
      <div className={styles.thumbnail}>
        <Image
          src={game.image}
          alt={`${game.title} cover`}
          fill
          className={styles.cover}
          sizes="72px"
        />
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{game.title}</span>
          {game.metacritic != null && (
            <span className={styles.metacritic}>MC {game.metacritic}</span>
          )}
        </div>
        <div className={styles.metaRow}>
          {game.genres.filter(Boolean).map((g, i) => (
            <GenreTag key={g} label={g} accent={i === 0} />
          ))}
          <span className={styles.developer}>
            {game.developer} · {game.year}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Remove ${game.title}`}
        className={styles.removeButton}
      >
        <CloseIcon className={styles.removeIcon} aria-hidden />
      </button>
    </li>
  );
}
