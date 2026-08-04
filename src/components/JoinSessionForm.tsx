"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setActiveDeckId } from "@/lib/deck-store";
import { joinGuestSession } from "@/lib/supabase/sessions";

export function JoinSessionForm() {
  const router = useRouter();
  const [code, setCode] = useState("SWPY-");
  const [displayName, setDisplayName] = useState("Guest");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinLobby() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const session = await joinGuestSession({ code, displayName });
      setActiveDeckId(session.deckId);
      router.push("/session/lobby");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
      setBusy(false);
    }
  }

  return (
    <div className="relative z-[2] flex min-h-0 flex-1 flex-col items-center justify-center px-10">
      <p className="mb-3 font-mono text-[11px] tracking-[0.08em] text-sw-accent uppercase">
        Join session
      </p>
      <h1 className="mb-3 font-display text-[clamp(36px,4vw,52px)] leading-none font-extrabold tracking-[-0.04em] text-sw-text">
        Enter the code
      </h1>
      <p className="mb-10 max-w-md text-center font-body text-base text-sw-text/50">
        Ask the host for the session code, then jump into the lobby.
      </p>

      <div className="mb-8 flex w-full max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.06em] text-white/30 uppercase">
            Your name
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-xl border border-white/10 bg-sw-surface px-5 py-3 font-body text-sw-text outline-none focus:border-sw-accent/40"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.06em] text-white/30 uppercase">
            Code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SWPY-XXXX"
            className="rounded-xl border border-white/10 bg-sw-surface px-5 py-4 text-center font-display text-2xl font-bold tracking-[0.14em] text-sw-text outline-none placeholder:text-white/15 focus:border-sw-accent/40"
          />
        </label>
      </div>

      {error && (
        <p className="mb-4 max-w-md text-center font-body text-sm text-sw-dislike">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void joinLobby()}
          disabled={busy || code.trim().length < 6}
          className="rounded-xl bg-sw-accent px-8 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-sw-bg shadow-[0_0_28px_rgba(45,212,191,0.2)] transition-all hover:bg-sw-like disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Joining…" : "Join lobby"}
        </button>
        <Link
          href="/session"
          className="rounded-xl border border-white/10 bg-white/[0.06] px-8 py-3.5 text-[15px] font-medium text-sw-text/70 transition-all hover:bg-white/10 hover:text-sw-text"
        >
          Create instead
        </Link>
      </div>
    </div>
  );
}
