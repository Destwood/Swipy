"use client";

import { CustomCursorToggle } from "@/features/custom-cursor";
import { AccountShell } from "@/features/account/components/AccountShell";
import { IgnoreListSection } from "@/features/account/components/IgnoreListSection";
import shell from "@/features/account/components/AccountShell.module.css";
import { useSteamOpenPreference } from "@/features/games/lib/use-steam-open-preference";
import { PreferenceToggle } from "@/shared/ui/PreferenceToggle";

export function AccountPreferencesPage() {
  const steam = useSteamOpenPreference();

  return (
    <AccountShell title="Preferences">
      <section className={shell.panel}>
        <h2 className={shell.panelTitle}>Display</h2>
        <CustomCursorToggle />
      </section>

      <section className={shell.panel}>
        <h2 className={shell.panelTitle}>Ignore list</h2>
        <IgnoreListSection />
      </section>

      <section className={shell.panel}>
        <h2 className={shell.panelTitle}>Steam links</h2>
        {steam.ready ? (
          <PreferenceToggle
            label="Open in Steam"
            checked={steam.openInSteam}
            onChange={steam.setOpenInSteam}
          />
        ) : null}
      </section>
    </AccountShell>
  );
}
