"use client";

import { THEME_SWITCH_ENABLED } from "./theme-script";
import { useTheme } from "./theme";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  if (!THEME_SWITCH_ENABLED) return null;
  const toLight = theme === "dark";
  const label = toLight ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className={styles.button}
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      {toLight ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={styles.icon}>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={styles.icon}>
          <path
            d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.7 6.7 0 0 0 9.8 9.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
