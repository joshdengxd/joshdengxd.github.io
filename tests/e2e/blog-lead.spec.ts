import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const LEAD = "My learning notes on building software with agents, posted weekly. Newest first.";

test.describe("blog opening line, JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the weekly line, the description, and no feed link", async ({ page }) => {
    await page.goto("/blog/");
    await expect(page.getByText(LEAD)).toBeVisible();
    await expect(page.getByRole("link", { name: /rss|feed/i })).toHaveCount(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "My weekly learning notes on building software with agents.",
    );
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
