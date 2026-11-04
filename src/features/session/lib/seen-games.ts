type SeenEntry = { t: number; s: string };

const STORAGE_KEY = "swipy.seenGames";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 3000;

function read(now: number): Record<string, SeenEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SeenEntry>;
    const fresh: Record<string, SeenEntry> = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (
        entry &&
        typeof entry.t === "number" &&
        typeof entry.s === "string" &&
        now - entry.t < TTL_MS
      ) {
        fresh[id] = entry;
      }
    }
    return fresh;
  } catch {
    return {};
  }
}

function write(entries: Record<string, SeenEntry>) {
  try {
    const sorted = Object.entries(entries).sort((a, b) => b[1].t - a[1].t);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(sorted.slice(0, MAX_ENTRIES))),
    );
  } catch {
    /* ignore */
  }
}

export function markGameSeen(gameId: string, sessionId: string) {
  const now = Date.now();
  const entries = read(now);
  entries[gameId] = { t: now, s: sessionId };
  write(entries);
}

/** Games swiped in earlier sessions; games from the current session are never skipped. */
export function readSeenSkipSet(currentSessionId: string): Set<string> {
  const skip = new Set<string>();
  for (const [id, entry] of Object.entries(read(Date.now()))) {
    if (entry.s !== currentSessionId) skip.add(id);
  }
  return skip;
}
