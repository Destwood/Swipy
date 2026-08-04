"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/AppTopBar";
import { MemberRow } from "@/components/MemberRow";
import { SwipyLogo } from "@/components/SwipyLogo";
import type { SessionMember } from "@/data/session";
import { getDeckById, setActiveDeckId } from "@/lib/deck-store";
import { getActiveSession, toUiMember } from "@/lib/session-context";
import {
  fetchMembers,
  fetchSession,
  startSessionSwiping,
  subscribeToMembers,
} from "@/lib/supabase/sessions";

export default function SessionLobbyPage() {
  const router = useRouter();
  const [code, setCode] = useState("…");
  const [deckLabel, setDeckLabel] = useState("…");
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const active = getActiveSession();
    if (!active) {
      setError("No active session. Create or join one first.");
      return;
    }

    const [session, dbMembers] = await Promise.all([
      fetchSession(active.sessionId),
      fetchMembers(active.sessionId),
    ]);

    setCode(session.code);
    setIsHost(active.isHost);
    setActiveDeckId(session.deck_id);
    const deck = getDeckById(session.deck_id);
    setDeckLabel(
      deck ? `${deck.name} · ${deck.gameIds.length} games` : session.deck_id,
    );
    setMembers(dbMembers.map(toUiMember));

    if (session.status === "swiping") {
      router.push("/session/deck");
    }
  }

  useEffect(() => {
    const active = getActiveSession();
    if (!active) {
      setError("No active session. Create or join one first.");
      return;
    }

    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load lobby"),
    );

    return subscribeToMembers(active.sessionId, () => {
      void reload().catch(() => undefined);
    });
  }, [router]);

  async function onStart() {
    const active = getActiveSession();
    if (!active || busy) return;
    setBusy(true);
    setError(null);
    try {
      await startSessionSwiping(active.sessionId);
      router.push("/session/deck");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setBusy(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      setError("Could not copy code");
    }
  }

  const readyCount = members.filter((m) => m.status !== "waiting").length;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar
        right={
          <span className="font-mono text-xs tracking-[0.04em] text-white/30">
            {code}
          </span>
        }
      >
        <div className="flex items-center gap-4">
          <Link
            href="/session"
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
            Back
          </Link>
          <div className="h-5 w-px bg-white/[0.08]" />
          <SwipyLogo size="bar" />
        </div>
      </AppTopBar>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[780px] px-10 pt-10 pb-[60px]">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-sw-accent uppercase">
                Lobby
              </p>
              <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-sw-text">
                Friends in this session
              </h1>
              <p className="mt-2 font-body text-sm text-sw-text/45">
                Deck: <span className="text-sw-text/70">{deckLabel}</span>
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs text-white/25">
              {readyCount}/{members.length} ready
            </span>
          </div>

          {error && (
            <p className="mb-4 font-body text-sm text-sw-dislike">{error}</p>
          )}

          <ul className="mb-10 m-0 flex list-none flex-col gap-0.5 p-0">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            {isHost ? (
              <button
                type="button"
                onClick={() => void onStart()}
                disabled={busy || members.length === 0}
                className="rounded-xl bg-sw-accent px-8 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-sw-bg shadow-[0_0_28px_rgba(45,212,191,0.2)] transition-all hover:bg-sw-like disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Starting…" : "Start session swipe"}
              </button>
            ) : (
              <p className="font-body text-sm text-sw-text/45">
                Waiting for host to start…
              </p>
            )}
            <button
              type="button"
              onClick={() => void copyCode()}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-8 py-3.5 text-[15px] font-medium text-sw-text/70 transition-all hover:bg-white/10 hover:text-sw-text"
            >
              Copy invite code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
