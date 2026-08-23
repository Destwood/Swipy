import Image from "next/image";
import type { Game } from "@/features/games/data/games";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import { GenreTag } from "./GenreTag";
import styles from "./GameCard.module.css";

interface Props {
  game: Game;
  dimmed?: boolean;
}

export function GameCard({ game, dimmed = false }: Props) {
  return (
    <div className={`${styles.root} ${dimmed ? styles.dimmed : ""}`}>
      <Image
        src={gameCoverSrc(game.image, "hero")}
        alt={`${game.title} cover`}
        fill
        className={styles.cover}
        sizes="(max-height: 900px) 70vh, 420px"
        quality={90}
        priority={!dimmed}
        draggable={false}
      />

      {!dimmed && (
        <>
          <div className={styles.gradient} />

          <div className={styles.footer}>
            <div className={styles.meta}>
              {game.developer} · {game.year}
              {game.metacritic != null && (
                <span className={styles.metacritic}>MC {game.metacritic}</span>
              )}
            </div>

            <h2 className={styles.title}>{game.title}</h2>

            <div className={styles.genres}>
              {game.genres.filter(Boolean).map((g, i) => (
                <GenreTag key={g} label={g} accent={i === 0} />
              ))}
            </div>

            <p className={styles.description}>{game.description}</p>
          </div>
        </>
      )}
    </div>
  );
}
