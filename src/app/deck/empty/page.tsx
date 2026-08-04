import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { AppTopBar } from "@/components/AppTopBar";

export default function DeckEmptyPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar remainingLabel="0 left" />

      <div className="flex min-h-0 flex-1 items-center justify-center gap-16">
        <ActionButton type="dislike" muted />

        <div className="flex h-[626px] w-[460px] flex-col items-center justify-center gap-5 rounded-2xl border border-white/[0.06] bg-sw-surface">
          <div className="relative flex h-16 w-16 items-center justify-center">
            {[64, 48, 32].map((size, i) => (
              <div
                key={size}
                className="absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  border: `1px solid rgba(255,255,255,${0.06 - i * 0.015})`,
                }}
              />
            ))}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <rect
                x="1"
                y="1"
                width="16"
                height="16"
                rx="3"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.2"
              />
              <path
                d="M5 9h8M9 5v8"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="text-center">
            <p className="mb-2 font-display text-xl font-bold tracking-[-0.02em] text-sw-text">
              No games right now
            </p>
            <p className="m-0 font-body text-sm text-sw-text/38">
              We&apos;re loading new games. Check back soon.
            </p>
          </div>

          <Link
            href="/deck"
            className="rounded-[10px] border border-[rgba(45,212,191,0.22)] bg-[rgba(45,212,191,0.1)] px-6 py-2.5 text-sm font-semibold tracking-[-0.01em] text-sw-accent transition-colors hover:bg-[rgba(45,212,191,0.16)]"
          >
            Refresh
          </Link>
        </div>

        <ActionButton type="like" muted />
      </div>
    </div>
  );
}
