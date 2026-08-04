"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppTopBar } from "@/components/AppTopBar";
import { GenreTag } from "@/components/GenreTag";
import { SwipyLogo } from "@/components/SwipyLogo";
import type { Game } from "@/data/games";
import { getGameById } from "@/data/games";
import { getActiveSession } from "@/lib/session-context";
import {
  computeMatchGameIds,
  fetchMembers,
  fetchSession,
  fetchVotes,
} from "@/lib/supabase/sessions";

const RESULT_GAME_KEY = "swipy.resultGameId";

export function SessionMatchesClient() {
  const [matches, setMatches] = useState<Game[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [memberCount, setMemberCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const active = getActiveSession();
      if (!active) {
        setError("No active session.");
        setReady(true);
        return;
      }

      const [session, members, votes] = await Promise.all([
        fetchSession(active.sessionId),
        fetchMembers(active.sessionId),
        fetchVotes(active.sessionId),
      ]);

      const counts: Record<string, number> = {};
      for (const vote of votes) {
        if (vote.value === "like") {
          counts[vote.game_id] = (counts[vote.game_id] ?? 0) + 1;
        }
      }

      const ids = computeMatchGameIds(votes, members.length, session.match_rule);
      setMatches(ids.map(getGameById).filter((g): g is Game => Boolean(g)));
      setLikeCounts(counts);
      setMemberCount(members.length);
      setReady(true);
    }

    void load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load matches");
      setReady(true);
    });
  }, []);

  function pickGame(gameId: string) {
    sessionStorage.setItem(RESULT_GAME_KEY, gameId);
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center font-mono text-sm text-white/30">
        Computing matches…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar
        right={
          matches[0] ? (
            <Link
              href="/session/result"
              onClick={() => pickGame(matches[0].id)}
              className="rounded-lg px-2.5 py-1.5 text-sm text-sw-accent transition-colors hover:text-sw-like"
            >
              Pick a game
            </Link>
          ) : null
        }
      >
        <div className="flex items-center gap-4">
          <Link
            href="/session/deck"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-white/40 transition-colors hover:text-sw-text"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Deck
          </Link>
          <div className="h-5 w-px bg-white/[0.08]" />
          <SwipyLogo size="bar" href="/session/lobby" />
        </div>
      </AppTopBar>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[780px] px-10 pt-10 pb-[60px]">
          <div className="mb-8">
            <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-sw-accent uppercase">
              Shared list
            </p>
            <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-sw-text">
              Matches
            </h1>
            <p className="mt-2 font-body text-sm text-sw-text/45">
              Games liked by everyone in the session. Pick one to play.
            </p>
          </div>

          {error && (
            <p className="mb-4 font-body text-sm text-sw-dislike">{error}</p>
          )}

          {matches.length === 0 ? (
            <p className="font-body text-sw-text/45">
              No full matches yet. Keep swiping or wait for friends to finish.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {matches.map((game, index) => (
                <li
                  key={game.id}
                  className="flex items-center gap-5 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.035]"
                >
                  <span className="w-6 shrink-0 font-mono text-sm text-white/25">
                    {index + 1}
                  </span>
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-sw-surface">
                    <Image
                      src={game.image}
                      alt={`${game.title} cover`}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 truncate font-display text-base font-bold tracking-[-0.02em] text-sw-text">
                      {game.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {game.genres.slice(0, 2).map((g, i) => (
                        <GenreTag key={g} label={g} accent={i === 0} />
                      ))}
                      <span className="font-mono text-[11px] text-sw-accent">
                        {likeCounts[game.id] ?? 0}/{memberCount} liked
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/session/result"
                    onClick={() => pickGame(game.id)}
                    className="shrink-0 rounded-lg border border-[rgba(45,212,191,0.28)] bg-sw-accent-d px-3 py-2 text-sm font-medium text-sw-accent transition-colors hover:bg-[rgba(45,212,191,0.22)]"
                  >
                    Play this
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            {matches[0] && (
              <Link
                href="/session/result"
                onClick={() => pickGame(matches[0].id)}
                className="rounded-xl bg-sw-accent px-8 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-sw-bg transition-all hover:bg-sw-like"
              >
                Continue to result
              </Link>
            )}
            <Link
              href="/session/deck"
              className="rounded-xl border border-white/10 bg-white/[0.06] px-8 py-3.5 text-[15px] font-medium text-sw-text/70 transition-all hover:bg-white/10 hover:text-sw-text"
            >
              Keep swiping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
