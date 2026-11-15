// The v1 pages in a browser (both builds): reachable from the navigation and the Projects index, the project pages
// and their repo links, the home sections, and the visible placeholder labels.
import { expect, test, type Page } from "@playwright/test";
import { REPO_URL } from "../../lib/build-log";
import { PROJECTS } from "../../lib/projects";

const REPOS = {
  "josh-shared-skills": "https://github.com/joshdengxd/josh-shared-skills",
  "job-search-skills": "https://github.com/joshdengxd/job-search-skills",
  "this-site": "https://github.com/joshdengxd/joshdengxd.github.io",
};

function watch(page: Page) {
  const problems: string[] = [];
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

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
      expect(await (await request.get("/sitemap.xml")).text()).toContain(`<loc>https://joshdengxd.github.io${path}</loc>`);
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
    test(`/projects/${slug}/ links its GitHub repo and is indexable with its own metadata`, async ({ page, request }) => {
      const problems = watch(page);
      const res = await page.goto(`/projects/${slug}/`);
      expect(res?.status()).toBe(200);
      const project = PROJECTS.find((p) => p.slug === slug)!;
      expect(project.repoUrl).toBe(repo);
      await expect(page.getByRole("link", { name: `${project.name} on GitHub` })).toHaveAttribute("href", repo);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", project.summary);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.locator("[data-placeholder]").first()).toBeVisible();
      expect(await (await request.get("/sitemap.xml")).text()).toContain(`/projects/${slug}/</loc>`);
      expect(problems).toEqual([]);
    });
  }

  test("an unknown project is the 404 page", async ({ page }) => {
    expect((await page.goto("/projects/no-such-project/"))?.status()).toBe(404);
  });
});

test.describe("home", () => {
  test("the D5 first screen, then Focus, Featured repos and Latest posts on the ground, then the footer line", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const problems = watch(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Josh\s*Deng/);
    await expect(page.getByText(/under construction/i)).toHaveCount(0);
    const intro = page.getByRole("region", { name: "Intro" });
    await expect(intro.locator("[data-placeholder]")).toBeVisible();
    await expect(intro).toContainText("Alberta, Canada");

    await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Focus", "Featured repos", "Latest posts"]);
    // The sections start below the first screen, and the footer line ends the page.
    const focusTop = await page.getByRole("heading", { level: 2, name: "Focus" }).evaluate((el) => el.getBoundingClientRect().top + scrollY);
    expect(focusTop).toBeGreaterThanOrEqual(900);
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "GitHub" })).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "LinkedIn" })).toBeVisible();

    // Featured repos: the same cards as the Projects index.
    const featured = page.getByRole("region", { name: "Featured repos" });
    await expect(featured.locator("article[data-project]")).toHaveCount(PROJECTS.length);
    for (const p of PROJECTS) await expect(featured.getByRole("link", { name: p.name })).toHaveAttribute("href", `/projects/${p.slug}/`);
    expect(problems).toEqual([]);
  });

  test("the home page has no horizontal overflow on a phone and the footer line follows the sections", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    const order = await page.evaluate(() => {
      const top = (sel: string) => document.querySelector(sel)!.getBoundingClientRect().top;
      return [top("h1"), top("main section:last-of-type"), top("footer")];
    });
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

test.describe("placeholders", () => {
  test("each one shows the label 'Placeholder:' and has data-placeholder, on every v1 page", async ({ page }) => {
    for (const path of ["/", "/about/", "/projects/this-site/", "/how-this-site-is-built/"]) {
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
  test("links each part's issue, and its PR when known, for this repo only; names the five unused skills", async ({ page }) => {
    await page.goto("/how-this-site-is-built/");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Workflow", "Parts", "Skills not used here"]);
    await expect(page.getByRole("link", { name: "Issue #2" })).toHaveAttribute("href", `${REPO_URL}/issues/2`);
    await expect(page.getByRole("link", { name: "PR #11" })).toHaveAttribute("href", `${REPO_URL}/pull/11`);
    await expect(page.getByRole("link", { name: "Issue #7" })).toHaveAttribute("href", `${REPO_URL}/issues/7`);
    await expect(page.getByRole("link", { name: "PR #7", exact: true })).toHaveCount(0);
    for (const skill of ["deploy-to-staging", "run-e2e-automation", "live-env-local-test", "prod-release-gate", "log-analysis"])
      await expect(page.getByText(skill, { exact: true })).toBeVisible();
  });
});
