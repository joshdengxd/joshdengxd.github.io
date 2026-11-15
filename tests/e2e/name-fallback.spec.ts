// The name's wrap safety net (design-language/README.md, "Name fallback"): with the web font blocked and the name's
// family forced to a far wider font, no page scrolls sideways. Runs on both builds.
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/about/",
  "/projects/",
  "/projects/this-site/",
  "/blog/",
  "/how-this-site-is-built/",
  "/design/",
  "/no-such-page/",
  ...(process.env.E2E_BUILD === "default" ? [] : ["/blog/blog-engine-fixture/"]),
];
const WIDE = `<style>.name, .name *, [class*="wordmark"], [class*="wordmark"] * { font-family: monospace !important; }</style>`;

for (const js of [true, false]) {
  for (const width of [320, 390]) {
    test.describe(`web font blocked, name forced to monospace, ${width}px, JavaScript ${js ? "on" : "off"}`, () => {
      test.use({ javaScriptEnabled: js, viewport: { width, height: 800 } });

      for (const path of PAGES) {
        test(`${path} does not scroll sideways`, async ({ page }) => {
          const blocked: string[] = [];
          const loaded: string[] = [];
          page.on("requestfailed", (request) => {
            if (request.url().endsWith(".woff2")) {
              blocked.push(request.url());
            }
          });
          page.on("requestfinished", (request) => {
            if (request.url().endsWith(".woff2")) {
              loaded.push(request.url());
            }
          });
          // One handler: font files are aborted, the page document gets a style tag put into it (so it also works
          // with JavaScript off), everything else goes on. A second broad route that continues would hide the abort.
          await page.route("**/*", async (route) => {
            const request = route.request();
            if (request.url().endsWith(".woff2")) {
              return route.abort();
            }
            if (request.resourceType() !== "document") {
              return route.continue();
            }
            const response = await route.fetch();
            const body = (await response.text()).replace("</head>", `${WIDE}</head>`);
            return route.fulfill({ response, body });
          });
          await page.goto(path);
          await page.waitForLoadState("load");
          await page.evaluate(() => document.fonts.ready);

          const family = await page.evaluate(() => {
            const el = document.querySelector(".name, [class*='wordmark']");
            return el ? getComputedStyle(el).fontFamily : "none";
          });
          expect(family, `${path}: the name is set in the forced family`).toMatch(/monospace/);

          // The web font is really absent: font files were asked for and aborted, none arrived, no face is loaded.
          expect(blocked.length, `${path}: font requests aborted`).toBeGreaterThan(0);
          expect(loaded, `${path}: font files that arrived`).toEqual([]);
          // The "... Fallback" faces are the local size-adjusted ones; they have no file and are not the web font.
          const faces = await page.evaluate(() =>
            [...document.fonts]
              .filter((f) => f.status === "loaded" && !/fallback$/i.test(f.family))
              .map((f) => f.family),
          );
          expect(faces, `${path}: web font faces loaded`).toEqual([]);

          const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          expect(over, `${path}: horizontal overflow in px`).toBeLessThanOrEqual(0);
        });
      }
    });
  }
}
