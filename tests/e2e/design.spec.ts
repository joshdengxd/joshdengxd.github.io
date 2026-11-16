import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { codeColours, sharedTokens, themeColours, type Theme } from "../../lib/tokens";

const css = readFileSync(join(process.cwd(), "design-language", "tokens.css"), "utf8");
const DARK_GROUND = "rgb(30, 44, 35)";
const LIGHT_GROUND = "rgb(243, 240, 230)";

const theme = (page: Page) => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
const bodyBackground = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
// For each token, the computed value of a property set to var(--token) must equal the same property set to
// the literal value from the token file. The browser resolves both, so minified spellings do not matter.
const PROPERTY_FOR: [string, string][] = [
  ["--color-", "color"],
  ["--font-", "font-family"],
  ["--weight-", "font-weight"],
  ["--stretch-", "font-stretch"],
  ["--leading-", "line-height"],
  ["--tracking-", "letter-spacing"],
  ["--radius-", "border-top-left-radius"],
  ["--duration-", "transition-duration"],
  ["--delay-", "transition-duration"],
  ["--ease-", "transition-timing-function"],
  ["--", "width"], // steps, spacing, margins, widths, measure, distance: lengths
];

async function mismatches(page: Page, tokens: Record<string, string>) {
  const checks = Object.entries(tokens).map(([name, literal]) => ({
    name,
    literal,
    prop: PROPERTY_FOR.find(([prefix]) => name.startsWith(prefix))![1],
  }));
  return page.evaluate((list) => {
    const box = document.createElement("div");
    document.body.append(box);
    const out: string[] = [];
    for (const { name, literal, prop } of list) {
      const viaToken = document.createElement("div");
      const viaLiteral = document.createElement("div");
      box.append(viaToken, viaLiteral);
      viaToken.style.setProperty(prop, `var(${name})`);
      viaLiteral.style.setProperty(prop, literal);
      const got = getComputedStyle(viaToken).getPropertyValue(prop);
      const want = getComputedStyle(viaLiteral).getPropertyValue(prop);
      if (!want || got !== want) {
        out.push(`${name}: ${prop} is "${got}", token file gives "${want}"`);
      }
    }
    box.remove();
    return out;
  }, checks);
}

test("dark is the default on every page", async ({ page }) => {
  for (const path of ["/", "/design/"]) {
    await page.goto(path);
    expect(await theme(page)).toBe("dark");
    expect(await bodyBackground(page)).toBe(DARK_GROUND);
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the page is dark and there is no toggle", async ({ page }) => {
    await page.goto("/design/");
    expect(await bodyBackground(page)).toBe(DARK_GROUND);
    await expect(page.getByRole("button", { name: "Light theme" })).toHaveCount(0);
  });
});

test("the toggle on /design/ switches to light, is remembered, and switches back", async ({ page }) => {
  await page.goto("/design/");
  const toggle = page.getByRole("button", { name: "Light theme" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await theme(page)).toBe("light");
  expect(await bodyBackground(page)).toBe(LIGHT_GROUND);

  // Remembered, and applied before first paint: the attribute is already light when the DOM is parsed.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(await theme(page)).toBe("light");
  expect(await bodyBackground(page)).toBe(LIGHT_GROUND);

  await page.goto("/design/");
  await page.getByRole("button", { name: "Light theme" }).click();
  expect(await theme(page)).toBe("dark");
  await page.reload();
  expect(await theme(page)).toBe("dark");
});

test("computed styles on /design/ equal the token file, in both themes", async ({ page }) => {
  await page.goto("/design/");
  expect(await mismatches(page, sharedTokens(css))).toEqual([]);

  for (const t of ["dark", "light"] as Theme[]) {
    if ((await theme(page)) !== t) {
      await page.getByRole("button", { name: "Light theme" }).click();
    }
    expect(await theme(page)).toBe(t);
    expect(await mismatches(page, themeColours(css, t))).toEqual([]);
  }
  expect(await bodyBackground(page)).toBe(LIGHT_GROUND);

  // The fonts behind the tokens: the name is condensed and heavy, text is Archivo at normal width.
  const name = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".name")!);
    return { stretch: cs.fontStretch, weight: cs.fontWeight, family: cs.fontFamily };
  });
  expect(name).toMatchObject({ stretch: "62%", weight: "800" });
  expect(name.family.toLowerCase()).toContain("archivo");
});

