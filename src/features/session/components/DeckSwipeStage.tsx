"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import SidebarCompactIcon from "@/assets/icons/sidebar-compact.svg";
import SidebarFullIcon from "@/assets/icons/sidebar-full.svg";
import SidebarHiddenIcon from "@/assets/icons/sidebar-hidden.svg";
import { ActionButton } from "@/shared/ui/ActionButton";
import { GameCard } from "@/features/games/components/GameCard";
import { GameInfoSidebar } from "@/features/session/components/GameInfoSidebar";
import {
  useCardSwipe,
  type SwipeResult,
  type SwipeValue,
} from "@/features/session/lib/use-card-swipe";
import type { Game } from "@/features/games/data/games";
import { loadSteamMedia } from "@/features/games/lib/steam-media";
import styles from "./SessionDeckClient.module.css";

type Props = {
  current: Game;
  next?: Game;
  preload?: Game[];
  enabled: boolean;
  swipeKey?: number;
  onLike: () => SwipeResult;
  onSkip: () => SwipeResult;
  hideCurrent?: boolean;
  handleRef?: Ref<DeckSwipeHandle>;
  onIgnore?: () => void;
  dock?: ReactNode;
};

type Ghost = {
  id: number;
  game: Game;
  value: SwipeValue;
  fromX: number;
  fromY: number;
  fromRotate: number;
};

function FlyingGhost({
  ghost,
  onDone,
}: {
  ghost: Ghost;
  onDone: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dir = ghost.value === "like" ? 1 : -1;
    const to = dir * FLY_PX;
    const { fromX, fromY, fromRotate } = ghost;
    const anim = el.animate(
      [
        {
          transform: `translate(${fromX}px, ${fromY}px) rotate(${fromRotate}deg)`,
          opacity: 1,
        },
        {
          transform: `translateX(${to}px) rotate(${to / 14}deg)`,
          opacity: 0,
        },
      ],
      { duration: FLY_MS, easing: "ease-in", fill: "forwards" },
    );
    const timer = window.setTimeout(() => onDone(ghost.id), FLY_MS + 40);
    return () => {
      window.clearTimeout(timer);
      anim.cancel();
    };
  }, [ghost, onDone]);

  return (
    <div ref={ref} aria-hidden className={styles.ghostLayer}>
      <span
        className={`${styles.stamp} ${
          ghost.value === "like" ? styles.stampLike : styles.stampSkip
        }`}
        style={{ opacity: 1 }}
      >
        {ghost.value === "like" ? "Play" : "Skip"}
      </span>
      <GameCard game={ghost.game} />
    </div>
  );
}

export type DeckSwipeHandle = {
  swipe: (value: "like" | "dislike") => void;
};

type SidebarMode = "full" | "compact" | "hidden";

