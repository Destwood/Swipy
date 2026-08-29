"use client";

import type { ReactNode } from "react";
import type { Game } from "@/features/games/data/games";
import { openSteamStore } from "@/features/games/lib/steam";
import { HoverLift } from "@/shared/ui/HoverLift";

type Props = {
  game: Game;
  className?: string;
  amount?: "sm" | "md";
  children: ReactNode;
};

/** Cover/tile wrapper: opens Steam store (web tab by default) when steamAppId is known. */
export function SteamGameTile({
  game,
  className,
  amount = "sm",
  children,
}: Props) {
  if (!game.steamAppId) {
    return (
      <HoverLift amount={amount} className={className}>
        {children}
      </HoverLift>
    );
  }

  const appId = game.steamAppId;

  return (
    <HoverLift
      as="button"
      type="button"
      amount={amount}
      className={className}
      onClick={() => openSteamStore(appId)}
      aria-label={`Open ${game.title} in Steam`}
    >
      {children}
    </HoverLift>
  );
}
