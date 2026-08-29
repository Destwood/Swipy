export type SwipeRunMode = "infinite" | "deck";
export type SwipeVoteValue = "like" | "dislike";

export type SwipeVote = {
  gameId: string;
  value: SwipeVoteValue;
};

export type SwipeRun = {
  id: string;
  mode: SwipeRunMode;
  label: string;
  votes: SwipeVote[];
  startedAt: string;
};

const ACTIVE_RUN_KEY = "swipy.activeSwipeRun";
const CHANGE_EVENT = "swipy:swipe-run";

function emit() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function readActiveSwipeRun(): SwipeRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SwipeRun;
    if (!parsed?.id || !parsed.mode || !Array.isArray(parsed.votes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeActiveSwipeRun(run: SwipeRun | null) {
  if (run) {
    sessionStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(run));
  } else {
    sessionStorage.removeItem(ACTIVE_RUN_KEY);
  }
  emit();
}

export function subscribeSwipeRun(onChange: (run: SwipeRun | null) => void) {
  function refresh() {
    onChange(readActiveSwipeRun());
  }
  window.addEventListener(CHANGE_EVENT, refresh);
  return () => window.removeEventListener(CHANGE_EVENT, refresh);
}

export function getOrCreateSwipeRun(input: {
  mode: SwipeRunMode;
  label: string;
}): SwipeRun {
  const existing = readActiveSwipeRun();
  if (existing && existing.mode === input.mode) {
    if (existing.label !== input.label) {
      const next = { ...existing, label: input.label };
      writeActiveSwipeRun(next);
      return next;
    }
    return existing;
  }

  const run: SwipeRun = {
    id: `run-${Date.now()}`,
    mode: input.mode,
    label: input.label.trim() || (input.mode === "infinite" ? "Infinite" : "Deck"),
    votes: [],
    startedAt: new Date().toISOString(),
  };
  writeActiveSwipeRun(run);
  return run;
}

export function recordSwipeVote(gameId: string, value: SwipeVoteValue) {
  const run = readActiveSwipeRun();
  if (!run) return;
  const without = run.votes.filter((vote) => vote.gameId !== gameId);
  writeActiveSwipeRun({
    ...run,
    votes: [...without, { gameId, value }],
  });
}

export function popLastSwipeVote(): SwipeVote | null {
  const run = readActiveSwipeRun();
  if (!run || run.votes.length === 0) return null;
  const last = run.votes[run.votes.length - 1];
  writeActiveSwipeRun({
    ...run,
    votes: run.votes.slice(0, -1),
  });
  return last;
}

export function clearActiveSwipeRun() {
  writeActiveSwipeRun(null);
}

export function formatResultsDeckStamp(completedAt: string): string {
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm} ${hh}:${min}`;
}

/** e.g. `Results: PC • RPG 29.08 18:30` */
export function buildResultsDeckNameFromHistory(
  label: string,
  completedAt: string,
): string {
  const base = label.trim().replace(/^Results:\s*/i, "") || "Infinite";
  const parts = base
    .split(/[·•|,]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const filterPart = parts.join(" • ") || "Infinite";
  const stamp = formatResultsDeckStamp(completedAt);
  return stamp
    ? `Results: ${filterPart} ${stamp}`
    : `Results: ${filterPart}`;
}

export function buildResultsDeckName(label: string): string {
  const trimmed = label.trim() || "Infinite";
  return trimmed.startsWith("Results:") ? trimmed : `Results: ${trimmed}`;
}

export function infiniteRunLabel(filterLabel: string | null): string {
  return filterLabel?.trim() || "Infinite";
}
