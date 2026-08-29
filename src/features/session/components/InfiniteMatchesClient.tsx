"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthUser } from "@/features/auth/lib/use-auth-user";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { MatchResultsPageSkeleton } from "@/features/session/components/skeletons/MatchResultsPageSkeleton";
import type { Game } from "@/features/games/data/games";
import {
  ensureGamesInLibrary,
  getLibraryGamesByIds,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import { MatchGameRow } from "@/features/session/components/MatchGameRow";
import { ResultsPageToolbar } from "@/features/session/components/ResultsPageToolbar";
import { buildHistoryShareUrl } from "@/features/session/lib/history-actions";
import {
  convertSwipeHistoryToDeck,
  getSwipeHistoryEntry,
  purgeLegacySwipeHistoryStorage,
  saveSwipeHistoryEntry,
  type SwipeHistoryEntry,
} from "@/features/session/lib/swipe-history";
import { Button, ButtonVariant } from "@/shared/ui/Button";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import { toast } from "@/shared/ui/toast";
import styles from "./SessionMatchesClient.module.css";

export function InfiniteMatchesClient() {
  const router = useRouter();
  const { user } = useAuthUser();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [entry, setEntry] = useState<SwipeHistoryEntry | null>(null);
  const [liked, setLiked] = useState<Game[]>([]);
  const [rejected, setRejected] = useState<Game[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    purgeLegacySwipeHistoryStorage();
    async function load() {
      await hydrateSeedGamesFromIgdb();
      const row = sessionId ? await getSwipeHistoryEntry(sessionId) : null;
      setEntry(row ?? null);

      if (!row) {
        setReady(true);
        return;
      }

      const likedIds = row.votes
        .filter((vote) => vote.value === "like")
        .map((vote) => vote.gameId);
      const rejectedIds = row.votes
        .filter((vote) => vote.value === "dislike")
        .map((vote) => vote.gameId);

      const [likedGames, rejectedGames] = await Promise.all([
        ensureGamesInLibrary(likedIds).then((games) =>
          likedIds
            .map((id) => games.find((game) => game.id === id))
            .filter((game): game is Game => Boolean(game)),
        ),
        Promise.resolve(getLibraryGamesByIds(rejectedIds)),
      ]);

      setLiked(likedGames);
      setRejected(rejectedGames);
      setReady(true);
    }

    void load().catch(() => setReady(true));
  }, [sessionId]);

  async function handleSave() {
    if (!entry || entry.saved || busy) return;
    setBusy(true);
    setHint(null);
    try {
      await saveSwipeHistoryEntry(entry.id);
      setEntry({ ...entry, saved: true });
      setHint("Saved to your swipe history.");
      toast("Session saved");
    } catch (e) {
      setHint(e instanceof Error ? e.message : "Could not save session.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!entry || shareBusy) return;
    setShareBusy(true);
    try {
      await navigator.clipboard.writeText(
        buildHistoryShareUrl({ kind: "solo", id: entry.id }),
      );
      toast("Link copied");
    } catch {
      toast("Could not copy link");
    } finally {
      setShareBusy(false);
    }
  }

  async function handleConvertToDeck() {
    if (!entry || busy) return;
    if (entry.deckId) {
      router.push(`/decks/${encodeURIComponent(entry.deckId)}`);
      return;
    }
    setBusy(true);
    setHint(null);
    try {
      const deck = await convertSwipeHistoryToDeck(entry.id);
      setEntry({ ...entry, saved: true, deckId: deck.id });
      toast("Deck created");
      router.push(`/decks/${encodeURIComponent(deck.id)}`);
    } catch (e) {
      setHint(e instanceof Error ? e.message : "Could not create deck.");
    } finally {
      setBusy(false);
    }
  }

  function renderGameList(
    games: Game[],
    variant: "compact" | "hero" = "compact",
    priceAlign: "foot" | "center" = "foot",
  ) {
    return (
      <ul className={variant === "hero" ? styles.heroList : styles.list}>
        {games.map((game, index) => (
          <MatchGameRow
            key={game.id}
            game={game}
            rank={index + 1}
            variant={variant}
            priceAlign={variant === "compact" ? priceAlign : "foot"}
          />
        ))}
      </ul>
    );
  }

  if (!ready) {
    return (
      <MatchResultsPageSkeleton
        backHref="/infinite"
        backLabel="← Infinite"
        eyebrow="Infinite mode"
        title="Results"
        subtitle="Your latest swipe session."
      />
    );
  }

  const hasAny = liked.length > 0 || rejected.length > 0;
  const isPreview = entry?.preview === true;

  return (
    <div className={styles.root}>
      <AppTopBar />

      <div className={styles.scroll}>
        <div className={styles.page}>
          <PageBackLink href="/infinite">← Infinite</PageBackLink>
          <div className={styles.headerRow}>
            <div className={styles.headerMain}>
              <p className={styles.eyebrow}>Infinite mode</p>
              <h1 className={styles.title}>Results</h1>
              <p className={styles.subtitle}>
                {entry
                  ? `${entry.label} · ${entry.votes.length} swipes`
                  : "Your latest swipe session."}
              </p>
            </div>
            {entry && !isPreview ? (
              <ResultsPageToolbar
                onCopyLink={() => void handleShare()}
                menuItems={[
                  ...(liked.length > 0
                    ? [
                        {
                          label: busy ? "Creating…" : "Transform to deck",
                          onClick: () => void handleConvertToDeck(),
                          disabled: busy,
                        },
                      ]
                    : []),
                  ...(entry.deckId
                    ? [
                        {
                          label: "Open deck",
                          href: `/decks/${encodeURIComponent(entry.deckId)}`,
                        },
                      ]
                    : []),
                  ...(!entry.saved
                    ? [
                        {
                          label: "Save session",
                          onClick: () => void handleSave(),
                          disabled: busy,
                        },
                      ]
                    : []),
                ]}
              />
            ) : null}
          </div>

          {hint ? <p className={styles.shareHint}>{hint}</p> : null}

          {isPreview ? (
            <p className={styles.shareHint}>
              Preview only in this tab.{" "}
              <Link href="/login?next=%2Finfinite%2Fhistory">Sign in</Link> to
              save history and convert to a deck.
            </p>
          ) : null}

          {!entry ? (
            <p className={styles.empty}>No finished session yet. Keep swiping first.</p>
          ) : null}

          {!hasAny && entry ? (
            <p className={styles.empty}>No swipes recorded in this session.</p>
          ) : null}

          {liked.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Liked</h2>
                <span className={styles.sectionMeta}>
                  {liked.length} {liked.length === 1 ? "game" : "games"}
                </span>
              </div>
              {renderGameList(liked, "hero")}
            </section>
          ) : null}

          {rejected.length > 0 ? (
            <section className={`${styles.section} ${styles.sectionRejected}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Rejected</h2>
                <span className={styles.sectionMeta}>
                  {rejected.length} {rejected.length === 1 ? "game" : "games"}
                </span>
              </div>
              {renderGameList(rejected, "compact", "center")}
            </section>
          ) : null}

          <div className={styles.footer}>
            {entry && liked.length > 0 && !isPreview ? (
              <Button
                type="button"
                onClick={() => void handleConvertToDeck()}
                disabled={busy}
                variant={ButtonVariant.Accent}
              >
                {busy ? "Creating…" : "Transform to deck"}
              </Button>
            ) : null}
            {entry && !entry.saved && !isPreview ? (
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={busy}
                variant={ButtonVariant.Soft}
              >
                Save session
              </Button>
            ) : null}
            {user ? (
              <Button href="/history" variant={ButtonVariant.Soft}>
                Swipe history
              </Button>
            ) : null}
            <Button
              href="/infinite"
              variant={ButtonVariant.Dark}
              onClick={() => router.refresh()}
            >
              Keep swiping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
