"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CustomCursor.module.css";
import { useCustomCursorPreference } from "./use-custom-cursor-preference";

/** Dot + lagging ring. Entire feature lives under `features/custom-cursor`. */
export function CustomCursor() {
  const { active } = useCustomCursorPreference();
  const [instant, setInstant] = useState({ x: -100, y: -100 });
  const [smooth, setSmooth] = useState({ x: -100, y: -100 });
  const [pointer, setPointer] = useState(false);
  const smoothRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (!active) return;

    document.documentElement.classList.add(styles.rootHide);

    function isInteractiveTarget(target: EventTarget | null) {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), label[for], [role="button"]:not([aria-disabled="true"]), .cursor-pointer',
        ),
      );
    }

    function onMove(e: MouseEvent) {
      setInstant({ x: e.clientX, y: e.clientY });
      smoothRef.current = { x: e.clientX, y: e.clientY };
      setPointer(isInteractiveTarget(e.target));
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
        className={`${styles.dot} ${pointer ? styles.dotPointer : ""}`}
        style={{ left: instant.x, top: instant.y }}
      />
      <div
        className={`${styles.outline} ${pointer ? styles.outlinePointer : ""}`}
        style={{ left: smooth.x, top: smooth.y }}
      />
    </div>
  );
}
