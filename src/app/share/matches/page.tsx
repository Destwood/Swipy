import { Suspense } from "react";
import { SharedMatchesClient } from "@/features/session/components/SharedMatchesClient";
import { MatchResultsPageSkeleton } from "@/features/session/components/skeletons/MatchResultsPageSkeleton";
import styles from "@/app/session/matches/page.module.css";

export default function ShareMatchesPage() {
  return (
    <div className={styles.root}>
      <Suspense
        fallback={
          <MatchResultsPageSkeleton
            eyebrow="Shared results"
            title="Matches"
            subtitle="Loading shared session snapshot…"
          />
        }
      >
        <SharedMatchesClient />
      </Suspense>
    </div>
  );
}
