// The v1 pages in a browser (both builds): reachable from the navigation and the Projects index, the project pages
// and their repo links, the home sections, and the visible placeholder labels.
import { expect, test, type Page } from "@playwright/test";
import { watch } from "./watch";
import { PROJECTS } from "../../lib/projects";
import { MERGED_PRS_URL, PROJECT_BOARD_URL, SITE_REPO_URL } from "../../lib/site";
import { SKILLS } from "../../lib/skills";

const REPOS = {
  "josh-shared-skills": "https://github.com/joshdengxd/josh-shared-skills",
  "job-search-skills": "https://github.com/joshdengxd/job-search-skills",
  "this-site": "https://github.com/joshdengxd/joshdengxd.github.io",
};

const nav = (page: Page) => page.getByRole("navigation", { name: "Main" }).filter({ visible: true });

test.describe("each page is reachable from the navigation", () => {
  for (const [label, path, heading] of [
    ["About", "/about/", "About"],
    ["Projects", "/projects/", "Projects"],
    ["How this site is built", "/how-this-site-is-built/", "How this site is built"],
  ] as const) {
    test(`${label}: link from home, 200, its title, indexable, a sitemap entry`, async ({ page, request }) => {
      const problems = watch(page);
      await page.goto("/");
      await nav(page).getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page).toHaveTitle(`${heading} · Xindong Deng (Josh)`);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      expect((await page.goto(path))?.status()).toBe(200);
      expect(await (await request.get("/sitemap.xml")).text()).toContain(
        `<loc>https://joshdengxd.github.io${path}</loc>`,
      );
      expect(problems).toEqual([]);
    });
  }
});

test.describe("projects", () => {
  test("the index has one card per project, each linking to its page", async ({ page }) => {
    const problems = watch(page);
    await page.goto("/projects/");
    const cards = page.locator("article[data-project]");
    await expect(cards).toHaveCount(PROJECTS.length);
    for (const p of PROJECTS) {
      const card = page.locator(`article[data-project="${p.slug}"]`);
      await expect(card).toContainText(p.summary);
      const link = card.getByRole("link", { name: p.name });
      await expect(link).toHaveAttribute("href", `/projects/${p.slug}/`);
      await link.click();
      await expect(page).toHaveURL(`/projects/${p.slug}/`);
      await expect(page.getByRole("heading", { level: 1, name: p.name })).toBeVisible();
      await page.goBack();
    }
    expect(problems).toEqual([]);
  });

  for (const [slug, repo] of Object.entries(REPOS)) {
    test(`/projects/${slug}/ links its GitHub repo and is indexable with its own metadata`, async ({
      page,
      request,
    }) => {
      const problems = watch(page);
      const res = await page.goto(`/projects/${slug}/`);
      expect(res?.status()).toBe(200);
      const project = PROJECTS.find((p) => p.slug === slug)!;
      expect(project.repoUrl).toBe(repo);
      await expect(page.getByRole("link", { name: `${project.name} on GitHub` })).toHaveAttribute("href", repo);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", project.summary);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.locator("[data-placeholder]")).toHaveCount(0);
      for (const text of [...project.whatItDoes, ...project.whyItExists]) {
        await expect(page.getByText(text, { exact: true })).toBeVisible();
      }
      expect(await (await request.get("/sitemap.xml")).text()).toContain(`/projects/${slug}/</loc>`);
      expect(problems).toEqual([]);
    });
  }

  test("the written project texts show with JavaScript off", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    for (const slug of ["josh-shared-skills", "job-search-skills", "this-site"]) {
      await page.goto(`/projects/${slug}/`);
      const project = PROJECTS.find((p) => p.slug === slug)!;
      await expect(page.locator("[data-placeholder]")).toHaveCount(0);
      for (const text of [...project.whatItDoes, ...project.whyItExists]) {
        await expect(page.getByText(text, { exact: true })).toBeVisible();
      }
    }
    await context.close();
  });

  test("an unknown project is the 404 page", async ({ page }) => {
    expect((await page.goto("/projects/no-such-project/"))?.status()).toBe(404);
  });
});

