import { expect, test, type Page } from "@playwright/test";
import { PROJECTS } from "../../lib/projects";
import { ABOUT_LINKS } from "../about-text";
import { MERGED_PRS_URL, PROJECT_BOARD_URL } from "../../lib/site";

const HOME_LABEL = "Josh Deng, home";
const NAV = [
  { href: "/about/", label: "About" },
  { href: "/projects/", label: "Projects" },
  { href: "/blog/", label: "Blog" },
  { href: "/how-this-site-is-built/", label: "How this site is built" },
];
const PAGES = ["/", ...NAV.map((n) => n.href), "/projects/this-site/", "/design/", "/no-such-page/"];
const ACCENT_DARK = "rgb(196, 154, 90)";
const DARK_GROUND = "rgb(30, 44, 35)";
const LIGHT_GROUND = "rgb(243, 240, 230)";

const theme = (page: Page) => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
const bodyBackground = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const currentLinks = (page: Page) => page.locator('a[aria-current="page"]').filter({ visible: true });

// The first animation frame comes before the first paint: the theme then is the theme the visitor first sees.
type Recorded = { firstFrameTheme?: string | null };
function recordFirstFrameTheme() {
  requestAnimationFrame(() => {
    (window as Recorded).firstFrameTheme = document.documentElement.getAttribute("data-theme");
  });
}
async function firstFrameTheme(page: Page) {
  await page.waitForFunction(() => (window as Recorded).firstFrameTheme !== undefined);
  return page.evaluate(() => (window as Recorded).firstFrameTheme);
}

