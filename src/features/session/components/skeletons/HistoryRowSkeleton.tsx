import styles from "./HistoryRowSkeleton.module.css";

export function HistoryRowSkeleton() {
  return (
    <li className={styles.row} aria-hidden>
      <div className={`${styles.mosaic} sw-shimmer`} />
      <div className={styles.body}>
        <div className={`${styles.title} sw-shimmer`} />
        <div className={styles.tags}>
          <div className={`${styles.tag} sw-shimmer`} />
          <div className={`${styles.tag} sw-shimmer`} />
        </div>
        <div className={`${styles.meta} sw-shimmer`} />
      </div>
      <div className={styles.toolbar}>
        <div className={`${styles.btn} ${styles.btnOpen} sw-shimmer`} />
        <div className={`${styles.btn} ${styles.btnMenu} sw-shimmer`} />
      </div>
    </li>
  );
}
