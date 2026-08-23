"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
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
  fetchMembers,
  fetchSession,
  fetchSessionGames,
  markMemberDone,
} from "@/features/session/lib/sessions";
import { DeckSwipeStage } from "@/features/session/components/DeckSwipeStage";
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
  const [swipeKey, setSwipeKey] = useState(0);

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
      setIndex(0);

      const dbMembers = await fetchMembers(active.sessionId);
      setMembers(dbMembers.map(toUiMember));
      setReady(true);
    }

    void load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load deck");
      setReady(true);
    });
  }, []);

  async function vote(value: "like" | "dislike") {
    if (voting || games.length === 0) return;
    const active = getActiveSession();
    const current = games[index];
    if (!active || !current) return;

    setVoting(true);
    setError(null);
    try {
      await castVote({
        sessionId: active.sessionId,
        memberId: active.memberId,
        gameId: current.id,
        value,
      });

      if (index >= games.length - 1) {
        await markMemberDone(active.memberId);
        router.push("/session/matches");
        return;
      }
      setIndex((currentIndex) => currentIndex + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vote failed");
      setSwipeKey((key) => key + 1);
    } finally {
      setVoting(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.body.dataset.galleryOpen) return;
      if (e.key === "ArrowRight" || e.key === "l") void vote("like");
      if (e.key === "ArrowLeft" || e.key === "a") void vote("dislike");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const current = games[index];
  const next = games[index + 1];
  const remaining = games.length - index;

  if (!ready) {
    return <div className={styles.loading}>Loading deck…</div>;
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

      <AppTopBar
        remainingLabel={`${remaining} left`}
        right={
          <div className={styles.topBarRight}>
            <span className={styles.deckName}>{deckName}</span>
            <Link href="/session/matches" className={styles.matchesLink}>
              Matches
            </Link>
          </div>
        }
      >
        <div className={styles.topBarLeft}>
          <SwipyLogo size="bar" href="/" />
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
        </div>
      </AppTopBar>

      {error && <p className={styles.voteError}>{error}</p>}

      <DeckSwipeStage
        current={current}
        next={next}
        enabled={!voting}
        swipeKey={swipeKey}
        onLike={() => void vote("like")}
        onSkip={() => void vote("dislike")}
      />
    </div>
  );
}
