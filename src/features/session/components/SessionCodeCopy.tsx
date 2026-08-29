"use client";

import CopyIcon from "@/assets/icons/copy.svg";
import { toast } from "@/shared/ui/toast";
import styles from "./SessionCodeCopy.module.css";

type Props = {
  code: string;
  /** If set, clipboard gets this value while the UI still shows `code`. */
  copyValue?: string;
  label?: string;
  hint?: string;
  align?: "center" | "start";
  className?: string;
};

export function SessionCodeCopy({
  code,
  copyValue,
  label = "Session code",
  hint,
  align = "center",
  className,
}: Props) {
  async function copy() {
    const value = copyValue?.trim() || code;
    try {
      await navigator.clipboard.writeText(value);
      toast("Copied");
    } catch {
      toast("Could not copy");
    }
  }

  return (
    <div
      className={`${styles.root} ${align === "start" ? styles.alignStart : ""} ${className ?? ""}`}
    >
      {label ? <span className={styles.label}>{label}</span> : null}
      <button
        type="button"
        className={styles.well}
        onClick={() => void copy()}
        aria-label={`Copy session code ${code}`}
      >
        <span className={styles.copyAffordance} aria-hidden>
          <CopyIcon className={styles.copyIcon} />
        </span>
        <span className={styles.code}>{code}</span>
      </button>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