/** Watches a page for failed responses (404 and up), console errors and uncaught errors. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

for (const js of [true, false]) {
  test.describe(`the home mark (JavaScript ${js ? "on" : "off"})`, () => {
    test.use({ javaScriptEnabled: js });

    // WCAG 2.5.3 (label in name): the accessible name starts with the words on screen.
    for (const path of ["/", "/about/"]) {
      test(`${path}: the link home is named "${HOME_LABEL}", which contains its visible text`, async ({ page }) => {
        await page.goto(path);
        const mark = page.getByRole("link", { name: HOME_LABEL, exact: true });
        await expect(mark).toHaveCount(1);
        await expect(mark).toHaveAttribute("href", "/");
        await expect(mark).toBeVisible();
        const visible = ((await mark.textContent()) ?? "").replace(/\s+/g, " ").trim();
        expect(visible.toLowerCase()).toBe("josh deng");
        expect(HOME_LABEL.toLowerCase()).toContain(visible.toLowerCase());
        expect(HOME_LABEL.startsWith("Josh Deng")).toBe(true);
      });
    }
  });

  test.describe(`every page is inside the shell (JavaScript ${js ? "on" : "off"})`, () => {
    test.use({ javaScriptEnabled: js });

    test("the current section is marked, in ochre", async ({ page }) => {
      for (const path of PAGES) {
        await page.goto(path);
        await expect(page.getByRole("banner"), path).toHaveCount(1);
        await expect(page.locator("main#main"), path).toHaveCount(1);
        await expect(page.getByRole("navigation", { name: "Main" }).filter({ visible: true }), path).toHaveCount(1);
        expect(await bodyBackground(page), path).toBe(DARK_GROUND);

        const current = currentLinks(page);
        // A project page marks Projects, as a sub-page of it.
        const section = NAV.find((n) => path === n.href || path.startsWith(n.href));
        if (path === "/") {
          await expect(current).toHaveCount(1);
          await expect(current).toHaveAccessibleName(HOME_LABEL);
          await expect(current.locator(".name-first")).toHaveCSS("color", ACCENT_DARK);
        } else if (section) {
          await expect(current, path).toHaveCount(1);
          await expect(current, path).toHaveText(section.label);
          await expect(current, path).toHaveCSS("color", ACCENT_DARK);
        } else {
          await expect(current, path).toHaveCount(0);
        }
      }
    });
  });
}

test.describe("theme", () => {
  test("dark by default on every page, before first paint", async ({ page }) => {
    await page.addInitScript(recordFirstFrameTheme);
    for (const path of PAGES) {
      await page.goto(path);
      expect(await firstFrameTheme(page), path).toBe("dark");
      expect(await theme(page), path).toBe("dark");
    }
  });

  test("the toggle in the shell switches to light; it survives a reload and carries to other pages", async ({
    page,
  }) => {
    await page.goto("/about/");
    const toggle = page.getByRole("button", { name: /Switch to (light|dark) theme/ });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await bodyBackground(page)).toBe(LIGHT_GROUND);

    // Light from the first frame on: no flash of dark once light is chosen.
    await page.addInitScript(recordFirstFrameTheme);
    await page.reload();
    expect(await firstFrameTheme(page)).toBe("light");
    for (const path of PAGES) {
      await page.goto(path);
      expect(await firstFrameTheme(page), path).toBe("light");
      expect(await bodyBackground(page), path).toBe(LIGHT_GROUND);
      await expect(page.getByRole("button", { name: /Switch to (light|dark) theme/ }), path).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }

    await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
    await page.goto("/blog/");
    expect(await theme(page)).toBe("dark");
  });
});

test.describe("navigation", () => {
  for (const start of ["/", "/about/"]) {
    test(`every navigation link and the wordmark work from ${start}`, async ({ page }) => {
      const problems = watch(page);
      const targets = [...NAV.map((n) => ({ name: n.label, href: n.href })), { name: HOME_LABEL, href: "/" }];
      for (const { name, href } of targets) {
        await page.goto(start);
        const link = page.getByRole("link", { name, exact: true }).filter({ visible: true });
        await expect(link, `${name} from ${start}`).toHaveCount(1);
        await expect(link).toHaveAttribute("href", href);
        await link.click();
        await expect(page).toHaveURL(href);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        // A full load of the same URL must succeed too (the static file exists, not only the client route).
        const res = await page.goto(href);
        expect(res?.status(), href).toBe(200);
      }
      expect(problems).toEqual([]);
    });
  }

  test("an unknown URL shows the 404 page inside the shell, with a link back home", async ({ page }) => {
    const res = await page.goto("/no-such-page/");
    expect(res?.status()).toBe(404);
    await expect(page).toHaveTitle("Page not found · Xindong Deng (Josh)");
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
    await page.getByRole("link", { name: "Back to the home page" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Josh\s*Deng/);
  });
});

test.describe("keyboard", () => {
  test("the skip link is the first Tab stop and moves focus to the main content", async ({ page }) => {
    for (const path of ["/", "/about/", "/no-such-page/"]) {
      await page.goto(path);
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: "Skip to content" });
      await expect(skip, path).toBeFocused();
      await expect(skip).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(page.locator("main#main"), path).toBeFocused();
    }
  });

  test("wide screen: Tab reaches the wordmark, every section, the toggle and the profile links, each with a focus ring", async ({
    page,
  }) => {
    await page.goto("/about/");
    await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).waitFor();
    const order: string[] = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) {
          return { name: "", ring: false };
        }
        const cs = getComputedStyle(el);
        return {
          name: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "",
          ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2,
        };
      });
      if (info.name === "") {
        break;
      }
      order.push(info.name);
      expect(info.ring, `focus ring on ${info.name}`).toBe(true);
    }
    // Utilities follow navigation; page content follows the panel.
    expect(order).toEqual([
      "Skip to content",
      HOME_LABEL,
      ...NAV.map((n) => n.label),
      "Switch to light theme",
      "GitHub (opens in a new tab)",
      "LinkedIn (opens in a new tab)",
      "Matt Pocock (opens in a new tab)",
      "Lauren Tan (opens in a new tab)",
    ]);

    // The toggle works from the keyboard.
    await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).focus();
    await page.keyboard.press("Enter");
    expect(await theme(page)).toBe("light");
    await page.keyboard.press("Space");
    expect(await theme(page)).toBe("dark");
  });

  test("phone: Tab reaches the Menu, Enter opens the sheet, and its links follow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects/");
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // wordmark
    await expect(page.getByRole("link", { name: HOME_LABEL })).toBeFocused();
    await page.keyboard.press("Tab");
    const menu = page.locator("summary", { hasText: "Menu" });
    await expect(menu).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "About" }).filter({ visible: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/about/");
  });
});

test.describe("phone", () => {
  for (const width of [320, 390]) {
    test(`at ${width}px nothing overflows, the Menu sheet works and targets are at least 44px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(path);
        const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(await overflow(), `${path} closed`).toBeLessThanOrEqual(0);
        await page.locator("summary", { hasText: "Menu" }).click();
        const sheetNav = page.getByRole("navigation", { name: "Main" }).filter({ visible: true });
        await expect(sheetNav, path).toBeVisible();
        expect(await overflow(), `${path} open`).toBeLessThanOrEqual(0);

        const small = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("header a, header button, header summary, footer a, main a")]
            .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed")
            // WCAG 2.2 target size, inline exception: a link is exempt only when it is displayed inline and sits in a
            // sentence, i.e. its paragraph still has a letter or digit once the text of ALL links in it is removed.
            // Every other link (blocks, inline-blocks, flex, a paragraph of only links) must be 44px.
            .filter((el) => {
              const block = el.closest("p");
              if (!el.matches("main a") || !block || getComputedStyle(el).display !== "inline") {
                return true;
              }
              const copy = block.cloneNode(true) as HTMLElement;
              copy.querySelectorAll("a").forEach((a) => a.remove());
              return !/[\p{L}\p{N}]/u.test(copy.textContent ?? "");
            })
            .map((el) => ({ name: el.textContent?.trim(), r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
            .map(({ name, r }) => `${name} ${Math.round(r.width)}x${Math.round(r.height)}`),
        );
        expect(small, path).toEqual([]);
      }
    });
  }
});

// The condensed Archivo file is what makes the name fit a phone. Until it arrives (or if it never does) the
// fallback face must fit too: no page may overflow while the font is missing.
test.describe("phone, web font not loaded", () => {
  for (const js of [true, false]) {
    for (const width of [320, 390]) {
      test(`nothing overflows at ${width}px with the font file blocked (JavaScript ${js ? "on" : "off"})`, async ({
        browser,
      }) => {
        const context = await browser.newContext({ javaScriptEnabled: js, viewport: { width, height: 800 } });
        const page = await context.newPage();
        let blocked = 0;
        await page.route("**/*.woff2", (route) => {
          blocked += 1;
          return route.abort();
        });
        for (const path of PAGES) {
          await page.goto(path);
          await page.waitForLoadState("load");
          const loaded = await page.evaluate(() => document.fonts.check("800 20px archivo"));
          expect(loaded, `${path}: the web font must be missing for this test to mean anything`).toBe(false);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          expect(overflow, path).toBeLessThanOrEqual(0);
        }
        expect(blocked).toBeGreaterThan(0);
        await context.close();
      });
    }
  }
});

