"use client";

import { useSyncExternalStore } from "react";
import { LibraryCatalog } from "@/features/games/components/LibraryCatalog";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import styles from "./page.module.css";

function subscribeNoop() {
  return () => {};
}

export default function LibraryPage() {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  return (
    <div className={styles.root}>
      <AppTopBar />
      {mounted ? <LibraryCatalog syncUrl /> : <div className={styles.content} />}
    </div>
  );
}
