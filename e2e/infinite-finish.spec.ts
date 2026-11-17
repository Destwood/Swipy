import { expect, test } from "@playwright/test";

const GAMES = ["Alpha", "Beta", "Gamma"].map((title, i) => ({
  id: `igdb-9000${i}`,
  title,
  developer: "Test Studio",
  year: 2020,
  genres: ["Indie"],
  description: `${title} fixture`,
  image: "/favicon.ico",
  modes: ["Single"],
  platforms: ["PC"],
}));

test("infinite: swiping the last game of a finite list opens results", async ({
  page,
}) => {
  await page.route("**/api/games?**", (route) =>
    route.fulfill({ json: { results: GAMES, next: false } }),
  );
  await page.route("**/api/games/by-ids**", (route) =>
    route.fulfill({ json: { results: GAMES } }),
  );
  await page.route("**/api/steam/**", (route) => route.fulfill({ json: {} }));

  await page.goto("/infinite");
  const heading = page.getByRole("heading", { level: 2 });

  for (const [index, game] of GAMES.entries()) {
    await expect(heading.filter({ hasText: game.title }).first()).toBeVisible();
    await page
      .getByRole("button", { name: index === 1 ? "Dislike" : "Like", exact: true })
      .click();
    if (index < GAMES.length - 1) {
      await expect(heading.filter({ hasText: game.title })).toHaveCount(0);
    }
  }

  await expect(page).toHaveURL(/\/infinite\/matches\?session=/, {
    timeout: 30_000,
  });
  const liked = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Liked" }) });
  await expect(liked.getByText("Alpha", { exact: true })).toBeVisible();
  await expect(liked.getByText("Gamma", { exact: true })).toBeVisible();
});
