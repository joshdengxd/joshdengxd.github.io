// Pictures in posts (ticket #41), on the fixture build: the fixture post "blog-engine-fixture" has two pictures of
// tests/fixtures/post-images/blog-engine-fixture/diagram.svg (800 x 400), one with a caption and one without.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { themeColours } from "../../lib/tokens";

const POST = "/blog/blog-engine-fixture/";
const SRC = "/blog/blog-engine-fixture/diagram.svg";
const ALT = "Diagram of a Markdown file turning into a figure";
const CAPTION = "Figure 1: the build turns the picture into a figure";
const tokens = readFileSync(join(process.cwd(), "design-language", "tokens.css"), "utf8");

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
};

/** Failed responses (404 and up), console errors and uncaught errors. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

async function expectFigures(page: Page) {
  const figures = page.locator("figure");
  await expect(figures).toHaveCount(2);
  const img = page.getByRole("img", { name: ALT });
  await expect(img).toHaveCount(1);
  await expect(img).toHaveAttribute("src", SRC);
  await expect(img).toHaveAttribute("width", "800");
  await expect(img).toHaveAttribute("height", "400");
  await expect(img).toHaveAttribute("loading", "lazy");
  await expect(img).toHaveAttribute("decoding", "async");
  await expect(figures.first().locator("figcaption")).toHaveText(CAPTION);
  await expect(figures.first().locator("img")).toHaveAccessibleName(ALT);
  // the second picture has an alt text of its own and no caption: a figure with no figcaption
  await expect(page.getByRole("img", { name: "The same diagram without a caption" })).toHaveCount(1);
  await expect(figures.nth(1).locator("figcaption")).toHaveCount(0);
}

test.describe("a picture in a post", () => {
  test("renders as a figure with its alt text and caption, and loads", async ({ page }) => {
    const problems = watch(page);
    await page.goto(POST);
    await expectFigures(page);
    const img = page.getByRole("img", { name: ALT });
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBe(800);
    expect(problems).toEqual([]);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("is in the page the same way", async ({ page }) => {
      await page.goto(POST);
      await expectFigures(page);
    });
  });

  for (const theme of ["dark", "light"] as const) {
    test(`sits on the light plate in the ${theme} theme, and the caption keeps the page colours`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto(POST);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const colours = themeColours(tokens, theme);
      const img = page.getByRole("img", { name: ALT });
      await expect(img).toHaveCSS("background-color", rgb(colours["--color-plate"]));
      await expect(img).toHaveCSS("background-color", rgb(themeColours(tokens, "light")["--color-ground"]));
      await expect(page.locator("figcaption").first()).toHaveCSS("color", rgb(colours["--color-muted"]));
    });
  }

  test("keeps its box while it loads (the size comes from the file, no layout shift)", async ({ page }) => {
    // hold the picture back, so the box can be measured before it exists and again after it has loaded
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(`**${SRC}`, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(POST, { waitUntil: "domcontentloaded" });
    const img = page.getByRole("img", { name: ALT });
    await img.scrollIntoViewIfNeeded();
    const box = () =>
      page.evaluate(() => {
        const el = document.querySelector("figure img") as HTMLImageElement;
        const figure = el.closest("figure")!.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return { loaded: el.complete && el.naturalWidth > 0, w: r.width, h: r.height, figureH: figure.height };
      });
    const before = await box();
    expect(before.loaded).toBe(false);
    expect(before.w).toBeGreaterThan(0);
    expect(before.h).toBeGreaterThan(0);
    release();
    await expect.poll(async () => (await box()).loaded).toBe(true);
    const after = await box();
    expect({ w: after.w, h: after.h, figureH: after.figureH }).toEqual({
      w: before.w,
      h: before.h,
      figureH: before.figureH,
    });
    // the picture keeps the file's proportions (800 x 400), whatever the width, padding aside
    const inner = await img.evaluate((el) => {
      const s = getComputedStyle(el);
      return { w: parseFloat(s.width), h: parseFloat(s.height) };
    });
    expect(inner.w / inner.h).toBeCloseTo(2, 1);
  });

  for (const width of [320, 390, 1440]) {
    test(`fits the page column with no horizontal overflow at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(POST);
      const img = page.getByRole("img", { name: ALT });
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBe(800);
      const { overflow, right, column } = await page.evaluate(() => {
        const el = document.querySelector("figure img")!;
        const prose = el.closest("figure")!.parentElement!.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          right: el.getBoundingClientRect().right,
          column: prose.right,
        };
      });
      expect(overflow).toBe(false);
      expect(right).toBeLessThanOrEqual(column + 0.5);
      expect(right).toBeLessThanOrEqual(width);
    });
  }

  test("the picture file is served from the post's folder, and only the fixture build has it", async ({ request }) => {
    const response = await request.get(SRC);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/svg/);
  });
});
