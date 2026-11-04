"use client";

import Link from "next/link";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import HeartIcon from "@/assets/icons/heart.svg";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { SwipeDeckPageSkeleton } from "@/features/session/components/skeletons/SwipeDeckPageSkeleton";
import type { Game } from "@/features/games/data/games";
import { getDeckById, setActiveDeckId } from "@/features/decks/lib/deck-store";
import {
  getLibraryGamesByIds,
  ensureGamesInLibrary,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import { getActiveSession, toUiMember } from "@/features/session/lib/session-context";
import type { SessionMember } from "@/features/session/data/session";
import {
  castVote,
  deleteVote,
  fetchMembers,
  fetchSession,
  fetchSessionGames,
  markMemberDone,
} from "@/features/session/lib/sessions";
import {
  DeckSwipeStage,
  type DeckSwipeHandle,
} from "@/features/session/components/DeckSwipeStage";
import { SwipeUndoChip } from "@/features/session/components/SwipeUndoChip";
import { useSwipeUndo } from "@/features/session/lib/use-swipe-undo";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import styles from "./SessionDeckClient.module.css";

export function SessionDeckClient() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [deckName, setDeckName] = useState("Deck");
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const indexRef = useRef(0);
  const finishingRef = useRef(false);
  const failedIndexRef = useRef<number | null>(null);
  const pendingVotesRef = useRef(new Set<Promise<boolean>>());
  const [swipeKey, setSwipeKey] = useState(0);
  const stageRef = useRef<DeckSwipeHandle>(null);
  const undo = useSwipeUndo();

  useEffect(() => {
    async function load() {
      const active = getActiveSession();
      if (!active) {
        setError("No active session.");
        setReady(true);
        return;
      }

      const session = await fetchSession(active.sessionId);
      setActiveDeckId(session.deck_id);
      await hydrateSeedGamesFromIgdb();
      const snapshotIds = await fetchSessionGames(session.id);
      if (snapshotIds.length > 0) {
        const list = await ensureGamesInLibrary(snapshotIds);
        setDeckName(session.deck_name ?? "Deck");
        setGames(list);
      } else {
        const deck = await getDeckById(session.deck_id);
        const list = deck ? getLibraryGamesByIds(deck.gameIds) : [];
        setDeckName(deck?.name ?? session.deck_id);
        setGames(list);
      }
      goTo(0);

      const dbMembers = await fetchMembers(active.sessionId);
      setMembers(dbMembers.map(toUiMember));
      setReady(true);
    }

    void load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load deck");
      setReady(true);
    });
  }, []);

  function goTo(next: number) {
    indexRef.current = next;
    setIndex(next);
  }

  function rollbackFailedVotes() {
    const failedAt = failedIndexRef.current;
    failedIndexRef.current = null;
    finishingRef.current = false;
    setFinishing(false);
    if (failedAt == null) return;
    goTo(Math.min(indexRef.current, failedAt));
    setSwipeKey((key) => key + 1);
  }

  function vote(value: "like" | "dislike"): boolean {
    if (finishingRef.current || games.length === 0) return false;
    const active = getActiveSession();
    const votedIndex = indexRef.current;
    const game = games[votedIndex];
    if (!active || !game) return false;

    setError(null);
    undo.record(votedIndex);

    const task: Promise<boolean> = castVote({
      sessionId: active.sessionId,
      memberId: active.memberId,
      gameId: game.id,
      value,
    }).then(
      () => true,
      (e: unknown) => {
        setError(e instanceof Error ? e.message : "Vote failed");
        failedIndexRef.current = Math.min(
          failedIndexRef.current ?? votedIndex,
          votedIndex,
        );
        if (!finishingRef.current) rollbackFailedVotes();
        return false;
      },
    );
    const tracked = task.finally(() => pendingVotesRef.current.delete(tracked));
    pendingVotesRef.current.add(tracked);

    if (votedIndex >= games.length - 1) {
      finishingRef.current = true;
      setFinishing(true);
      void (async () => {
        const results = await Promise.all([...pendingVotesRef.current]);
        if (!results.every(Boolean)) {
          rollbackFailedVotes();
          return;
        }
        try {
          await markMemberDone(active.memberId);
          router.push("/session/matches");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Vote failed");
          rollbackFailedVotes();
        }
      })();
      return true;
    }

    goTo(votedIndex + 1);
    return true;
  }

  async function undoLast() {
    if (voting || finishingRef.current) return;
    const prev = undo.back();
    if (prev == null) return;
    const game = games[prev];
    const active = getActiveSession();
    setVoting(true);
    setError(null);
    try {
      await Promise.all([...pendingVotesRef.current]);
      if (active && game) {
        try {
          await deleteVote({
            sessionId: active.sessionId,
            memberId: active.memberId,
            gameId: game.id,
          });
        } catch {
          /* keep going — recast upserts */
        }
      }
      goTo(prev);
      setSwipeKey((key) => key + 1);
    } finally {
      setVoting(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.body.dataset.galleryOpen) return;
      if (!e.repeat && (e.key === "ArrowRight" || e.key === "l")) {
        stageRef.current?.swipe("like");
      }
      if (!e.repeat && (e.key === "ArrowLeft" || e.key === "a")) {
        stageRef.current?.swipe("dislike");
      }
      if (e.key === "Backspace" || e.key === "u" || e.key === "U") {
        e.preventDefault();
        void undoLast();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const current = games[index];
  const next = games[index + 1];
  const lobbyHref = (() => {
    const active = getActiveSession();
    return active?.code
      ? `/session/lobby/${encodeURIComponent(active.code)}`
      : "/session";
  })();

  if (!ready) {
    return <SwipeDeckPageSkeleton />;
  }

  if (error && games.length === 0) {
    return (
      <div className={styles.errorPage}>
        <p className={styles.errorText}>{error}</p>
        <Link href="/session" className={styles.errorLink}>
          Back to session
        </Link>
      </div>
    );
  }

  if (games.length === 0 || !current) {
    return (
      <div className={styles.emptyPage}>
        <p className={styles.emptyText}>No games in this deck.</p>
        <Link href="/decks/new" className={styles.emptyLink}>
          Create a deck
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div aria-hidden className={styles.glow} />

      <AppTopBar />

      <div className={styles.stage}>
        <div className={`${styles.sessionChrome} ${styles.sessionChromeWide}`}>
          <div className={styles.chromeStart}>
            <div className={styles.chromeNav}>
              <PageBackLink href={lobbyHref} className={styles.chromeChip}>
                <ChevronLeftIcon className={styles.chipGlyph} aria-hidden />
                Lobby
              </PageBackLink>
              <div className={styles.members}>
                {members.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    title={m.name}
                    className={styles.memberAvatar}
                    style={{ background: m.color }}
                  >
                    <span className={styles.initials}>{m.initials}</span>
                  </div>
                ))}
              </div>
              <span className={styles.deckName}>{deckName}</span>
              <SwipeUndoChip
                disabled={voting || finishing || !undo.canUndo}
                onUndo={() => void undoLast()}
              />
            </div>
          </div>
        </div>

        {error && <p className={styles.voteError}>{error}</p>}

        <DeckSwipeStage
          current={current}
          next={next}
          preload={games.slice(index + 2, index + 6)}
          enabled={!voting && !finishing}
          hideCurrent={finishing}
          swipeKey={swipeKey}
          dock={
            <Link href="/session/matches" className={styles.chromeChip}>
              <HeartIcon className={styles.chipIcon} aria-hidden />
              Matches
            </Link>
          }
          handleRef={stageRef}
          onLike={() => vote("like")}
          onSkip={() => vote("dislike")}
        />
      </div>
    </div>
  );
}
