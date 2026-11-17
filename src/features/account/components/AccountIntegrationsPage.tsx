"use client";

import Image from "next/image";
import { useEffect } from "react";
import { AccountContentSkeleton } from "@/features/account/components/AccountContentSkeleton";
import { AccountShell } from "@/features/account/components/AccountShell";
import shell from "@/features/account/components/AccountShell.module.css";
import type { SteamLibraryMode } from "@/features/steam/lib/library-filter";
import { useSteamConnection } from "@/features/steam/lib/use-steam";
import type { SteamLink } from "@/features/steam/lib/types";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import { FilterChip } from "@/shared/ui/FilterChip";
import { toast } from "@/shared/ui/toast";
import styles from "./AccountIntegrationsPage.module.css";

const MODE_OPTIONS: { value: SteamLibraryMode; label: string }[] = [
  { value: "all", label: "Show everything" },
  { value: "hide-owned", label: "Hide games I own" },
  { value: "only-owned", label: "Only games I own" },
  { value: "only-wishlist", label: "Only my wishlist" },
];

const RESULT_MESSAGES: Record<string, string> = {
  connected: "Steam connected",
  taken: "This Steam account is already linked to another Swipy account",
  "sync-failed": "Steam connected, but the first sync failed. Try Sync again",
  error: "Could not connect Steam. Try again",
};

type Props = { result?: string };

function libraryNote(link: SteamLink, ownedCount: number): string {
  switch (link.libraryStatus) {
    case "private":
      return "Your game library is private. In Steam open Profile → Edit Profile → Privacy Settings and set Game details to Public, then sync again.";
    case "error":
      return "Could not read your library from Steam. Try syncing again later.";
    case "pending":
      return "Waiting for the first sync.";
    default:
      return `${ownedCount} games in your library.`;
  }
}

function wishlistNote(link: SteamLink, wishlistCount: number): string {
  switch (link.wishlistStatus) {
    case "empty":
      return "No wishlist found. It is empty or hidden — Steam shows it only when Game details are public.";
    case "error":
      return "Could not read your wishlist from Steam. Try syncing again later.";
    case "pending":
      return "Waiting for the first sync.";
    default:
      return `${wishlistCount} games on your wishlist.`;
  }
}

function syncedLabel(iso: string | null): string {
  if (!iso) return "Never synced";
  return `Synced ${new Date(iso).toLocaleString()}`;
}

export function AccountIntegrationsPage({ result }: Props) {
  const steam = useSteamConnection();

  useEffect(() => {
    const message = result ? RESULT_MESSAGES[result] : undefined;
    if (message) toast(message);
  }, [result]);

  if (!steam.ready) {
    return (
      <AccountShell title="Integrations">
        <AccountContentSkeleton />
      </AccountShell>
    );
  }

  const link = steam.link;

  async function onSync() {
    const ok = await steam.sync();
    toast(ok ? "Steam library updated" : "Sync failed. Try again later");
  }

  async function onDisconnect() {
    const ok = await steam.disconnect();
    toast(ok ? "Steam disconnected" : "Could not disconnect Steam");
  }

  return (
    <AccountShell title="Integrations">
      <section className={shell.panel}>
        <h2 className={shell.panelTitle}>Steam</h2>

        {link ? (
          <>
            <div className={shell.identity}>
              <div className={shell.avatar}>
                {link.avatarUrl ? (
                  <Image
                    src={link.avatarUrl}
                    alt=""
                    width={64}
                    height={64}
                    className={shell.avatarImg}
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (link.personaName ?? "S").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className={shell.identityText}>
                <p className={shell.displayName}>
                  {link.personaName ?? "Steam account"}
                </p>
                <p className={shell.email}>{syncedLabel(link.lastSyncedAt)}</p>
              </div>
            </div>

            <p className={styles.note}>{libraryNote(link, steam.ownedCount)}</p>
            <p className={styles.note}>
              {wishlistNote(link, steam.wishlistCount)}
            </p>

            <p className={styles.groupLabel}>Games feed</p>
            <div className={styles.chips}>
              {MODE_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  active={steam.mode === option.value}
                  onClick={() => steam.setMode(option.value)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>
            <p className={styles.note}>
              Applies to the Games library and infinite swiping. Games without a
              Steam page are only hidden by “Only …” modes.
            </p>

            <div className={shell.actions}>
              <Button
                type="button"
                variant={ButtonVariant.Soft}
                size={ButtonSize.Sm}
                disabled={steam.busy}
                onClick={() => void onSync()}
              >
                {steam.busy ? "Working…" : "Sync now"}
              </Button>
              {link.profileUrl ? (
                <Button
                  href={link.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant={ButtonVariant.Soft}
                  size={ButtonSize.Sm}
                >
                  Steam profile
                </Button>
              ) : null}
              <Button
                type="button"
                variant={ButtonVariant.Dark}
                size={ButtonSize.Sm}
                disabled={steam.busy}
                onClick={() => void onDisconnect()}
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.note}>
              Connect your Steam account to hide games you already own, browse
              only your library or wishlist, and keep them in sync. Swipy never
              sees your Steam password.
            </p>
            <div className={shell.actions}>
              <Button
                type="button"
                variant={ButtonVariant.Accent}
                size={ButtonSize.Sm}
                onClick={() => window.location.assign("/api/steam/connect")}
              >
                Connect Steam
              </Button>
            </div>
          </>
        )}
      </section>

      <section className={shell.panel}>
        <h2 className={shell.panelTitle}>Discord</h2>
        <div className={shell.actions}>
          <Button
            type="button"
            variant={ButtonVariant.Soft}
            size={ButtonSize.Sm}
            disabled
          >
            Discord: coming soon
          </Button>
        </div>
      </section>
    </AccountShell>
  );
}
