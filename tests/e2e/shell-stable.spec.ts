// The navigation panel is one fixed thing (ticket #33): the same size, place and elements on every page, so clicking
// through the site never makes it jump. Classic scrollbars are switched on (headless Chromium hides them by default),
// because overlay scrollbars hide the problem: with a classic scrollbar the page is 15 px narrower on a page that
// scrolls than on one that fits.
import { expect, test, type Locator, type Page } from "@playwright/test";

const PAGES = ["/", "/about/", "/projects/", "/blog/", "/how-this-site-is-built/"];
const HOME_LABEL = "Josh Deng, home";

type Box = { x: number; y: number; width: number; height: number } | null;
const round = (b: Box) => b && { x: b.x, y: b.y, width: b.width, height: b.height };

async function boxes(page: Page, locators: Record<string, Locator>) {
  const out: Record<string, Box> = {};
  for (const [name, locator] of Object.entries(locators)) {
    await expect(locator, name).toBeVisible();
    out[name] = round(await locator.boundingBox());
  }
  return out;
}

const WIDE = { width: 1440, height: 900 };

// Classic scrollbars for every test in this file (top level: it needs its own browser).
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

for (const js of [true, false]) {
  test.describe(`classic scrollbars, JavaScript ${js ? "on" : "off"}`, () => {
    test.use({ javaScriptEnabled: js });

    for (const viewport of [WIDE, { width: 1100, height: 900 }]) {
      test(`${viewport.width}px: the panel, the wordmark and the links are at the same place on every page`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        let first: Record<string, Box> | undefined;
        const scrolls = new Set<boolean>();
        for (const path of PAGES) {
          await page.goto(path);
          scrolls.add(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight));
          const now = await boxes(page, {
            panel: page.getByRole("banner"),
            wordmark: page.getByRole("link", { name: HOME_LABEL }),
            // the theme toggle needs JavaScript
            ...(js ? { toggle: page.getByRole("button", { name: /theme/i }).filter({ visible: true }).first() } : {}),
            ...Object.fromEntries(
              ["About", "Projects", "Blog", "How this site is built"].map((label) => [
                label,
                page
                  .getByRole("navigation", { name: "Main" })
                  .filter({ visible: true })
                  .getByRole("link", { name: label }),
              ]),
            ),
          });
          first ??= now;
          expect(now, path).toEqual(first);
        }
        // the check means something only if some pages scroll and some fit
        expect([...scrolls].sort(), "pages that scroll and pages that fit").toEqual([false, true]);
      });
    }

    test("375px: the top row, the Menu button and the open sheet start at the same place on every page", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 1400 });
      let first: Record<string, Box> | undefined;
      const scrolls = new Set<boolean>();
      for (const path of PAGES) {
        await page.goto(path);
        scrolls.add(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight));
        const closed = await boxes(page, {
          wordmark: page.getByRole("link", { name: HOME_LABEL }),
          menu: page.getByText("Menu", { exact: true }),
        });
        await page.getByText("Menu", { exact: true }).click();
        const open = await boxes(page, {
          About: page
            .getByRole("navigation", { name: "Main" })
            .filter({ visible: true })
            .getByRole("link", { name: "About" }),
          Blog: page
            .getByRole("navigation", { name: "Main" })
            .filter({ visible: true })
            .getByRole("link", { name: "Blog" }),
        });
        const now = { ...closed, ...open };
        first ??= now;
        expect(now, path).toEqual(first);
      }
      expect([...scrolls].sort(), "pages that scroll and pages that fit").toEqual([false, true]);
    });
  });
}

for (const js of [true, false]) {
  test.describe(`the home link on the home page (JavaScript ${js ? "on" : "off"})`, () => {
    test.use({ javaScriptEnabled: js });

    test("the wordmark is the one home link and the current page; the big name is a heading, not a link", async ({
      page,
    }) => {
      await page.goto("/");
      const links = page.getByRole("link", { name: HOME_LABEL });
      await expect(links).toHaveCount(1);
      await expect(links).toHaveAttribute("aria-current", "page");
      const name = page.getByRole("heading", { level: 1, name: "Josh Deng" });
      await expect(name).toBeVisible();
      await expect(name.getByRole("link")).toHaveCount(0);
    });

    test("other pages are unchanged: the wordmark is a home link, not the current page", async ({ page }) => {
      await page.goto("/about/");
      const link = page.getByRole("link", { name: HOME_LABEL });
      await expect(link).toHaveCount(1);
      await expect(link).not.toHaveAttribute("aria-current", "page");
    });
  });
}
