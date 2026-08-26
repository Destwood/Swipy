"use client";

import { useState } from "react";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import CloseIcon from "@/assets/icons/close.svg";
import {
  CATALOG_FILTER_OPTIONS,
  catalogFiltersActive,
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import {
  SORT_OPTIONS,
  type SortValue,
} from "@/features/games/lib/sort-games";
import { FilterChip } from "@/shared/ui/FilterChip";
import styles from "./CatalogFilterBar.module.css";

type Props = {
  filters: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
};

function toggleValue(current: string, next: string): string {
  return current === next ? "All" : next;
}

function activeSummary(filters: CatalogFilterState): string[] {
  const parts: string[] = [];
  if (filters.genre !== "All") parts.push(filters.genre);
  if (filters.mode !== "All") {
    const mode = CATALOG_FILTER_OPTIONS.modes.find(
      (m) => m.value === filters.mode,
    );
    parts.push(mode?.label ?? filters.mode);
  }
  if (filters.players !== "All") {
    const players = CATALOG_FILTER_OPTIONS.players.find(
      (p) => p.value === filters.players,
    );
    parts.push(players?.label ?? filters.players);
  }
  if (filters.platform !== "All") parts.push(filters.platform);
  if (filters.crossplayOnly) parts.push("Crossplay");
  return parts;
}

export function CatalogFilterBar({
  filters,
  onChange,
  sort,
  onSortChange,
}: Props) {
  const [open, setOpen] = useState(true);
  const showPlayers = filters.mode === "Co-op";
  const dirty = catalogFiltersActive(filters);
  const summary = activeSummary(filters);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.toggleLabel}>Filters</span>
          {dirty && !open && summary.length > 0 ? (
            <span className={styles.summary}>{summary.join(" · ")}</span>
          ) : null}
          <ChevronLeftIcon
            className={`${styles.toggleIcon} ${open ? styles.toggleIconOpen : ""}`}
            aria-hidden
          />
        </button>

        <div className={styles.headerActions}>
          {dirty ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => onChange(EMPTY_CATALOG_FILTERS)}
            >
              <CloseIcon className={styles.clearIcon} aria-hidden />
              Clear filters
            </button>
          ) : null}

          <label className={styles.sortWrap}>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortValue)}
              aria-label="Sort"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {open ? (
        <div className={styles.panel}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Genre</span>
            <div className={styles.chips}>
              <FilterChip
                active={filters.genre === "All"}
                onClick={() => onChange({ ...filters, genre: "All" })}
              >
                All
              </FilterChip>
              {CATALOG_FILTER_OPTIONS.genres.map((genre) => (
                <FilterChip
                  key={genre}
                  active={filters.genre === genre}
                  onClick={() =>
                    onChange({
                      ...filters,
                      genre: toggleValue(filters.genre, genre),
                    })
                  }
                >
                  {genre}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>Play</span>
            <div className={styles.chips}>
              {CATALOG_FILTER_OPTIONS.modes.map((mode) => (
                <FilterChip
                  key={mode.value}
                  active={filters.mode === mode.value}
                  onClick={() => {
                    const nextMode = toggleValue(filters.mode, mode.value);
                    onChange({
                      ...filters,
                      mode: nextMode,
                      players: nextMode === "Co-op" ? filters.players : "All",
                    });
                  }}
                >
                  {mode.label}
                </FilterChip>
              ))}
              {showPlayers ? (
                <>
                  <span className={styles.divider} aria-hidden />
                  {CATALOG_FILTER_OPTIONS.players.map((p) => (
                    <FilterChip
                      key={p.value}
                      active={filters.players === p.value}
                      onClick={() =>
                        onChange({
                          ...filters,
                          players: toggleValue(filters.players, p.value),
                        })
                      }
                    >
                      {p.label}
                    </FilterChip>
                  ))}
                </>
              ) : null}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>Platform</span>
            <div className={styles.chips}>
              {CATALOG_FILTER_OPTIONS.platforms.map((platform) => (
                <FilterChip
                  key={platform}
                  active={filters.platform === platform}
                  onClick={() =>
                    onChange({
                      ...filters,
                      platform: toggleValue(filters.platform, platform),
                    })
                  }
                >
                  {platform}
                </FilterChip>
              ))}
              <span className={styles.divider} aria-hidden />
              <FilterChip
                active={filters.crossplayOnly}
                onClick={() =>
                  onChange({
                    ...filters,
                    crossplayOnly: !filters.crossplayOnly,
                  })
                }
              >
                Crossplay
              </FilterChip>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
