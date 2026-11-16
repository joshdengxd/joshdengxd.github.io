// Checks every HTML page in out/ and the files beside them (sitemap, robots, social image). No browser: it reads the
// build. Runs on both builds (the deployed one and the blog fixture one), so it compares pages with the sitemap of the
// same build instead of a fixed list.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { expect, test } from "@playwright/test";
import { PROJECTS } from "../../lib/projects";
import { ABOUT_LINKS } from "../about-text";
import { MERGED_PRS_URL, PROJECT_BOARD_URL } from "../../lib/site";

const OUT = join(process.cwd(), "out");
const ORIGIN = "https://joshdengxd.github.io";

type Page = { file: string; path: string; html: string; noindex: boolean; text: string };

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) {
      return e.name === "_next" ? [] : htmlFiles(join(dir, e.name));
    }
    return e.name.endsWith(".html") ? [join(dir, e.name)] : [];
  });
}

const decode = (s: string) =>
  s
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/** The rendered text of a page: no scripts, styles or tags. */
const textOf = (html: string) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

function loadPages(): Page[] {
  return htmlFiles(OUT).map((file) => {
    const html = readFileSync(file, "utf8");
    const rel = relative(OUT, file).split(sep).join("/");
    const path = rel === "404.html" ? "/404.html" : `/${rel.replace(/index\.html$/, "")}`;
    return {
      file: rel,
      path,
      html,
      noindex: /<meta name="robots" content="[^"]*noindex/.test(html),
      text: textOf(html),
    };
  });
}

/** The content of `<meta name|property=key content=...>`, or null. */
function meta(html: string, key: string): string | null {
  const head = html.slice(0, html.indexOf("</head>"));
  const tag = new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`).exec(head);
  return tag ? decode(tag[1]) : null;
}

const title = (html: string) => decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "");
const canonical = (html: string) => /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] ?? null;
const sitemapUrls = () =>
  [...readFileSync(join(OUT, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const pages = loadPages();
const indexable = pages.filter((p) => !p.noindex);

test.describe("pages and the sitemap", () => {
  test("every HTML page in out/ is in the sitemap or noindex, and every sitemap URL is a real indexable page", () => {
    const urls = new Set(sitemapUrls());
    expect(pages.length).toBeGreaterThan(8);
    for (const p of pages) {
      if (p.noindex) {
        expect(urls.has(`${ORIGIN}${p.path}`), `${p.file} is noindex but in the sitemap`).toBe(false);
      } else {
        expect(urls.has(`${ORIGIN}${p.path}`), `${p.file} is indexable but not in the sitemap`).toBe(true);
      }
    }
    const indexablePaths = new Set(indexable.map((p) => `${ORIGIN}${p.path}`));
    for (const url of urls) {
      expect(indexablePaths.has(url), `${url} is in the sitemap but has no indexable page`).toBe(true);
    }
  });

  test("the sitemap has every v1 route, and never /design/ or a _none page", () => {
    const urls = sitemapUrls();
    for (const path of [
      "/",
      "/about/",
      "/projects/",
      "/how-this-site-is-built/",
      "/blog/",
      ...PROJECTS.map((p) => `/projects/${p.slug}/`),
    ]) {
      expect(urls, path).toContain(`${ORIGIN}${path}`);
    }
    expect(urls.join("\n")).not.toMatch(/design|_none/);
    expect(new Set(urls).size).toBe(urls.length);
  });

  test("the hidden pages (/design/, _none, 404) are noindex", () => {
    for (const p of pages.filter((q) => /design|_none|404|_not-found/.test(q.file))) {
      expect(p.noindex, p.file).toBe(true);
    }
  });
});

test.describe("metadata of every indexable page", () => {
  test("unique non-empty title and description", () => {
    const titles = indexable.map((p) => title(p.html));
    const descriptions = indexable.map((p) => meta(p.html, "description"));
    for (const [i, p] of indexable.entries()) {
      expect(titles[i].trim(), p.file).not.toBe("");
      expect(descriptions[i]?.trim(), p.file).toBeTruthy();
    }
    expect(new Set(titles).size, `titles: ${titles.join(" | ")}`).toBe(titles.length);
    expect(new Set(descriptions).size, `descriptions: ${descriptions.join(" | ")}`).toBe(descriptions.length);
  });

  test("titles are the page title plus the site name (the home page: the name alone)", () => {
    for (const p of indexable) {
      const t = title(p.html);
      if (p.path === "/") {
        expect(t).toBe("Xindong Deng (Josh)");
      } else {
        expect(t, p.file).toMatch(/^.+ · Xindong Deng \(Josh\)$/);
      }
      expect(t.match(/Xindong Deng \(Josh\)/g), p.file).toHaveLength(1);
    }
  });

  test("the canonical URL is the page's sitemap URL: absolute, with the trailing slash", () => {
    const urls = new Set(sitemapUrls());
    for (const p of indexable) {
      const c = canonical(p.html);
      expect(c, p.file).toBe(`${ORIGIN}${p.path}`);
      expect(urls.has(c!), p.file).toBe(true);
    }
  });

  test("Open Graph and Twitter tags are complete, with absolute URLs including the image", () => {
    for (const p of indexable) {
      const t = title(p.html);
      const d = meta(p.html, "description");
      expect(meta(p.html, "og:title"), p.file).toBe(t);
      expect(meta(p.html, "og:description"), p.file).toBe(d);
      expect(meta(p.html, "og:url"), p.file).toBe(`${ORIGIN}${p.path}`);
      expect(meta(p.html, "og:site_name"), p.file).toBe("Xindong Deng (Josh)");
      expect(meta(p.html, "og:type"), p.file).toMatch(/^(website|article)$/);
      expect(meta(p.html, "twitter:card"), p.file).toBe("summary_large_image");
      expect(meta(p.html, "twitter:title"), p.file).toBe(t);
      expect(meta(p.html, "twitter:description"), p.file).toBe(d);
      for (const key of ["og:image", "twitter:image"]) {
        const url = meta(p.html, key);
        expect(url, `${p.file} ${key}`).toMatch(new RegExp(`^${ORIGIN}/[^?#]+\\.png$`));
      }
      expect(meta(p.html, "og:image:width"), p.file).toBe("1200");
      expect(meta(p.html, "og:image:height"), p.file).toBe("630");
      expect(meta(p.html, "og:image:alt")?.length, p.file).toBeGreaterThan(10);
    }
  });

  test("the social image file exists (1200x630 PNG) and is the one every page names", () => {
    const urls = new Set(indexable.flatMap((p) => [meta(p.html, "og:image"), meta(p.html, "twitter:image")]));
    expect(urls.size).toBe(1);
    const file = join(OUT, new URL([...urls][0]!).pathname);
    expect(existsSync(file)).toBe(true);
    const png = readFileSync(file);
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    expect(png.length).toBeLessThan(200_000);
  });
});

