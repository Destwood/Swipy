"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { RangeSlider } from "@/app/library/RangeSlider";
import { getSignedInUserId } from "@/features/decks/lib/account-decks";
import {
  CATALOG_FILTER_OPTIONS,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  YEAR_MAX,
  YEAR_MIN,
  isPriceRangeActive,
  isSteamPlatforms,
  priceRangeLabel,
  yearRangeLabel,
  type ExtraFilters,
} from "@/features/games/lib/catalog-filters";
import {
  EMPTY_INFINITE_FILTERS,
  INFINITE_GENRE_OPTIONS,
  filtersToKey,
  infiniteFilterLabel,
  normalizeInfiniteFilters,
  readInfiniteFilters,
  sortActiveFirst,
  writeInfiniteFilters,
  type InfiniteFilterState,
} from "@/features/session/lib/infinite-filters";
import {
  readInfiniteSession,
  startNewInfiniteSession,
} from "@/features/session/lib/infinite-session";
import { finalizeInfiniteSession } from "@/features/session/lib/swipe-history";
import { infiniteRunLabel } from "@/features/session/lib/swipe-run";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import { FilterAccordion } from "@/shared/ui/FilterAccordion";
import { FilterChip } from "@/shared/ui/FilterChip";
import styles from "./InfiniteModeDialog.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply?: (filters: InfiniteFilterState) => void;
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function toggleMode(current: string, next: string): string {
  return current === next ? "All" : next;
}

