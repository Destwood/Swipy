import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { AppTopBar } from "@/components/AppTopBar";

export default function DeckErrorPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar />

      <div className="flex min-h-0 flex-1 items-center justify-center gap-16">
        <ActionButton type="dislike" muted />

        <div className="flex h-[626px] w-[460px] flex-col items-center justify-center gap-5 rounded-2xl border border-white/[0.06] bg-sw-surface">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(251,113,133,0.22)] bg-[rgba(251,113,133,0.1)]">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="10" stroke="#fb7185" strokeWidth="1.5" />
              <path
                d="M11 6v6M11 15.5v.5"
                stroke="#fb7185"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="text-center">
            <p className="mb-2 font-display text-xl font-bold tracking-[-0.02em] text-sw-text">
              Couldn&apos;t load games
            </p>
            <p className="m-0 font-body text-sm text-sw-text/40">
              Check your connection and try again.
            </p>
          </div>

          <Link
            href="/deck"
            className="rounded-[10px] border border-white/12 bg-white/[0.07] px-6 py-2.5 text-sm font-semibold tracking-[-0.01em] text-sw-text transition-colors hover:bg-white/[0.11]"
          >
            Try again
          </Link>
        </div>

        <ActionButton type="like" muted />
      </div>
    </div>
  );
}
