"use client";

import { useRef, type KeyboardEvent } from "react";
import CloseIcon from "@/assets/icons/close.svg";
import {
  CATALOG_FILTER_OPTIONS,
  DEFAULT_PLATFORM,
  EMPTY_CATALOG_FILTERS,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  YEAR_MAX,
  YEAR_MIN,
  catalogFiltersActive,
  isPriceRangeActive,
  priceRangeLabel,
  yearRangeLabel,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import { FilterChip } from "@/shared/ui/FilterChip";
import { RangeSlider } from "./RangeSlider";
import styles from "./LibraryFilters.module.css";

type Segment = { value: string; label: string };

const PLATFORM_SEGMENTS: Segment[] = [
  { value: "All", label: "Any" },
  ...CATALOG_FILTER_OPTIONS.platforms.map((p) => ({
    value: p,
    label: p === "PlayStation" ? "PS" : p,
  })),
];

const MODE_SEGMENTS: Segment[] = [
  { value: "All", label: "Any" },
  ...CATALOG_FILTER_OPTIONS.modes
    .filter((m) => m.value !== "Co-op")
    .map((m) => ({ value: m.value, label: m.label })),
];

const REVIEW_SEGMENTS: Segment[] = [...CATALOG_FILTER_OPTIONS.reviews];
const ERA_SEGMENTS: Segment[] = [...CATALOG_FILTER_OPTIONS.eras];
const MULTI_OPTIONS: readonly Segment[] = CATALOG_FILTER_OPTIONS.multi;
const VIBE_OPTIONS: readonly Segment[] = CATALOG_FILTER_OPTIONS.vibes;
const GENRE_OPTIONS: readonly string[] = CATALOG_FILTER_OPTIONS.genres;

function toggleValue(current: string, next: string): string {
  return current === next ? "All" : next;
}

function toggleIn(list: readonly string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function optionLabel(options: readonly Segment[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function modeLabel(value: string): string {
  return CATALOG_FILTER_OPTIONS.modes.find((m) => m.value === value)?.label ?? value;
}

function playersLabel(value: string): string {
  const label = CATALOG_FILTER_OPTIONS.players.find((p) => p.value === value)?.label;
  return label ?? value;
}

export function activeFilterCount(filters: CatalogFilterState): number {
  return (
    [
      filters.genre !== "All",
      filters.mode !== "All",
      filters.players !== "All",
      filters.platform !== DEFAULT_PLATFORM,
      filters.crossplayOnly,
      isPriceRangeActive(filters),
      filters.onSale,
      filters.reviews !== "any",
      filters.era !== "any",
      filters.deck,
    ].filter(Boolean).length +
    filters.multi.length +
    filters.vibe.length
  );
}

export type ActiveChip = { key: string; label: string; onRemove?: () => void };

export function buildActiveChips(
  filters: CatalogFilterState,
  onChange: (next: CatalogFilterState) => void,
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (filters.platform === DEFAULT_PLATFORM) {
    chips.push({ key: "platform", label: DEFAULT_PLATFORM });
  } else {
    chips.push({
      key: "platform",
      label: filters.platform === "All" ? "All platforms" : filters.platform,
      onRemove: () => onChange({ ...filters, platform: DEFAULT_PLATFORM }),
    });
  }
  if (filters.mode !== "All") {
    chips.push({
      key: "mode",
      label: modeLabel(filters.mode),
      onRemove: () => onChange({ ...filters, mode: "All", players: "All" }),
    });
  }
  if (filters.players !== "All") {
    chips.push({
      key: "players",
      label: playersLabel(filters.players),
      onRemove: () => onChange({ ...filters, players: "All" }),
    });
  }
  for (const key of filters.multi) {
    chips.push({
      key: `multi-${key}`,
      label: optionLabel(MULTI_OPTIONS, key),
      onRemove: () => onChange({ ...filters, multi: toggleIn(filters.multi, key) }),
    });
  }
  for (const key of filters.vibe) {
    chips.push({
      key: `vibe-${key}`,
      label: optionLabel(VIBE_OPTIONS, key),
      onRemove: () => onChange({ ...filters, vibe: toggleIn(filters.vibe, key) }),
    });
  }
  if (isPriceRangeActive(filters)) {
    chips.push({
      key: "price",
      label: priceRangeLabel(filters.priceMin, filters.priceMax),
      onRemove: () =>
        onChange({ ...filters, priceMin: PRICE_MIN, priceMax: PRICE_MAX }),
    });
  }
  if (filters.onSale) {
    chips.push({
      key: "sale",
      label: "On sale",
      onRemove: () => onChange({ ...filters, onSale: false }),
    });
  }
  if (filters.reviews !== "any") {
    chips.push({
      key: "reviews",
      label: optionLabel(REVIEW_SEGMENTS, filters.reviews),
      onRemove: () => onChange({ ...filters, reviews: "any" }),
    });
  }
  if (filters.era !== "any") {
    chips.push({
      key: "era",
      label:
        filters.era === "range"
          ? yearRangeLabel(filters.yearMin, filters.yearMax)
          : optionLabel(ERA_SEGMENTS, filters.era),
      onRemove: () =>
        onChange({ ...filters, era: "any", yearMin: YEAR_MIN, yearMax: YEAR_MAX }),
    });
  }
  if (filters.deck) {
    chips.push({
      key: "deck",
      label: "Steam Deck",
      onRemove: () => onChange({ ...filters, deck: false }),
    });
  }
  if (filters.genre !== "All") {
    chips.push({
      key: "genre",
      label: filters.genre,
      onRemove: () => onChange({ ...filters, genre: "All" }),
    });
  }
  if (filters.crossplayOnly) {
    chips.push({
      key: "crossplay",
      label: "Crossplay",
      onRemove: () => onChange({ ...filters, crossplayOnly: false }),
    });
  }
  return chips;
}

function SwitchRow({
  title,
  hint,
  checked,
  onToggle,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.switchRow}
      onClick={onToggle}
    >
      <span className={styles.switchText}>
        <span className={styles.switchTitle}>{title}</span>
        <span className={styles.switchHint}>{hint}</span>
      </span>
      <span
        className={`${styles.switchTrack} ${checked ? styles.switchTrackOn : ""}`}
        aria-hidden
      >
        <span className={styles.switchThumb} />
      </span>
    </button>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Segment[];
  onChange: (next: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasSelected = options.some((o) => o.value === value);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    const step = keys[e.key];
    if (!step) return;
    e.preventDefault();
    const current = Math.max(
      0,
      options.findIndex((o) => o.value === value),
    );
    const next = (current + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      className={styles.segmented}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[i] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (!hasSelected && i === 0) ? 0 : -1}
            className={`${styles.segment} ${selected ? styles.segmentActive : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={styles.pinIcon}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 17v5" />
      <path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z" />
    </svg>
  );
}

type PanelProps = {
  filters: CatalogFilterState;
  onFiltersChange: (next: CatalogFilterState) => void;
  docked: boolean;
  canPin: boolean;
  onTogglePin: () => void;
  onClose?: () => void;
  doneLabel?: string;
};

export function FiltersPanel({
  filters,
  onFiltersChange,
  docked,
  canPin,
  onTogglePin,
  onClose,
  doneLabel,
}: PanelProps) {
  const steamOnly = filters.platform === DEFAULT_PLATFORM;
  const dirty = catalogFiltersActive(filters);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Filters</span>
        <div className={styles.headerActions}>
          {dirty ? (
            <button
              type="button"
              className={styles.textButton}
              onClick={() => onFiltersChange(EMPTY_CATALOG_FILTERS)}
            >
              Reset
            </button>
          ) : null}
          {canPin ? (
            <button
              type="button"
              className={`${styles.textButton} ${docked ? styles.pinned : ""}`}
              aria-pressed={docked}
              onClick={onTogglePin}
            >
              <PinIcon />
              {docked ? "Unpin" : "Pin"}
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close filters"
              onClick={onClose}
            >
              <CloseIcon className={styles.closeIcon} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Genre</span>
          <div className={styles.chips}>
            {GENRE_OPTIONS.map((genre) => (
              <FilterChip
                key={genre}
                active={filters.genre === genre}
                onClick={() =>
                  onFiltersChange({
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

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Play</span>
          <Segmented
            label="Play mode"
            value={filters.mode === "Co-op" ? "All" : filters.mode}
            options={MODE_SEGMENTS}
            onChange={(mode) =>
              onFiltersChange({
                ...filters,
                mode,
                players: "All",
                multi: mode === "Single" ? [] : filters.multi,
              })
            }
          />
          {filters.mode !== "Single" ? (
            <div className={styles.chips}>
              {MULTI_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  active={filters.multi.includes(option.value)}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      multi: toggleIn(filters.multi, option.value),
                    })
                  }
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Mood</span>
          <div className={styles.chips}>
            {VIBE_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={filters.vibe.includes(option.value)}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    vibe: toggleIn(filters.vibe, option.value),
                  })
                }
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <RangeSlider
            label="Price"
            title="Price"
            format={priceRangeLabel}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            low={filters.priceMin}
            high={filters.priceMax}
            onChange={(priceMin, priceMax) =>
              onFiltersChange({ ...filters, priceMin, priceMax })
            }
          />
          <SwitchRow
            title="On sale"
            hint="Games with a current discount"
            checked={filters.onSale}
            onToggle={() => onFiltersChange({ ...filters, onSale: !filters.onSale })}
          />
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Reviews</span>
          <Segmented
            label="Review score"
            value={filters.reviews}
            options={REVIEW_SEGMENTS}
            onChange={(reviews) => onFiltersChange({ ...filters, reviews })}
          />
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Released</span>
          <Segmented
            label="Release period"
            value={filters.era === "range" ? "" : filters.era}
            options={ERA_SEGMENTS}
            onChange={(era) =>
              onFiltersChange({
                ...filters,
                era,
                yearMin: YEAR_MIN,
                yearMax: YEAR_MAX,
              })
            }
          />
          <RangeSlider
            label="Release year"
            format={(low, high) =>
              filters.era === "month" || filters.era === "upcoming"
                ? optionLabel(ERA_SEGMENTS, filters.era)
                : yearRangeLabel(low, high)
            }
            min={YEAR_MIN}
            max={YEAR_MAX}
            step={1}
            low={filters.yearMin}
            high={filters.yearMax}
            disabled={filters.era === "month" || filters.era === "upcoming"}
            onChange={(yearMin, yearMax) =>
              onFiltersChange({
                ...filters,
                yearMin,
                yearMax,
                era: yearMin === YEAR_MIN && yearMax === YEAR_MAX ? "any" : "range",
              })
            }
          />
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Platform</span>
          <Segmented
            label="Platform"
            value={filters.platform}
            options={PLATFORM_SEGMENTS}
            onChange={(platform) => onFiltersChange({ ...filters, platform })}
          />
          {!steamOnly ? (
            <p className={styles.platformNote}>
              Price, reviews, release, mood and Steam Deck filters apply to PC only.
            </p>
          ) : null}
        </div>

        <SwitchRow
          title="Steam Deck friendly"
          hint="Verified or playable on Steam Deck"
          checked={filters.deck}
          onToggle={() => onFiltersChange({ ...filters, deck: !filters.deck })}
        />

        <SwitchRow
          title="Crossplay only"
          hint="Games you can play across platforms"
          checked={filters.crossplayOnly}
          onToggle={() =>
            onFiltersChange({ ...filters, crossplayOnly: !filters.crossplayOnly })
          }
        />
      </div>

      {onClose && doneLabel ? (
        <div className={styles.footer}>
          <button type="button" className={styles.doneButton} onClick={onClose}>
            {doneLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
