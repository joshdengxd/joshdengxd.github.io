import { defineConfig, devices } from "@playwright/test";

const port = 4173;
// Which build is in out/: the blog test fixture (npm run e2e) or the deployed one (npm run e2e:default).
// *.fixture.spec.ts run only on the first, *.default.spec.ts only on the second; other specs run on both.
const build = process.env.E2E_BUILD === "default" ? "default" : "fixture";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: build === "default" ? "**/*.fixture.spec.ts" : "**/*.default.spec.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx serve out --listen ${port} --no-port-switching`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: false,
  },
});
