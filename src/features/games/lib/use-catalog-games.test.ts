// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Game } from "@/features/games/data/games";
import { EMPTY_CATALOG_FILTERS } from "./catalog-filters";
import type { LibraryFilter } from "@/features/steam/lib/library-filter";

const ctx = vi.hoisted(() => ({ library: {
  mode: "all", owned: new Set<string>(), wishlist: new Set<string>(),
} as LibraryFilter }));
vi.mock("@/features/steam/lib/use-steam", () => ({ useLibraryFilter: () => ctx.library }));
vi.mock("./game-library", () => ({ upsertGames: vi.fn() }));
import { useCatalogGames } from "./use-catalog-games";

const game = (id: string, steamAppId = "owned"): Game => ({
  id, steamAppId, title: id, developer: "Fixture", year: 2020,
  genres: ["Indie"], description: "", image: "/favicon.ico",
});
const reply = (results: Game[], next = true) => new Response(JSON.stringify({ results, next }));
const pageNumber = (url: string) => Number(new URL(url, "http://localhost").searchParams.get("page"));

beforeEach(() => {
  localStorage.clear();
  ctx.library = { mode: "all", owned: new Set(), wishlist: new Set() };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("loads one page per operation without an effective Steam filter, including empty pages", async () => {
  const fetcher = vi.fn(async () => reply([]));
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(() => useCatalogGames(EMPTY_CATALOG_FILTERS, "popular"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetcher).toHaveBeenCalledTimes(1);
  act(() => { result.current.loadMore(); result.current.loadMore(); });
  await waitFor(() => expect(result.current.loadingMore).toBe(false));
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(result.current.hasMore).toBe(true);
});

it("bounds sparse batches, deduplicates within and across pages, and continues after empty pages", async () => {
  ctx.library = { mode: "only-owned", owned: new Set(["owned"]), wishlist: new Set() };
  const fetcher = vi.fn(async (url: string) => {
    const n = pageNumber(url);
    return reply(n === 25 ? [game("match"), game("match")] : [], n < 25);
  });
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(() => useCatalogGames(EMPTY_CATALOG_FILTERS, "popular"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetcher).toHaveBeenCalledTimes(24);
  expect(result.current.hasMore).toBe(true);
  act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.hasMore).toBe(false));
  expect(result.current.games.map(g => g.id)).toEqual(["match"]);
});

it("keeps loaded games and blocks automatic retries after a request fails", async () => {
  ctx.library = { mode: "hide-owned", owned: new Set(["owned"]), wishlist: new Set() };
  const fetcher = vi.fn(async (url: string) => pageNumber(url) === 1
    ? reply([game("kept", "unowned")])
    : new Response(JSON.stringify({ error: "Catalog unavailable" }), { status: 503 }));
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(() => useCatalogGames(EMPTY_CATALOG_FILTERS, "popular"));
  await waitFor(() => expect(result.current.error).toBe("Catalog unavailable"));
  expect(result.current.games.map(g => g.id)).toEqual(["kept"]);
  act(() => result.current.loadMore());
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(result.current.hasMore).toBe(true);
});

it("re-evaluates cached games and tops up when Steam mode or data changes", async () => {
  const fetcher = vi.fn(async (url: string) => {
    const n = pageNumber(url);
    return reply([game(`game-${n}`, n === 1 ? "unowned" : "owned")], n < 5);
  });
  vi.stubGlobal("fetch", fetcher);
  const { result, rerender } = renderHook(() => useCatalogGames(EMPTY_CATALOG_FILTERS, "popular"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  ctx.library = { mode: "only-owned", owned: new Set(["owned"]), wishlist: new Set() };
  rerender();
  await waitFor(() => expect(result.current.hasMore).toBe(false));
  expect(result.current.games.map(g => g.id)).toEqual(["game-2", "game-3", "game-4", "game-5"]);
  ctx.library = { ...ctx.library, owned: new Set(["unowned"]) };
  rerender();
  expect(result.current.games.map(g => g.id)).toEqual(["game-1"]);
});

it("aborts stale loads on query changes and on unmount", async () => {
  const requests: { signal: AbortSignal; resolve: (response: Response) => void }[] = [];
  vi.stubGlobal("fetch", vi.fn((_url: string, options: { signal: AbortSignal }) =>
    new Promise<Response>(resolve => requests.push({ signal: options.signal, resolve }))));
  const { result, rerender, unmount } = renderHook(({ query }) =>
    useCatalogGames(EMPTY_CATALOG_FILTERS, "popular", query), { initialProps: { query: "old" } });
  rerender({ query: "new" });
  expect(requests[0].signal.aborted).toBe(true);
  await act(async () => { requests[1].resolve(reply([game("new")], false)); });
  await act(async () => { requests[0].resolve(reply([game("old")], false)); });
  expect(result.current.games.map(g => g.id)).toEqual(["new"]);
  rerender({ query: "pending" });
  unmount();
  expect(requests[2].signal.aborted).toBe(true);
});

it("counts only unique non-ignored matches toward the target and keeps concurrent pages in order", async () => {
  localStorage.setItem("swipy.ignoreList", JSON.stringify({ genres: ["Shooter"], platforms: [] }));
  ctx.library = { mode: "only-wishlist", owned: new Set(), wishlist: new Set(["owned"]) };
  const pending = new Map<number, (response: Response) => void>();
  const fetcher = vi.fn((url: string) => new Promise<Response>(resolve => {
    pending.set(pageNumber(url), resolve);
  }));
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(() => useCatalogGames(EMPTY_CATALOG_FILTERS, "popular"));
  expect(fetcher).toHaveBeenCalledTimes(4);
  await act(async () => {
    for (const n of [4, 3, 2, 1]) pending.get(n)!(reply([
      game("same"), game("same"), game(`unowned-${n}`, "other"),
      { ...game(`ignored-${n}`), genres: ["Shooter"] },
    ]));
  });
  expect(result.current.games.map(g => g.id)).toEqual(["same"]);
  expect(fetcher).toHaveBeenCalledTimes(8);
  await act(async () => {
    for (const n of [8, 7, 6, 5]) pending.get(n)!(reply(Array.from({ length: 4 }, (_, i) => game(`game-${n}-${i}`))));
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetcher).toHaveBeenCalledTimes(8);
  expect(result.current.games).toHaveLength(17);
  expect(result.current.games[1].id).toBe("game-5-0");
  expect(result.current.games[16].id).toBe("game-8-3");
});
