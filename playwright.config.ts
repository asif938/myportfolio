import { defineConfig, devices } from "@playwright/test";

/**
 * Browser smoke tests (tests/e2e). They run against the production build:
 *   npm run build && npm run test:e2e
 * Set E2E_PORT to use another port. An already running server on that port is reused.
 */
const port = process.env.E2E_PORT ?? "3100";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node scripts/next-qa.mjs start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
