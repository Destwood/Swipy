import { expect, test, type Page } from "@playwright/test";

const GAMES = [
  { id: "igdb-14593", title: "Hollow Knight" },
  { id: "igdb-113112", title: "Hades" },
  { id: "igdb-26226", title: "Celeste" },
  { id: "igdb-26855", title: "Dead Cells" },
  { id: "igdb-11737", title: "Outer Wilds" },
  { id: "igdb-17000", title: "Stardew Valley" },
].map(({ id, title }) => ({
  id,
  title,
  developer: "Test Studio",
  year: 2020,
  genres: ["Indie"],
  description: `${title} fixture`,
  image: "/favicon.ico",
  modes: ["Single"],
  platforms: ["PC"],
}));

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/games?**", (route) => {
    const query = new URL(route.request().url()).searchParams.get("q") ?? "";
    return route.fulfill({
      json: {
        results: GAMES.filter((game) =>
          game.title.toLowerCase().includes(query.toLowerCase()),
        ),
        next: false,
      },
    });
  });
  await page.route("**/api/games/by-ids**", (route) =>
    route.fulfill({ json: { results: GAMES } }),
  );
  await page.route("**/api/steam/**", (route) =>
    route.fulfill({ json: {} }),
  );
});

async function createDeck(page: Page) {
  await page.goto("/decks/new");
  await page.getByRole("textbox", { name: "Deck name" }).fill("Indie picks");
  for (const game of GAMES.slice(0, 2)) {
    await page.getByRole("button", { name: `Add ${game.title}`, exact: true }).click();
    await expect(
      page.getByRole("button", { name: `Remove ${game.title}`, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.getByText("2 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save deck", exact: true }).click();
  await expect(page).toHaveURL(/\/decks\?created=custom-\d+$/, { timeout: 30_000 });
  return new URL(page.url()).searchParams.get("created")!;
}

test("guest creates a deck from selected library tiles", async ({ page }) => {
  await createDeck(page);
});

test("deck validation requires a name and at least two games", async ({ page }) => {
  await page.goto("/decks/new");
  await page.getByRole("button", { name: "Save deck", exact: true }).click();
  await expect(page.getByText("Give the deck a name.", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Deck name" }).fill("One game");
  await page.getByRole("button", { name: "Add Hollow Knight", exact: true }).click();
  await page.getByRole("button", { name: "Save deck", exact: true }).click();
  await expect(page.getByText("Pick at least 2 games.", { exact: true })).toBeVisible();
});

test("guest edits a deck and retains selections outside current search results", async ({ page }) => {
  const id = await createDeck(page);
  await page.goto(`/decks/${id}/edit`);
  await expect(page.getByText("2 selected", { exact: true })).toBeVisible();
  for (const game of GAMES.slice(0, 2)) {
    await expect(
      page.getByRole("button", { name: `Remove ${game.title}`, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("button", { name: "Remove Hades", exact: true }).click();
  const search = page.getByRole("textbox", { name: "Search games", exact: true });
  await search.fill("Celeste");
  await search.press("Enter");
  await expect(page.getByRole("button", { name: "Remove Hollow Knight", exact: true })).toHaveCount(0);
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add Celeste", exact: true }).click();
  await expect(page.getByText("2 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(`/decks?updated=${id}`, { timeout: 30_000 });
  await page.goto(`/decks/${id}/edit`);
  for (const title of ["Hollow Knight", "Celeste"]) {
    await expect(page.getByRole("button", { name: `Remove ${title}`, exact: true })).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.getByRole("button", { name: "Add Hades", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("deck catalog search preserves the URL and Enter does not submit the deck", async ({ page }) => {
  await page.goto("/decks/new");
  const url = page.url();
  const search = page.getByRole("textbox", { name: "Search games", exact: true });
  await search.fill("Celeste");
  await expect(page).toHaveURL(url);
  await search.press("Enter");
  await expect(page.getByText("1 results for “Celeste”", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(url);
  await expect(page.getByText("Give the deck a name.", { exact: true })).toHaveCount(0);
});

test("library catalog search still syncs the query to its URL", async ({ page }) => {
  await page.goto("/library");
  const search = page.getByRole("textbox", { name: "Search games", exact: true });
  await search.fill("Celeste");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/library\?q=Celeste$/);
  await expect(page.getByText("1 results for “Celeste”", { exact: true })).toBeVisible();
});
