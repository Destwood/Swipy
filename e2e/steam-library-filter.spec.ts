import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

for (const { mode, emptyPages } of [
  { mode: "only-owned", emptyPages: 0 },
  { mode: "hide-owned", emptyPages: 0 },
  { mode: "only-owned", emptyPages: 24 },
  { mode: "hide-owned", emptyPages: 6 },
] as const) {
  test(`Steam ${mode} fills sparse results after ${emptyPages} empty pages without scrolling`, async ({ page }) => {
    const owned = Array.from({ length: 10 + emptyPages }, (_, n) =>
      Array.from({ length: 20 }, (_, i) => ({ n: n + 1, i })),
    ).flat().filter(({ i }) => mode === "only-owned" ? i === 0 : i !== 19)
      .map(({ n, i }) => `app-${n}-${i}`);
    await page.addInitScript(({ owned, mode }) => {
      const cache = JSON.stringify({ owned, wishlist: [] });
      localStorage.setItem("swipy.steamLibrary", cache);
      localStorage.setItem("swipy.steamLibraryMode", mode);
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        setItem.call(this, key, key === "swipy.steamLibrary" ? cache : value);
      };
    }, { owned, mode });
    const pages = new Set<number>();
    await page.route("**/api/games?**", (route) => {
      const n = Number(new URL(route.request().url()).searchParams.get("page"));
      pages.add(n);
      return route.fulfill({ json: {
        results: n <= emptyPages ? [] : Array.from({ length: 20 }, (_, i) => {
          const steamAppId = `app-${n}-${i}`;
          return {
            id: `igdb-${n}-${i}`,
            title: `${owned.includes(steamAppId) ? "Owned" : "Unowned"} ${n}-${i}`,
            steamAppId,
            developer: "Fixture Studio", year: 2020, genres: ["Indie"],
            description: "Steam fixture", image: "/favicon.ico",
            modes: ["Single"], platforms: ["PC"],
          };
        }),
        next: n < 10 + emptyPages,
      } });
    });
    await page.route("**/api/steam/**", (route) => route.fulfill({ json: {} }));
    await page.route("**/api/games/by-ids**", (route) => route.fulfill({ json: { results: [] } }));
    await page.goto("/library");
    const wanted = mode === "only-owned" ? "Owned" : "Unowned";
    const unwanted = mode === "only-owned" ? "Unowned" : "Owned";
    const tiles = page.getByRole("button", { name: new RegExp(`^Open ${wanted} `) });
    await expect.poll(() => tiles.count()).toBeGreaterThanOrEqual(8);
    await expect.poll(() => pages.size).toBeGreaterThan(4);
    await expect(page.getByRole("button", { name: new RegExp(`^Open ${unwanted} `) })).toHaveCount(0);
    await expect(tiles).toHaveCount(10);
    await expect(page.getByText("No games found", { exact: true })).toHaveCount(0);
  });
}
