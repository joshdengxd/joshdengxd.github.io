import { defineConfig, devices } from "@playwright/test";

const port = 4173;
// Which build is in out/: the blog test fixture (npm run e2e) or the deployed one (npm run e2e:default).
// *.fixture.spec.ts run only on the first, *.default.spec.ts only on the second; other specs run on both.
const build = process.env.E2E_BUILD === "default" ? "default" : "fixture";
// WebKit (the iPhone Safari engine) is opt-in, to keep CI on Chromium only: `npm run e2e:webkit` sets E2E_WEBKIT=1.
const webkit = process.env.E2E_WEBKIT === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: build === "default" ? "**/*.fixture.spec.ts" : "**/*.default.spec.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}`, trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // The phone Menu sheet behaves differently per engine (Safari on iPhones), so with the flag its spec also runs in WebKit.
    ...(webkit
      ? [{ name: "webkit", testMatch: "**/menu-sheet.spec.ts", use: { ...devices["Desktop Safari"] } }]
      : []),
  ],
  webServer: {
    command: `npx serve out --listen ${port} --no-port-switching`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: false,
  },
});
