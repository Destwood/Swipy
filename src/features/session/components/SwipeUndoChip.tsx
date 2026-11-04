import UndoIcon from "@/assets/icons/undo.svg";
import styles from "./SessionDeckClient.module.css";

type Props = {
  disabled?: boolean;
  onUndo: () => void;
};

export function SwipeUndoChip({ disabled = false, onUndo }: Props) {
  return (
    <button
      type="button"
      className={styles.chromeChip}
      disabled={disabled}
      onClick={onUndo}
    >
      <UndoIcon className={styles.chipGlyph} aria-hidden />
      Previous
    </button>
  );
}
