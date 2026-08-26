"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { subscribeToasts } from "@/shared/ui/toast";
import styles from "./ToastHost.module.css";

type ToastItem = {
  id: number;
  message: string;
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return subscribeToasts(setItems);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.host} aria-live="polite" aria-relevant="additions">
      {items.map((item) => (
        <div key={item.id} className={styles.toast} role="status">
          {item.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}
