import { Suspense } from "react";
import { InfiniteMatchesClient } from "@/features/session/components/InfiniteMatchesClient";
import { MatchResultsPageSkeleton } from "@/features/session/components/skeletons/MatchResultsPageSkeleton";

export default function InfiniteMatchesPage() {
  return (
    <Suspense
      fallback={
        <MatchResultsPageSkeleton
          backHref="/infinite"
          backLabel="← Infinite"
          eyebrow="Infinite mode"
          title="Results"
          subtitle="Your latest swipe session."
        />
      }
    >
      <InfiniteMatchesClient />
    </Suspense>
  );
}
