import { test } from "@playwright/test";

const INDIE_NIGHT = [
  { id: "igdb-14593", title: "Hollow Knight" },
  { id: "igdb-113112", title: "Hades" },
  { id: "igdb-26226", title: "Celeste" },
  { id: "igdb-26855", title: "Dead Cells" },
  { id: "igdb-11737", title: "Outer Wilds" },
  { id: "igdb-17000", title: "Stardew Valley" },
];

test.describe("Swipy", () => {
  test("seed", async ({ page }) => {
    await page.route("**/api/games/by-ids**", (route) =>
      route.fulfill({
        json: {
          results: INDIE_NIGHT.map(({ id, title }) => ({
            id,
            title,
            developer: "Test Studio",
            year: 2020,
            genres: ["Indie"],
            description: `${title} fixture`,
            image: "/favicon.ico",
            modes: ["Single"],
            platforms: ["PC"],
          })),
        },
      }),
    );
    await page.route("**/api/steam/**", (route) => route.fulfill({ json: {} }));
    await page.goto("/");
  });
});
