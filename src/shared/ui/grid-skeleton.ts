import { CATALOG_PAGE_SIZE } from "@/features/games/lib/catalog-query";

/**
 * Skeletons to fill the last incomplete grid row, then enough tiles for one
 * fetch page (`pageSize`), so row count matches expected incoming games.
 */
export function loadingMoreSkeletonCount(
  itemCount: number,
  columns: number,
  pageSize: number = CATALOG_PAGE_SIZE,
): number {
  const cols = Math.max(1, columns);
  const size = Math.max(1, pageSize);
  const rem = itemCount % cols;
  const fillLastRow = rem === 0 ? 0 : cols - rem;
  const loadRows = Math.ceil(size / cols);
  return fillLastRow + loadRows * cols;
}

/** Read current CSS grid column count from `grid-template-columns`. */
export function readGridColumnCount(el: Element): number {
  const raw = getComputedStyle(el).gridTemplateColumns;
  if (!raw || raw === "none") return 1;
  const parts = raw.split(/\s+/).filter(Boolean);
  return Math.max(1, parts.length);
}