test("robots.txt allows everything and points at the absolute sitemap", () => {
  const robots = readFileSync(join(OUT, "robots.txt"), "utf8");
  expect(robots).toMatch(/^User-Agent: \*$/m);
  expect(robots).toMatch(/^Allow: \/$/m);
  expect(robots).not.toMatch(/^Disallow:\s*\S/m);
  expect(robots).toMatch(new RegExp(`^Sitemap: ${ORIGIN}/sitemap\\.xml$`, "m"));
});

test.describe("placeholders", () => {
  test("every data-placeholder carries a visible 'Placeholder:' label, and every label is on one", () => {
    let total = 0;
    for (const p of pages) {
      const body = p.html.replace(/<script[\s\S]*?<\/script>/g, "");
      const marked = (body.match(/ data-placeholder(?:="[^"]*")?[ >]/g) ?? []).length;
      const labelled = (
        body.match(/<p [^>]*data-placeholder(?:="[^"]*")?[^>]*><span [^>]*>Placeholder:<\/span>/g) ?? []
      ).length;
      const labels = (p.text.match(/Placeholder:/g) ?? []).length;
      expect(labelled, `${p.file}: placeholders without the label`).toBe(marked);
      expect(labels, `${p.file}: a Placeholder: label that is not on a placeholder`).toBe(marked);
      total += marked;
    }
    expect(total).toBeGreaterThan(0); // the audit must not be vacuous; fewer remain as pages get real text
  });

  test("the v1 pages without written text each have at least one placeholder", () => {
    for (const path of ["/how-this-site-is-built/"]) {
      expect(pages.find((p) => p.path === path)?.html, path).toContain("data-placeholder");
    }
  });
});

test.describe("personal details", () => {
  const FORBIDDEN: [string, RegExp][] = [
    ["a place of residence", /based in|located in|living in|lives in|home town|hometown/i],
    ["an email address", /[\w.+-]+@[\w-]+\.[a-z]{2,}/i],
    ["a phone number", /(?:\+?\d[\s().-]?){10,}/],
    [
      "job-search status",
      /open to work|looking for (?:a |new |my next )?(?:job|role|work|opportunit)|job[- ]hunt|seeking|laid off|layoff|unemployed|available for hire/i,
    ],
    ["a photo", /<img[\s>]/i],
  ];

  test("no page shows a city, email, phone number, job-search status or photo", () => {
    for (const p of pages) {
      for (const [what, pattern] of FORBIDDEN) {
        // Figures may hold a post's own image or one of the two approved project diagrams, checked below.
        // One sentence on the job-search-skills page (ticket #47) says "friends who are looking for work": it is about the
        // reader's friends, not the owner, so that exact phrase is not scanned. Any other use still fails.
        const text = p.text.replace(/friends who are looking for work/g, "friends who need it");
        const where = what === "a photo" ? p.html.replace(/<figure(?:\s[^>]*)?>[\s\S]*?<\/figure>/g, "") : text;
        expect(pattern.test(where), `${p.file} shows ${what}`).toBe(false);
      }
    }
  });

  test("pictures belong to their post, except the two approved project workflow diagrams", () => {
    const diagrams = new Map([
      ["/projects/josh-shared-skills/", "/projects/josh-shared-skills/cycle.svg"],
      ["/projects/job-search-skills/", "/projects/job-search-skills/pipeline.svg"],
    ]);
    for (const p of pages) {
      for (const [tag] of p.html.matchAll(/<img\s[^>]*>/gi)) {
        const src = /\ssrc="([^"]*)"/.exec(tag)?.[1];
        const diagram = diagrams.get(p.path);
        if (diagram) {
          expect(src, `${p.file}: ${tag}`).toBe(diagram);
        } else {
          expect(p.path, `${p.file} has a picture outside a post`).toMatch(/^\/blog\/[a-z0-9-]+\/$/);
          expect(src, `${p.file}: ${tag}`).toContain(`${p.path}`);
        }
      }
    }
  });

  test("the only location named is 'Alberta, Canada'", () => {
    const home = pages.find((p) => p.path === "/")!;
    expect(home.text).toContain("Alberta, Canada");
    for (const p of pages) {
      // The Background text names the university and two employers with Alberta in their names (ticket #34).
      const rest = p.text
        .replace(/Alberta, Canada/g, "")
        .replace(/University of Alberta|Alberta Motor Association|College of Registered Nurses of Alberta/g, "");
      expect(rest, p.file).not.toMatch(/Alberta|Canada/);
    }
  });

  test("outside links go only to the GitHub and LinkedIn profiles, the three public repos, the two people About names, the project board and the merged pull requests", () => {
    const allowed = [
      "https://github.com/joshdengxd",
      "https://www.linkedin.com/in/josh-deng-edm",
      ...PROJECTS.map((p) => p.repoUrl),
      // Approved project-page guides (#79–#81); keep the privacy allowlist explicit.
      "https://github.com/joshdengxd/josh-shared-skills/blob/main/README.md",
      "https://github.com/joshdengxd/job-search-skills/blob/main/README.md",
      "https://github.com/joshdengxd/joshdengxd.github.io/blob/main/docs/context/INDEX.md",
      ...ABOUT_LINKS.map((l) => l.href), // Matt Pocock and Lauren Tan, in About (ticket #35)
      PROJECT_BOARD_URL,
      MERGED_PRS_URL,
      // The two links in the first post (the talk it answers and its speaker).
      "https://www.youtube.com/watch?v=O_zcc6Xl12g",
      "https://x.com/poteto",
    ];
    for (const p of pages) {
      for (const href of [...p.html.replace(/<script[\s\S]*?<\/script>/g, "").matchAll(/<a [^>]*href="([^"]+)"/g)].map(
        (m) => decode(m[1]),
      )) {
        if (href.startsWith("/") || href.startsWith("#")) {
          continue;
        }
        expect(allowed.includes(href), `${p.file} links ${href}`).toBe(true);
      }
    }
  });
});
