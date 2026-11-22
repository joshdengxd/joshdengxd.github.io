import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const LEAD =
  "I think of this blog as a journal. It’s where I write about what’s been on my mind and what I’m learning along the way. If something here helps you, I’m glad I shared it.";
const DESCRIPTION = "A personal journal of what’s been on my mind and what I’m learning along the way.";

test.describe("blog opening line, JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the journal introduction, matching metadata, and no feed link", async ({ page }) => {
    await page.goto("/blog/");
    const lead = page.locator("h1 + p");
    await expect(lead).toBeVisible();
    await expect(lead).toHaveText(LEAD);
    await expect(page.getByRole("link", { name: /rss|feed/i })).toHaveCount(0);
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
    ]) {
      await expect(page.locator(selector)).toHaveAttribute("content", DESCRIPTION);
    }
  });
});

test("there is no feed: /rss.xml is a 404", async ({ request }) => {
  expect((await request.get("/rss.xml")).status()).toBe(404);
});

test("no built page links a feed or has a feed tag, and out/ has no rss.xml", () => {
  expect(existsSync("out/rss.xml")).toBe(false);
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) {
        return walk(p);
      }
      return p.endsWith(".html") ? [p] : [];
    });
  for (const file of walk("out")) {
    const html = readFileSync(file, "utf8");
    expect(html, file).not.toContain("application/rss+xml");
    expect(html, file).not.toContain("/rss.xml");
  }
});