export function InfiniteModeDialog({ open, onClose, onApply }: Props) {
  const router = useRouter();
  const titleId = useId();
  const [draft, setDraft] = useState<InfiniteFilterState>(EMPTY_INFINITE_FILTERS);

  const platformOptions = useMemo(
    () => sortActiveFirst(CATALOG_FILTER_OPTIONS.platforms, draft.platforms),
    [draft.platforms],
  );
  const genreOptions = useMemo(
    () => sortActiveFirst(INFINITE_GENRE_OPTIONS, draft.genres),
    [draft.genres],
  );
  const showPlayers = draft.mode === "Co-op";
  const [starting, setStarting] = useState(false);
  const steamOnly = isSteamPlatforms(draft.platforms);

  function setExtra(patch: Partial<ExtraFilters>) {
    setDraft((current) => ({
      ...current,
      extra: { ...current.extra, ...patch },
    }));
  }

  const extra = draft.extra;
  const optionLabels = (
    options: readonly { value: string; label: string }[],
    values: readonly string[],
  ) =>
    values
      .map((value) => options.find((o) => o.value === value)?.label ?? value)
      .join(", ");
  const platformSummary =
    [
      draft.platforms.length > 0 ? draft.platforms.join(", ") : "Any",
      draft.crossplayOnly ? "Crossplay" : "",
    ]
      .filter(Boolean)
      .join(" · ") || "Any";
  const playSummary =
    [
      draft.mode === "All"
        ? ""
        : (CATALOG_FILTER_OPTIONS.modes.find((m) => m.value === draft.mode)
            ?.label ?? draft.mode),
      draft.players === "All"
        ? ""
        : (CATALOG_FILTER_OPTIONS.players.find((p) => p.value === draft.players)
            ?.label ?? draft.players),
      optionLabels(CATALOG_FILTER_OPTIONS.multi, extra.multi),
    ]
      .filter(Boolean)
      .join(" · ") || "Any";
  const genreSummary = draft.genres.length > 0 ? draft.genres.join(", ") : "Any";
  const moodSummary =
    extra.vibe.length > 0
      ? optionLabels(CATALOG_FILTER_OPTIONS.vibes, extra.vibe)
      : "Any";
  const priceSummary =
    [
      isPriceRangeActive(extra)
        ? priceRangeLabel(extra.priceMin, extra.priceMax)
        : "",
      extra.onSale ? "On sale" : "",
    ]
      .filter(Boolean)
      .join(" · ") || "Any";
  const qualitySummary =
    [
      extra.reviews === "any"
        ? ""
        : (CATALOG_FILTER_OPTIONS.reviews.find((o) => o.value === extra.reviews)
            ?.label ?? ""),
      extra.deck ? "Steam Deck" : "",
    ]
      .filter(Boolean)
      .join(" · ") || "Any";
  const eraSummary =
    extra.era === "range"
      ? yearRangeLabel(extra.yearMin, extra.yearMax)
      : extra.era === "recent"
        ? "New & upcoming"
        : extra.era === "any"
          ? "All time"
          : (CATALOG_FILTER_OPTIONS.eras.find((o) => o.value === extra.era)
              ?.label ?? "All time");
  const releasedSummary = [eraSummary, extra.demo ? "Has demo" : ""]
    .filter(Boolean)
    .join(" · ");
  const monthActive = extra.era === "month" || extra.era === "recent";
  const upcomingActive = extra.era === "upcoming" || extra.era === "recent";
  const presetActive = monthActive || upcomingActive;

  function toggleEra(target: "month" | "upcoming") {
    const hasMonth = monthActive;
    const hasUpcoming = upcomingActive;
    const nextMonth = target === "month" ? !hasMonth : hasMonth;
    const nextUpcoming = target === "upcoming" ? !hasUpcoming : hasUpcoming;
    const era =
      nextMonth && nextUpcoming
        ? "recent"
        : nextMonth
          ? "month"
          : nextUpcoming
            ? "upcoming"
            : "any";
    setExtra({ era, yearMin: YEAR_MIN, yearMax: YEAR_MAX });
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) setDraft(readInfiniteFilters());
  }, [open]);

  async function start() {
    if (starting) return;
    const next = normalizeInfiniteFilters(draft);
    if (onApply) {
      if (filtersToKey(next) !== filtersToKey(readInfiniteFilters())) {
        onApply(next);
      }
      onClose();
      return;
    }
    writeInfiniteFilters(next);
    const filterKey = filtersToKey(next);
    const label = infiniteRunLabel(infiniteFilterLabel(next));
    setStarting(true);
    try {
      const previous = readInfiniteSession();
      if (
        previous &&
        previous.votes.length > 0 &&
        !previous.finishedHistoryId &&
        (await getSignedInUserId())
      ) {
        await finalizeInfiniteSession();
      }
    } catch {
      /* the previous run is dropped if it cannot be saved */
    }
    startNewInfiniteSession({ label, filterKey });
    setStarting(false);
    onClose();
    router.push("/infinite");
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {onApply ? "Change games" : "Infinite mode"}
          </h2>
          <button
            type="button"
            role="switch"
            aria-checked={draft.skipSeen}
            className={styles.switchRow}
            title="Hide games you swiped in earlier runs during the last 30 days"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                skipSeen: !current.skipSeen,
              }))
            }
          >
            <span className={styles.switchLabel}>Skip recently viewed</span>
            <span
              className={`${styles.switchTrack}${draft.skipSeen ? ` ${styles.switchTrackOn}` : ""}`}
              aria-hidden
            >
              <span className={styles.switchThumb} />
            </span>
          </button>
        </div>

        <div className={styles.scroll}>
          <FilterAccordion
            title="Platforms"
            summary={platformSummary}
            defaultOpen
          >
            <div className={styles.chips}>
              {platformOptions.map((platform) => (
                <FilterChip
                  key={platform}
                  active={draft.platforms.includes(platform)}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      platforms: toggleValue(current.platforms, platform),
                    }))
                  }
                >
                  {platform}
                </FilterChip>
              ))}
              <span className={styles.divider} aria-hidden />
              <FilterChip
                active={draft.crossplayOnly}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    crossplayOnly: !current.crossplayOnly,
                  }))
                }
              >
                Crossplay
              </FilterChip>
            </div>
            {steamOnly ? null : (
              <p className={styles.note}>
                Price, reviews, release, mood and Steam Deck filters are
                available when PC is the only platform selected.
              </p>
            )}
          </FilterAccordion>

          <FilterAccordion title="Play" summary={playSummary} defaultOpen>
            <div className={styles.chips}>
              {CATALOG_FILTER_OPTIONS.modes.map((mode) => (
                <FilterChip
                  key={mode.value}
                  active={draft.mode === mode.value}
                  onClick={() => {
                    const nextMode = toggleMode(draft.mode, mode.value);
                    setDraft((current) => ({
                      ...current,
                      mode: nextMode,
                      players: nextMode === "Co-op" ? current.players : "All",
                      extra:
                        nextMode === "Single"
                          ? { ...current.extra, multi: [] }
                          : current.extra,
                    }));
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
                      active={draft.players === p.value}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          players: toggleMode(current.players, p.value),
                        }))
                      }
                    >
                      {p.label}
                    </FilterChip>
                  ))}
                </>
              ) : null}
            </div>
            {steamOnly && draft.mode !== "Single" ? (
              <div className={`${styles.chips} ${styles.subChips}`}>
                {CATALOG_FILTER_OPTIONS.multi.map((option) => (
                  <FilterChip
                    key={option.value}
                    active={draft.extra.multi.includes(option.value)}
                    onClick={() =>
                      setExtra({
                        multi: toggleValue(draft.extra.multi, option.value),
                      })
                    }
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </div>
            ) : null}
          </FilterAccordion>

          <FilterAccordion title="Genres" summary={genreSummary}>
            <div className={styles.chips}>
              {genreOptions.map((genre) => (
                <FilterChip
                  key={genre}
                  active={draft.genres.includes(genre)}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      genres: toggleValue(current.genres, genre),
                    }))
                  }
                >
                  {genre}
                </FilterChip>
              ))}
            </div>
          </FilterAccordion>

          {steamOnly ? (
            <>
              <FilterAccordion title="Mood" summary={moodSummary}>
                <div className={styles.chips}>
                  {CATALOG_FILTER_OPTIONS.vibes.map((option) => (
                    <FilterChip
                      key={option.value}
                      active={draft.extra.vibe.includes(option.value)}
                      onClick={() =>
                        setExtra({
                          vibe: toggleValue(draft.extra.vibe, option.value),
                        })
                      }
                    >
                      {option.label}
                    </FilterChip>
                  ))}
                </div>
              </FilterAccordion>

              <FilterAccordion title="Price" summary={priceSummary}>
                <RangeSlider
                  label="Price"
                  format={priceRangeLabel}
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  low={draft.extra.priceMin}
                  high={draft.extra.priceMax}
                  debounceMs={0}
                  onChange={(priceMin, priceMax) =>
                    setExtra({ priceMin, priceMax })
                  }
                />
                <div className={`${styles.chips} ${styles.subChips}`}>
                  <FilterChip
                    active={draft.extra.onSale}
                    onClick={() => setExtra({ onSale: !draft.extra.onSale })}
                  >
                    On sale
                  </FilterChip>
                </div>
              </FilterAccordion>

              <FilterAccordion title="Quality" summary={qualitySummary}>
                <div className={styles.chips}>
                  {CATALOG_FILTER_OPTIONS.reviews
                    .filter((option) => option.value !== "any")
                    .map((option) => (
                      <FilterChip
                        key={option.value}
                        active={draft.extra.reviews === option.value}
                        onClick={() =>
                          setExtra({
                            reviews:
                              draft.extra.reviews === option.value
                                ? "any"
                                : option.value,
                          })
                        }
                      >
                        {option.label}
                      </FilterChip>
                    ))}
                  <span className={styles.divider} aria-hidden />
                  <FilterChip
                    active={draft.extra.deck}
                    onClick={() => setExtra({ deck: !draft.extra.deck })}
                  >
                    Steam Deck
                  </FilterChip>
                </div>
              </FilterAccordion>

              <FilterAccordion title="Released" summary={releasedSummary}>
                <div className={styles.chips}>
                  <FilterChip
                    active={
                      draft.extra.era === "any" &&
                      draft.extra.yearMin === YEAR_MIN &&
                      draft.extra.yearMax === YEAR_MAX
                    }
                    onClick={() =>
                      setExtra({
                        era: "any",
                        yearMin: YEAR_MIN,
                        yearMax: YEAR_MAX,
                      })
                    }
                  >
                    All time
                  </FilterChip>
                  <FilterChip
                    active={monthActive}
                    onClick={() => toggleEra("month")}
                  >
                    Last month
                  </FilterChip>
                  <FilterChip
                    active={upcomingActive}
                    onClick={() => toggleEra("upcoming")}
                  >
                    Upcoming
                  </FilterChip>
                  <span className={styles.divider} aria-hidden />
                  <FilterChip
                    active={draft.extra.demo}
                    onClick={() => setExtra({ demo: !draft.extra.demo })}
                  >
                    Has demo
                  </FilterChip>
                </div>
                <RangeSlider
                  label="Release year"
                  format={(low, high) => yearRangeLabel(low, high)}
                  min={YEAR_MIN}
                  max={YEAR_MAX}
                  step={1}
                  low={draft.extra.yearMin}
                  high={draft.extra.yearMax}
                  debounceMs={0}
                  disabled={presetActive}
                  onChange={(yearMin, yearMax) =>
                    setExtra({
                      yearMin,
                      yearMax,
                      era:
                        yearMin === YEAR_MIN && yearMax === YEAR_MAX
                          ? "any"
                          : "range",
                    })
                  }
                />
              </FilterAccordion>
            </>
          ) : null}
        </div>

        <div className={styles.footer}>
          <Button
            type="button"
            onClick={onClose}
            variant={ButtonVariant.Dark}
            size={ButtonSize.Sm}
            className={styles.footerButton}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={start}
            disabled={starting}
            variant={ButtonVariant.Accent}
            size={ButtonSize.Sm}
            className={styles.footerButton}
          >
            {onApply ? "Apply" : "Start swiping"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
