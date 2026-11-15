import { expect, test, type Page } from "@playwright/test";

// The phone Menu sheet at 390 px, in Chromium and WebKit (see playwright.config.ts). Next's navigation payload
// requests are delayed, like a slow phone connection, so a navigation arrives long after the tap.
const DELAY = 2500;

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const menuButton = (page: Page) => page.locator("summary", { hasText: "Menu" });
const sheet = (page: Page) => page.locator("details");
const sheetLink = (page: Page, name: string) => page.locator("details nav a", { hasText: name });
const slowNavigation = (page: Page) =>
  page.route(/\.txt(\?.*)?$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    await route.continue().catch(() => {});
  });
const expectOpen = (page: Page, open: boolean) => expect(sheet(page)).toHaveJSProperty("open", open);
/** The state right now, without waiting: used right after a tap, while the slow navigation is still on its way. */
const isOpen = (page: Page) => page.evaluate(() => document.querySelector("details")!.open);
/** Records every open/close of the sheet, to prove each tap toggled it exactly once. */
const recordToggles = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { toggles: boolean[] };
    w.toggles = [];
    const d = document.querySelector("details")!;
    d.addEventListener("toggle", () => w.toggles.push(d.open));
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

  test("Menu, About, Menu, Projects ends on /projects/ with the sheet closed; each tap toggled it once", async ({ page }) => {
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
    await page.getByRole("button", { name: "Light theme" }).filter({ visible: true }).tap();
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

test.describe("Menu sheet without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the Menu opens and its links are full page loads", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).tap();
    await expectOpen(page, true);
    await sheetLink(page, "Projects").tap();
    await expect(page).toHaveURL("/projects/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectOpen(page, false);
    await menuButton(page).tap();
    await expectOpen(page, true);
    await sheetLink(page, "About").tap();
    await expect(page).toHaveURL("/about/");
  });
});
