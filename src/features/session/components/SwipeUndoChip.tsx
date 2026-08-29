import styles from "./SessionDeckClient.module.css";

type Props = {
  disabled?: boolean;
  onUndo: () => void;
};

export function SwipeUndoChip({ disabled = false, onUndo }: Props) {
  return (
    <button
      type="button"
      className={`${styles.chromeChip} ${styles.undoChip}`}
      disabled={disabled}
      onClick={onUndo}
    >
      ← Previous
    </button>
  );
}
