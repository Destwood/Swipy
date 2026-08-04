"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/data/games";
import { saveCustomDeck } from "@/lib/deck-store";

export function CreateDeckForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selected.length;
  const sortedGames = useMemo(
    () => [...GAMES].sort((a, b) => a.title.localeCompare(b.title)),
    [],
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the deck a name.");
      return;
    }
    if (selected.length < 2) {
      setError("Pick at least 2 games.");
      return;
    }

    const deck = saveCustomDeck({
      name,
      description,
      gameIds: selected,
    });
    router.push(`/decks?created=${deck.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[900px] px-10 pt-10 pb-[60px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-sw-accent uppercase">
            Create deck
          </p>
          <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-sw-text">
            Build a game list
          </h1>
          <p className="mt-2 font-body text-sm text-sw-text/45">
            Pick games from the catalog. Later you&apos;ll attach this deck to a lobby.
          </p>
        </div>
        <Link
          href="/decks"
          className="text-sm text-white/40 transition-colors hover:text-sw-text"
        >
          Back to decks
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.06em] text-white/30 uppercase">
            Deck name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friday co-op"
            className="rounded-xl border border-white/10 bg-sw-surface px-4 py-3 font-body text-sw-text outline-none placeholder:text-white/20 focus:border-sw-accent/40"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.06em] text-white/30 uppercase">
            Description
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="rounded-xl border border-white/10 bg-sw-surface px-4 py-3 font-body text-sw-text outline-none placeholder:text-white/20 focus:border-sw-accent/40"
          />
        </label>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-sw-text">
          Catalog
        </h2>
        <span className="font-mono text-xs text-white/30">
          {selectedCount} selected · {GAMES.length} total
        </span>
      </div>

      <ul className="mb-8 m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
        {sortedGames.map((game) => {
          const isOn = selected.includes(game.id);
          return (
            <li key={game.id}>
              <button
                type="button"
                onClick={() => toggle(game.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                  isOn
                    ? "border-[rgba(45,212,191,0.35)] bg-[rgba(45,212,191,0.1)]"
                    : "border-white/[0.06] bg-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sw-surface">
                  <Image
                    src={game.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-bold text-sw-text">
                    {game.title}
                  </div>
                  <div className="truncate font-mono text-[11px] text-white/30">
                    {game.genres.slice(0, 2).join(" · ")}
                  </div>
                </div>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] ${
                    isOn
                      ? "border-sw-accent bg-sw-accent text-sw-bg"
                      : "border-white/15 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="mb-4 font-body text-sm text-sw-dislike">{error}</p>
      )}

      <button
        type="submit"
        className="rounded-xl bg-sw-accent px-8 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-sw-bg transition-all hover:bg-sw-like"
      >
        Save deck
      </button>
    </form>
  );
}
