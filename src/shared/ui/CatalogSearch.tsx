"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Game } from "@/features/games/data/games";
import {
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "@/features/games/lib/catalog-filters";
import { catalogSearchParams } from "@/features/games/lib/catalog-query";
import type { SortValue } from "@/features/games/lib/sort-games";
import styles from "./CatalogSearch.module.css";

const DEBOUNCE_MS = 500;
const SUGGEST_LIMIT = 8;

type Props = {
  /** Committed search query (drives catalog fetch). */
  value: string;
  onChange: (query: string) => void;
  filters?: CatalogFilterState;
  sort?: SortValue;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Modular catalog search + IGDB autocomplete.
 * Drop in / remove without rewriting page logic — wire `value` + `onChange`.
 */
export function CatalogSearch({
  value,
  onChange,
  filters = EMPTY_CATALOG_FILTERS,
  sort = "popular",
  disabled = false,
  placeholder = "Search games…",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

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
          setOpen(true);
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
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  function commit(next: string) {
    const q = next.trim();
    setDraft(q);
    setOpen(false);
    setSuggestions([]);
    onChange(q);
  }

  function clear() {
    setDraft("");
    setSuggestions([]);
    setOpen(false);
    onChange("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        commit(suggestions[activeIndex].title);
        return;
      }
      commit(draft);
    }
  }

  const showList =
    open && draft.trim().length >= 2 && (busy || hasFetched);

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.row}>
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (draft.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={styles.input}
          aria-label="Search games"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showList}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.searchButton}
          onClick={() => commit(draft)}
          disabled={disabled}
        >
          Search
        </button>
        {value || draft ? (
          <button type="button" className={styles.clear} onClick={clear}>
            Clear
          </button>
        ) : null}
      </div>

      {showList ? (
        <ul id={listId} role="listbox" className={styles.list}>
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
  );
}
