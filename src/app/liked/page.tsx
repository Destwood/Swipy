import Link from "next/link";
import { AppTopBar } from "@/components/AppTopBar";
import { LikedRow } from "@/components/LikedRow";
import { SwipyLogo } from "@/components/SwipyLogo";
import { SAMPLE_LIKED } from "@/data/games";

export default function LikedPage() {
  const liked = SAMPLE_LIKED;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar
        right={
          <span className="font-mono text-xs tracking-[0.04em] text-sw-accent">
            {liked.length} liked
          </span>
        }
      >
        <div className="flex items-center gap-4">
          <Link
            href="/deck"
            aria-label="Back to deck"
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
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-sw-text">
              Liked
            </h1>
            <span className="font-mono text-xs text-white/25">
              {liked.length} {liked.length === 1 ? "game" : "games"}
            </span>
          </div>

          <ul className="flex list-none flex-col gap-0.5 p-0 m-0">
            {liked.map((game) => (
              <LikedRow key={game.id} game={game} />
            ))}
          </ul>

          <p className="mt-10 text-center font-mono text-[11px] text-white/15">
            Sample data · swipe logic later ·{" "}
            <Link href="/liked/empty" className="text-white/25 underline-offset-2 hover:underline">
              empty state
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
