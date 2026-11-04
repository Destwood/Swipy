"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { GameHoverPreview } from "@/features/games/components/GameHoverPreview";
import type { Game } from "@/features/games/data/games";
import { ensureGamesInLibrary } from "@/features/games/lib/game-library";
import { openSteamStore } from "@/features/games/lib/steam";
import { gameCoverSrc } from "@/features/games/lib/igdb/image";
import { fetchSessionGames } from "@/features/session/lib/sessions";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./SessionGamesDialog.module.css";

function GameTile({ game, children }: { game: Game; children: ReactNode }) {
  const appId = game.steamAppId;
  if (!appId) return <div className={styles.tile}>{children}</div>;
  return (
    <button
      type="button"
      className={styles.tile}
      onClick={() => openSteamStore(appId)}
      aria-label={`Open ${game.title} in Steam`}
    >
      {children}
    </button>
  );
}

const PAGE_SIZE = 48;

function SkeletonTiles({ count }: { count: number }) {
  return Array.from({ length: count }, (_, i) => (
    <li key={`sk-${i}`} className={styles.skeletonTile} aria-hidden>
      <div className={`${styles.skeletonCover} sw-shimmer`} />
      <div className={`${styles.skeletonTitle} sw-shimmer`} />
    </li>
  ));
}

type Props = {
  open: boolean;
  sessionId: string | null;
  deckName: string;
  started: boolean;
  onClose: () => void;
};

export function SessionGamesDialog({
  open,
  sessionId,
  deckName,
  started,
  onClose,
}: Props) {
  const titleId = useId();
  const [ids, setIds] = useState<string[] | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const runRef = useRef(0);
  const busyRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open || !sessionId) return;
    const run = ++runRef.current;
    busyRef.current = false;
    setIds(null);
    setGames([]);
    setCursor(0);
    setBusy(false);
    setFailed(false);
    void fetchSessionGames(sessionId)
      .then((list) => {
        if (runRef.current === run) setIds(list);
      })
      .catch(() => {
        if (runRef.current === run) setFailed(true);
      });
    return () => {
      runRef.current += 1;
    };
  }, [open, sessionId]);

  const hasMore = ids !== null && cursor < ids.length;

  const loadMore = useCallback(async () => {
    if (!ids || busyRef.current || cursor >= ids.length) return;
    const run = runRef.current;
    const chunk = ids.slice(cursor, cursor + PAGE_SIZE);
    busyRef.current = true;
    setBusy(true);
    try {
      const loaded = await ensureGamesInLibrary(chunk);
      if (runRef.current !== run) return;
      setGames((list) => [...list, ...loaded]);
      setCursor(cursor + chunk.length);
    } catch {
      if (runRef.current === run) setFailed(true);
    } finally {
      if (runRef.current === run) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  }, [ids, cursor]);

  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!open || !hasMore || busy || failed || !root || !target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { root, rootMargin: "0px 0px 100% 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [open, hasMore, busy, failed, loadMore]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (document.querySelector('[role="tooltip"]')) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {deckName}
          </h2>
          <p className={styles.subtitle}>
            {ids ? `${ids.length} games the host picked` : "Host's games"}
          </p>
        </div>

        {started ? (
          <p className={styles.notice} role="status">
            The session has started. You will jump in when you close this.
          </p>
        ) : null}

        <div ref={scrollRef} className={styles.scroll}>
          {failed ? (
            <p className={styles.state}>Could not load the games.</p>
          ) : ids === null ? (
            <ul className={styles.grid} aria-busy="true" aria-label="Loading games">
              <SkeletonTiles count={10} />
            </ul>
          ) : ids.length === 0 ? (
            <p className={styles.state}>No games in this deck.</p>
          ) : (
            <ul className={styles.grid}>
              {games.map((game) => (
                <li key={game.id} className={styles.gridItem}>
                  <GameHoverPreview game={game} variant="inline">
                    <GameTile game={game}>
                      <div className={styles.coverWrap}>
                        <Image
                          src={gameCoverSrc(game.image, "tile")}
                          alt=""
                          fill
                          sizes="48px"
                          className={styles.coverImage}
                          unoptimized={
                            game.image.includes("igdb") ||
                            game.image.includes("rawg")
                          }
                        />
                      </div>
                      <h3 className={styles.gameTitle}>{game.title}</h3>
                    </GameTile>
                  </GameHoverPreview>
                </li>
              ))}
              {hasMore ? (
                <>
                  <SkeletonTiles count={games.length === 0 ? 10 : 2} />
                  <li ref={sentinelRef} className={styles.sentinel} aria-hidden />
                </>
              ) : null}
            </ul>
          )}
        </div>

        <div className={styles.footer}>
          <Button
            type="button"
            onClick={onClose}
            variant={started ? ButtonVariant.Accent : ButtonVariant.Dark}
            size={ButtonSize.Sm}
            className={styles.footerButton}
          >
            {started ? "Join the session" : "Close"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
