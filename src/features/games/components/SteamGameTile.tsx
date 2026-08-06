"use client";

import type { ReactNode } from "react";
import type { Game } from "@/features/games/data/games";
import { steamStoreAppUrl } from "@/features/games/lib/steam";
import { HoverLift } from "@/shared/ui/HoverLift";

type Props = {
  game: Game;
  className?: string;
  amount?: "sm" | "md";
  children: ReactNode;
};

/** Cover/tile wrapper: opens Steam client store when steamAppId is known. */
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

  return (
    <HoverLift
      as="a"
      amount={amount}
      className={className}
      href={steamStoreAppUrl(game.steamAppId)}
      title={`Open ${game.title} in Steam`}
      aria-label={`Open ${game.title} in Steam`}
    >
      {children}
    </HoverLift>
  );
}
