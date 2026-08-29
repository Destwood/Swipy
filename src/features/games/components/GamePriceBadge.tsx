import { useSteamPrices } from "@/features/games/lib/use-steam-prices";
import styles from "./GamePriceBadge.module.css";

type Props = {
  appId?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "tag" | "buy";
};

export function GamePriceBadge({
  appId,
  size = "xs",
  variant = "tag",
}: Props) {
  const prices = useSteamPrices(appId ? [appId] : []);
  const price = appId ? (prices[appId] ?? null) : null;
  if (!price) return null;

  if (variant === "buy") {
    if (price.free) {
      return (
        <span data-price-badge className={`${styles.buy} ${styles.free}`}>
          Free
        </span>
      );
    }
    if (price.discountPercent > 0) {
      return (
        <span data-price-badge className={styles.buy}>
          <span className={styles.buyDiscount}>−{price.discountPercent}%</span>
          <span className={styles.buyAmount}>{price.formatted}</span>
          {price.originalFormatted ? (
            <span className={styles.original}>{price.originalFormatted}</span>
          ) : null}
        </span>
      );
    }
    return (
      <span data-price-badge className={`${styles.buy} ${styles.buyAmount}`}>
        {price.formatted}
      </span>
    );
  }

  if (price.free) {
    return (
      <span
        data-price-badge
        className={`${styles.tag} ${styles[size]} ${styles.free}`}
      >
        Free
      </span>
    );
  }

  if (price.discountPercent > 0) {
    return (
      <span data-price-badge className={`${styles.sale} ${styles[size]}`}>
        <span className={styles.discount}>−{price.discountPercent}%</span>
        <span className={styles.amount}>{price.formatted}</span>
      </span>
    );
  }

  return (
    <span
      data-price-badge
      className={`${styles.tag} ${styles[size]} ${styles.amount}`}
    >
      {price.formatted}
    </span>
  );
}
