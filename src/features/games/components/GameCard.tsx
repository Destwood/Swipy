import Image from "next/image";
import type { Game } from "@/features/games/data/games";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import { GenreTag } from "./GenreTag";
import styles from "./GameCard.module.css";

interface Props {
  game: Game;
  dimmed?: boolean;
}

function cardBlurb(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned || /from IGDB\.?$/i.test(cleaned)) return null;
  return cleaned;
}

export function GameCard({ game, dimmed = false }: Props) {
  const genres = game.genres.filter(Boolean).slice(0, 2);
  const studio =
    game.developer &&
    game.developer !== "Unknown" &&
    game.developer !== "IGDB"
      ? game.developer
      : null;
  const byline = [studio, game.year || null].filter(Boolean).join(" · ");
  const description = cardBlurb(game.description);

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
            {genres.length > 0 ? (
              <div className={styles.genreRow}>
                {genres.map((g) => (
                  <GenreTag key={g} label={g} compact />
                ))}
              </div>
            ) : null}

            <h2 className={styles.title}>{game.title}</h2>
            {byline ? <p className={styles.meta}>{byline}</p> : null}

            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
