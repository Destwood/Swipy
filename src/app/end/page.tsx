import Image from "next/image";
import Link from "next/link";
import { AppTopBar } from "@/components/AppTopBar";
import { HERO_IMG } from "@/data/games";

export default function EndPage() {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-sw-bg">
      <Image
        src={HERO_IMG}
        alt=""
        aria-hidden
        fill
        className="pointer-events-none object-cover brightness-[0.14] saturate-70"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(12,14,18,0.4) 0%, rgba(12,14,18,0.88) 100%)",
        }}
      />

      <AppTopBar />

      <div className="relative z-[2] flex min-h-0 flex-1 flex-col items-center justify-center">
        <div className="mb-8 flex items-center gap-2 rounded-full border border-[rgba(45,212,191,0.22)] bg-[rgba(45,212,191,0.1)] px-4 py-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M7 12s-5.5-3.25-5.5-7a3 3 0 016 0 3 3 0 016 0c0 3.75-6.5 7-6.5 7z"
              fill="#2dd4bf"
            />
          </svg>
          <span className="font-mono text-xs tracking-[0.04em] text-sw-accent">
            4 liked
          </span>
        </div>

        <h1 className="mb-4 font-display text-[clamp(48px,5.5vw,76px)] leading-none font-extrabold tracking-[-0.04em] text-sw-text">
          That&apos;s the deck.
        </h1>

        <p className="mb-11 font-body text-lg font-normal tracking-[-0.01em] text-sw-text/50">
          See what you liked or keep going.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/liked"
            className="flex items-center gap-2 rounded-xl bg-sw-accent px-8 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-sw-bg shadow-[0_0_28px_rgba(45,212,191,0.2)] transition-all duration-[180ms] hover:bg-sw-like hover:shadow-[0_0_40px_rgba(45,212,191,0.32)]"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <path
                d="M7.5 13s-6-3.75-6-8a3.5 3.5 0 017 0 3.5 3.5 0 017 0c0 4.25-6 8-8 8z"
                fill="#0c0e12"
              />
            </svg>
            View liked
          </Link>
          <Link
            href="/deck"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-8 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-sw-text/70 transition-all duration-[180ms] hover:bg-white/10 hover:text-sw-text"
          >
            Swipe again
          </Link>
        </div>
      </div>
    </div>
  );
}
