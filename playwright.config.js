import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL || process.env.BASE_URL;
const baseUrl = externalBaseUrl || "http://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  workers: 1,
  expect: { timeout: 5000 },
  use: {
    baseURL: baseUrl,
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
    ignoreHTTPSErrors: true,
  },
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:5173",
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
        },
      }),
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
