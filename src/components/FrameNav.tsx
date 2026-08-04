"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FRAMES: { href: string; label: string; group?: string }[] = [
  { href: "/", label: "Home", group: "solo" },
  { href: "/deck", label: "Deck", group: "solo" },
  { href: "/deck/loading", label: "Loading", group: "solo" },
  { href: "/deck/error", label: "Error", group: "solo" },
  { href: "/deck/empty", label: "Empty", group: "solo" },
  { href: "/end", label: "End", group: "solo" },
  { href: "/liked", label: "Liked", group: "solo" },
  { href: "/liked/empty", label: "Liked empty", group: "solo" },
  { href: "/decks", label: "Decks", group: "library" },
  { href: "/decks/new", label: "New deck", group: "library" },
  { href: "/session", label: "Create", group: "session" },
  { href: "/session/join", label: "Join", group: "session" },
  { href: "/session/lobby", label: "Lobby", group: "session" },
  { href: "/session/deck", label: "S-Deck", group: "session" },
  { href: "/session/matches", label: "Matches", group: "session" },
  { href: "/session/result", label: "Result", group: "session" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href;
}

export function FrameNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Page frames"
      className="relative z-[9999] flex h-[38px] shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/[0.06] bg-[#080a0d] px-4"
    >
      <span className="mr-3 shrink-0 font-mono text-[10px] tracking-[0.08em] text-white/25 uppercase">
        Frames
      </span>

      {FRAMES.map((frame, index) => {
        const prev = FRAMES[index - 1];
        const showDivider = prev && prev.group !== frame.group;
        const active = isActive(pathname, frame.href);

        return (
          <span key={frame.href} className="flex shrink-0 items-center">
            {showDivider && (
              <span
                aria-hidden
                className="mx-2 h-3 w-px bg-white/10"
              />
            )}
            {showDivider && (
              <span className="mr-2 font-mono text-[10px] tracking-[0.06em] text-white/20 uppercase">
                {frame.group === "library"
                  ? "Library"
                  : frame.group === "session"
                    ? "Session"
                    : frame.group}
              </span>
            )}
            <Link
              href={frame.href}
              className={`rounded-[5px] px-2 py-0.5 font-mono text-[11px] tracking-[0.01em] transition-colors ${
                active
                  ? "bg-[rgba(45,212,191,0.1)] font-medium text-sw-accent"
                  : "font-normal text-white/35 hover:text-white/65"
              }`}
            >
              {frame.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
