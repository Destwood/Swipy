"use client";

import { AppTopBar } from "@/features/shell/components/AppTopBar";
import styles from "./PageLoadingShell.module.css";

type Props = {
  message?: string;
};

export function PageLoadingShell({ message = "Loading…" }: Props) {
  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.loading}>{message}</div>
    </div>
  );
}
