import type { ReactNode } from "react";
import styles from "./FilterChip.module.css";

type Props = {
  active?: boolean;
  tone?: "accent" | "danger";
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
};

export function FilterChip({
  active = false,
  tone = "accent",
  children,
  onClick,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const pressed =
    active && tone === "danger" ? styles.danger : active ? styles.active : "";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`${styles.chip}${pressed ? ` ${pressed}` : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
