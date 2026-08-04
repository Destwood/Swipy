import Link from "next/link";
import { AppTopBar } from "@/components/AppTopBar";
import { SwipyLogo } from "@/components/SwipyLogo";

export default function LikedEmptyPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar
        right={
          <span className="font-mono text-xs tracking-[0.04em] text-white/25">
            0 liked
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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-[rgba(52,211,153,0.15)] bg-[rgba(52,211,153,0.08)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 20s-9-5.5-9-12a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 6.5-9 12-9 12z"
              stroke="#34d399"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="mb-1.5 font-display text-xl font-bold tracking-[-0.02em] text-sw-text">
            No likes yet
          </p>
          <p className="m-0 font-body text-sm text-sw-text/38">
            Swipe right on games you&apos;d want to play.
          </p>
        </div>
        <Link
          href="/deck"
          className="rounded-[10px] bg-sw-accent px-6 py-2.5 text-sm font-semibold tracking-[-0.01em] text-sw-bg"
        >
          Start swiping
        </Link>
      </div>
    </div>
  );
}
