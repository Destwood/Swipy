"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import {
  ensureGamesInLibrary,
  getLibraryGameById,
} from "@/features/games/lib/game-library";
import type { Game } from "@/features/games/data/games";
import {
  requeueInfiniteGame,
  readInfiniteSession,
  type InfiniteSessionState,
} from "@/features/session/lib/infinite-session";
import { finalizeInfiniteSession } from "@/features/session/lib/swipe-history";
import type { SwipeVote } from "@/features/session/lib/swipe-run";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./InfiniteMatchesPopover.module.css";

type Props = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onRequeue: () => void;
};

function groupVotes(votes: SwipeVote[]) {
  const liked: SwipeVote[] = [];
  const rejected: SwipeVote[] = [];
  for (const vote of votes) {
    if (vote.value === "like") liked.push(vote);
    else rejected.push(vote);
  }
  return { liked, rejected };
}

export function InfiniteMatchesPopover({
  open,
  anchorRef,
  onClose,
  onRequeue,
}: Props) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<InfiniteSessionState | null>(null);
  const [games, setGames] = useState<Record<string, Game>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const current = readInfiniteSession();
    setSession(current);
    if (!current?.votes.length) {
      setGames({});
      return;
    }
    const ids = current.votes.map((vote) => vote.gameId);
    void ensureGamesInLibrary(ids).then((list) => {
      const map: Record<string, Game> = {};
      for (const game of list) map[game.id] = game;
      for (const id of ids) {
        const cached = getLibraryGameById(id);
        if (cached) map[id] = cached;
      }
      setGames(map);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !session) return null;

  const { liked, rejected } = groupVotes(session.votes);
  const ordered = [...liked, ...rejected];

  function handleRequeue(gameId: string) {
    requeueInfiniteGame(gameId);
    setSession(readInfiniteSession());
    onRequeue();
  }

  async function handleFinish() {
    if (busy || !session || session.votes.length === 0) return;
    setBusy(true);
    try {
      if (session.finishedHistoryId) {
        onClose();
        router.push(
          `/infinite/matches?session=${encodeURIComponent(session.finishedHistoryId)}`,
        );
        return;
      }
      const entry = await finalizeInfiniteSession();
      onClose();
      router.push(
        entry
          ? `/infinite/matches?session=${encodeURIComponent(entry.id)}`
          : "/infinite/matches",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Session matches">
      <div className={styles.header}>
        <p className={styles.title}>Matches</p>
        <p className={styles.meta}>{session.votes.length} swiped</p>
      </div>

      {ordered.length === 0 ? (
        <p className={styles.empty}>Swipe a few games first.</p>
      ) : (
        <ul className={styles.list}>
          {ordered.map((vote) => {
            const game = games[vote.gameId];
            return (
              <li key={vote.gameId} className={styles.row}>
                <span
                  className={`${styles.badge} ${
                    vote.value === "like" ? styles.badgeLike : styles.badgeSkip
                  }`}
                >
                  {vote.value === "like" ? "Like" : "Skip"}
                </span>
                <span className={styles.gameTitle}>
                  {game?.title ?? vote.gameId}
                </span>
                <button
                  type="button"
                  className={styles.requeueBtn}
                  title="Return to swipe list"
                  aria-label={`Return ${game?.title ?? vote.gameId} to swipe list`}
                  onClick={() => handleRequeue(vote.gameId)}
                >
                  <ChevronLeftIcon className={styles.requeueIcon} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.footer}>
        <Button
          type="button"
          size={ButtonSize.Sm}
          variant={ButtonVariant.Accent}
          disabled={busy || ordered.length === 0}
          onClick={() => void handleFinish()}
        >
          {session.finishedHistoryId ? "View results" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
