import Image from "next/image";
import type { Game } from "@/data/games";
import { GenreTag } from "./GenreTag";

export function LikedRow({ game }: { game: Game }) {
  return (
    <li className="group flex items-center gap-5 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.035]">
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
        <div className="mb-1.5 flex items-center gap-3">
          <span className="truncate font-display text-base font-bold tracking-[-0.02em] text-sw-text">
            {game.title}
          </span>
          {game.metacritic != null && (
            <span className="shrink-0 font-mono text-[11px] text-[rgba(45,212,191,0.75)]">
              MC {game.metacritic}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {game.genres.filter(Boolean).map((g, i) => (
            <GenreTag key={g} label={g} accent={i === 0} />
          ))}
          <span className="ml-0.5 font-mono text-[11px] text-white/22">
            {game.developer} · {game.year}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Remove ${game.title}`}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/30 opacity-0 transition-all group-hover:opacity-100 hover:border-[rgba(251,113,133,0.3)] hover:bg-[rgba(251,113,133,0.08)] hover:text-sw-dislike"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2 2l8 8M10 2L2 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}
