import { expect, test, type Page } from "@playwright/test";

// The phone Menu sheet at 390 px, in Chromium and WebKit (see playwright.config.ts). Next's navigation payload
// requests are delayed, like a slow phone connection, so a navigation arrives long after the tap.
const DELAY = 2500;

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const menuButton = (page: Page) => page.locator("button[aria-controls]");

const sheetLink = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Main" }).filter({ visible: true }).getByRole("link", { name, exact: true });
const slowNavigation = (page: Page) =>
  page.route(/\.txt(\?.*)?$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    await route.continue().catch(() => {
      // the page may already be gone when the delayed request resumes
    });
  });
const expectOpen = (page: Page, open: boolean) =>
  expect(menuButton(page)).toHaveAttribute("aria-expanded", String(open));
/** The state right now, without waiting: used right after a tap, while the slow navigation is still on its way. */
const isOpen = (page: Page) =>
  page.evaluate(() => document.querySelector("button[aria-controls]")!.getAttribute("aria-expanded") === "true");
/** Records every open/close of the sheet, to prove each tap toggled it exactly once. */
const recordToggles = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { toggles: boolean[] };
    w.toggles = [];
    const d = document.querySelector("button[aria-controls]")!;
    new MutationObserver(() => w.toggles.push(d.getAttribute("aria-expanded") === "true")).observe(d, {
      attributes: true,
      attributeFilter: ["aria-expanded"],
    });
  });
const toggles = (page: Page) => page.evaluate(() => (window as unknown as { toggles: boolean[] }).toggles);

async function start(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await slowNavigation(page);
}

