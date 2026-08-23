"use client";

import { useMemo, useState } from "react";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import type {
  CatalogFilterState,
  ChipStat,
} from "@/features/games/lib/catalog-filters";
import {
  SORT_OPTIONS,
  type SortValue,
} from "@/features/games/lib/sort-games";
import { FilterChip } from "@/shared/ui/FilterChip";
import styles from "./CatalogFilterBar.module.css";

const DEFAULT_VISIBLE = 1;

type Props = {
  filters: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
  genres: ChipStat[];
  modes: ChipStat[];
  players: ChipStat[];
  platforms: ChipStat[];
  crossplayCount?: number;
  totalCount?: number;
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
  visibleCount?: number;
};

function toggleChip(current: string, next: string): string {
  return current === next ? "All" : next;
}

function Chips({
  items,
  active,
  onToggle,
}: {
  items: ChipStat[];
  active: string;
  onToggle: (label: string) => void;
}) {
  return (
    <>
      {items.map((item) => (
        <FilterChip
          key={item.label}
          active={active === item.label}
          onClick={() => onToggle(item.label)}
        >
          {item.label}
          <span className={styles.count}>{item.count}</span>
        </FilterChip>
      ))}
    </>
  );
}

export function CatalogFilterBar({
  filters,
  onChange,
  genres,
  modes,
  players,
  platforms,
  crossplayCount = 0,
  totalCount = 0,
  sort,
  onSortChange,
  visibleCount = DEFAULT_VISIBLE,
}: Props) {
  const [genresOpen, setGenresOpen] = useState(false);

  const visibleGenres = useMemo(() => {
    if (genresOpen) return genres;
    const head = genres.slice(0, visibleCount);
    if (
      filters.genre !== "All" &&
      !head.some((g) => g.label === filters.genre) &&
      genres.some((g) => g.label === filters.genre)
    ) {
      const active = genres.find((g) => g.label === filters.genre);
      if (active) return [...head.slice(0, Math.max(0, visibleCount - 1)), active];
    }
    return head;
  }, [genresOpen, genres, filters.genre, visibleCount]);

  const hasMoreGenres = genres.length > visibleCount;
  const showPlayers = filters.mode === "Co-op" && players.length > 0;

  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <div className={styles.filters}>
          <FilterChip
            active={filters.genre === "All"}
            onClick={() =>
              onChange({
                ...filters,
                genre: "All",
                mode: "All",
                players: "All",
                platform: "All",
                crossplayOnly: false,
              })
            }
          >
            All
            <span className={styles.count}>{totalCount}</span>
          </FilterChip>
          {visibleGenres.map((genre) => (
            <FilterChip
              key={genre.label}
              active={filters.genre === genre.label}
              onClick={() =>
                onChange({
                  ...filters,
                  genre: genre.label,
                  mode: "All",
                  players: "All",
                  platform: "All",
                  crossplayOnly: false,
                })
              }
            >
              {genre.label}
              <span className={styles.count}>{genre.count}</span>
            </FilterChip>
          ))}
          {hasMoreGenres ? (
            <button
              type="button"
              aria-expanded={genresOpen}
              aria-label={genresOpen ? "Show fewer genres" : "Show more genres"}
              onClick={() => setGenresOpen((v) => !v)}
              className={styles.moreButton}
            >
              <ChevronLeftIcon
                className={`${styles.moreIcon} ${genresOpen ? styles.moreIconOpen : ""}`}
                aria-hidden
              />
            </button>
          ) : null}
        </div>

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

      {modes.length > 0 ? (
        <div className={showPlayers ? styles.splitRow : styles.row}>
          <div className={styles.row}>
            <Chips
              items={modes}
              active={filters.mode}
              onToggle={(mode) => {
                const nextMode = toggleChip(filters.mode, mode);
                onChange({
                  ...filters,
                  mode: nextMode,
                  players: "All",
                  platform: "All",
                  crossplayOnly: false,
                });
              }}
            />
          </div>
          {showPlayers ? (
            <div className={`${styles.row} ${styles.playersRow}`}>
              <Chips
                items={players}
                active={filters.players}
                onToggle={(playersValue) => {
                  onChange({
                    ...filters,
                    players: toggleChip(filters.players, playersValue),
                    platform: "All",
                    crossplayOnly: false,
                  });
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {platforms.length > 0 || crossplayCount > 0 ? (
        <div className={styles.row}>
          <Chips
            items={platforms}
            active={filters.platform}
            onToggle={(platform) => {
              onChange({
                ...filters,
                platform: toggleChip(filters.platform, platform),
              });
            }}
          />
          {crossplayCount > 0 ? (
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
              <span className={styles.count}>{crossplayCount}</span>
            </FilterChip>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
