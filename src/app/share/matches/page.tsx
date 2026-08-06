import { Suspense } from "react";
import { SharedMatchesClient } from "@/features/session/components/SharedMatchesClient";
import matchStyles from "@/features/session/components/SessionMatchesClient.module.css";
import styles from "@/app/session/matches/page.module.css";

export default function ShareMatchesPage() {
  return (
    <div className={styles.root}>
      <Suspense
        fallback={<div className={matchStyles.loading}>Loading shared matches…</div>}
      >
        <SharedMatchesClient />
      </Suspense>
    </div>
  );
}
