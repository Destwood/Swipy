import { getSignedInUserId } from "@/features/decks/lib/account-decks";
import { saveCustomDeck } from "@/features/decks/lib/deck-store";
import {
  deleteCloudSwipeHistory,
  fetchCloudSwipeHistory,
  insertCloudSwipeHistory,
  markCloudSwipeHistorySaved,
  setCloudSwipeHistoryDeckId,
  type CloudSwipeHistoryEntry,
} from "@/features/session/lib/account-swipe-history";
import {
  markInfiniteSessionFinished,
  readInfiniteSession,
} from "@/features/session/lib/infinite-session";
import {
  buildResultsDeckNameFromHistory,
  clearActiveSwipeRun,
  readActiveSwipeRun,
  type SwipeRunMode,
  type SwipeVote,
} from "@/features/session/lib/swipe-run";

export type SwipeHistoryEntry = CloudSwipeHistoryEntry & {
  /** Tab-only preview for guests; not listed in /infinite/history */
  preview?: boolean;
};

const FINISHED_VIEW_KEY = "swipy.finishedSwipeView";
const CHANGE_EVENT = "swipy:swipe-history";

function emit() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function readFinishedView(): SwipeHistoryEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FINISHED_VIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SwipeHistoryEntry;
    if (!parsed?.id || !Array.isArray(parsed.votes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFinishedView(entry: SwipeHistoryEntry | null) {
  if (entry) {
    sessionStorage.setItem(FINISHED_VIEW_KEY, JSON.stringify(entry));
  } else {
    sessionStorage.removeItem(FINISHED_VIEW_KEY);
  }
}

export function subscribeSwipeHistory(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export async function finalizeInfiniteSession(): Promise<SwipeHistoryEntry | null> {
  const session = readInfiniteSession();
  if (!session || session.votes.length === 0) return null;

  const userId = await getSignedInUserId();
  if (userId) {
    const cloud = await insertCloudSwipeHistory({
      mode: "infinite",
      label: session.label,
      votes: session.votes,
      saved: false,
    });
    markInfiniteSessionFinished(cloud.id);
    writeFinishedView(null);
    emit();
    return cloud;
  }

  const preview: SwipeHistoryEntry = {
    id: `preview-${session.id}-${Date.now()}`,
    mode: "infinite",
    label: session.label,
    votes: session.votes,
    saved: false,
    createdAt: new Date().toISOString(),
    preview: true,
  };
  writeFinishedView(preview);
  markInfiniteSessionFinished(preview.id);
  emit();
  return preview;
}

async function persistSwipeVotes(input: {
  mode: SwipeRunMode;
  label: string;
  votes: SwipeVote[];
}): Promise<SwipeHistoryEntry | null> {
  const userId = await getSignedInUserId();
  if (userId) {
    const cloud = await insertCloudSwipeHistory({
      mode: input.mode,
      label: input.label,
      votes: input.votes,
      saved: false,
    });
    writeFinishedView(null);
    return cloud;
  }

  const preview: SwipeHistoryEntry = {
    id: `preview-inf-${Date.now()}`,
    mode: input.mode,
    label: input.label,
    votes: input.votes,
    saved: false,
    createdAt: new Date().toISOString(),
    preview: true,
  };
  writeFinishedView(preview);
  return preview;
}

export async function finalizeActiveSwipeRun(): Promise<SwipeHistoryEntry | null> {
  const infinite = readInfiniteSession();
  if (infinite) return finalizeInfiniteSession();

  const run = readActiveSwipeRun();
  if (!run) return null;

  clearActiveSwipeRun();

  return persistSwipeVotes({
    mode: run.mode,
    label: run.label,
    votes: run.votes,
  });
}

export async function listSwipeHistory(): Promise<SwipeHistoryEntry[]> {
  const userId = await getSignedInUserId();
  if (!userId) return [];
  return fetchCloudSwipeHistory();
}

export async function getSwipeHistoryEntry(
  id: string,
): Promise<SwipeHistoryEntry | undefined> {
  const preview = readFinishedView();
  if (preview?.id === id) return preview;

  const infinite = readInfiniteSession();
  if (infinite?.finishedHistoryId === id) {
    const fromCloud = await (async () => {
      const userId = await getSignedInUserId();
      if (!userId) return undefined;
      const rows = await fetchCloudSwipeHistory();
      return rows.find((entry) => entry.id === id);
    })();
    if (fromCloud) return fromCloud;
    return {
      id,
      mode: "infinite",
      label: infinite.label,
      votes: infinite.votes,
      saved: Boolean(fromCloud),
      createdAt: infinite.updatedAt,
      preview: !fromCloud,
    };
  }

  const userId = await getSignedInUserId();
  if (!userId) return undefined;

  const rows = await fetchCloudSwipeHistory();
  return rows.find((entry) => entry.id === id);
}

async function requireCloudEntry(id: string): Promise<SwipeHistoryEntry> {
  const entry = await getSwipeHistoryEntry(id);
  if (!entry || entry.preview) {
    throw new Error("Sign in to save swipe history to your account.");
  }
  return entry;
}

export async function saveSwipeHistoryEntry(id: string): Promise<void> {
  await requireCloudEntry(id);
  await markCloudSwipeHistorySaved(id);
  emit();
}

export async function convertSwipeHistoryToDeck(id: string) {
  const entry = await requireCloudEntry(id);

  const likedIds = entry.votes
    .filter((vote) => vote.value === "like")
    .map((vote) => vote.gameId);
  if (likedIds.length === 0) {
    throw new Error("Like at least one game before creating a deck.");
  }

  const deck = await saveCustomDeck({
    name: buildResultsDeckNameFromHistory(entry.label, entry.createdAt),
    gameIds: likedIds,
  });

  await setCloudSwipeHistoryDeckId(entry.id, deck.id);
  emit();
  return deck;
}

export async function deleteSwipeHistoryEntry(id: string): Promise<void> {
  const preview = readFinishedView();
  if (preview?.id === id) {
    writeFinishedView(null);
    emit();
    return;
  }
  await deleteCloudSwipeHistory(id);
  emit();
}

export function votesToGames(votes: SwipeVote[]) {
  const liked: string[] = [];
  const rejected: string[] = [];
  for (const vote of votes) {
    if (vote.value === "like") liked.push(vote.gameId);
    else rejected.push(vote.gameId);
  }
  return { liked, rejected };
}

/** Drop legacy localStorage history from before DB migration. */
export function purgeLegacySwipeHistoryStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("swipy.swipeHistory");
  } catch {
    /* ignore */
  }
}
