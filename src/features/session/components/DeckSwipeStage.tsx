"use client";

import { ActionButton } from "@/shared/ui/ActionButton";
import { GameCard } from "@/features/games/components/GameCard";
import { GameInfoSidebar } from "@/features/session/components/GameInfoSidebar";
import { useCardSwipe } from "@/features/session/lib/use-card-swipe";
import type { Game } from "@/features/games/data/games";
import styles from "./SessionDeckClient.module.css";

type Props = {
  current: Game;
  next?: Game;
  enabled: boolean;
  swipeKey?: number;
  onLike: () => void;
  onSkip: () => void;
};

export function DeckSwipeStage({
  current,
  next,
  enabled,
  swipeKey = 0,
  onLike,
  onSkip,
}: Props) {
  const swipe = useCardSwipe({
    enabled,
    cardId: `${current.id}:${swipeKey}`,
    onLike,
    onSkip,
  });

  const likeGlow = Math.min(1, Math.max(0, swipe.offset / 140));
  const skipGlow = Math.min(1, Math.max(0, -swipe.offset / 140));

  return (
    <div className={styles.body}>
      <div className={styles.deckArea}>
        <div className={styles.deckRow}>
          <ActionButton type="dislike" onClick={onSkip} />

          <div className={styles.cardStack}>
            {next && (
              <div className={styles.nextCard}>
                <GameCard game={next} dimmed />
              </div>
            )}
            <div
              className={`${styles.swipeLayer} ${swipe.dragging ? "" : styles.swipeSettle}`}
              style={{
                transform: `translateX(${swipe.offset}px) rotate(${swipe.offset / 18}deg)`,
              }}
              {...swipe.bind}
            >
              <span
                className={`${styles.stamp} ${styles.stampLike}`}
                style={{ opacity: likeGlow }}
              >
                Play
              </span>
              <span
                className={`${styles.stamp} ${styles.stampSkip}`}
                style={{ opacity: skipGlow }}
              >
                Skip
              </span>
              <GameCard game={current} />
            </div>
          </div>

          <ActionButton type="like" onClick={onLike} />
        </div>

        <div className={styles.hints}>
          <span>Drag left to skip</span>
          <span className={styles.hintDivider}>·</span>
          <span>Drag right to play</span>
        </div>
      </div>

      <GameInfoSidebar game={current} />
    </div>
  );
}
