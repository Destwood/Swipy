import styles from "./AccountShell.module.css";
import sk from "./AccountContentSkeleton.module.css";

export function AccountContentSkeleton() {
  return (
    <div className={styles.body} aria-busy="true" aria-label="Loading account">
      <div className={styles.panel}>
        <div className={`${sk.panelTitle} sw-shimmer`} />
        <div className={styles.identity}>
          <div className={`${styles.avatar} ${sk.avatar} sw-shimmer`} />
          <div className={styles.identityText}>
            <div className={`${sk.name} sw-shimmer`} />
            <div className={`${sk.email} sw-shimmer`} />
          </div>
        </div>
        <div className={`${sk.button} sw-shimmer`} />
      </div>
      <div className={styles.panel}>
        <div className={`${sk.line} sw-shimmer`} />
        <div className={`${sk.lineShort} sw-shimmer`} />
      </div>
    </div>
  );
}
