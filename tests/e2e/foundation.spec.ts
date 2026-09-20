import { expect, test } from "@playwright/test";

test("402 route shell renders", async ({ page }) => {
  await page.goto("/402");

  await expect(
    page.getByRole("heading", { level: 1, name: "Today" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Seed Today" }),
  ).toBeVisible();
});

test("design tokens are applied to the page background", async ({ page }) => {
  await page.goto("/402");

  const background = await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor,
  );

  // #F5F7F4 from docs/reference/design/design-tokens.json
  expect(background).toBe("rgb(245, 247, 244)");
});