test("fonts come from the site itself, and the condensed width is in the file", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const requests: { url: string; type: string }[] = [];
  page.on("request", (r) => requests.push({ url: r.url(), type: r.resourceType() }));
  for (const path of ["/", "/design/"]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
  }
  const fonts = requests.filter((r) => r.type === "font" || /\.(woff2?|ttf|otf)(\?|$)/.test(r.url));
  expect(fonts.length).toBeGreaterThan(0);
  for (const f of fonts) {
    expect(new URL(f.url).origin, f.url).toBe(origin);
  }
  for (const r of requests) {
    expect(new URL(r.url).origin, r.url).toBe(origin);
  }

  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "loaded").map((f) => ({ family: f.family, stretch: f.stretch })),
  );
  expect(loaded.some((f) => /archivo/i.test(f.family) && f.stretch.includes("62%"))).toBe(true);
});

test("/design/ is noindex, and not in the sitemap or linked from home", async ({ page, request }) => {
  await page.goto("/design/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('a[href*="design"]')).toHaveCount(0);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("<loc>https://joshdengxd.github.io/</loc>");
  expect(xml).not.toContain("/design");
});

test("/design/ shows a passing contrast ratio for every pair", async ({ page }) => {
  await page.goto("/design/");
  const rows = page.locator("tr[data-pair]");
  await expect(rows).toHaveCount(20);
  for (const text of await rows.allTextContents()) {
    expect(text).toMatch(/\d+\.\d\d:1/);
    expect(text).toContain("passes");
  }
});

test("/design/ shows the highlighted code sample and a passing ratio for every code colour, in both themes", async ({
  page,
}) => {
  await page.goto("/design/");
  await expect(page.locator("pre.shiki")).toHaveCount(2);
  const rows = page.locator("li[data-code-pair]");
  await expect(rows).toHaveCount(12);
  for (const text of await rows.allTextContents()) {
    expect(text).toMatch(/dark \d+\.\d\d:1 passes, light \d+\.\d\d:1 passes/);
  }
});

test("the code colours on /design/ equal the token file, in both themes", async ({ page }) => {
  await page.goto("/design/");
  for (const t of ["dark", "light"] as Theme[]) {
    if ((await theme(page)) !== t) {
      await page.getByRole("button", { name: "Light theme" }).click();
    }
    expect(await theme(page)).toBe(t);
    const colours = codeColours(css, t);
    const seen = await page
      .locator("pre.shiki")
      .first()
      .evaluate((pre) => ({
        background: getComputedStyle(pre).backgroundColor,
        foreground: getComputedStyle(pre).color,
      }));
    const hex = (h: string) => {
      const n = parseInt(h.slice(1), 16);
      return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
    };
    expect(seen).toEqual({
      background: hex(colours["--shiki-background"]),
      foreground: hex(colours["--shiki-foreground"]),
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the name is not animated", async ({ page }) => {
    await page.goto("/");
    const names = await page
      .locator(".reveal-line")
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
    expect(names).toEqual(["none", "none"]);
  });
});

test("the name rises from below on load", async ({ page }) => {
  await page.goto("/");
  const names = await page
    .locator(".reveal-line")
    .evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
  expect(names.every((n) => n !== "none")).toBe(true);
  await expect(page.getByRole("heading", { level: 1, name: "Josh Deng" })).toBeVisible();
  await expect(page.locator("h1")).toHaveText(/Josh\s*Deng/);
});
