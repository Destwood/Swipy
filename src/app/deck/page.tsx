import { ActionButton } from "@/components/ActionButton";
import { AppTopBar } from "@/components/AppTopBar";
import { GameCard } from "@/components/GameCard";
import { GAMES } from "@/data/games";

export default function DeckPage() {
  const current = GAMES[0];
  const next = GAMES[1];
  const remaining = GAMES.length;

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

      <AppTopBar showLikedLink remainingLabel={`${remaining} left`} />

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="flex items-center justify-center gap-16">
          <ActionButton type="dislike" />

          <div className="relative h-[626px] w-[460px]">
            {next && (
              <div className="absolute inset-0 origin-bottom scale-[0.955] translate-y-3.5 overflow-hidden rounded-2xl bg-sw-surface shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
                <GameCard game={next} dimmed />
              </div>
            )}
            <GameCard game={current} />
          </div>

          <ActionButton type="like" />
        </div>

        <div className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-6 whitespace-nowrap font-mono text-[11px] tracking-[0.03em] text-white/20">
          <span>← Dislike</span>
          <span className="text-white/[0.08]">·</span>
          <span>Like →</span>
        </div>
      </div>
    </div>
  );
}
