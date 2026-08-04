import Image from "next/image";
import Link from "next/link";
import { SwipyLogo } from "@/components/SwipyLogo";
import { HERO_IMG } from "@/data/games";

export default function HomePage() {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-sw-bg">
      <Image
        src={HERO_IMG}
        alt="Dark atmospheric bokeh lights"
        fill
        priority
        className="object-cover object-center brightness-[0.28] saturate-90"
        sizes="100vw"
      />

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, rgba(12,14,18,0.55) 60%, rgba(12,14,18,0.92) 100%)",
        }}
      />

      <div
        aria-hidden
        className="absolute right-0 bottom-0 left-0 h-[35%]"
        style={{
          background: "linear-gradient(to top, #0c0e12 0%, transparent 100%)",
        }}
      />

      <div className="relative z-[2] flex max-w-[680px] flex-col items-center px-10 text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-[rgba(45,212,191,0.22)] bg-[rgba(45,212,191,0.1)] px-3.5 py-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sw-accent" />
          <span className="font-mono text-[11px] tracking-[0.08em] text-sw-accent uppercase">
            Layout preview
          </span>
        </div>

        <SwipyLogo size="hero" />

        <p className="mt-5 mb-10 font-body text-lg leading-normal font-normal tracking-[-0.01em] text-sw-text/55">
          Swipe with friends. Pick what to play.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/session"
            className="flex items-center gap-2.5 rounded-xl bg-sw-accent px-8 py-3.5 text-base font-semibold tracking-[-0.01em] text-sw-bg shadow-[0_0_36px_rgba(45,212,191,0.22),0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-200 hover:bg-sw-like hover:shadow-[0_0_48px_rgba(45,212,191,0.35),0_2px_8px_rgba(0,0,0,0.4)]"
          >
            Play with friends
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="#0c0e12"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/decks"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-8 py-3.5 text-base font-medium tracking-[-0.01em] text-sw-text/70 transition-all duration-[180ms] hover:bg-white/10 hover:text-sw-text"
          >
            Manage decks
          </Link>
          <Link
            href="/deck"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-8 py-3.5 text-base font-medium tracking-[-0.01em] text-sw-text/70 transition-all duration-[180ms] hover:bg-white/10 hover:text-sw-text"
          >
            Solo swipe
          </Link>
        </div>

        <p className="mt-8 font-mono text-[11px] tracking-[0.04em] text-white/[0.18]">
          Static pages only · logic later
        </p>
      </div>
    </div>
  );
}