const SIDEBAR_STORAGE_KEY = "swipy:deck-sidebar-mode";
const SIDEBAR_NEXT_MODE: Record<SidebarMode, SidebarMode> = {
  full: "compact",
  compact: "hidden",
  hidden: "full",
};
const SIDEBAR_LABEL: Record<SidebarMode, string> = {
  full: "Compact game details",
  compact: "Hide game details",
  hidden: "Show game details",
};
const SIDEBAR_SLIDE_MS = 320;
const FLY_PX = 460;
const FLY_MS = 240;
const PROMOTE_MS = 220;
const VISIBLE_BEHIND = 3;
const STACK_SCALES = [1, 0.955, 0.925, 0.895];
const STACK_OFFSETS_PX = [0, 12, 17, 17];

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
  preload,
  enabled,
  swipeKey = 0,
  onLike,
  onSkip,
  hideCurrent = false,
  handleRef,
  onIgnore,
  dock,
}: Props) {
  const [magnet, setMagnet] = useState<"like" | "skip" | null>(null);
  const [follow, setFollow] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const followRef = useRef({ x: 0, y: 0 });
  const followTargetRef = useRef({ x: 0, y: 0 });
  const followRafRef = useRef<number | null>(null);

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("full");
  const [sidebarWidthMode, setSidebarWidthMode] = useState<"full" | "compact">(
    "full",
  );
  const [sidebarMounted, setSidebarMounted] = useState(true);
  const [sidebarAnimate, setSidebarAnimate] = useState(false);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [edgePulse, setEdgePulse] = useState<{
    value: SwipeValue;
    seq: number;
  } | null>(null);
  const ghostSeqRef = useRef(0);
  const promoteRef = useRef(false);
  const swipeLayerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  const launchGhost = useCallback((value: SwipeValue, fromOffset: number) => {
    promoteRef.current = true;
    ghostSeqRef.current += 1;
    setEdgePulse({ value, seq: ghostSeqRef.current });
    const idleEl = swipeLayerRef.current?.firstElementChild;
    const rest = idleEl
      ? new DOMMatrix(getComputedStyle(idleEl).transform)
      : new DOMMatrix();
    const ghost: Ghost = {
      id: ghostSeqRef.current,
      game: currentRef.current,
      value,
      fromX: fromOffset + rest.m41,
      fromY: rest.m42,
      fromRotate: fromOffset / 14 + (Math.atan2(rest.b, rest.a) * 180) / Math.PI,
    };
    setGhosts((list) => [...list, ghost]);
  }, []);

  const removeGhost = useCallback((id: number) => {
    setGhosts((list) => list.filter((ghost) => ghost.id !== id));
  }, []);

  const swipe = useCardSwipe({
    enabled,
    cardId: `${current.id}:${swipeKey}`,
    onLike,
    onSkip,
    onLaunch: launchGhost,
  });

  const [idleHold, setIdleHold] = useState(false);
  const cardKey = `${current.id}:${swipeKey}`;

  useLayoutEffect(() => {
    if (promoteRef.current) {
      promoteRef.current = false;
      swipeLayerRef.current?.animate(
        [
          {
            scale: STACK_SCALES[1],
            translate: `0 ${STACK_OFFSETS_PX[1]}px`,
          },
          { scale: 1, translate: "0 0" },
        ],
        { duration: PROMOTE_MS, easing: "ease-out" },
      );
    }
    setIdleHold(true);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setIdleHold(false));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [cardKey]);

  const upcoming = [next, ...(preload ?? [])].filter(
    (game, i, list): game is Game =>
      game !== undefined &&
      game.id !== current.id &&
      list.findIndex((other) => other?.id === game.id) === i,
  );
  const visibleCards = upcoming.slice(0, VISIBLE_BEHIND);
  const hiddenCards = upcoming.slice(VISIBLE_BEHIND);

  const upcomingSteamKey = upcoming
    .map((game) => game.steamAppId)
    .filter(Boolean)
    .join(",");
  useEffect(() => {
    if (!upcomingSteamKey) return;
    for (const appId of upcomingSteamKey.split(",")) {
      void loadSteamMedia(appId);
    }
  }, [upcomingSteamKey]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "compact") {
        setSidebarMode("compact");
        setSidebarWidthMode("compact");
      } else if (saved === "hidden") {
        setSidebarMode("hidden");
        setSidebarMounted(false);
      }
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setSidebarAnimate(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sidebarMode !== "hidden") return;
    const timer = window.setTimeout(
      () => setSidebarMounted(false),
      SIDEBAR_SLIDE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [sidebarMode]);

  const toggleSidebar = useCallback(() => {
    const next = SIDEBAR_NEXT_MODE[sidebarMode];
    if (next !== "hidden") {
      setSidebarMounted(true);
      setSidebarWidthMode(next);
    }
    setSidebarMode(next);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, [sidebarMode]);

  const sidebarOpen = sidebarMode !== "hidden";
  const SidebarToggleIcon =
    sidebarMode === "full"
      ? SidebarFullIcon
      : sidebarMode === "compact"
        ? SidebarCompactIcon
        : SidebarHiddenIcon;

  const { commit } = swipe;
  useImperativeHandle(handleRef, () => ({ swipe: commit }), [commit]);

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

  const toggleButton = (
    <button
      type="button"
      className={`${styles.chromeChip} ${styles.sidebarToggle}`}
      aria-label={SIDEBAR_LABEL[sidebarMode]}
      title={SIDEBAR_LABEL[sidebarMode]}
      onClick={toggleSidebar}
    >
      <SidebarToggleIcon className={styles.sidebarToggleIcon} aria-hidden />
    </button>
  );

  return (
    <div className={styles.body}>
      <div
        className={`${styles.deckArea}${onIgnore ? ` ${styles.deckAreaIgnore}` : ""}`}
        onPointerMove={onDeckPointerMove}
        onPointerLeave={onDeckPointerLeave}
      >
        {edgePulse ? (
          <div
            key={edgePulse.seq}
            aria-hidden
            className={`${styles.edgePulse} ${
              edgePulse.value === "like"
                ? styles.edgePulseLike
                : styles.edgePulseSkip
            }`}
          />
        ) : null}
        <div
          className={styles.skipRail}
          onPointerEnter={() => !swipe.dragging && setMagnet("skip")}
          onPointerLeave={() => setMagnet((m) => (m === "skip" ? null : m))}
        >
          <ActionButton
            type="dislike"
            active={swipe.offset < -24}
            onClick={() => commit("dislike")}
          />
        </div>
        <div
          className={styles.likeRail}
          onPointerEnter={() => !swipe.dragging && setMagnet("like")}
          onPointerLeave={() => setMagnet((m) => (m === "like" ? null : m))}
        >
          <ActionButton
            type="like"
            active={swipe.offset > 24}
            onClick={() => commit("like")}
          />
        </div>

        <div className={styles.deckRow}>
          <div className={styles.cardMagnet}>
            <div ref={cardRef} className={styles.cardStack}>
              {hiddenCards.map((game) => (
                <div key={game.id} aria-hidden className={styles.preloadCard}>
                  <GameCard game={game} dimmed />
                </div>
              ))}
              {[...visibleCards]
                .map((game, i) => ({ game, depth: i + 1 }))
                .reverse()
                .map(({ game, depth }) => (
                  <div
                    key={game.id}
                    className={styles.nextCard}
                    style={{
                      scale: STACK_SCALES[depth],
                      translate: `0 ${STACK_OFFSETS_PX[depth]}px`,
                    }}
                  >
                    <GameCard key={game.id} game={game} dimmed />
                  </div>
                ))}
              <div
                ref={swipeLayerRef}
                className={`${styles.swipeLayer} ${
                  swipe.instant
                    ? styles.swipeInstant
                    : swipe.dragging
                      ? ""
                      : styles.swipeSettle
                }`}
                style={{
                  transform: `translateX(${swipe.offset}px) rotate(${swipe.offset / 14}deg)`,
                  opacity: hideCurrent ? 0 : 1,
                }}
              >
                <div
                  ref={swipe.layerRef}
                  className={`${styles.swipeIdleMotion}${swipe.dragging ? ` ${styles.swipeIdleMotionDragging}` : ""}`}
                  style={{
                    transition: idleHold ? "none" : undefined,
                    transform: swipe.dragging || idleHold
                      ? "translate(0px, 0px) rotate(0deg)"
                      : `translate(${magnetX + follow.x}px, ${follow.y}px) rotate(${magnetX * 0.045 + follow.x * 0.04}deg)`,
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
                  <GameCard key={current.id} game={current} />
                </div>
              </div>
              {ghosts.map((ghost) => (
                <FlyingGhost key={ghost.id} ghost={ghost} onDone={removeGhost} />
              ))}
            </div>
            {onIgnore ? (
              <button
                type="button"
                className={styles.ignoreButton}
                onClick={onIgnore}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden className={styles.ignoreIcon}>
                  <path
                    d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a14.7 14.7 0 0 1-2.1 2.8M6.7 6.7C3.6 8.5 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4.1-.8M9.9 9.9a3 3 0 0 0 4.2 4.2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Don’t show this game again
              </button>
            ) : null}
          </div>
        </div>

        {onIgnore ? null : (
          <div className={styles.hints}>
            <span>Drag left to skip</span>
            <span className={styles.hintDivider}>·</span>
            <span>Drag right to play</span>
          </div>
        )}
      </div>

      <div
        className={`${styles.sidebarSlot}${sidebarMode === "full" ? ` ${styles.sidebarSlotOpen}` : ""}${sidebarMode === "compact" ? ` ${styles.sidebarSlotCompact}` : ""}${sidebarAnimate ? ` ${styles.sidebarSlotAnimated}` : ""}`}
      >
        <div className={styles.sidebarDock}>
          {dock}
          <div
            className={`${styles.dockToggle}${sidebarOpen ? "" : ` ${styles.dockToggleVisible}`}`}
            inert={sidebarOpen}
          >
            <div className={styles.dockToggleInner}>{toggleButton}</div>
          </div>
        </div>
        <div className={styles.sidebarClip} aria-hidden={!sidebarOpen}>
          {sidebarMounted ? (
            <GameInfoSidebar
              game={current}
              compact={sidebarWidthMode === "compact"}
              headerAction={sidebarOpen ? toggleButton : null}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
