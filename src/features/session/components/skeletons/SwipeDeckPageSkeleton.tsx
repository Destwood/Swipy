"use client";

import { AppTopBar } from "@/features/shell/components/AppTopBar";
import styles from "./SwipeDeckPageSkeleton.module.css";

export function SwipeDeckPageSkeleton() {
  return (
    <div className={styles.root} aria-busy="true" aria-label="Loading deck">
      <AppTopBar />
      <div className={styles.stage}>
        <div className={styles.chrome}>
          <div className={`${styles.chip} ${styles.chipWide} sw-shimmer`} />
          <div className={`${styles.chip} ${styles.chipNarrow} sw-shimmer`} />
        </div>
        <div className={`${styles.card} sw-shimmer`}>
          <div className={styles.cardMeta}>
            <div className={`${styles.cardTitle} sw-shimmer`} />
            <div className={styles.cardTags}>
              <div className={`${styles.cardTag} sw-shimmer`} />
              <div className={`${styles.cardTag} sw-shimmer`} />
            </div>
          </div>
        </div>
        <div className={`${styles.hint} sw-shimmer`} />
      </div>
    </div>
  );
}
