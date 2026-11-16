import { defineConfig, devices } from "@playwright/test";

const port = 4173;
// Which build is in out/: the blog test fixture (npm run e2e) or the deployed one (npm run e2e:default).
// *.fixture.spec.ts run only on the first, *.default.spec.ts only on the second; other specs run on both.
const build = process.env.E2E_BUILD === "default" ? "default" : "fixture";
// WebKit is local and opt-in; CI runs Chromium only. "all" covers every spec, "1" the quick Menu sheet check.
const webkit = process.env.E2E_WEBKIT;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: build === "default" ? "**/*.fixture.spec.ts" : "**/*.default.spec.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}`, trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // The quick command keeps its Menu sheet filter; the full suite uses the same build filters as Chromium.
    ...(webkit === "all" || webkit === "1"
      ? [
          {
            name: "webkit",
            ...(webkit === "1" ? { testMatch: "**/menu-sheet.spec.ts" } : {}),
            use: { ...devices["Desktop Safari"] },
          },
        ]
      : []),
  ],
  webServer: {
    command: `npx serve out --listen ${port} --no-port-switching`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: false,
  },
});
