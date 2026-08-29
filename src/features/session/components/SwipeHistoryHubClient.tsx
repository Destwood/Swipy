"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { HistoryPageSkeleton } from "@/features/session/components/skeletons/HistoryPageSkeleton";
import { hydrateSeedGamesFromIgdb } from "@/features/games/lib/game-library";
import { HistoryGroupedList } from "@/features/session/components/HistoryGroupedList";
import {
  buildCoopHistoryItem,
  buildSoloHistoryItem,
  sortHistoryItems,
  type HistoryListItem,
} from "@/features/session/lib/history-items";
import {
  buildHistoryShareUrl,
  convertCoopSessionToDeck,
} from "@/features/session/lib/history-actions";
import {
  fetchMembers,
  fetchSession,
  fetchSessionGames,
  fetchVotes,
} from "@/features/session/lib/sessions";
import {
  listStoredMemberships,
  setActiveSession,
} from "@/features/session/lib/session-context";
import {
  convertSwipeHistoryToDeck,
  deleteSwipeHistoryEntry,
  listSwipeHistory,
} from "@/features/session/lib/swipe-history";
import { readInfiniteSession, patchInfiniteSession } from "@/features/session/lib/infinite-session";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import { toast } from "@/shared/ui/toast";
import styles from "@/features/session/components/SwipeHistoryClient.module.css";

export function SwipeHistoryHubClient() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    await hydrateSeedGamesFromIgdb();

    const [rows, memberships] = await Promise.all([
      listSwipeHistory(),
      Promise.resolve(listStoredMemberships()),
    ]);

    const built: HistoryListItem[] = await Promise.all(
      rows.map((entry) => buildSoloHistoryItem(entry)),
    );

    for (const membership of memberships) {
      try {
        const [session, members, votes, gameIds] = await Promise.all([
          fetchSession(membership.sessionId),
          fetchMembers(membership.sessionId),
          fetchVotes(membership.sessionId),
          fetchSessionGames(membership.sessionId),
        ]);
        built.push(
          await buildCoopHistoryItem({
            code: membership.code,
            sessionId: membership.sessionId,
            deckName: session.deck_name ?? session.deck_id,
            memberCount: members.length,
            votes,
            gameIds,
            sessionCreatedAt: session.created_at,
          }),
        );
      } catch {
        /* skip stale membership */
      }
    }

    setItems(sortHistoryItems(built));
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function prepareCoopOpen(item: HistoryListItem) {
    if (item.kind !== "coop" || !item.coopCode) return;
    const membership = listStoredMemberships().find((m) => m.code === item.coopCode);
    if (!membership) return;
    void fetchSession(membership.sessionId).then((session) => {
      setActiveSession({
        sessionId: membership.sessionId,
        memberId: membership.memberId,
        code: item.coopCode!,
        deckId: session.deck_id,
        isHost: membership.isHost,
        displayName: membership.displayName,
        guestToken: membership.guestToken,
      });
      router.push("/session/matches");
    });
  }

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
      if (item.kind === "solo") {
        const deck = await convertSwipeHistoryToDeck(item.id);
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, deckId: deck.id } : row,
          ),
        );
        toast(`Deck "${deck.name}" created`);
        router.push(`/decks/${encodeURIComponent(deck.id)}`);
        return;
      }
      if (!item.sessionId) return;
      const deck = await convertCoopSessionToDeck({
        sessionId: item.sessionId,
        deckLabel: item.title,
        completedAt: item.completedAt,
      });
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, deckId: deck.id } : row,
        ),
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
    if (item.kind !== "solo") return;
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

  if (!ready) {
    return (
      <HistoryPageSkeleton
        backHref="/"
        backLabel="← Home"
        eyebrow="Swipy"
        title="Swipe history"
        subtitle="Solo infinite runs and multiplayer sessions — newest first."
      />
    );
  }

  return (
    <div className={styles.root}>
      <AppTopBar />

      <div className={styles.scroll}>
        <div className={styles.page}>
          <PageBackLink href="/">← Home</PageBackLink>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Swipy</p>
            <h1 className={styles.title}>Swipe history</h1>
            <p className={styles.subtitle}>
              Solo infinite runs and multiplayer sessions — newest first.
            </p>
          </div>

          {items.length === 0 ? (
            <p className={styles.empty}>
              No history yet. Finish an infinite session while signed in, or join
              a friends session.
            </p>
          ) : (
            <HistoryGroupedList
              items={items}
              busyId={busyId}
              onShare={(item) => void shareItem(item)}
              onTransform={(item) => void transformItem(item)}
              onDelete={(item) => void deleteItem(item)}
              onCoopOpen={(item, e) => {
                e.preventDefault();
                prepareCoopOpen(item);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
