// These run against the fixture build (npm run e2e builds with BLOG_FIXTURES=1): two test posts,
// "blog-engine-fixture" (2026-11-15T23:30:00Z, tags engine-check + markdown, with a code block and a table) and
// "blog-engine-fixture-early" (2026-11-16T00:30:00Z, tag engine-check).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { codeColours } from "../../lib/tokens";

const LATE = "time[datetime='2026-11-15T23:30:00Z']"; // 23:30 UTC
const EARLY = "time[datetime='2026-11-16T00:30:00Z']"; // 00:30 UTC the next day
const POST = "/blog/blog-engine-fixture/";
const TITLE = "Fixture post for the blog engine";
const codeTokens = readFileSync(join(process.cwd(), "design-language", "tokens.css"), "utf8");

/** "#rrggbb" as the browser reports a computed colour. */
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

test.describe("the list", () => {
  test("shows the posts newest first, each with date, summary and tag links, and links the feed", async ({ page }) => {
    const problems = watch(page);
    await page.goto("/blog/");
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
    await expect(page.getByText("No posts yet.")).toHaveCount(0);
    const titles = page.getByRole("heading", { level: 2 });
    await expect(titles).toHaveText(["Second fixture post, just after midnight UTC", TITLE]);
    await expect(page.getByText("A test post 30 minutes after midnight UTC")).toBeVisible();
    await expect(page.locator(LATE)).toBeVisible();
    await expect(page.getByRole("link", { name: "markdown" })).toHaveAttribute("href", "/blog/tags/markdown/");
    await expect(page.getByRole("link", { name: "RSS feed" })).toHaveAttribute("href", "/rss.xml");
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
      "href",
      "https://joshdengxd.github.io/rss.xml",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test("a post title leads to the post", async ({ page }) => {
    await page.goto("/blog/");
    await page.getByRole("link", { name: TITLE }).click();
    await expect(page).toHaveURL(POST);
    await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
  });
});

test.describe("a post", () => {
  test("shows title, date, tags, the Markdown (heading, code, table, link) and has its own title and description", async ({
    page,
  }) => {
    const problems = watch(page);
    await page.goto(POST);
    await expect(page).toHaveTitle(`${TITLE} · Xindong Deng (Josh)`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /code block and a table/);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://joshdengxd.github.io/blog/blog-engine-fixture/",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 2, name: "A code block" })).toBeVisible();
    await expect(page.locator("pre code").first()).toContainText("export function add");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Part" })).toBeVisible();
    await expect(page.getByRole("link", { name: "link to the blog" })).toHaveAttribute("href", /^\/blog\/?$/);
    await expect(page.getByRole("link", { name: "engine-check" })).toHaveAttribute("href", "/blog/tags/engine-check/");
    expect(problems).toEqual([]);
  });

  for (const [name, size] of [
    ["desktop", { width: 1440, height: 900 }],
    ["phone", { width: 390, height: 800 }],
  ] as const) {
    test(`a long code line scrolls inside its block, the page does not overflow (${name})`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(POST);
      const pre = page.locator("pre").first();
      await expect(pre).toBeVisible();
      const [scrolls, overflow] = await Promise.all([
        pre.evaluate((el) => el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === "auto"),
        page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      ]);
      expect(scrolls).toBe(true);
      expect(overflow).toBe(false);
      await expect(page.locator("pre code").first()).toHaveCSS("font-family", /^codeFace,/); // the JetBrains Mono face from app/fonts.ts;
    });
  }

  test.describe("code highlighting", () => {
    test("known languages are highlighted in the built HTML with --shiki-* variables and no colour value", async ({
      request,
    }) => {
      const html = await (await request.get(POST)).text();
      expect(html).toContain("--shiki-token-keyword");
      expect(html).toContain("background-color:var(--shiki-background)");
      for (const [, style] of html.matchAll(/style="([^"]*)"/g)) {
        expect(style).not.toMatch(/#[0-9a-f]{3}|rgb\(|hsl\(/i);
      }
      expect(html).not.toMatch(/language-/);
    });

    test("no highlighting script or wasm is loaded in the browser", async ({ page }) => {
      const urls: string[] = [];
      page.on("request", (r) => urls.push(r.url()));
      await page.goto(POST);
      await page.waitForLoadState("networkidle");
      expect(urls.filter((u) => /shiki|oniguruma|onig|\.wasm|textmate/i.test(u))).toEqual([]);
      // the highlighting is already in the served markup
      expect(await page.locator("pre.shiki span[style*='--shiki-token-']").count()).toBeGreaterThan(0);
    });

    test("an unknown language and no language render as plain code", async ({ page }) => {
      await page.goto(POST);
      const blocks = page.locator("pre.shiki");
      await expect(blocks).toHaveCount(7); // ts, json, bash, csharp, brainfuck, none, diff
      const plain = await blocks.evaluateAll((els) =>
        els.slice(4, 6).map((e) => e.querySelectorAll("[style*='--shiki-token-']").length),
      );
      expect(plain).toEqual([0, 0]);
      await expect(blocks.nth(4)).toContainText("++++++++[>++++[>++>+++<<-]<-]>>.");
      await expect(blocks.nth(5)).toContainText("a block with no language");
      const classes = await page.locator("pre code").evaluateAll((els) => els.map((e) => e.className));
      expect(classes.every((c) => c === "")).toBe(true);
    });

    test("a diff block shows added and removed lines in different colours, from the token file, in both themes", async ({
      page,
    }) => {
      await page.goto(POST);
      for (const theme of ["dark", "light"] as const) {
        if ((await page.evaluate(() => document.documentElement.getAttribute("data-theme"))) !== theme) {
          await page.getByRole("button", { name: "Light theme" }).click();
        }
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const c = codeColours(codeTokens, theme);
        const lines = page.locator("pre.shiki").nth(6).locator(".line");
        await expect(lines).toHaveCount(3);
        const colours = await lines.evaluateAll((els) =>
          els.map((line) => getComputedStyle(line.querySelector("span[style]")!).color),
        );
        const [removed, added] = colours;
        expect(added, `${theme}: added line`).toBe(rgb(c["--shiki-token-inserted"]));
        expect(removed, `${theme}: removed line`).toBe(rgb(c["--shiki-token-deleted"]));
        expect(added).not.toBe(removed);
      }
    });

    test("the code colours follow the theme and equal the token file, in both themes", async ({ page }) => {
      await page.goto(POST);
      for (const theme of ["dark", "light"] as const) {
        if ((await page.evaluate(() => document.documentElement.getAttribute("data-theme"))) !== theme) {
          await page.getByRole("button", { name: "Light theme" }).click();
        }
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const c = codeColours(codeTokens, theme);
        const seen = await page.evaluate(() => {
          const pre = document.querySelector("pre.shiki")!;
          const color = (el: Element) => getComputedStyle(el).color;
          const kw = [...pre.querySelectorAll("span[style]")].find((s) => s.textContent === "export")!;
          const comment = [...pre.querySelectorAll("span[style]")].find((s) =>
            s.textContent?.startsWith("// a long line"),
          )!;
          return {
            background: getComputedStyle(pre).backgroundColor,
            foreground: color(pre),
            keyword: color(kw),
            comment: color(comment),
          };
        });
        expect(seen).toEqual({
          background: rgb(c["--shiki-background"]),
          foreground: rgb(c["--shiki-foreground"]),
          keyword: rgb(c["--shiki-token-keyword"]),
          comment: rgb(c["--shiki-token-comment"]),
        });
      }
    });
  });

  test("a slug that is not a post is the 404 page, and the hidden _none page does not exist in this build", async ({
    page,
  }) => {
    for (const path of ["/blog/no-such-post/", "/blog/_none/", "/blog/tags/no-such-tag/"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
      await expect(page.getByText("This page does not exist."), path).toBeVisible();
    }
  });
});

test.describe("tag pages", () => {
  test("a tag page lists the posts with that tag (works without JavaScript)", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/blog/tags/markdown/");
    await expect(page).toHaveTitle("Posts tagged markdown · Xindong Deng (Josh)");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tagged markdown");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([TITLE]);
    await page.goto("/blog/tags/engine-check/");
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
    await page.getByRole("link", { name: "All posts" }).click();
    await expect(page).toHaveURL("/blog/");
    await context.close();
  });

  test("following a tag link from a post lands on a page that lists the post", async ({ page }) => {
    await page.goto(POST);
    await page.getByRole("link", { name: "markdown" }).click();
    await expect(page).toHaveURL("/blog/tags/markdown/");
    await expect(page.getByRole("link", { name: TITLE })).toBeVisible();
  });
});

test.describe("feed and sitemap", () => {
  test("rss.xml is RSS 2.0 with the fixture posts, newest first", async ({ request }) => {
    const res = await request.get("/rss.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const xml = await res.text();
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('rel="self"');
    expect(xml).toContain("<link>https://joshdengxd.github.io/blog/blog-engine-fixture/</link>");
    expect(xml).toContain("<pubDate>Sun, 15 Nov 2026 23:30:00 GMT</pubDate>");
    expect(xml.indexOf("blog-engine-fixture-early")).toBeLessThan(xml.indexOf("blog-engine-fixture/"));
    expect(xml).not.toContain("_none");
  });

  test("the sitemap has /blog/, the posts and the tag pages, and no _none page", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const path of [
      "/blog/",
      "/blog/blog-engine-fixture/",
      "/blog/blog-engine-fixture-early/",
      "/blog/tags/engine-check/",
      "/blog/tags/markdown/",
    ]) {
      expect(xml, path).toContain(`<loc>https://joshdengxd.github.io${path}</loc>`);
    }
    expect(xml).toContain("<lastmod>2026-11-15T23:30:00Z</lastmod>");
    expect(xml).not.toContain("_none");
  });
});

