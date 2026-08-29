import styles from "./GameListRowSkeleton.module.css";

type Props = {
  showAction?: boolean;
};

export function GameListRowSkeleton({ showAction = false }: Props) {
  return (
    <li className={styles.row} aria-hidden>
      <div className={`${styles.thumbnail} sw-shimmer`} />
      <div className={styles.content}>
        <div className={`${styles.title} sw-shimmer`} />
        <div className={styles.tags}>
          <div className={`${styles.tag} sw-shimmer`} />
          <div className={`${styles.tag} sw-shimmer`} />
        </div>
        <div className={`${styles.meta} sw-shimmer`} />
      </div>
      <div className={`${styles.price} sw-shimmer`} />
      {showAction ? <div className={`${styles.action} sw-shimmer`} /> : null}
    </li>
  );
}
