"use client";

import { AccountShell } from "@/features/account/components/AccountShell";
import shell from "@/features/account/components/AccountShell.module.css";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";

export function AccountIntegrationsPage() {
  return (
    <AccountShell title="Integrations">
      <section className={shell.panel}>
        <h2 className={shell.panelTitle}>Steam</h2>
        <div className={shell.row}>
          <div>
            <p className={shell.rowLabel}>Status</p>
            <p className={shell.rowValue}>Not connected</p>
          </div>
        </div>
        <div className={shell.actions}>
          <Button type="button" variant={ButtonVariant.Accent} size={ButtonSize.Sm}>
            Connect Steam
          </Button>
          <Button type="button" variant={ButtonVariant.Soft} size={ButtonSize.Sm}>
            Sync My Games
          </Button>
          <Button type="button" variant={ButtonVariant.Dark} size={ButtonSize.Sm}>
            Disconnect
          </Button>
        </div>
      </section>

      <section className={shell.panel}>
        <h2 className={shell.panelTitle}>Discord</h2>
        <div className={shell.actions}>
          <Button type="button" variant={ButtonVariant.Soft} size={ButtonSize.Sm}>
            Connect Discord
          </Button>
        </div>
      </section>
    </AccountShell>
  );
}
