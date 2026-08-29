"use client";

import { useEffect, useState, type RefObject } from "react";
import { readGridColumnCount } from "./grid-skeleton";

/**
 * Live CSS grid column count for the referenced grid element.
 * `observeKey` remounts the observer when the grid appears / item count changes
 * (ref alone is stable and would miss the first mount after loading).
 */
export function useGridColumnCount(
  ref: RefObject<HTMLElement | null>,
  fallback = 3,
  observeKey?: unknown,
) {
  const [columns, setColumns] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function measure() {
      if (!ref.current) return;
      setColumns(readGridColumnCount(ref.current));
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, observeKey]);

  return columns;
}
