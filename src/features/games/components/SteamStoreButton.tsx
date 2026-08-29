"use client";

import SteamIcon from "@/assets/icons/steam.svg";
import { openSteamStore, steamStoreUrl } from "@/features/games/lib/steam";
import styles from "./SteamStoreButton.module.css";

type Props = {
  appId: string;
  size?: "sm" | "md" | "row";
  className?: string;
};

export function SteamStoreButton({ appId, size = "md", className }: Props) {
  const icon = size === "sm" ? 12 : size === "md" ? 20 : 15;
  return (
    <a
      href={steamStoreUrl(appId)}
      className={`${styles.root} ${styles[size]}${className ? ` ${className}` : ""}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Steam"
      onClick={(e) => {
        e.preventDefault();
        openSteamStore(appId);
      }}
    >
      <SteamIcon
        width={icon}
        height={icon}
        className={styles.icon}
        aria-hidden
      />
      Open in Steam
    </a>
  );
}
