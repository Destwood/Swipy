"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Deck } from "@/data/decks";
import { getActiveDeckId, listDecks, setActiveDeckId } from "@/lib/deck-store";
import { generateSessionCode } from "@/lib/session-context";
import { createGuestSession } from "@/lib/supabase/sessions";

export function CreateSessionForm() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");
  const [displayName, setDisplayName] = useState("Host");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState("SWPY-····");

  useEffect(() => {
    const all = listDecks();
    setDecks(all);
    const active = getActiveDeckId();
    const initial =
      (active && all.some((d) => d.id === active) && active) || all[0]?.id || "";
    setDeckId(initial);
    setSessionCode(generateSessionCode());
  }, []);

  async function openLobby() {
    if (!deckId || busy) return;
    setBusy(true);
    setError(null);
    try {
      setActiveDeckId(deckId);
      await createGuestSession({
        deckId,
        displayName,
        code: sessionCode,
      });
      router.push("/session/lobby");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
      setBusy(false);
    }
  }

  const selected = decks.find((d) => d.id === deckId);

  return (
    <div className="relative z-[2] flex min-h-0 flex-1 flex-col items-center justify-center px-10">
      <p className="mb-3 font-mono text-[11px] tracking-[0.08em] text-sw-accent uppercase">
        New session
      </p>
      <h1 className="mb-3 font-display text-[clamp(36px,4vw,52px)] leading-none font-extrabold tracking-[-0.04em] text-sw-text">
        Invite your friends
      </h1>
      <p className="mb-10 max-w-md text-center font-body text-base text-sw-text/50">
        Pick a deck, create a lobby, share the code.
      </p>

      <div className="mb-8 flex w-full max-w-md flex-col gap-5 rounded-2xl border border-white/[0.08] bg-sw-surface px-8 py-7">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.06em] text-white/30 uppercase">
            Your name
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-xl border border-white/10 bg-sw-bg px-4 py-3 font-body text-sw-text outline-none focus:border-sw-accent/40"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.06em] text-white/30 uppercase">
            Deck
          </span>
          <select
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="rounded-xl border border-white/10 bg-sw-bg px-4 py-3 font-body text-sw-text outline-none focus:border-sw-accent/40"
          >
            {decks.length === 0 && <option value="">No decks yet</option>}
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.gameIds.length} games)
              </option>
            ))}
          </select>
          {selected && (
            <span className="font-body text-xs text-white/35">
              {selected.description ?? `${selected.gameIds.length} games in this deck`}
            </span>
          )}
        </label>

        <div className="flex flex-col items-center gap-2 border-t border-white/[0.06] pt-5">
          <span className="font-mono text-[11px] tracking-[0.06em] text-white/30 uppercase">
            Session code
          </span>
          <span className="font-display text-3xl font-extrabold tracking-[0.12em] text-sw-text">
            {sessionCode}
          </span>
          <span className="font-mono text-[11px] text-white/25">
            Share after you open the lobby
          </span>
        </div>

        <Link
          href="/decks/new"
          className="text-center font-body text-sm text-sw-accent/80 transition-colors hover:text-sw-accent"
        >
          Or create a new deck →
        </Link>
      </div>

      {error && (
        <p className="mb-4 max-w-md text-center font-body text-sm text-sw-dislike">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void openLobby()}
          disabled={!deckId || busy}
          className="rounded-xl bg-sw-accent px-8 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-sw-bg shadow-[0_0_28px_rgba(45,212,191,0.2)] transition-all hover:bg-sw-like disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Creating…" : "Open lobby"}
        </button>
        <Link
          href="/session/join"
          className="rounded-xl border border-white/10 bg-white/[0.06] px-8 py-3.5 text-[15px] font-medium text-sw-text/70 transition-all hover:bg-white/10 hover:text-sw-text"
        >
          I have a code
        </Link>
      </div>
    </div>
  );
}
