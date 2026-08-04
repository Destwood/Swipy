import type { ReactNode } from "react";
import Link from "next/link";
import { SwipyLogo } from "./SwipyLogo";

interface Props {
  children?: ReactNode;
  right?: ReactNode;
  showLikedLink?: boolean;
  remainingLabel?: string;
}

export function AppTopBar({
  children,
  right,
  showLikedLink = false,
  remainingLabel,
}: Props) {
  return (
    <div className="relative z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[rgba(12,14,18,0.8)] px-10 backdrop-blur-[12px]">
      {children ?? <SwipyLogo size="bar" />}
      {showLikedLink && (
        <Link
          href="/liked"
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-white/35 transition-colors hover:text-sw-accent"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
            <path
              d="M7.5 13s-6-3.75-6-8a3.5 3.5 0 017 0 3.5 3.5 0 017 0c0 4.25-8 8-8 8z"
              fill="currentColor"
            />
          </svg>
          Liked
        </Link>
      )}
      {remainingLabel !== undefined && (
        <span className="font-mono text-[13px] tracking-[0.02em] text-white/28">
          {remainingLabel}
        </span>
      )}
      {right}
    </div>
  );
}
