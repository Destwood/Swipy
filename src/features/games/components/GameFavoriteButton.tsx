"use client";

import { useEffect, useState } from "react";
import StarIcon from "@/assets/icons/star.svg";
import StarOutlineIcon from "@/assets/icons/star-outline.svg";
import {
  isFavoriteGame,
  toggleFavoriteGame,
} from "@/features/games/lib/game-favorites";
import styles from "./GameFavoriteButton.module.css";

type Props = {
  gameId: string;
  className?: string;
  size?: number;
};

export function GameFavoriteButton({
  gameId,
  className,
  size = 14,
}: Props) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavoriteGame(gameId));
  }, [gameId]);

  return (
    <button
      type="button"
      className={`${styles.root} ${favorite ? styles.on : ""} ${className ?? ""}`}
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorite(toggleFavoriteGame(gameId));
      }}
    >
      {favorite ? (
        <StarIcon width={size} height={size} className={styles.icon} />
      ) : (
        <StarOutlineIcon width={size} height={size} className={styles.icon} />
      )}
    </button>
  );
}
