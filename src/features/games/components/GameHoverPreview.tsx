"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import ArrowRightIcon from "@/assets/icons/arrow-right.svg";
import type { Game } from "@/features/games/data/games";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import styles from "./GameHoverPreview.module.css";

const SHOW_DELAY_MS = 260;
const HIDE_DELAY_MS = 220;

type Props = {
  game: Game;
  children: ReactNode;
  variant?: "tile" | "inline";
  className?: string;
};

function canHoverPreview() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function formatRelease(game: Game) {
  if (game.releaseDate) {
    const [year, month, day] = game.releaseDate.split("-").map(Number);
    if (year && month && day) {
      return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        },
      );
    }
  }
  return game.year ? String(game.year) : null;
}

function previewImages(game: Game) {
  const shots = (game.screenshots ?? []).filter(Boolean);
  if (shots.length > 0) return [...new Set(shots)];
  return game.image ? [game.image] : [];
}

function realDescription(game: Game) {
  const text = game.description.trim();
  if (!text || text.endsWith("from IGDB.")) return null;
  return text;
}

export function GameHoverPreview({
  game,
  children,
  variant = "tile",
  className,
}: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef(0);
  const hideTimer = useRef(0);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    side: "left" | "right";
    arrowTop: number;
  }>({ top: 0, left: 0, side: "right", arrowTop: 28 });
  const [index, setIndex] = useState(0);

  const images = useMemo(() => previewImages(game), [game]);
  const release = formatRelease(game);
  const description = realDescription(game);
  const current = images[index] ?? images[0];
  const hasGallery = images.length > 1;

  const clearTimers = useCallback(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
  }, []);

  const scheduleShow = useCallback(() => {
    if (!canHoverPreview()) return;
    clearTimers();
    showTimer.current = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
  }, [clearTimers]);

  const scheduleHide = useCallback(() => {
    clearTimers();
    hideTimer.current = window.setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  }, [clearTimers]);

  const step = useCallback(
    (dir: -1 | 1) => {
      if (images.length < 2) return;
      setIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    setIndex(0);
  }, [game.id]);

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const card = cardRef.current;
    if (!anchor || !card) return;
    const rect = anchor.getBoundingClientRect();
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const pad = 12;
    const gap = 16;
    let side: "left" | "right" = "right";
    let left = rect.right + gap;
    if (left + width > window.innerWidth - pad) {
      left = rect.left - width - gap;
      side = "left";
    }
    if (left < pad) left = pad;
    let top = rect.top;
    if (top + height > window.innerHeight - pad) {
      top = window.innerHeight - pad - height;
    }
    if (top < pad) top = pad;
    const center = rect.top + rect.height / 2;
    const arrowTop = Math.min(height - 18, Math.max(18, center - top));
    setPos({ top, left, side, arrowTop });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const frame = requestAnimationFrame(place);
    function onScroll() {
      setOpen(false);
    }
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place, index]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  return (
    <div
      ref={anchorRef}
      className={`${styles.anchor} ${variant === "inline" ? styles.inline : styles.tile}${open ? ` ${styles.hot}` : ""}${className ? ` ${className}` : ""}`}
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      {children}
      {open && current
        ? createPortal(
            <div
              ref={cardRef}
              className={styles.card}
              role="tooltip"
              style={{ top: pos.top, left: pos.left }}
              onMouseEnter={clearTimers}
              onMouseLeave={scheduleHide}
            >
              <span
                className={`${styles.arrow} ${
                  pos.side === "right" ? styles.arrowStart : styles.arrowEnd
                }`}
                style={{ top: pos.arrowTop }}
                aria-hidden
              />
              <div className={styles.cardInner}>
                <div className={styles.media}>
                  <Image
                    src={gameCoverSrc(current, "hero")}
                    alt=""
                    fill
                    className={styles.image}
                    sizes="272px"
                    unoptimized={
                      current.includes("igdb") || current.includes("rawg")
                    }
                  />
                  {hasGallery ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.nav} ${styles.prev}`}
                        aria-label="Previous image"
                        onClick={() => step(-1)}
                      >
                        <ChevronLeftIcon className={styles.navIcon} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.nav} ${styles.next}`}
                        aria-label="Next image"
                        onClick={() => step(1)}
                      >
                        <ArrowRightIcon className={styles.navIcon} />
                      </button>
                      <span className={styles.counter}>
                        {index + 1}/{images.length}
                      </span>
                    </>
                  ) : null}
                </div>
                <div className={styles.body}>
                  <p className={styles.title}>{game.title}</p>
                  {release ? (
                    <p className={styles.meta}>
                      {release}
                      {game.developer && game.developer !== "Unknown"
                        ? ` · ${game.developer}`
                        : ""}
                    </p>
                  ) : null}
                  {description ? (
                    <p className={styles.description}>{description}</p>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
