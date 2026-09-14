import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Production-floor tablet viewport, per the design system's touch-target
      // rules. Chromium rather than a WebKit device descriptor: shared floor
      // devices are Chrome-based, and it keeps one browser download.
      name: "production-floor",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1080, height: 810 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
