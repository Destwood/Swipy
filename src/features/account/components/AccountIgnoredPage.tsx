"use client";

import { AccountShell } from "@/features/account/components/AccountShell";
import { IgnoredGamesSection } from "@/features/account/components/IgnoredGamesSection";

export function AccountIgnoredPage() {
  return (
    <AccountShell title="Ignored games">
      <IgnoredGamesSection />
    </AccountShell>
  );
}
