import Image from "next/image";
import type { Game } from "@/data/games";
import { GenreTag } from "./GenreTag";

interface Props {
  game: Game;
  dimmed?: boolean;
}

export function GameCard({ game, dimmed = false }: Props) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-2xl bg-sw-surface shadow-[0_32px_80px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.06)] ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <Image
        src={game.image}
        alt={`${game.title} cover`}
        fill
        className="object-cover"
        sizes="460px"
        priority={!dimmed}
        draggable={false}
      />

      {!dimmed && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 30%, rgba(12,14,18,0.4) 55%, rgba(12,14,18,0.88) 75%, rgba(12,14,18,0.97) 100%)",
            }}
          />

          <div className="pointer-events-none absolute right-0 bottom-0 left-0 px-6 pb-7">
            <div className="mb-2 font-mono text-[11px] tracking-[0.04em] text-sw-text/45">
              {game.developer} · {game.year}
              {game.metacritic != null && (
                <span className="ml-2.5 text-sw-accent">MC {game.metacritic}</span>
              )}
            </div>

            <h2 className="mb-2.5 font-display text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] text-sw-text">
              {game.title}
            </h2>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {game.genres.filter(Boolean).map((g, i) => (
                <GenreTag key={g} label={g} accent={i === 0} />
              ))}
            </div>

            <p className="line-clamp-2 font-body text-[13px] leading-[1.55] font-normal text-sw-text/52">
              {game.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
