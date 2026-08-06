import type { ReactNode } from "react";
import styles from "./FilterChip.module.css";

type Props = {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
};

export function FilterChip({
  active = false,
  children,
  onClick,
  className,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`${styles.chip}${active ? ` ${styles.active}` : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