// The same two posts, 23:30 UTC and 00:30 UTC the next day, as readers in different time zones see them.
const zones = [
  { timezoneId: "Pacific/Honolulu", locale: "en-GB", late: "15 November 2026", early: "15 November 2026" }, // UTC-10
  { timezoneId: "UTC", locale: "en-GB", late: "15 November 2026", early: "16 November 2026" },
  { timezoneId: "America/Denver", locale: "en-US", late: "November 15, 2026", early: "November 15, 2026" }, // UTC-7
  { timezoneId: "Pacific/Kiritimati", locale: "en-GB", late: "16 November 2026", early: "16 November 2026" }, // UTC+14
  { timezoneId: "Pacific/Kiritimati", locale: "de-DE", late: "16. November 2026", early: "16. November 2026" },
];
for (const zone of zones) {
  test.describe(`dates for a reader in ${zone.timezoneId}, locale ${zone.locale}`, () => {
    test.use({ timezoneId: zone.timezoneId, locale: zone.locale });

    test("the list and the post show the day in the reader's zone", async ({ page }) => {
      const problems = watch(page);
      await page.goto("/blog/");
      await expect(page.locator(LATE)).toHaveText(zone.late);
      await expect(page.locator(EARLY)).toHaveText(zone.early);
      await page.goto(POST);
      await expect(page.locator(LATE)).toHaveText(zone.late);
      expect(problems).toEqual([]); // no hydration warning either
    });
  });
}

test.describe("dates with JavaScript off", () => {
  test.use({ javaScriptEnabled: false, timezoneId: "Pacific/Kiritimati", locale: "de-DE" });

  test("show the UTC date, whatever the reader's zone", async ({ page }) => {
    await page.goto("/blog/");
    await expect(page.locator(LATE)).toHaveText("15 November 2026 (UTC)");
    await expect(page.locator(EARLY)).toHaveText("16 November 2026 (UTC)");
    await page.goto(POST);
    await expect(page.locator(LATE)).toHaveText("15 November 2026 (UTC)");
  });
});
