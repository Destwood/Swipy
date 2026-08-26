"use client";

import CopyIcon from "@/assets/icons/copy.svg";
import { toast } from "@/shared/ui/toast";
import styles from "./SessionCodeCopy.module.css";

type Props = {
  code: string;
  label?: string;
  hint?: string;
};

export function SessionCodeCopy({
  code,
  label = "Session code",
  hint,
}: Props) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast("Copied");
    } catch {
      toast("Could not copy");
    }
  }

  return (
    <div className={styles.root}>
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
