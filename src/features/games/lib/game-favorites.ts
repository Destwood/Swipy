const FAVORITES_KEY = "swipy.favoriteGameIds";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
}

export function isFavoriteGame(id: string): boolean {
  return readIds().has(id);
}

/** Returns whether the game is a favorite after the toggle. */
export function toggleFavoriteGame(id: string): boolean {
  const ids = readIds();
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  writeIds(ids);
  return ids.has(id);
}

export function listFavoriteGameIds(): string[] {
  return [...readIds()];
}
