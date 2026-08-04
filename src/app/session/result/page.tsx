"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppTopBar } from "@/components/AppTopBar";
import { GenreTag } from "@/components/GenreTag";
import type { Game } from "@/data/games";
import { getGameById, HERO_IMG, SAMPLE_LIKED } from "@/data/games";
import type { SessionMember } from "@/data/session";
import { getActiveSession, toUiMember } from "@/lib/session-context";
import { fetchMembers } from "@/lib/supabase/sessions";

const RESULT_GAME_KEY = "swipy.resultGameId";

export default function SessionResultPage() {
  const [game, setGame] = useState<Game>(SAMPLE_LIKED[0]);
  const [members, setMembers] = useState<SessionMember[]>([]);

  useEffect(() => {
    const id = sessionStorage.getItem(RESULT_GAME_KEY);
    const picked = id ? getGameById(id) : undefined;
    if (picked) setGame(picked);

    const active = getActiveSession();
    if (!active) return;
    void fetchMembers(active.sessionId)
      .then((rows) => setMembers(rows.map(toUiMember)))
      .catch(() => undefined);
  }, []);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-sw-bg">
      <Image
        src={HERO_IMG}
        alt=""
        aria-hidden
        fill
        className="pointer-events-none object-cover brightness-[0.14] saturate-70"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(12,14,18,0.35) 0%, rgba(12,14,18,0.9) 100%)",
        }}
      />

      <AppTopBar />

      <div className="relative z-[2] flex min-h-0 flex-1 flex-col items-center justify-center px-10">
        <p className="mb-4 font-mono text-[11px] tracking-[0.08em] text-sw-accent uppercase">
          Tonight we play
        </p>

        <div className="mb-8 flex w-full max-w-xl items-center gap-6 rounded-2xl border border-white/[0.08] bg-[rgba(19,22,28,0.85)] p-5 backdrop-blur-md">
          <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-sw-surface">
            <Image
              src={game.image}
              alt={`${game.title} cover`}
              fill
              className="object-cover"
              sizes="112px"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="mb-2 font-display text-[clamp(28px,3vw,40px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-sw-text">
              {game.title}
            </h1>
            <p className="mb-3 font-mono text-[11px] text-white/35">
              {game.developer} · {game.year}
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {game.genres.map((g, i) => (
                <GenreTag key={g} label={g} accent={i === 0} />
              ))}
            </div>
            <p className="font-body text-sm text-sw-text/45">
              Matched by {members.length || "your"} friends
            </p>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-2">
          {members.map((m) => (
            <div
              key={m.id}
              title={m.name}
              className="flex h-9 w-9 items-center justify-center rounded-full font-display text-[11px] font-bold text-sw-bg"
              style={{ background: m.color }}
            >
              {m.initials}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/session/matches"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-8 py-3.5 text-[15px] font-medium text-sw-text/70 transition-all hover:bg-white/10 hover:text-sw-text"
          >
            Back to matches
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-sw-accent px-8 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-sw-bg shadow-[0_0_28px_rgba(45,212,191,0.2)] transition-all hover:bg-sw-like"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  );
}
