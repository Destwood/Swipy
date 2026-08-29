import HeartIcon from "@/assets/icons/heart.svg";
import CloseIcon from "@/assets/icons/close.svg";
import styles from "./ActionButton.module.css";

interface Props {
  type: "like" | "dislike";
  muted?: boolean;
  onClick?: () => void;
}

export function ActionButton({ type, muted = false, onClick }: Props) {
  const isLike = type === "like";

  if (muted) {
    return <div className={styles.muted} aria-hidden />;
  }

  return (
    <button
      type="button"
      aria-label={isLike ? "Like" : "Dislike"}
      onClick={onClick}
      className={`${styles.hit} ${isLike ? styles.hitLike : styles.hitSkip}`}
    >
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
    </button>
  );
}
