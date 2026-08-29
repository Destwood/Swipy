import type { SwipeVote, SwipeVoteValue } from "@/features/session/lib/swipe-run";

export type InfiniteSessionState = {
  id: string;
  label: string;
  filterKey: string;
  votes: SwipeVote[];
  streamIndex: number;
  loadedGameIds: string[];
  requeueFifo: string[];
  catalogPage: number;
  catalogHasMore: boolean;
  finishedHistoryId?: string;
  updatedAt: string;
};

const STORAGE_KEY = "swipy.infiniteSession";
const CHANGE_EVENT = "swipy:infinite-session";

function emit() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function infiniteFilterKey(label: string): string {
  return label.trim() || "infinite";
}

export function readInfiniteSession(): InfiniteSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InfiniteSessionState;
    if (!parsed?.id || !Array.isArray(parsed.votes)) return null;
    return {
      ...parsed,
      loadedGameIds: parsed.loadedGameIds ?? [],
      requeueFifo: parsed.requeueFifo ?? [],
      streamIndex: parsed.streamIndex ?? 0,
      catalogPage: parsed.catalogPage ?? 1,
      catalogHasMore: parsed.catalogHasMore ?? true,
    };
  } catch {
    return null;
  }
}

export function writeInfiniteSession(session: InfiniteSessionState | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

export function subscribeInfiniteSession(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function getOrCreateInfiniteSession(input: {
  label: string;
  filterKey: string;
}): InfiniteSessionState {
  const existing = readInfiniteSession();
  if (existing) {
    const hasProgress =
      existing.votes.length > 0 ||
      existing.streamIndex > 0 ||
      existing.loadedGameIds.length > 0 ||
      existing.requeueFifo.length > 0;
    if (hasProgress || existing.filterKey === input.filterKey) {
      if (existing.label !== input.label) {
        const next = { ...existing, label: input.label, updatedAt: now() };
        writeInfiniteSession(next);
        return next;
      }
      return existing;
    }
  }

  const session: InfiniteSessionState = {
    id: `inf-${Date.now()}`,
    label: input.label.trim() || "Infinite",
    filterKey: input.filterKey,
    votes: [],
    streamIndex: 0,
    loadedGameIds: [],
    requeueFifo: [],
    catalogPage: 1,
    catalogHasMore: true,
    updatedAt: now(),
  };
  writeInfiniteSession(session);
  return session;
}

export function clearInfiniteSession() {
  writeInfiniteSession(null);
}

export function startNewInfiniteSession(input: {
  label: string;
  filterKey: string;
}): InfiniteSessionState {
  const session: InfiniteSessionState = {
    id: `inf-${Date.now()}`,
    label: input.label.trim() || "Infinite",
    filterKey: input.filterKey,
    votes: [],
    streamIndex: 0,
    loadedGameIds: [],
    requeueFifo: [],
    catalogPage: 1,
    catalogHasMore: true,
    updatedAt: now(),
  };
  writeInfiniteSession(session);
  return session;
}

export function patchInfiniteSession(
  patch: Partial<
    Pick<
      InfiniteSessionState,
      | "votes"
      | "streamIndex"
      | "loadedGameIds"
      | "requeueFifo"
      | "catalogPage"
      | "catalogHasMore"
      | "finishedHistoryId"
      | "label"
    >
  > & { clearFinishedHistory?: boolean },
) {
  const session = readInfiniteSession();
  if (!session) return null;
  const { clearFinishedHistory, ...rest } = patch;
  const merged = clearFinishedHistory
    ? (({ finishedHistoryId: _, ...keep }) => keep)(session)
    : session;
  const clearedFinish =
    clearFinishedHistory && session.finishedHistoryId != null;
  if (!clearedFinish && !sessionPatchChanged(merged, rest)) return merged;
  const next: InfiniteSessionState = {
    ...merged,
    ...rest,
    updatedAt: now(),
  };
  writeInfiniteSession(next);
  return next;
}

function sessionPatchChanged(
  session: InfiniteSessionState,
  patch: Partial<
    Pick<
      InfiniteSessionState,
      | "votes"
      | "streamIndex"
      | "loadedGameIds"
      | "requeueFifo"
      | "catalogPage"
      | "catalogHasMore"
      | "finishedHistoryId"
      | "label"
    >
  >,
): boolean {
  for (const key of Object.keys(patch) as Array<keyof typeof patch>) {
    const nextVal = patch[key];
    if (nextVal === undefined) continue;
    const prevVal = session[key];
    if (Array.isArray(nextVal) && Array.isArray(prevVal)) {
      if (nextVal.length !== prevVal.length) return true;
      if (key === "votes") {
        for (let i = 0; i < nextVal.length; i++) {
          const a = nextVal[i] as SwipeVote;
          const b = prevVal[i] as SwipeVote;
          if (a.gameId !== b.gameId || a.value !== b.value) return true;
        }
        continue;
      }
      const sortedNext = [...nextVal].sort();
      const sortedPrev = [...prevVal].sort();
      if (sortedNext.some((item, i) => item !== sortedPrev[i])) return true;
      continue;
    }
    if (nextVal !== prevVal) return true;
  }
  return false;
}

export function recordInfiniteVote(gameId: string, value: SwipeVoteValue) {
  const session = readInfiniteSession();
  if (!session) return null;
  const votes = [
    ...session.votes.filter((vote) => vote.gameId !== gameId),
    { gameId, value },
  ];
  return patchInfiniteSession({
    votes,
    clearFinishedHistory: Boolean(session.finishedHistoryId),
  });
}

export function removeInfiniteVote(gameId: string) {
  const session = readInfiniteSession();
  if (!session) return null;
  return patchInfiniteSession({
    votes: session.votes.filter((vote) => vote.gameId !== gameId),
  });
}

export function popLastInfiniteVote(): SwipeVote | null {
  const session = readInfiniteSession();
  if (!session || session.votes.length === 0) return null;
  const last = session.votes[session.votes.length - 1];
  patchInfiniteSession({
    votes: session.votes.slice(0, -1),
    clearFinishedHistory: Boolean(session.finishedHistoryId),
  });
  return last;
}

/** FIFO — append to requeue tail; move duplicates to tail. */
export function requeueInfiniteGame(gameId: string) {
  const session = readInfiniteSession();
  if (!session) return null;
  const rest = session.requeueFifo.filter((id) => id !== gameId);
  return patchInfiniteSession({
    votes: session.votes.filter((vote) => vote.gameId !== gameId),
    requeueFifo: [...rest, gameId],
    clearFinishedHistory: Boolean(session.finishedHistoryId),
  });
}

export function consumeRequeueHead() {
  const session = readInfiniteSession();
  if (!session || session.requeueFifo.length === 0) return session;
  return patchInfiniteSession({ requeueFifo: session.requeueFifo.slice(1) });
}

export function markInfiniteSessionFinished(historyId: string) {
  return patchInfiniteSession({ finishedHistoryId: historyId });
}

export function hasActiveInfiniteSession(filterKey?: string): boolean {
  const session = readInfiniteSession();
  if (!session) return false;
  if (filterKey && session.filterKey !== filterKey) return false;
  return true;
}

function now() {
  return new Date().toISOString();
}
