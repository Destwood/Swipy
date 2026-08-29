"use client";



import { useEffect, useState } from "react";

import TrashIcon from "@/assets/icons/trash.svg";

import { AppTopBar } from "@/features/shell/components/AppTopBar";

import type { Game } from "@/features/games/data/games";

import { hydrateSeedGamesFromIgdb } from "@/features/games/lib/game-library";

import {

  getActiveDeck,

  getActiveDeckGames,

} from "@/features/decks/lib/deck-store";

import { DeckSwipeStage } from "@/features/session/components/DeckSwipeStage";

import { SwipeUndoChip } from "@/features/session/components/SwipeUndoChip";

import { useSwipeUndo } from "@/features/session/lib/use-swipe-undo";

import { gameIsIgnored } from "@/features/games/lib/ignore-list";

import { useIgnoreList } from "@/features/games/lib/use-ignore-list";

import { useIgnoredGames } from "@/features/games/lib/use-ignored-games";

import {

  infiniteFiltersActive,

} from "@/features/session/lib/infinite-filters";

import { useInfiniteGames } from "@/features/session/lib/use-infinite-games";

import { PageBackLink } from "@/shared/ui/PageBackLink";

import styles from "./SessionDeckClient.module.css";



type Props = {

  mode: "infinite" | "deck";

};



export function DeckPreviewClient({ mode }: Props) {

  const [deckGames, setDeckGames] = useState<Game[]>([]);

  const [deckName, setDeckName] = useState("Deck");

  const [deckReady, setDeckReady] = useState(false);

  const [index, setIndex] = useState(0);

  const [swipeKey, setSwipeKey] = useState(0);

  const undo = useSwipeUndo();

  const ignore = useIgnoreList();

  const ignoredGames = useIgnoredGames();

  const ignoredKey = ignoredGames.entries.map((row) => row.gameId).join(",");

  const infinite = mode === "infinite";

  const bannedIds = ignoredGames.entries.map((row) => row.gameId);

  const stream = useInfiniteGames(bannedIds);

  const games = infinite ? stream.games : deckGames;

  const ready = infinite

    ? stream.loading === false && ignoredGames.ready

    : deckReady;



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

      setIndex((i) => (next.length === 0 ? 0 : Math.min(i, next.length - 1)));

      setDeckReady(true);

    })();

    return () => {

      cancelled = true;

    };

  }, [infinite, ignore.ready, ignore.genres, ignore.platforms]);



  useEffect(() => {

    if (!infinite) return;

    if (index < games.length - 3) return;

    if (!stream.hasMore || stream.loadingMore || stream.loading) return;

    stream.loadMore();

  }, [

    infinite,

    index,

    games.length,

    stream.hasMore,

    stream.loadingMore,

    stream.loading,

    stream.loadMore,

  ]);



  const current = games[index];

  const next = games[index + 1];



  function advance() {

    undo.record(index);

    if (index >= games.length - 1) {

      if (infinite && stream.hasMore) {

        stream.loadMore();

      }

      return;

    }

    setIndex((i) => i + 1);

  }



  function undoLast() {

    const prev = undo.back();

    if (prev == null) return;

    setIndex(prev);

    setSwipeKey((key) => key + 1);

  }



  function trashCurrent() {
    if (!current || !infinite) return;
    void ignoredGames.ignore(current.id);
    setIndex((i) => Math.min(i, Math.max(0, games.length - 2)));
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



  const filterLabel = infiniteFiltersActive(stream.filters)
    ? [
        ...stream.filters.platforms,
        ...(stream.filters.crossplayOnly ? ["Crossplay"] : []),
        ...stream.filters.genres,
      ].join(" · ")
    : null;



  if (!ready) {

    return <div className={styles.loading}>Loading deck…</div>;

  }



  return (

    <div className={styles.root}>

      <div aria-hidden className={styles.glow} />



      <AppTopBar />



      <div className={styles.stage}>

        <div className={`${styles.sessionChrome} ${styles.sessionChromeWide}`}>

          <div className={styles.chromeStart}>

            <div className={styles.chromeNav}>

              <PageBackLink

                href={infinite ? "/" : "/decks"}

                className={styles.chromeChip}

              >

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

            onLike={advance}

            onSkip={advance}

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

