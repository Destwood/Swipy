"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CustomCursor.module.css";
import { useCustomCursorPreference } from "./use-custom-cursor-preference";

/** Dot + lagging ring. Entire feature lives under `features/custom-cursor`. */
export function CustomCursor() {
  const { active } = useCustomCursorPreference();
  const [instant, setInstant] = useState({ x: -100, y: -100 });
  const [smooth, setSmooth] = useState({ x: -100, y: -100 });
  const smoothRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (!active) return;

    document.documentElement.classList.add(styles.rootHide);

    function onMove(e: MouseEvent) {
      setInstant({ x: e.clientX, y: e.clientY });
      smoothRef.current = { x: e.clientX, y: e.clientY };
    }

    const id = window.setInterval(() => {
      setSmooth(smoothRef.current);
    }, 1000 / 15);

    window.addEventListener("mousemove", onMove);
    return () => {
      document.documentElement.classList.remove(styles.rootHide);
      window.removeEventListener("mousemove", onMove);
      window.clearInterval(id);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.cursor} aria-hidden>
      <div
        className={styles.dot}
        style={{ left: instant.x, top: instant.y }}
      />
      <div
        className={styles.outline}
        style={{ left: smooth.x, top: smooth.y }}
      />
    </div>
  );
}
