"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CATALOG_FILTER_OPTIONS } from "@/features/games/lib/catalog-filters";
import {
  EMPTY_INFINITE_FILTERS,
  INFINITE_GENRE_OPTIONS,
  filtersToKey,
  infiniteFilterLabel,
  readInfiniteFilters,
  sortActiveFirst,
  writeInfiniteFilters,
  type InfiniteFilterState,
} from "@/features/session/lib/infinite-filters";
import {
  getOrCreateInfiniteSession,
  readInfiniteSession,
  startNewInfiniteSession,
} from "@/features/session/lib/infinite-session";
import { infiniteRunLabel } from "@/features/session/lib/swipe-run";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import { FilterChip } from "@/shared/ui/FilterChip";
import styles from "./InfiniteModeDialog.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function toggleMode(current: string, next: string): string {
  return current === next ? "All" : next;
}

export function InfiniteModeDialog({ open, onClose }: Props) {
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

  function start() {
    writeInfiniteFilters(draft);
    const filterKey = filtersToKey(draft);
    const label = infiniteRunLabel(infiniteFilterLabel(draft));
    const existing = readInfiniteSession();
    if (existing?.filterKey === filterKey) {
      getOrCreateInfiniteSession({ label, filterKey });
    } else {
      startNewInfiniteSession({ label, filterKey });
    }
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
            Infinite mode
          </h2>
        </div>

        <div className={styles.scroll}>
          <section className={styles.group}>
            <p className={styles.groupLabel}>Platforms</p>
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
          </section>

          <section className={styles.group}>
            <p className={styles.groupLabel}>Play</p>
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
          </section>

          <section className={styles.group}>
            <p className={styles.groupLabel}>Genres</p>
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
          </section>
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
            variant={ButtonVariant.Accent}
            size={ButtonSize.Sm}
            className={styles.footerButton}
          >
            Start swiping
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