test.describe("Menu sheet with a slow navigation", () => {
  test("tapping the link of the current page closes the sheet at once", async ({ page }) => {
    await start(page, "/about/");
    await menuButton(page).tap();
    await expectOpen(page, true);
    await sheetLink(page, "About").tap();
    expect(await isOpen(page), "closed at once").toBe(false);
    await expect(page).toHaveURL("/about/");
  });

  test("tapping a link to another page closes the sheet at once, then that page arrives", async ({ page }) => {
    await start(page, "/");
    await menuButton(page).tap();
    await sheetLink(page, "Projects").tap();
    expect(await isOpen(page), "closed at once").toBe(false);
    expect(new URL(page.url()).pathname, "the page has not arrived yet").toBe("/");
    await expect(page).toHaveURL("/projects/", { timeout: DELAY * 3 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectOpen(page, false);
  });

  test("Menu, About, Menu, Projects ends on /projects/ with the sheet closed; each tap toggled it once", async ({
    page,
  }) => {
    await start(page, "/");
    await recordToggles(page);
    await menuButton(page).tap();
    await expectOpen(page, true);
    await sheetLink(page, "About").tap();
    expect(await isOpen(page), "closed at once").toBe(false);
    await menuButton(page).tap(); // About has not arrived yet
    expect(await isOpen(page), "reopened").toBe(true);
    expect(new URL(page.url()).pathname, "About has not arrived yet").toBe("/");
    await sheetLink(page, "Projects").tap();
    expect(await isOpen(page), "closed at once").toBe(false);
    await expect(page).toHaveURL("/projects/", { timeout: DELAY * 4 });
    // Let every late payload arrive: nothing may open or close the sheet by itself.
    await page.waitForTimeout(DELAY * 2);
    await expect(page).toHaveURL("/projects/");
    await expectOpen(page, false);
    expect(await toggles(page)).toEqual([true, false, true, false]);
  });
});

test.describe("Menu sheet, other ways to close it", () => {
  test("Escape closes it and puts focus on the Menu button", async ({ page }) => {
    await start(page, "/about/");
    await menuButton(page).tap();
    await expectOpen(page, true);
    await sheetLink(page, "Blog").focus();
    await page.keyboard.press("Escape");
    await expectOpen(page, false);
    await expect(menuButton(page)).toBeFocused();
    await expect(page).toHaveURL("/about/");
  });

  test("a tap outside the sheet closes it; a tap inside it (the theme toggle) does not", async ({ page }) => {
    await start(page, "/about/");
    await menuButton(page).tap();
    await page
      .getByRole("button", { name: /Switch to (light|dark) theme/ })
      .filter({ visible: true })
      .tap();
    await expectOpen(page, true);
    await page.touchscreen.tap(195, 800); // empty page area below the sheet
    await expectOpen(page, false);
    // And the Menu opens again afterwards.
    await menuButton(page).tap();
    await expectOpen(page, true);
  });

  test("browser back and forward leave the sheet closed", async ({ page }) => {
    await start(page, "/");
    await menuButton(page).tap();
    await sheetLink(page, "About").tap();
    await expect(page).toHaveURL("/about/", { timeout: DELAY * 3 });
    await expectOpen(page, false);
    await menuButton(page).tap();
    await expectOpen(page, true);
    await page.goBack();
    await expect(page).toHaveURL("/");
    await expectOpen(page, false);
    await menuButton(page).tap();
    await expectOpen(page, true);
    await page.goForward();
    await expect(page).toHaveURL("/about/");
    await expectOpen(page, false);
  });
});

for (const width of [320, 390]) {
  for (const path of ["/", "/about/", "/how-this-site-is-built/"]) {
    test(`repeated disclosure visibly dismisses at ${width}px on ${path}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path, { waitUntil: "networkidle" });
      const button = menuButton(page);
      const panel = page.locator(`[id="${await button.getAttribute("aria-controls")}"]`);
      const capture = (name: string) => page.screenshot({ path: info.outputPath(`${name}.png`) });
      await expectOpen(page, false);
      await capture("before");
      for (let cycle = 0; cycle < 2; cycle++) {
        await button.tap({ position: { x: 16, y: 19 } });
        await page.waitForTimeout(460);
        await expectOpen(page, true);
        await expect(panel.getByRole("navigation")).toBeVisible();
        if (cycle === 0) {
          await capture("open");
        }
        await button.tap({ position: { x: 20, y: 23 } });
        await page.waitForTimeout(530);
        await expectOpen(page, false);
        await expect(panel).toBeHidden();
        await expect(panel.locator("*")).toHaveCount(0);
        if (cycle === 0) {
          const closed = await capture("closed");
          await page.waitForTimeout(810);
          expect(await capture("settled")).toEqual(closed);
        }
        await expect(page).toHaveURL(path);
      }
      // A tap on the underlying focusable main must reach it after dismissal.
      const underlying = page.getByRole("main");
      await underlying.tap({ position: { x: 18, y: 16 } });
      await expect(underlying).toBeFocused();
      await page.evaluate(() => window.scrollBy(0, 180));
      await page.waitForTimeout(470);
      await page.evaluate(() => window.scrollBy(0, -180));
      await page.waitForTimeout(620);
      await button.tap();
      await expectOpen(page, true);
      await page.setViewportSize({ width: 1100, height: 844 });
      await expect(button).toBeHidden();
      await expectOpen(page, false);
      await expect(panel.locator("*")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      await page.setViewportSize({ width, height: 844 });
      await expectOpen(page, false);
      await button.tap();
      await expectOpen(page, true);
    });
  }
}

test("Space, short-screen scrolling and theme survive content removal", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 230 });
  await page.goto("/about/");
  await menuButton(page).focus();
  await page.keyboard.press("Space");
  await expectOpen(page, true);
  const theme = page.getByRole("button", { name: "Switch to light theme" });
  await theme.scrollIntoViewIfNeeded();
  await expect(theme).toBeInViewport();
  await theme.tap();
  await page.keyboard.press("Escape");
  await expect(menuButton(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await menuButton(page).tap();
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});

test("a late navigation cannot close a reopened panel", async ({ page }) => {
  await start(page, "/");
  await menuButton(page).tap();
  await sheetLink(page, "About").tap();
  expect(await isOpen(page)).toBe(false);
  await menuButton(page).tap();
  await expect(page).toHaveURL("/about/", { timeout: DELAY * 3 });
  await expectOpen(page, true);
});

test("navigation remains usable while enhancement scripts are delayed", async ({ page }) => {
  let resume!: () => void;
  const scripts = new Promise<void>((resolve) => {
    resume = resolve;
  });
  await page.route("**/*.js", async (route) => {
    await scripts;
    await route.continue();
  });
  await page.goto("/about/", { waitUntil: "commit" });
  try {
    await expect(menuButton(page)).toHaveCount(0);
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole("link", { name: "Projects", exact: true })).toHaveAttribute("href", "/projects/");
    const position = await nav.evaluate((el) => getComputedStyle(el.parentElement!).position);
    expect(position).toBe("static");
  } finally {
    resume();
  }
  await expectOpen(page, false);
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await menuButton(page).tap();
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
});

test.describe("Menu sheet without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("expanded normal-flow navigation works with full page loads", async ({ page }) => {
    await page.goto("/");
    await expect(menuButton(page)).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
    await sheetLink(page, "Projects").tap();
    await expect(page).toHaveURL("/projects/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await sheetLink(page, "About").tap();
    await expect(page).toHaveURL("/about/");
  });
});
