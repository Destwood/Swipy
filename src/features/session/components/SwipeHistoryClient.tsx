"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/features/auth/lib/use-auth-user";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { HistoryPageSkeleton } from "@/features/session/components/skeletons/HistoryPageSkeleton";
import { hydrateSeedGamesFromIgdb } from "@/features/games/lib/game-library";
import { HistoryGroupedList } from "@/features/session/components/HistoryGroupedList";
import { buildHistoryShareUrl } from "@/features/session/lib/history-actions";
import {
  buildSoloHistoryItem,
  sortHistoryItems,
  type HistoryListItem,
} from "@/features/session/lib/history-items";
import {
  convertSwipeHistoryToDeck,
  deleteSwipeHistoryEntry,
  listSwipeHistory,
  purgeLegacySwipeHistoryStorage,
} from "@/features/session/lib/swipe-history";
import { patchInfiniteSession, readInfiniteSession } from "@/features/session/lib/infinite-session";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import { toast } from "@/shared/ui/toast";
import styles from "./SwipeHistoryClient.module.css";

export function SwipeHistoryClient() {
  const router = useRouter();
  const { user, ready: authReady } = useAuthUser();
  const [items, setItems] = useState<HistoryListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    await hydrateSeedGamesFromIgdb();
    const rows = await listSwipeHistory();
    const built = await Promise.all(rows.map((entry) => buildSoloHistoryItem(entry)));
    setItems(sortHistoryItems(built));
    setReady(true);
  }, []);

  useEffect(() => {
    purgeLegacySwipeHistoryStorage();
    void reload();
  }, [reload, user?.id]);

  async function shareItem(item: HistoryListItem) {
    try {
      await navigator.clipboard.writeText(buildHistoryShareUrl(item));
      toast("Link copied");
    } catch {
      toast("Could not copy link");
    }
  }

  async function transformItem(item: HistoryListItem) {
    if (item.deckId) {
      router.push(`/decks/${encodeURIComponent(item.deckId)}`);
      return;
    }
    setBusyId(item.id);
    try {
      const deck = await convertSwipeHistoryToDeck(item.id);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, deckId: deck.id } : row)),
      );
      toast(`Deck "${deck.name}" created`);
      router.push(`/decks/${encodeURIComponent(deck.id)}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create deck.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item: HistoryListItem) {
    setBusyId(item.id);
    try {
      await deleteSwipeHistoryEntry(item.id);
      const session = readInfiniteSession();
      if (session?.finishedHistoryId === item.id) {
        patchInfiniteSession({ clearFinishedHistory: true });
      }
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      toast("Removed from history");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete session.");
    } finally {
      setBusyId(null);
    }
  }

  if (!authReady || !ready) {
    return (
      <HistoryPageSkeleton
        backHref="/infinite"
        backLabel="← Infinite"
        eyebrow="Infinite mode"
        title="Swipe history"
        subtitle="Finished sessions saved to your account. Turn likes into a deck for friends."
      />
    );
  }

  return (
    <div className={styles.root}>
      <AppTopBar />

      <div className={styles.scroll}>
        <div className={styles.page}>
          <PageBackLink href="/infinite">← Infinite</PageBackLink>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Infinite mode</p>
            <h1 className={styles.title}>Swipe history</h1>
            <p className={styles.subtitle}>
              Finished sessions saved to your account. Turn likes into a deck for
              friends.
            </p>
          </div>

          {!user ? (
            <p className={styles.empty}>
              <Link href="/login?next=%2Finfinite%2Fhistory">Sign in</Link> to see
              swipe history across devices.
            </p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>
              No history yet. Finish a session from infinite mode to see it here.
            </p>
          ) : (
            <HistoryGroupedList
              items={items}
              busyId={busyId}
              onShare={(item) => void shareItem(item)}
              onTransform={(item) => void transformItem(item)}
              onDelete={(item) => void deleteItem(item)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
