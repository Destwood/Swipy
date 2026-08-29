"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** Card idle-motion tuning (top card only; see `swipeIdleMotion`). */
const HOVER_PULL_PX = 36; // Horizontal shift when hovering like/skip rails (px).
const CURSOR_PULL_X = 0.09; // Cursor X distance → card X (fraction of offset from center).
const CURSOR_PULL_Y = 0.05; // Cursor Y distance → card Y (fraction of offset from center).
const CURSOR_MAX_X = 4; // Max horizontal cursor-follow offset (px).
const CURSOR_MAX_Y = 3; // Max vertical cursor-follow offset (px).
const FOLLOW_LERP = 0.045; // Smoothing per frame (0–1); lower = slower, softer follow.

export function DeckSwipeStage({
  current,
  next,
  enabled,
  swipeKey = 0,
  onLike,
  onSkip,
}: Props) {
  const [magnet, setMagnet] = useState<"like" | "skip" | null>(null);
  const [follow, setFollow] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const followRef = useRef({ x: 0, y: 0 });
  const followTargetRef = useRef({ x: 0, y: 0 });
  const followRafRef = useRef<number | null>(null);

  const swipe = useCardSwipe({
    enabled,
    cardId: `${current.id}:${swipeKey}`,
    onLike,
    onSkip,
  });

  const likeGlow = Math.min(1, Math.max(0, swipe.offset / 140));
  const skipGlow = Math.min(1, Math.max(0, -swipe.offset / 140));

  const stopFollowAnimation = useCallback(() => {
    if (followRafRef.current != null) {
      cancelAnimationFrame(followRafRef.current);
      followRafRef.current = null;
    }
  }, []);

  const tickFollow = useCallback(() => {
    const target = followTargetRef.current;
    const current = followRef.current;
    const next = {
      x: current.x + (target.x - current.x) * FOLLOW_LERP,
      y: current.y + (target.y - current.y) * FOLLOW_LERP,
    };
    followRef.current = next;
    setFollow(next);

    const settled =
      Math.hypot(target.x - next.x, target.y - next.y) < 0.06;
    if (!settled) {
      followRafRef.current = requestAnimationFrame(tickFollow);
    } else {
      followRafRef.current = null;
      if (target.x === 0 && target.y === 0) {
        followRef.current = { x: 0, y: 0 };
        setFollow({ x: 0, y: 0 });
      }
    }
  }, []);

  const ensureFollowAnimation = useCallback(() => {
    if (followRafRef.current == null) {
      followRafRef.current = requestAnimationFrame(tickFollow);
    }
  }, [tickFollow]);

  useEffect(() => {
    return () => stopFollowAnimation();
  }, [stopFollowAnimation]);

  useEffect(() => {
    if (!swipe.dragging) return;
    setMagnet(null);
    followTargetRef.current = { x: 0, y: 0 };
    followRef.current = { x: 0, y: 0 };
    setFollow({ x: 0, y: 0 });
    stopFollowAnimation();
  }, [swipe.dragging, stopFollowAnimation]);

  const magnetX =
    !swipe.dragging && magnet === "like"
      ? HOVER_PULL_PX
      : !swipe.dragging && magnet === "skip"
        ? -HOVER_PULL_PX
        : 0;

  const onDeckPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || swipe.dragging || magnet) return;
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawX = (e.clientX - cx) * CURSOR_PULL_X;
      const rawY = (e.clientY - cy) * CURSOR_PULL_Y;
      followTargetRef.current = {
        x: Math.max(-CURSOR_MAX_X, Math.min(CURSOR_MAX_X, rawX)),
        y: Math.max(-CURSOR_MAX_Y, Math.min(CURSOR_MAX_Y, rawY)),
      };
      ensureFollowAnimation();
    },
    [enabled, swipe.dragging, magnet, ensureFollowAnimation],
  );

  const onDeckPointerLeave = useCallback(() => {
    followTargetRef.current = { x: 0, y: 0 };
    ensureFollowAnimation();
  }, [ensureFollowAnimation]);

  return (
    <div className={styles.body}>
      <div
        className={styles.deckArea}
        onPointerMove={onDeckPointerMove}
        onPointerLeave={onDeckPointerLeave}
      >
        <div
          className={styles.skipRail}
          onPointerEnter={() => !swipe.dragging && setMagnet("skip")}
          onPointerLeave={() => setMagnet((m) => (m === "skip" ? null : m))}
        >
          <ActionButton type="dislike" onClick={onSkip} />
        </div>
        <div
          className={styles.likeRail}
          onPointerEnter={() => !swipe.dragging && setMagnet("like")}
          onPointerLeave={() => setMagnet((m) => (m === "like" ? null : m))}
        >
          <ActionButton type="like" onClick={onLike} />
        </div>

        <div className={styles.deckRow}>
          <div className={styles.cardMagnet}>
            <div ref={cardRef} className={styles.cardStack}>
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
              >
                <div
                  ref={swipe.layerRef}
                  className={`${styles.swipeIdleMotion}${swipe.dragging ? ` ${styles.swipeIdleMotionDragging}` : ""}`}
                  style={
                    swipe.dragging
                      ? undefined
                      : {
                          transform: `translate(${magnetX + follow.x}px, ${follow.y}px) rotate(${magnetX * 0.045 + follow.x * 0.04}deg)`,
                        }
                  }
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
            </div>
          </div>
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