test.describe("home", () => {
  test("the D5 first screen and navigation utilities, nothing between or after", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const problems = watch(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Josh\s*Deng/);
    await expect(page.getByText(/under construction/i)).toHaveCount(0);
    const intro = page.getByRole("region", { name: "Intro" });
    await expect(intro.locator("[data-placeholder]")).toHaveCount(0);
    await expect(intro).toHaveText(
      "Xindong Deng (Josh). A software developer since 2018 and an AI-native builder, in Alberta, Canada.",
    );

    // No heading but the name; no Focus, Featured repos or Latest posts.
    await expect(page.getByRole("heading")).toHaveCount(1);
    for (const name of ["Focus", "Featured repos", "Latest posts"]) {
      await expect(page.getByRole("region", { name })).toHaveCount(0);
    }
    await expect(page.locator("main article")).toHaveCount(0);
    await expect(page.locator("main a")).toHaveCount(0);
    await expect(
      page.getByRole("banner").getByRole("link", { name: "GitHub" }).filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "LinkedIn" }).filter({ visible: true }),
    ).toBeVisible();
    expect(problems).toEqual([]);
  });

  for (const width of [320, 390, 1440]) {
    test(`the home page at ${width}px: no horizontal overflow; the name, then the intro under it, then navigation utilities`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width > 500 ? 900 : 844 });
      await page.goto("/");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(
        0,
      );
      // Read both boxes in one frame: hydration replaces expanded fallback navigation.
      const [name, intro] = await page.evaluate(() =>
        ["h1", "section[aria-label=Intro]"].map((selector) => {
          const r = document.querySelector(selector)!.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        }),
      );
      expect(intro.top, "the intro is under the name").toBeGreaterThanOrEqual(name.bottom - 1);
      await expect(page.getByRole("contentinfo")).toHaveCount(0);
    });
  }
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`JavaScript ${javaScriptEnabled ? "on" : "off"}: home and About after the removals`, () => {
    test.use({ javaScriptEnabled });

    test("/ has only its first screen and navigation utilities, no Focus, Featured repos or Latest posts", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.getByRole("heading")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Josh\s*Deng/);
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
      await expect(page.locator("main article, main ol")).toHaveCount(0);
      await expect(page.locator("main a")).toHaveCount(0);
      await expect(page.getByRole("contentinfo")).toHaveCount(0);
      const footer = page.getByRole("banner");
      await expect(footer.getByRole("link", { name: "GitHub" }).filter({ visible: true })).toBeVisible();
      await expect(footer.getByRole("link", { name: "LinkedIn" }).filter({ visible: true })).toBeVisible();
    });

    test("/ shows the written intro word for word, with no Placeholder label", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("region", { name: "Intro" })).toHaveText(
        "Xindong Deng (Josh). A software developer since 2018 and an AI-native builder, in Alberta, Canada.",
      );
      await expect(page.locator("[data-placeholder]")).toHaveCount(0);
      await expect(page.getByText("Placeholder:")).toHaveCount(0);
    });

    test("/about/ has no Links section and no GitHub or LinkedIn link in its main content (only the two names in the text); navigation profile links stay", async ({
      page,
    }) => {
      await page.goto("/about/");
      await expect(page.getByRole("heading", { level: 2 })).toHaveText([
        "Background",
        "What I am learning",
        "How I work",
      ]);
      await expect(page.getByRole("heading", { name: "Links" })).toHaveCount(0);
      await expect(page.locator("main a")).toHaveText([
        "Matt Pocock (opens in a new tab)",
        "Lauren Tan (opens in a new tab)",
      ]);
      await expect(page.getByRole("contentinfo")).toHaveCount(0);
      const footer = page.getByRole("banner");
      await expect(footer.getByRole("link", { name: "GitHub" }).filter({ visible: true })).toBeVisible();
      await expect(footer.getByRole("link", { name: "LinkedIn" }).filter({ visible: true })).toBeVisible();
    });
  });
}

test.describe("placeholders", () => {
  test("each one shows the label 'Placeholder:' and has data-placeholder, on every v1 page", async ({ page }) => {
    for (const path of ["/how-this-site-is-built/"]) {
      await page.goto(path);
      const marked = page.locator("[data-placeholder]");
      expect(await marked.count(), path).toBeGreaterThan(0);
      for (const el of await marked.all()) {
        await expect(el, path).toBeVisible();
        await expect(el.getByText("Placeholder:", { exact: true }), path).toBeVisible();
        await expect(el, path).toHaveCSS("color", /^rgb\(152, 166, 148\)$/); // --color-muted, dark
      }
    }
  });
});

test.describe("how this site is built", () => {
  test("no issue or PR numbers, the installed skills, and the three record links", async ({ page }) => {
    await page.goto("/how-this-site-is-built/");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      "Workflow",
      "Skills used",
      "What it is made of",
      "The record",
    ]);
    await expect(page.locator("[data-part]")).toHaveCount(0);
    const hrefs = await page.locator("main a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.filter((h) => /#\d+|\/(issues|pull)\/\d+/.test(h))).toEqual([]);
    for (const name of Object.keys(SKILLS)) {
      await expect(page.locator("[data-skill-group] code", { hasText: new RegExp(`^${name}$`) })).toHaveCount(1);
    }
    await expect(page.getByRole("link", { name: "Project board" })).toHaveAttribute("href", PROJECT_BOARD_URL);
    await expect(page.getByRole("link", { name: "Merged pull requests" })).toHaveAttribute("href", MERGED_PRS_URL);
    await expect(page.getByRole("link", { name: "Repository" })).toHaveAttribute("href", SITE_REPO_URL);
  });
});
