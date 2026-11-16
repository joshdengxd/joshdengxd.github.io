import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SLUG = "how-do-i-trust-my-agents-more";
const URL = `/blog/${SLUG}/`;
const PICTURE_SHA256 = "b4e63ddbff62eda315459426270f2784663685e9b8db051f4fb868b5bd3f1fba";

test.describe("the first post, JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("shows its title, date, tags, text and the credited picture", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { level: 1, name: "How do I trust my agents more?" })).toBeVisible();
    await expect(page.locator("time")).toHaveAttribute("datetime", "2026-11-15T18:00:00Z");
    for (const tag of ["agents", "verification", "learning"]) {
      await expect(page.getByRole("link", { name: tag, exact: true }).first()).toHaveAttribute(
        "href",
        `/blog/tags/${tag}/`,
      );
    }
    await expect(page.getByRole("heading", { level: 2, name: "Verification was my AI moment" })).toBeVisible();
    await expect(page.getByText('The "poteto pyramid", a slide from Lauren Tan\'s talk.')).toBeVisible();
    const img = page.getByRole("img", { name: /upside-down pyramid/ });
    await expect(img).toHaveAttribute("alt", /^A slide titled "how do i trust my agents more\?"/);
    await expect(img).toHaveAttribute("src", `/blog/${SLUG}/trust-pyramid.png`);
  });
});

test("the picture is the approved slide and loads", async ({ page }) => {
  const bytes = readFileSync(join(process.cwd(), "out", "blog", SLUG, "trust-pyramid.png"));
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(PICTURE_SHA256);
  await page.goto(URL);
  const img = page.getByRole("img", { name: /upside-down pyramid/ });
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBe(1371);
});

test("the picture fits the column without overflow or layout shift from 320 to 1440 px", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL);
    const img = page.getByRole("img", { name: /upside-down pyramid/ });
    const before = await img.evaluate((el) => el.getBoundingClientRect().height);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).complete)).toBe(true);
    const after = await img.evaluate((el) => el.getBoundingClientRect().height);
    expect(after, `height at ${width}`).toBeCloseTo(before, 0);
    const box = await img.boundingBox();
    expect(box!.width, `width at ${width}`).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      `overflow at ${width}`,
    ).toBe(0);
  }
});

test("the two external links are absolute https and keyboard-focusable with a focus ring", async ({ page }) => {
  await page.goto(URL);
  const links = {
    "All Code Is Slop (Except Mine)": "https://www.youtube.com/watch?v=O_zcc6Xl12g",
    "Lauren Tan": "https://x.com/poteto",
  };
  for (const [name, href] of Object.entries(links)) {
    const link = page.getByRole("link", { name: `${name} (opens in a new tab)`, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await link.focus();
    await expect(link).toBeFocused();
    const outline = await link.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style, name).not.toBe("none");
    expect(outline.width, name).toBeGreaterThan(0);
  }
});

test("the post is in the list, the three tag pages and the sitemap", async ({ page, request }) => {
  await page.goto("/blog/");
  await expect(page.getByRole("link", { name: "How do I trust my agents more?" }).first()).toHaveAttribute("href", URL);
  for (const tag of ["agents", "verification", "learning"]) {
    await page.goto(`/blog/tags/${tag}/`);
    await expect(page.getByRole("link", { name: "How do I trust my agents more?" })).toBeVisible();
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(URL);
});

test("on a tablet the picture plate runs to the page margin on both sides (the page stays centred)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(URL);
  const plate = page.locator("figure > div").first();
  await plate.scrollIntoViewIfNeeded();
  const box = await plate.boundingBox();
  expect(box).not.toBeNull();
  const left = box!.x;
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const right = viewportWidth - (box!.x + box!.width);
  expect(Math.abs(left - right)).toBeLessThanOrEqual(2);
  expect(left).toBeLessThan(40);
});
