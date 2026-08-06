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
      className={`${styles.root} ${isLike ? styles.like : styles.dislike}`}
    >
      {isLike ? (
        <HeartIcon width={28} height={28} className={styles.icon} aria-hidden />
      ) : (
        <CloseIcon width={24} height={24} className={styles.icon} aria-hidden />
      )}
    </button>
  );
}
