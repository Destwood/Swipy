import { expect, test, type Page } from "@playwright/test";

const INDIE_NIGHT = [
  { id: "igdb-14593", title: "Hollow Knight" },
  { id: "igdb-113112", title: "Hades" },
  { id: "igdb-26226", title: "Celeste" },
  { id: "igdb-26855", title: "Dead Cells" },
  { id: "igdb-11737", title: "Outer Wilds" },
  { id: "igdb-17000", title: "Stardew Valley" },
];

function fixtureGame({ id, title }: { id: string; title: string }) {
  return {
    id,
    title,
    developer: "Test Studio",
    year: 2020,
    genres: ["Indie"],
    description: `${title} fixture`,
    image: "/favicon.ico",
    modes: ["Single"],
    platforms: ["PC"],
  };
}

async function mockExternalApis(page: Page) {
  await page.route("**/api/games/by-ids**", (route) =>
    route.fulfill({
      json: { results: INDIE_NIGHT.map(fixtureGame) },
    }),
  );
  await page.route("**/api/steam/**", (route) =>
    route.fulfill({ json: {} }),
  );
}

test("solo: Find a game -> Solo -> swipe the whole deck -> results list liked and rejected games", async ({
  page,
}) => {
  await mockExternalApis(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Find a game" }).click();
  await expect(page.getByRole("dialog", { name: "Find a game" })).toBeVisible();

  await page.getByRole("button", { name: "Solo" }).click();
  await expect(page).toHaveURL(/\/session\/pick-deck\?intent=solo$/);
  await expect(
    page.getByText("Pick one deck to play alone."),
  ).toBeVisible();

  const indieNight = page
    .locator("article")
    .filter({ hasText: "Indie Night" });
  await indieNight.hover();
  await indieNight.getByRole("button", { name: "Select" }).click();
  await expect(page).toHaveURL(/\/deck$/);

  const heading = page.getByRole("heading", { level: 2 });
  const skipped = "Hades";

  for (const [index, game] of INDIE_NIGHT.entries()) {
    await expect(heading.filter({ hasText: game.title }).first()).toBeVisible();
    const action = game.title === skipped ? "Dislike" : "Like";
    await page
      .getByRole("button", { name: action, exact: true })
      .click();
    if (index < INDIE_NIGHT.length - 1) {
      await expect(heading.filter({ hasText: game.title })).toHaveCount(0);
    }
  }

  await expect(page).toHaveURL(/\/infinite\/matches\?session=/, {
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  const liked = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Liked" }) });
  const rejected = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Rejected" }) });

  for (const game of INDIE_NIGHT) {
    const section = game.title === skipped ? rejected : liked;
    await expect(section.getByText(game.title, { exact: true })).toBeVisible();
  }
});
