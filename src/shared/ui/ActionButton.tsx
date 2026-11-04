import HeartIcon from "@/assets/icons/heart.svg";
import CloseIcon from "@/assets/icons/close.svg";
import styles from "./ActionButton.module.css";

interface Props {
  type: "like" | "dislike";
  muted?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export function ActionButton({
  type,
  muted = false,
  active = false,
  onClick,
}: Props) {
  const isLike = type === "like";

  if (muted) {
    return <div className={styles.muted} aria-hidden />;
  }

  return (
    <button
      type="button"
      aria-label={isLike ? "Like" : "Dislike"}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        onClick?.();
      }}
      className={`${styles.hit} ${isLike ? styles.hitLike : styles.hitSkip}${active ? ` ${styles.active}` : ""}`}
    >
      <span className={styles.stack}>
        <span
          className={`${styles.face} ${isLike ? styles.like : styles.dislike}`}
          aria-hidden
        >
          {isLike ? (
            <HeartIcon className={styles.icon} />
          ) : (
            <CloseIcon className={styles.icon} />
          )}
        </span>
        <span
          className={`${styles.label} ${isLike ? styles.labelLike : styles.labelSkip}`}
          aria-hidden
        >
          {isLike ? "Like" : "Skip"}
        </span>
      </span>
    </button>
  );
}
