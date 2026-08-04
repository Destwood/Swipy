"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Deck } from "@/data/decks";
import { listDecks } from "@/lib/deck-store";

export function DecksList() {
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    setDecks(listDecks());
  }, []);

  return (
    <div className="mx-auto max-w-[780px] px-10 pt-10 pb-[60px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-sw-accent uppercase">
            Library
          </p>
          <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-sw-text">
            Decks
          </h1>
          <p className="mt-2 font-body text-sm text-sw-text/45">
            Decks are curated lists from the game catalog. Attach one when you create a lobby.
          </p>
        </div>
        <Link
          href="/decks/new"
          className="rounded-xl bg-sw-accent px-5 py-2.5 text-sm font-semibold text-sw-bg transition-colors hover:bg-sw-like"
        >
          Create deck
        </Link>
      </div>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {decks.map((deck) => (
          <li
            key={deck.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] px-5 py-4 transition-colors hover:bg-white/[0.03]"
          >
            <div className="min-w-0">
              <div className="font-display text-base font-bold tracking-[-0.02em] text-sw-text">
                {deck.name}
              </div>
              <div className="mt-1 font-mono text-[11px] text-white/30">
                {deck.gameIds.length} games
                {deck.description ? ` · ${deck.description}` : ""}
                {deck.id.startsWith("custom-") ? " · custom" : " · seed"}
              </div>
            </div>
            <Link
              href="/session"
              className="shrink-0 rounded-lg border border-[rgba(45,212,191,0.28)] bg-sw-accent-d px-3 py-2 text-sm text-sw-accent transition-colors hover:bg-[rgba(45,212,191,0.22)]"
            >
              Use in session
            </Link>
          </li>
        ))}
      </ul>

      {decks.length === 0 && (
        <p className="font-body text-sm text-sw-text/40">No decks yet.</p>
      )}
    </div>
  );
}
