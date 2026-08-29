"use client";

import { openSteamStore } from "@/features/games/lib/steam";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./PlayThisButton.module.css";

type Props = {
  steamAppId?: string;
  className?: string;
};

export function PlayThisButton({ steamAppId, className }: Props) {
  if (steamAppId) {
    return (
      <Button
        type="button"
        onClick={() => openSteamStore(steamAppId)}
        variant={ButtonVariant.Soft}
        size={ButtonSize.Sm}
        className={className}
      >
        Play this
      </Button>
    );
  }

  return (
    <Button
      type="button"
      disabled
      variant={ButtonVariant.Dark}
      size={ButtonSize.Sm}
      className={[styles.unavailable, className].filter(Boolean).join(" ")}
      aria-disabled
    >
      No Steam
    </Button>
  );
}
