// Pictures in posts (ticket #41). Runs on the fixture build: the post "blog-engine-fixture" ends with a picture,
// tests/fixtures/post-images/blog-engine-fixture/diagram.svg (600 x 300, light), with alt text and a caption.
import { expect, test, type Page } from "@playwright/test";

const POST = "/blog/blog-engine-fixture/";
const ALT = "A diagram of three boxes, One, Two and Three, joined by arrows";
const CAPTION = "Figure 1: three boxes in a row, drawn on a light background.";
const PLATE = "rgb(243, 240, 230)"; // --color-plate, the same in both themes

const figure = (page: Page) => page.locator("figure");
const picture = (page: Page) => page.getByRole("img", { name: ALT });

/** Failed responses (404 and up), console errors and uncaught errors. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

test("the picture renders as a figure with its alt text and caption, loaded from the post's folder", async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto(POST);
  await picture(page).scrollIntoViewIfNeeded();
  await expect(figure(page)).toHaveCount(1);
  await expect(figure(page).locator("figcaption")).toHaveText(CAPTION);
  await expect(picture(page)).toHaveAttribute("src", "/blog/blog-engine-fixture/diagram.svg");
  await expect(picture(page)).toHaveAttribute("width", "600");
  await expect(picture(page)).toHaveAttribute("height", "300");
  await expect
    .poll(() => picture(page).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
    .toBe(600);
  expect(problems).toEqual([]);
});

test("the same picture, caption and plate without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: "http://localhost:4173" });
  const page = await context.newPage();
  await page.goto(POST);
  await picture(page).scrollIntoViewIfNeeded();
  await expect(figure(page).locator("figcaption")).toHaveText(CAPTION);
  await expect(picture(page)).toBeVisible();
  await expect(figure(page).locator("div")).toHaveCSS("background-color", PLATE);
  await context.close();
});

for (const theme of ["Dark", "Light"] as const) {
  test(`${theme} theme: the picture sits on the light plate, and the caption is readable`, async ({ page }) => {
    await page.goto(POST);
    if (theme === "Light") {
      await page.getByRole("button", { name: "Light theme" }).click();
    }
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme.toLowerCase());
    await picture(page).scrollIntoViewIfNeeded();
    await expect(figure(page).locator("div")).toHaveCSS("background-color", PLATE);
    await expect(figure(page).locator("figcaption")).toBeVisible();
  });
}

test("the picture's box does not change when the file finishes loading", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/blog/blog-engine-fixture/diagram.svg", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto(POST, { waitUntil: "domcontentloaded" });
    await picture(page).scrollIntoViewIfNeeded();
    const heading = page.getByRole("heading", { level: 1 });
    const before = {
      picture: await picture(page).boundingBox(),
      figure: await figure(page).boundingBox(),
      heading: await heading.boundingBox(),
    };
    expect(await picture(page).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(false);
    expect(before.picture?.height).toBeGreaterThan(0);
    release();
    await expect
      .poll(() => picture(page).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
      .toBe(600);
    expect({
      picture: await picture(page).boundingBox(),
      figure: await figure(page).boundingBox(),
      heading: await heading.boundingBox(),
    }).toEqual(before);
  } finally {
    release();
  }
});

for (const width of [320, 390]) {
  test(`no horizontal overflow at ${width}px, and the picture shrinks with its proportions`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(POST);
    await picture(page).scrollIntoViewIfNeeded();
    await expect
      .poll(() => picture(page).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
      .toBe(600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const box = await picture(page).boundingBox();
    expect(box!.width).toBeLessThanOrEqual(width);
    expect(box!.width / box!.height).toBeCloseTo(2, 1);
  });
}
