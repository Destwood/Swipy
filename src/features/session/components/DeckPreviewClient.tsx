"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TrashIcon from "@/assets/icons/trash.svg";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { SwipeDeckPageSkeleton } from "@/features/session/components/skeletons/SwipeDeckPageSkeleton";
import type { Game } from "@/features/games/data/games";
import {
  getLibraryGameById,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import { getActiveDeck, getActiveDeckGames } from "@/features/decks/lib/deck-store";
import { DeckSwipeStage } from "@/features/session/components/DeckSwipeStage";
import { InfiniteMatchesPopover } from "@/features/session/components/InfiniteMatchesPopover";
import { SwipeUndoChip } from "@/features/session/components/SwipeUndoChip";
import { gameIsIgnored } from "@/features/games/lib/ignore-list";
import { useIgnoreList } from "@/features/games/lib/use-ignore-list";
import { useIgnoredGames } from "@/features/games/lib/use-ignored-games";
import {
  filtersToKey,
  infiniteFiltersActive,
} from "@/features/session/lib/infinite-filters";
import {
  consumeRequeueHead,
  getOrCreateInfiniteSession,
  patchInfiniteSession,
  popLastInfiniteVote,
  readInfiniteSession,
  recordInfiniteVote,
  subscribeInfiniteSession,
  type InfiniteSessionState,
} from "@/features/session/lib/infinite-session";
import { useInfiniteGames } from "@/features/session/lib/use-infinite-games";
import { infiniteRunLabel } from "@/features/session/lib/swipe-run";
import { useSwipeUndo } from "@/features/session/lib/use-swipe-undo";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import styles from "./SessionDeckClient.module.css";

type Props = {
  mode: "infinite" | "deck";
};

export function DeckPreviewClient({ mode }: Props) {
  const infinite = mode === "infinite";
  const [deckGames, setDeckGames] = useState<Game[]>([]);
  const [deckName, setDeckName] = useState("Deck");
  const [deckReady, setDeckReady] = useState(false);
  const [deckIndex, setDeckIndex] = useState(0);
  const [streamIndex, setStreamIndex] = useState(() =>
    typeof window !== "undefined"
      ? (readInfiniteSession()?.streamIndex ?? 0)
      : 0,
  );
  const [swipeKey, setSwipeKey] = useState(0);
  const [session, setSession] = useState<InfiniteSessionState | null>(() =>
    typeof window !== "undefined" ? readInfiniteSession() : null,
  );
  const [matchesOpen, setMatchesOpen] = useState(false);
  const matchesBtnRef = useRef<HTMLButtonElement>(null);
  const undo = useSwipeUndo();
  const ignore = useIgnoreList();
  const ignoredGames = useIgnoredGames();
  const bannedIds = ignoredGames.entries.map((row) => row.gameId);
  const stream = useInfiniteGames(bannedIds);
  const games = infinite ? stream.games : deckGames;
  const ready = infinite
    ? stream.loading === false && ignoredGames.ready
    : deckReady;

  const filterLabel = infiniteFiltersActive(stream.filters)
    ? [
        ...stream.filters.platforms,
        ...(stream.filters.crossplayOnly ? ["Crossplay"] : []),
        ...stream.filters.genres,
      ].join(" · ")
    : null;
  const runLabel = infinite ? infiniteRunLabel(filterLabel) : deckName;
  const filterKey = infinite ? filtersToKey(stream.filters) : "";

  const refreshSession = useCallback(() => {
    setSession(readInfiniteSession());
  }, []);

  useEffect(() => {
    if (!infinite) return;

    let current = readInfiniteSession();
    if (!current) {
      current = getOrCreateInfiniteSession({ label: runLabel, filterKey });
    }

    setSession(current);
    setStreamIndex(current.streamIndex);

    return subscribeInfiniteSession(() => {
      const next = readInfiniteSession();
      if (!next) return;
      setSession((prev) =>
        prev?.updatedAt === next.updatedAt && prev?.id === next.id ? prev : next,
      );
      setStreamIndex((idx) => (idx === next.streamIndex ? idx : next.streamIndex));
    });
  }, [infinite, runLabel, filterKey]);

  const gameIdsKey = useMemo(
    () => (infinite ? games.map((game) => game.id).join(",") : ""),
    [infinite, games],
  );

  useEffect(() => {
    if (!infinite || games.length === 0) return;
    const savedIndex = readInfiniteSession()?.streamIndex ?? streamIndex;
    if (savedIndex >= games.length) return;
    if (streamIndex !== savedIndex) {
      setStreamIndex(savedIndex);
    }
  }, [infinite, games.length, streamIndex]);

  useEffect(() => {
    if (!infinite || !gameIdsKey) return;
    const current = readInfiniteSession();
    if (!current) return;
    const ids = gameIdsKey.split(",").filter(Boolean);
    const merged = [...new Set([...current.loadedGameIds, ...ids])];
    if (merged.length === current.loadedGameIds.length) return;
    patchInfiniteSession({ loadedGameIds: merged });
  }, [infinite, gameIdsKey]);

  useEffect(() => {
    if (infinite) return;
    let cancelled = false;
    void (async () => {
      await hydrateSeedGamesFromIgdb();
      if (cancelled) return;
      const blocked = { genres: ignore.genres, platforms: ignore.platforms };
      const deck = await getActiveDeck();
      const list = await getActiveDeckGames();
      if (cancelled) return;
      const next = list.filter((game) => !gameIsIgnored(game, blocked));
      setDeckName(deck?.name ?? "Deck");
      setDeckGames(next);
      setDeckIndex(0);
      setDeckReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [infinite, ignore.ready, ignore.genres, ignore.platforms]);

  useEffect(() => {
    if (!infinite) return;
    if (streamIndex < games.length - 3) return;
    if (!stream.hasMore || stream.loadingMore || stream.loading) return;
    stream.loadMore();
  }, [
    infinite,
    streamIndex,
    games.length,
    stream.hasMore,
    stream.loadingMore,
    stream.loading,
    stream.loadMore,
  ]);

  const requeueFifo = session?.requeueFifo ?? [];
  const streamCurrent = games[streamIndex];
  const requeueCurrent = requeueFifo[0]
    ? getLibraryGameById(requeueFifo[0])
    : undefined;
  const current = infinite
    ? (requeueCurrent ?? streamCurrent)
    : deckGames[deckIndex];
  const next = infinite
    ? requeueFifo[1]
      ? getLibraryGameById(requeueFifo[1])
      : requeueFifo[0]
        ? streamCurrent
        : games[streamIndex + 1]
    : deckGames[deckIndex + 1];

  function advanceDeck() {
    undo.record(deckIndex);
    if (deckIndex >= deckGames.length - 1) return;
    setDeckIndex((i) => i + 1);
  }

  function persistStreamIndex(nextIndex: number) {
    setStreamIndex(nextIndex);
    patchInfiniteSession({ streamIndex: nextIndex });
  }

  function swipe(value: "like" | "dislike") {
    if (!current) return;
    recordInfiniteVote(current.id, value);
    refreshSession();
    undo.record(streamIndex);

    if (requeueFifo.length > 0) {
      consumeRequeueHead();
      refreshSession();
      setSwipeKey((key) => key + 1);
      return;
    }

    if (streamIndex >= games.length - 1) {
      if (stream.hasMore) stream.loadMore();
      return;
    }
    persistStreamIndex(streamIndex + 1);
  }

  function undoLast() {
    const prev = undo.back();
    if (prev == null) return;
    popLastInfiniteVote();
    refreshSession();
    persistStreamIndex(prev);
    setSwipeKey((key) => key + 1);
  }

  function trashCurrent() {
    if (!current || !infinite) return;
    void ignoredGames.ignore(current.id);
    if (requeueFifo.length > 0) {
      consumeRequeueHead();
      refreshSession();
    } else {
      persistStreamIndex(Math.min(streamIndex, Math.max(0, games.length - 1)));
    }
    if (games.length <= 1 && stream.hasMore) stream.loadMore();
    setSwipeKey((key) => key + 1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.body.dataset.galleryOpen) return;
      if (e.key === "Backspace" || e.key === "u" || e.key === "U") {
        e.preventDefault();
        undoLast();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!ready) {
    return <SwipeDeckPageSkeleton />;
  }

  const swipeCount = session?.votes.length ?? 0;

  return (
    <div className={styles.root}>
      <div aria-hidden className={styles.glow} />
      <AppTopBar />

      <div className={styles.stage}>
        <div className={`${styles.sessionChrome} ${styles.sessionChromeWide}`}>
          <div className={styles.chromeStart}>
            <div className={styles.chromeNav}>
              <PageBackLink href={infinite ? "/" : "/decks"} className={styles.chromeChip}>
                {infinite ? "← Home" : "← Decks"}
              </PageBackLink>
              <span className={styles.chromeChip}>
                {infinite ? "Infinite mode" : deckName}
              </span>
              {filterLabel ? (
                <span className={styles.chromeChip}>{filterLabel}</span>
              ) : null}
            </div>
            <SwipeUndoChip disabled={!undo.canUndo} onUndo={undoLast} />
          </div>

          {infinite ? (
            <div className={`${styles.chromeEnd} ${styles.chromeEndPopover}`}>
              <span className={styles.remainingLabel}>{swipeCount} swiped</span>
              <button
                ref={matchesBtnRef}
                type="button"
                className={`${styles.chromeChip} ${styles.matchesChip}`}
                aria-expanded={matchesOpen}
                onClick={() => setMatchesOpen((open) => !open)}
              >
                Matches
              </button>
              <InfiniteMatchesPopover
                open={matchesOpen}
                anchorRef={matchesBtnRef}
                onClose={() => setMatchesOpen(false)}
                onRequeue={() => {
                  refreshSession();
                  setSwipeKey((key) => key + 1);
                }}
              />
            </div>
          ) : null}
        </div>

        {infinite && current ? (
          <button
            type="button"
            className={styles.trashFab}
            aria-label={`Ignore ${current.title}`}
            onClick={trashCurrent}
          >
            <TrashIcon className={styles.trashIcon} aria-hidden />
          </button>
        ) : null}

        {current ? (
          <DeckSwipeStage
            current={current}
            next={next}
            enabled
            swipeKey={swipeKey}
            onLike={() => (infinite ? swipe("like") : advanceDeck())}
            onSkip={() => (infinite ? swipe("dislike") : advanceDeck())}
          />
        ) : (
          <div className={styles.emptyPage}>
            <p className={styles.emptyText}>
              {infinite
                ? stream.error ??
                  "No games match these filters. Go home and try different criteria."
                : "Pick a deck first, then swipe it here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
