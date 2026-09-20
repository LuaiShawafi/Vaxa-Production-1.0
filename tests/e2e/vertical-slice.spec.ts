import { expect, test } from "@playwright/test";

function stockholmTodayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isoWeekFromYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  const week1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const weekNum =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
}

test.describe("Planning + 402 seeding vertical slice", () => {
  test("full journey when database is seeded", async ({ page }) => {
    test.setTimeout(120_000);
    const dateStr = stockholmTodayYmd();
    const [y, m, d] = dateStr.split("-").map(Number);
    const wd = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
    const isoWd = wd === 0 ? 7 : wd;
    test.skip(isoWd > 5, "E2E seeding slice requires a Mon–Fri operational day");
    const weekStr = isoWeekFromYmd(dateStr);
    const destinations = [
      "402",
      "406",
      "408",
      "410",
      "412",
      "414",
      "416",
      "418",
      "420",
      "422",
    ];
    const initialDest =
      destinations[Date.now() % destinations.length] ?? "402";
    const editDest =
      destinations[(Date.now() + 3) % destinations.length] ?? "406";

    await page.goto("/planning");
    const weekInput = page.getByLabel("ISO week");
    await weekInput.fill(weekStr);
    await page.getByRole("button", { name: "Create plan" }).click();
    await expect(page).toHaveURL(/\/planning\//);

    await page.locator('select[name="skuId"]').selectOption({ label: "PU_RED_RADISH" });
    await page.locator('input[name="plannedDate"]').fill(dateStr);
    await page.locator('input[name="plannedQuantity"]').fill("35");
    await page
      .locator('select[name="destinationIdentity"]')
      .selectOption(initialDest);
    await page.getByRole("button", { name: "Add plan item" }).click();
    await expect(page.getByRole("cell", { name: "PU_RED_RADISH" })).toBeVisible();

    await page.getByRole("button", { name: "Publish plan" }).click();
    await page.getByRole("button", { name: "Confirm publish" }).click();
    await expect(
      page.getByText("PUBLISHED", { exact: true }).first(),
    ).toBeVisible({ timeout: 15_000 });

    const batchCell = page.locator("td.font-mono").first();
    const batchNumber = (await batchCell.textContent())?.trim() ?? "";

    await page.getByRole("button", { name: "Edit" }).first().click();
    await page
      .locator('select[name="destinationIdentity"]')
      .selectOption(editDest);
    await page.getByRole("button", { name: "Save plan item" }).click();
    await expect(page.getByRole("cell", { name: editDest })).toBeVisible({
      timeout: 10_000,
    });
    await expect(batchCell).toHaveText(batchNumber);

    await page.goto("/402");
    const row = page
      .getByTestId("seed-today-row")
      .filter({ hasText: batchNumber })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    await row.getByRole("button", { name: "Start" }).click();

    await page.getByRole("button", { name: "Alex Kim" }).click();
    await page.getByRole("button", { name: "Start Seeding" }).click();
    await page.getByRole("link", { name: "Complete" }).click();

    await page.getByRole("button", { name: "Elena Svensson" }).click();

    await page.getByRole("button", { name: "Continue to review" }).click();
    await expect(
      page.getByRole("heading", { name: "Review Seeding" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Complete Seeding" }).click();
    await expect(
      page.getByRole("heading", { name: "Seeding completed" }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/\/402\/?$/, { timeout: 5000 });
    await expect(
      page
        .getByTestId("seed-today-row")
        .filter({ hasText: batchNumber })
        .getByText("Completed"),
    ).toBeVisible({ timeout: 15_000 });
  });
});
