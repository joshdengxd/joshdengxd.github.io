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

      test("no page scrolls sideways", async ({ page }) => {
        await page.route("**/*.woff2", (route) => route.abort());
        // A style tag put into the document itself, so it also works with JavaScript off.
        await page.route("**/*", async (route) => {
          if (route.request().resourceType() !== "document") {
            return route.continue();
          }
          const response = await route.fetch();
          const body = (await response.text()).replace("</head>", `${WIDE}</head>`);
          return route.fulfill({ response, body });
        });
        for (const path of PAGES) {
          await page.goto(path);
          const family = await page.evaluate(() => {
            const el = document.querySelector(".name, [class*='wordmark']");
            return el ? getComputedStyle(el).fontFamily : "none";
          });
          expect(family, `${path}: the name is set in the forced family`).toMatch(/monospace/);
          const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          expect(over, `${path}: horizontal overflow in px`).toBeLessThanOrEqual(0);
        }
      });
    });
  }
}
