import { getSignedInUserId } from "@/features/decks/lib/account-decks";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";

export type IgnoredGameEntry = {
  gameId: string;
  createdAt: string;
};

const STORAGE_KEY = "swipy.ignoredGames";
const CHANGE_EVENT = "swipy:ignored-games";

function sortNewest(entries: IgnoredGameEntry[]): IgnoredGameEntry[] {
  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function readLocal(): IgnoredGameEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IgnoredGameEntry[];
    if (!Array.isArray(parsed)) return [];
    return sortNewest(
      parsed.filter(
        (row): row is IgnoredGameEntry =>
          typeof row?.gameId === "string" && typeof row?.createdAt === "string",
      ),
    );
  } catch {
    return [];
  }
}

function writeLocal(entries: IgnoredGameEntry[]) {
  const next = sortNewest(entries);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
}

export function readIgnoredGames(): IgnoredGameEntry[] {
  return readLocal();
}

export function listIgnoredGameIds(): string[] {
  return readLocal().map((row) => row.gameId);
}

export function isIgnoredGame(gameId: string): boolean {
  return readLocal().some((row) => row.gameId === gameId);
}

function upsertLocal(gameId: string, createdAt: string) {
  const rest = readLocal().filter((row) => row.gameId !== gameId);
  writeLocal([{ gameId, createdAt }, ...rest]);
}

export async function ignoreGame(gameId: string): Promise<void> {
  const createdAt = new Date().toISOString();
  upsertLocal(gameId, createdAt);
  const userId = await getSignedInUserId();
  if (!userId) return;
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("ignored_games").upsert(
    { user_id: userId, game_id: gameId, created_at: createdAt },
    { onConflict: "user_id,game_id" },
  );
  if (error) {
    console.warn("ignored_games upsert failed", error.message);
  }
}

export async function restoreIgnoredGame(gameId: string): Promise<void> {
  writeLocal(readLocal().filter((row) => row.gameId !== gameId));
  const userId = await getSignedInUserId();
  if (!userId) return;
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from("ignored_games")
    .delete()
    .eq("user_id", userId)
    .eq("game_id", gameId);
  if (error) {
    console.warn("ignored_games delete failed", error.message);
  }
}

export async function hydrateIgnoredGames(): Promise<IgnoredGameEntry[]> {
  const userId = await getSignedInUserId();
  if (!userId) return readLocal();

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("ignored_games")
    .select("game_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return readLocal();

  const remote: IgnoredGameEntry[] = (data ?? []).map((row) => ({
    gameId: row.game_id,
    createdAt: row.created_at,
  }));
  const remoteIds = new Set(remote.map((row) => row.gameId));
  const pending = readLocal().filter((row) => !remoteIds.has(row.gameId));

  if (pending.length > 0) {
    await supabase.from("ignored_games").upsert(
      pending.map((row) => ({
        user_id: userId,
        game_id: row.gameId,
        created_at: row.createdAt,
      })),
      { onConflict: "user_id,game_id" },
    );
  }

  const merged = sortNewest([...pending, ...remote]);
  writeLocal(merged);
  return merged;
}

export function subscribeIgnoredGames(
  onChange: (entries: IgnoredGameEntry[]) => void,
) {
  function fromStorage() {
    onChange(readLocal());
  }
  function fromEvent(e: Event) {
    const detail = (e as CustomEvent<IgnoredGameEntry[]>).detail;
    onChange(detail ?? readLocal());
  }
  window.addEventListener("storage", fromStorage);
  window.addEventListener(CHANGE_EVENT, fromEvent);
  return () => {
    window.removeEventListener("storage", fromStorage);
    window.removeEventListener(CHANGE_EVENT, fromEvent);
  };
}
