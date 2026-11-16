// Every link to another site opens in a new tab and says so (ticket #44). The audit reads every HTML file in out/ (both
// builds) and parses it with the browser's HTML parser (JavaScript off, so nothing loads); the browser tests check the
// shell links with JavaScript on and off.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { SITE_ORIGIN } from "../../lib/site";

const OUT = join(process.cwd(), "out");
const NOTE = "(opens in a new tab)";
const named = (name: string) => new RegExp(`^${name}\\s*\\(opens in a new tab\\)$`);

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) {
      return e.name === "_next" ? [] : htmlFiles(join(dir, e.name));
    }
    return e.name.endsWith(".html") ? [join(dir, e.name)] : [];
  });
}

type Link = {
  href: string;
  target: string | null;
  rel: string[];
  text: string;
  /** Text of the last child element when it is a `span.visually-hidden`, else null. */
  note: string | null;
};

test.describe("audit of out/", () => {
  test.use({ javaScriptEnabled: false });
  const files = htmlFiles(OUT);

  test("every external link has target, noopener noreferrer and the hidden note; no internal link has a target", async ({
    page,
  }) => {
    expect(files.length).toBeGreaterThan(8);
    let external = 0;
    let internal = 0;
    for (const file of files) {
      await page.setContent(readFileSync(file, "utf8"), { waitUntil: "commit" });
      const links = await page.evaluate((): Link[] => {
        return [...document.querySelectorAll("a[href]")].map((a) => {
          const last = a.lastElementChild;
          return {
            href: new URL(a.getAttribute("href") ?? "", "https://base.invalid/").href,
            target: a.getAttribute("target"),
            rel: (a.getAttribute("rel") ?? "").split(/\s+/),
            text: (a.textContent ?? "").trim(),
            note: last?.matches("span.visually-hidden") ? (last.textContent ?? "").trim() : null,
          };
        });
      });
      for (const link of links) {
        const where = `${file}: ${link.href}`;
        const url = new URL(link.href);
        if (/^https?:$/.test(url.protocol) && url.origin !== SITE_ORIGIN && url.origin !== "https://base.invalid") {
          external++;
          expect(link.target, where).toBe("_blank");
          expect(link.rel, where).toContain("noopener");
          expect(link.rel, where).toContain("noreferrer");
          expect(link.note, where).toBe(NOTE);
          expect(link.text.endsWith(NOTE), where).toBe(true);
        } else {
          internal++;
          expect(link.target, where).toBeNull();
        }
      }
    }
    expect(external).toBeGreaterThan(5);
    expect(internal).toBeGreaterThan(5);
  });

  test("the profile links keep rel me", async ({ page }) => {
    for (const path of ["index.html", join("about", "index.html")]) {
      await page.setContent(readFileSync(join(OUT, path), "utf8"), { waitUntil: "commit" });
      for (const host of ["github.com/joshdengxd", "linkedin.com/in/"]) {
        const rel = await page.locator(`a[href*="${host}"]`).first().getAttribute("rel");
        expect(rel?.split(/\s+/), `${path}: ${host}`).toContain("me");
      }
    }
  });
});

test.describe("in the browser", () => {
  test.beforeEach(async ({ context }) => {
    // No request leaves the machine: the new tab gets an empty page.
    await context.route(/^https?:\/\/(?!(localhost|127\.0\.0\.1)[:/])/, (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>external</title>" }),
    );
  });

  for (const name of ["GitHub", "LinkedIn"]) {
    test(`${name} opens in a new tab and the page stays where it is`, async ({ page }) => {
      await page.goto("/about/");
      const url = page.url();
      const link = page.getByRole("link", { name: named(name) }).first();
      const [popup] = await Promise.all([page.waitForEvent("popup"), link.click()]);
      await popup.waitForLoadState();
      expect(popup.url()).toMatch(name === "GitHub" ? /github\.com/ : /linkedin\.com/);
      expect(page.url()).toBe(url);
    });
  }

  test("a navigation link stays in the same tab", async ({ page, context }) => {
    await page.goto("/");
    let opened = false;
    context.on("page", () => (opened = true));
    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL(/\/about\/$/);
    expect(opened).toBe(false);
  });

  test("the hidden note does not show and causes no horizontal overflow at 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/about/");
    const box = await page.locator("a .visually-hidden").first().boundingBox();
    expect(box === null || (box.width <= 1 && box.height <= 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("the note is in the accessible name of the profile links", async ({ page }) => {
    await page.goto("/");
    for (const name of ["GitHub", "LinkedIn"]) {
      const link = page.getByRole("link", { name: named(name) }).first();
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveText(named(name));
    }
  });
});