test.describe("without JavaScript, on a phone", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test("every page is readable and the Menu sheet opens", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Main" }).filter({ visible: true })).toHaveCount(0);
      await page.locator("summary", { hasText: "Menu" }).click();
      const sheet = page.getByRole("navigation", { name: "Main" }).filter({ visible: true });
      await expect(sheet, path).toBeVisible();
      for (const { label } of NAV) {
        await expect(sheet.getByRole("link", { name: label })).toBeVisible();
      }
      // No toggle without JavaScript: it could not work.
      await expect(page.getByRole("button", { name: /Switch to (light|dark) theme/ })).toHaveCount(0);
    }
  });
});

test.describe("personal details", () => {
  test("the shell shows no contact detail, and outside links go only to GitHub, LinkedIn, the public repos, the two people About names, the project board and the merged pull requests", async ({
    page,
  }) => {
    const outside = new Set<string>();
    for (const path of [...PAGES, ...PROJECTS.map((p) => `/projects/${p.slug}/`)]) {
      await page.goto(path);
      for (const href of await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
        if (!href.startsWith("/") && !href.startsWith("#")) {
          outside.add(href);
        }
      }
      const shell = await page.locator("header, footer").allInnerTexts();
      expect(shell.join(" "), path).not.toMatch(/@|\+?\d[\d\s().-]{6,}\d/);
    }
    const allowed = [
      "https://github.com/joshdengxd",
      "https://www.linkedin.com/in/josh-deng-edm",
      "https://github.com/joshdengxd/josh-shared-skills",
      "https://github.com/joshdengxd/job-search-skills",
      "https://github.com/joshdengxd/joshdengxd.github.io",
      ...ABOUT_LINKS.map((l) => l.href), // Matt Pocock and Lauren Tan, in About (ticket #35)
      PROJECT_BOARD_URL,
      MERGED_PRS_URL,
    ];
    for (const href of outside) {
      expect(allowed.includes(href), href).toBe(true);
    }
    for (const href of allowed) {
      expect([...outside], href).toContain(href);
    }
  });
});
