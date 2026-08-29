"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { CATALOG_PAGE_SIZE } from "@/features/games/lib/catalog-query";
import {
  loadingMoreSkeletonCount,
  readGridColumnCount,
} from "./grid-skeleton";
import { useGridColumnCount } from "./use-grid-column-count";

/**
 * Skeleton tile count for infinite-scroll: fill last incomplete row, then
 * rows covering one `pageSize` fetch. Recalculated each time loading starts.
 */
export function useLoadingMoreSkeletonCount(
  gridRef: RefObject<HTMLElement | null>,
  itemCount: number,
  loadingMore: boolean,
  pageSize: number = CATALOG_PAGE_SIZE,
  fallbackCols = 4,
) {
  const columns = useGridColumnCount(gridRef, fallbackCols, itemCount);
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    if (!loadingMore) {
      setCount(0);
      return;
    }
    const cols = gridRef.current
      ? readGridColumnCount(gridRef.current)
      : columns;
    setCount(loadingMoreSkeletonCount(itemCount, cols, pageSize));
  }, [loadingMore, itemCount, columns, gridRef, pageSize]);

  return count;
}
