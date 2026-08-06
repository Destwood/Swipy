import { ActionButton } from "@/shared/ui/ActionButton";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import styles from "./page.module.css";

export default function DeckLoadingPage() {
  return (
    <div className={styles.root}>
      <AppTopBar remainingLabel="— left" />

      <div className={styles.stage}>
        <ActionButton type="dislike" muted />

        <div className={styles.skeletonCard}>
          <div className={`${styles.shimmer} sw-shimmer`} />
          <div className={styles.skeletonContent}>
            <SkeletonLine width="45%" height={10} />
            <SkeletonLine width="75%" height={22} />
            <div className={styles.skeletonRow}>
              <SkeletonLine width={64} height={22} radius={6} />
              <SkeletonLine width={52} height={22} radius={6} />
            </div>
            <SkeletonLine width="95%" height={12} />
            <SkeletonLine width="80%" height={12} />
          </div>
        </div>

        <ActionButton type="like" muted />
      </div>
    </div>
  );
}

function SkeletonLine({
  width,
  height,
  radius = 4,
}: {
  width: string | number;
  height: number;
  radius?: number;
}) {
  return (
    <div
      className={styles.skeletonLine}
      style={{
        width,
        height,
        borderRadius: radius,
      }}
    />
  );
}
