"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { AppTopBar } from "@/components/AppTopBar";
import { GameCard } from "@/components/GameCard";
import { SwipyLogo } from "@/components/SwipyLogo";
import type { Game } from "@/data/games";
import { getGamesByIds } from "@/data/games";
import { getDeckById, setActiveDeckId } from "@/lib/deck-store";
import { getActiveSession, toUiMember } from "@/lib/session-context";
import type { SessionMember } from "@/data/session";
import {
  castVote,
  fetchMembers,
  fetchSession,
  markMemberDone,
} from "@/lib/supabase/sessions";

export function SessionDeckClient() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [deckName, setDeckName] = useState("Deck");
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

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
      const deck = getDeckById(session.deck_id);
      const list = deck ? getGamesByIds(deck.gameIds) : [];
      setDeckName(deck?.name ?? session.deck_id);
      setGames(list);
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
    } finally {
      setVoting(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "l") void vote("like");
      if (e.key === "ArrowLeft" || e.key === "a") void vote("dislike");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center font-mono text-sm text-white/30">
        Loading deck…
      </div>
    );
  }

  if (error && games.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="font-body text-sw-dislike">{error}</p>
        <Link href="/session" className="text-sw-accent hover:underline">
          Back to session
        </Link>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="font-body text-sw-text/50">No games in this deck.</p>
        <Link href="/decks/new" className="text-sw-accent hover:underline">
          Create a deck
        </Link>
      </div>
    );
  }

  const current = games[index];
  const next = games[index + 1];
  const remaining = games.length - index;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 45%, rgba(45,212,191,0.04) 0%, transparent 70%)",
        }}
      />

      <AppTopBar
        remainingLabel={`${remaining} left`}
        right={
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-white/25 sm:inline">
              {deckName}
            </span>
            <Link
              href="/session/matches"
              className="rounded-lg px-2.5 py-1.5 text-sm text-white/35 transition-colors hover:text-sw-accent"
            >
              Matches
            </Link>
          </div>
        }
      >
        <div className="flex items-center gap-4">
          <SwipyLogo size="bar" href="/session/lobby" />
          <div className="hidden items-center gap-1.5 sm:flex">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                title={m.name}
                className="flex h-7 w-7 items-center justify-center rounded-full font-display text-[10px] font-bold text-sw-bg"
                style={{ background: m.color }}
              >
                {m.initials}
              </div>
            ))}
          </div>
        </div>
      </AppTopBar>

      {error && (
        <p className="relative z-10 px-10 pt-3 text-center font-body text-sm text-sw-dislike">
          {error}
        </p>
      )}

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="flex items-center justify-center gap-16">
          <ActionButton
            type="dislike"
            onClick={() => void vote("dislike")}
          />

          <div className="relative h-[626px] w-[460px]">
            {next && (
              <div className="absolute inset-0 origin-bottom scale-[0.955] translate-y-3.5 overflow-hidden rounded-2xl bg-sw-surface shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
                <GameCard game={next} dimmed />
              </div>
            )}
            <GameCard key={current.id} game={current} />
          </div>

          <ActionButton type="like" onClick={() => void vote("like")} />
        </div>

        <div className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-6 whitespace-nowrap font-mono text-[11px] tracking-[0.03em] text-white/20">
          <span>← Skip</span>
          <span className="text-white/[0.08]">·</span>
          <span>Want to play →</span>
        </div>
      </div>
    </div>
  );
}
