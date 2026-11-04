"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@/assets/icons/close.svg";
import SearchIcon from "@/assets/icons/search.svg";
import SlidersIcon from "@/assets/icons/sliders.svg";
import SortIcon from "@/assets/icons/sort.svg";
import type { Game } from "@/features/games/data/games";
import {
  catalogFiltersActive,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import { catalogSearchParams } from "@/features/games/lib/catalog-query";
import { SORT_OPTIONS, type SortValue } from "@/features/games/lib/sort-games";
import {
  FiltersPanel,
  activeFilterCount,
  buildActiveChips,
} from "./LibraryFilters";
import styles from "./LibraryToolbar.module.css";

const DEBOUNCE_MS = 500;
const SUGGEST_LIMIT = 8;
const FOCUSABLE = "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  filters: CatalogFilterState;
  onFiltersChange: (next: CatalogFilterState) => void;
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
  disabled?: boolean;
  resultCount: number;
  resultHasMore: boolean;
  resultLoading: boolean;
  docked: boolean;
  canPin: boolean;
  onTogglePin: () => void;
};

export function LibraryToolbar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  disabled = false,
  resultCount,
  resultHasMore,
  resultLoading,
  docked,
  canPin,
  onTogglePin,
}: Props) {
  const listId = useId();
  const panelId = useId();
  const searchRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(query);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasFetched, setHasFetched] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const dirty = catalogFiltersActive(filters);
  const activeCount = activeFilterCount(filters);

  function closePanel(restoreFocus: boolean) {
    setPanelOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    if (panelOpen) panelRef.current?.focus();
  }, [panelOpen]);

  useEffect(() => {
    const q = draft.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setBusy(false);
      setHasFetched(false);
      return;
    }

    const controller = new AbortController();
    setBusy(true);
    setHasFetched(false);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const params = catalogSearchParams({
            filters,
            sort,
            page: 1,
            pageSize: SUGGEST_LIMIT,
            q,
          });
          const res = await fetch(`/api/games?${params.toString()}`, {
            signal: controller.signal,
          });
          const data = (await res.json()) as { results?: Game[] };
          if (!res.ok) {
            setSuggestions([]);
            return;
          }
          setSuggestions(data.results ?? []);
          setSuggestOpen(true);
          setActiveIndex(-1);
        } catch {
          if (!controller.signal.aborted) setSuggestions([]);
        } finally {
          if (!controller.signal.aborted) {
            setBusy(false);
            setHasFetched(true);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [draft, filters, sort]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (!searchRef.current?.contains(target)) setSuggestOpen(false);
      if (!sortRef.current?.contains(target)) setSortOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (panelOpen) {
        closePanel(true);
        return;
      }
      setSortOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  function onPanelKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function commit(next: string) {
    const q = next.trim();
    setDraft(q);
    setSuggestOpen(false);
    setSuggestions([]);
    onQueryChange(q);
  }

  function clear() {
    setDraft("");
    setSuggestions([]);
    setSuggestOpen(false);
    onQueryChange("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setSuggestOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setSuggestOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setSuggestOpen(true);
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestOpen && activeIndex >= 0 && suggestions[activeIndex]) {
        commit(suggestions[activeIndex].title);
        return;
      }
      commit(draft);
    }
  }

  const showList =
    suggestOpen && draft.trim().length >= 2 && (busy || hasFetched);

  const activeChips = buildActiveChips(filters, onFiltersChange);

  const doneLabel = resultLoading
    ? "Loading…"
    : resultCount === 0
      ? "No games found"
      : `Show ${resultCount}${resultHasMore ? "+" : ""} games`;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.search} ref={searchRef}>
          <div className={styles.searchRow}>
            <SearchIcon className={styles.searchIcon} aria-hidden />
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => {
                if (draft.trim().length >= 2) setSuggestOpen(true);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search games…"
              className={styles.input}
              aria-label="Search games"
              aria-autocomplete="list"
              aria-controls={listId}
              disabled={disabled}
              autoComplete="off"
            />
            {query || draft ? (
              <button
                type="button"
                className={styles.clear}
                onClick={clear}
                aria-label="Clear search"
              >
                <CloseIcon className={styles.clearIcon} aria-hidden />
              </button>
            ) : null}
          </div>

          {showList ? (
            <ul id={listId} role="listbox" className={styles.suggestions}>
              {busy && suggestions.length === 0 ? (
                <li className={styles.hint}>Searching…</li>
              ) : null}
              {suggestions.map((game, i) => (
                <li key={game.id} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    className={`${styles.option}${i === activeIndex ? ` ${styles.optionActive}` : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(game.title)}
                  >
                    <span className={styles.optionTitle}>{game.title}</span>
                    {game.year ? (
                      <span className={styles.optionMeta}>{game.year}</span>
                    ) : null}
                  </button>
                </li>
              ))}
              {!busy && suggestions.length === 0 ? (
                <li className={styles.hint}>No matches</li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <div className={styles.sortWrap} ref={sortRef}>
          <button
            type="button"
            className={`${styles.iconButton} ${sortOpen ? styles.buttonActive : ""}`}
            aria-label="Sort"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen((v) => !v)}
          >
            <SortIcon className={styles.buttonIcon} aria-hidden />
          </button>
          {sortOpen ? (
            <ul role="listbox" aria-label="Sort" className={styles.sortMenu}>
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value} role="option" aria-selected={opt.value === sort}>
                  <button
                    type="button"
                    className={`${styles.sortOption} ${opt.value === sort ? styles.sortOptionActive : ""}`}
                    onClick={() => {
                      onSortChange(opt.value);
                      setSortOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {docked ? null : (
          <div className={styles.filtersWrap}>
            <button
              ref={triggerRef}
              type="button"
              className={`${styles.filtersButton} ${panelOpen || dirty ? styles.buttonActive : ""}`}
              aria-expanded={panelOpen}
              aria-haspopup="dialog"
              aria-controls={panelOpen ? panelId : undefined}
              onClick={() => (panelOpen ? closePanel(false) : setPanelOpen(true))}
            >
              <SlidersIcon className={styles.buttonIcon} aria-hidden />
              <span className={styles.filtersLabel}>Filters</span>
              {activeCount > 0 ? (
                <span className={styles.filtersCount}>{activeCount}</span>
              ) : null}
            </button>
          </div>
        )}
      </div>

      <div className={styles.chipRow} role="group" aria-label="Active filters">
        {activeChips.map((chip) =>
          chip.onRemove ? (
            <span key={chip.key} className={styles.activeChip}>
              {chip.label}
              <button
                type="button"
                className={styles.activeChipRemove}
                aria-label={`Remove ${chip.label} filter`}
                onClick={chip.onRemove}
              >
                <CloseIcon className={styles.activeChipIcon} aria-hidden />
              </button>
            </span>
          ) : (
            <span key={chip.key} className={styles.baseChip}>
              {chip.label}
            </span>
          ),
        )}
      </div>

      {panelOpen && !docked
        ? createPortal(
            <>
              <div
                className={styles.backdrop}
                aria-hidden
                onClick={() => closePanel(true)}
              />
              <div
                id={panelId}
                ref={panelRef}
                role="dialog"
                aria-label="Filters"
                aria-modal
                tabIndex={-1}
                className={styles.drawer}
                onKeyDown={onPanelKeyDown}
              >
                <FiltersPanel
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  docked={false}
                  canPin={canPin}
                  onTogglePin={() => {
                    setPanelOpen(false);
                    onTogglePin();
                  }}
                  onClose={() => closePanel(true)}
                  doneLabel={doneLabel}
                />
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
