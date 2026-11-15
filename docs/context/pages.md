# Pages, metadata and placeholders (ticket #7)

Read when you add or edit a page, change metadata, the sitemap or robots, the social image, or replace placeholder copy.

## Routes
`/`, `/about/`, `/projects/`, `/projects/<slug>/` (`josh-shared-skills`, `job-search-skills`, `this-site`), `/how-this-site-is-built/`, `/blog/` (and its posts and tags, see `blog.md`), `/design/` (specimen, noindex, not in the sitemap). Every other route is the 404 page.

## Data lists (no network at build)
- `lib/projects.ts`: slug, name, repo URL, one-line summary for exactly the three public repos. Drives the Projects index, the project pages, Featured repos on home, and the sitemap. A new repo is one entry here (and the allowlists in the tests that name the three URLs).
- `lib/skills.ts`: one line per skill in `.claude/skills/`, keyed by folder name, in two groups (ticket cycle, supporting). A unit test compares the keys with the folders both ways, so adding or removing a skill needs a line change here. The How this site is built page (Workflow, Skills used, What it is made of, The record) has no per-PR data: the record links (board, merged PRs, repo) come from `lib/site.ts`.

## Placeholders
`<Placeholder>` (`app/_components/placeholder.tsx`) renders a muted paragraph with the visible label "Placeholder:" and `data-placeholder`. List what is left: `grep -r data-placeholder out/` after a build. Replacing one with real copy is deleting the component, nothing else. No check fails while placeholders remain. About has none left: its three text sections are the owner's own paragraphs (a test compares them with `tests/about-text.ts`; change both together), and the two names in "What I am learning" are plain links.

## Metadata
- Root layout: `title: { default, template: "%s · Xindong Deng (Josh)" }`, `metadataBase`. A page passes the bare title.
- `pageMetadata({ title, description, path })` (`lib/metadata.ts`) is used by every page, the blog pages included: description, canonical (absolute through `metadataBase`, with the trailing slash, equal to the sitemap URL), Open Graph and Twitter card (`summary_large_image`), and the social image in both.
- Why the image is set by the helper and not left to the file convention: `openGraph` merges shallowly, and the `app/opengraph-image.png` file only reaches the pages of its own segment, so a page with its own `openGraph` lost the image. The helper sets `images` itself (url `/opengraph-image.png`, 1200x630, alt text read from `app/opengraph-image.alt.txt`). The home page's title is the bare site name (`title.absolute`).
- Social image: `app/opengraph-image.png`, the D5 name in the dark theme, made by screenshotting a small page built from `design-language/tokens.css` and the Archivo file at 1200x630. Replace the PNG (and the alt text) to change it; keep it under 200 KB.
- `app/robots.ts` (force-static): allow all, absolute sitemap URL, `/design/` not disallowed (a crawler has to see its noindex). `app/sitemap.ts`: every public route, never `/design/` or a `_none` page.

## Personal details
Only what PRD-0001 allows: name "Xindong Deng (Josh)", "Alberta, Canada", past employers and titles, GitHub, LinkedIn. No city, email, phone, photo, job-search status, former-employer internals, other GitHub account or private repo. The job-search-skills page describes the public repo only. `tests/e2e/out-audit.spec.ts` scans the text and links of every page in `out/`.

## Tests
- `tests/unit/`: `projects`, `skills`, `placeholder`, `metadata`, `pages` (home, About, Projects, project page, How this site is built, sitemap, robots).
- `tests/e2e/out-audit.spec.ts` (no browser, both builds): every HTML page is in the sitemap or noindex, unique titles and descriptions, canonical equals sitemap URL, Open Graph and Twitter tags with absolute URLs, social image file, robots.txt, placeholder labels, personal-data scan.
- `tests/e2e/pages.spec.ts` (both builds): navigation, cards, repo links, home sections, placeholder colour. `home-posts.default.spec.ts` / `home-posts.fixture.spec.ts`: Latest posts on each build.
