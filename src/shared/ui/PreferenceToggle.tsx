"use client";

import styles from "./PreferenceToggle.module.css";

type Props = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  description?: string;
};

/** Animated on/off row for account / settings menus. */
export function PreferenceToggle({
  label,
  checked,
  onChange,
  description,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.row}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.copy}>
        <span className={styles.label}>{label}</span>
        {description ? (
          <span className={styles.hint}>{description}</span>
        ) : null}
      </span>
      <span className={`${styles.track}${checked ? ` ${styles.trackOn}` : ""}`}>
        <span className={styles.thumb} />
      </span>
    </button>
  );
}
