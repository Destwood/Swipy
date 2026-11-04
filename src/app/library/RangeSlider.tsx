"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./RangeSlider.module.css";

const DEBOUNCE_MS = 350;

type Props = {
  label: string;
  title?: string;
  min: number;
  max: number;
  step: number;
  low: number;
  high: number;
  disabled?: boolean;
  debounceMs?: number;
  format: (low: number, high: number) => string;
  onChange: (low: number, high: number) => void;
};

export function RangeSlider({
  label,
  title,
  min,
  max,
  step,
  low,
  high,
  disabled = false,
  debounceMs = DEBOUNCE_MS,
  format,
  onChange,
}: Props) {
  const [draft, setDraft] = useState({ low, high });
  const [synced, setSynced] = useState({ low, high });
  const onChangeRef = useRef(onChange);
  const timerRef = useRef<number | null>(null);

  if (synced.low !== low || synced.high !== high) {
    setSynced({ low, high });
    setDraft({ low, high });
  }

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function update(nextLow: number, nextHigh: number) {
    setDraft({ low: nextLow, high: nextHigh });
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onChangeRef.current(nextLow, nextHigh);
    }, debounceMs);
  }

  const span = max - min;
  const left = ((draft.low - min) / span) * 100;
  const right = ((draft.high - min) / span) * 100;

  return (
    <div className={`${styles.root} ${disabled ? styles.disabled : ""}`}>
      <div className={styles.head}>
        {title ? <span className={styles.title}>{title}</span> : <span />}
        <span className={styles.value} aria-live="polite">
          {format(draft.low, draft.high)}
        </span>
      </div>
      <div className={styles.control} role="group" aria-label={label}>
        <div className={styles.track} aria-hidden />
        <div
          className={styles.fill}
          style={{ left: `${left}%`, right: `${100 - right}%` }}
          aria-hidden
        />
        <input
          type="range"
          className={styles.input}
          aria-label={`${label}, minimum`}
          min={min}
          max={max}
          step={step}
          value={draft.low}
          disabled={disabled}
          onChange={(e) =>
            update(Math.min(Number(e.target.value), draft.high), draft.high)
          }
        />
        <input
          type="range"
          className={styles.input}
          aria-label={`${label}, maximum`}
          min={min}
          max={max}
          step={step}
          value={draft.high}
          disabled={disabled}
          onChange={(e) =>
            update(draft.low, Math.max(Number(e.target.value), draft.low))
          }
        />
      </div>
    </div>
  );
}
