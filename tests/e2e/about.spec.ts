// The About page text (tickets #34, #35, #36): each section shows the owner's approved text word for word and no
// placeholder, with JavaScript on and off; the two names in "What I am learning" are focusable links that open in a new tab.
import { expect, test, type Page } from "@playwright/test";
import { ABOUT_LINKS, ABOUT_TEXT } from "../about-text";

/** The accessible name of an external link: its text, then the hidden note (ticket #44). */
const named = (name: string) => new RegExp(`^${name}\\s*\\(opens in a new tab\\)$`);

async function paragraphs(page: Page, title: string) {
  const section = page.getByRole("region", { name: title });
  return (await section.locator("p").allTextContents()).map((t) =>
    t.replace(/\s+/g, " ").replaceAll(" (opens in a new tab)", "").trim(),
  );
}

async function expectText(page: Page) {
  await page.goto("/about/");
  for (const [title, expected] of Object.entries(ABOUT_TEXT)) {
    expect(await paragraphs(page, title), title).toEqual(expected);
    await expect(page.getByRole("region", { name: title }).locator("[data-placeholder]"), title).toHaveCount(0);
  }
  await expect(page.locator("[data-placeholder]")).toHaveCount(0);
  await expect(page.getByText("Placeholder:")).toHaveCount(0);
}

test("About shows the three sections' text word for word and no placeholder", async ({ page }) => {
  await expectText(page);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("About shows the three sections' text word for word and no placeholder", async ({ page }) => {
    await expectText(page);
  });
});

test("the two names link to their own pages, inside the paragraph", async ({ page }) => {
  await page.goto("/about/");
  const section = page.getByRole("region", { name: "What I am learning" });
  await expect(section.getByRole("link")).toHaveCount(ABOUT_LINKS.length);
  for (const { name, href } of ABOUT_LINKS) {
    const link = section.getByRole("link", { name: named(name) });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    expect(await link.evaluate((a) => [a.closest("p") !== null, getComputedStyle(a).display])).toEqual([
      true,
      "inline",
    ]);
  }
});

test("the links take focus in order, show the focus ring, and read at 4.5:1 in both themes", async ({ page }) => {
  await page.goto("/about/");
  const section = page.getByRole("region", { name: "What I am learning" });
  const first = section.getByRole("link", { name: named(ABOUT_LINKS[0].name) });
  const second = section.getByRole("link", { name: named(ABOUT_LINKS[1].name) });
  await page.keyboard.press("Tab"); // enter the page's tab order, then walk to the first link
  await first.focus();
  await expect(first).toBeFocused();
  await expect(first).toHaveCSS("outline-style", "solid");
  expect(parseFloat(await first.evaluate((a) => getComputedStyle(a).outlineWidth))).toBeGreaterThanOrEqual(2);
  await page.keyboard.press("Tab");
  await expect(second).toBeFocused();
  await expect(second).toHaveCSS("outline-style", "solid");

  const ratio = (link: typeof first) =>
    link.evaluate((a) => {
      const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      let bg = [0, 0, 0, 0];
      for (let el: Element | null = a; el; el = el.parentElement) {
        const c = parse(getComputedStyle(el).backgroundColor);
        if (c.length >= 3 && (c[3] ?? 1) > 0) {
          bg = c;
          break;
        }
      }
      const [l1, l2] = [lum(parse(getComputedStyle(a).color)), lum(bg)].sort((x, y) => y - x);
      return (l1 + 0.05) / (l2 + 0.05);
    });

  const themes = new Set<string>();
  for (let i = 0; i < 2; i++) {
    themes.add((await page.locator("html").getAttribute("data-theme")) ?? "");
    for (const link of [first, second]) {
      expect(await ratio(link)).toBeGreaterThanOrEqual(4.5);
    }
    await page.getByRole("button", { name: /theme/i }).click();
  }
  expect(themes.size).toBe(2);
});

test("no horizontal overflow at 320 and 390 px", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/about/");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      `${width}`,
    ).toBeLessThanOrEqual(0);
  }
});
