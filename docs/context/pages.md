# Pages, metadata and placeholders (ticket #7)

Read when you add or edit a page, change metadata, the sitemap or robots, the social image, or replace placeholder copy.

## Routes
`/`, `/about/`, `/projects/`, `/projects/<slug>/` (`josh-shared-skills`, `job-search-skills`, `this-site`), `/how-this-site-is-built/`, `/blog/` (and its posts and tags, see `blog.md`), `/design/` (specimen, noindex, not in the sitemap). Every other route is the 404 page.

## Data lists (no network at build)
- `lib/projects.ts`: slug, name, repo URL, one-line summary for exactly the three public repos. Drives the Projects index, the project pages, and the sitemap. A new repo is one entry here (and the allowlists in the tests that name the three URLs).
- `lib/skills.ts`: one line per skill in `.claude/skills/`, keyed by folder name, in two groups (ticket cycle, supporting). A unit test compares the keys with the folders both ways, so adding or removing a skill needs a line change here. The How this site is built page (Workflow, Skills used, What it is made of, The record) has no per-PR data: the record links (board, merged PRs, repo) come from `lib/site.ts`.

## Placeholders
`<Placeholder>` (`app/_components/placeholder.tsx`) renders a muted paragraph with the visible label "Placeholder:" and `data-placeholder`. List what is left: `grep -r data-placeholder out/` after a build. Replacing one with real copy is deleting the component, nothing else. All three project pages also have their written text (`whatItDoes`, `whyItExists` are required in `lib/projects.ts`, no placeholder fallback); only How this site is built retains placeholders. No check fails while placeholders remain. About has none left: its three text sections are the owner's own paragraphs (a test compares them with `tests/about-text.ts`; change both together), and the two names in "What I am learning" are plain links.

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
- The navigation panel is the same on every page, home included (#33): wordmark first (the one home link; on home it is the current page), then primary links, with a bottom utility row (theme icon left, GitHub and LinkedIn right; #68); the big name on home is a plain heading in the page, with the intro. `html { scrollbar-gutter: stable }` (globals.css) keeps the layout width the same on short and long pages; `tests/e2e/shell-stable.spec.ts` checks positions on every page with classic scrollbars (headless Chromium hides them unless `--hide-scrollbars` is dropped).
- `tests/e2e/pages.spec.ts` (both builds): navigation, cards, repo links, home (first screen with no links in main, and navigation utilities with GitHub and LinkedIn) and About (no links section) with JavaScript on and off, placeholder colour.

## Links to other sites
Every link to another site (an absolute `http(s)` address whose origin is not the site's) opens in a new tab: `target="_blank"`, `rel="noopener noreferrer"` (profile links add `me`) and a visually hidden " (opens in a new tab)" at the end of the link (`.visually-hidden` in `app/globals.css`), so it is in the accessible name and works without JavaScript. Write such links with `ExternalLink` (`app/_components/external-link.tsx`); links inside the site use `Link` and get no `target`. Links in Markdown posts get the same markup from `lib/posts/markdown.ts` (see `blog.md`). `tests/e2e/external-links.spec.ts` parses every HTML file in `out/` (both builds) and fails on an external `a` without the attributes or the note, so any new external link must use the component or the pipeline.

The content footer is removed (#68). On phones the enhanced Menu button controls an independent panel; closed panel contents are unmounted. Before hydration and without JavaScript, navigation remains expanded in normal flow. The expanded panel contains the utility row beneath primary links, with a gap; closing Menu hides all utilities. The sheet and desktop panel scroll at short heights. The theme button shows its destination (sun for light, moon for dark), with an accessible action name and matching hover/focus tooltip. It is absent without JavaScript; profile links remain usable.

## Project explanations (#79–#81)

`lib/projects.ts` stores each project's What it does, How it works and Why it exists paragraphs, guide links and optional diagram metadata. The shared project page renders these at build time; summaries, slugs and metadata are independent of the longer explanation. Internal guide links use Link; external guides use ExternalLink.

The two README diagrams are unchanged, checked-in SVGs, served locally without runtime GitHub requests. Each has intrinsic dimensions, responsive sizing, descriptive alt text, a caption and a same-tab full-size link that works without JavaScript. The original light background is part of each SVG and remains in both site themes. The shared skills diagram describes the broader toolkit, including optional staging and production tools; it is not this site's deployment architecture.

| Local asset | Upstream source | Git blob SHA |
|---|---|---|
| `public/projects/josh-shared-skills/cycle.svg` | [shared skills delivery cycle](https://github.com/joshdengxd/josh-shared-skills/blob/main/assets/cycle.svg) | `0834829af75e544e17c17e43ea1879bc66e305fe` |
| `public/projects/job-search-skills/pipeline.svg` | [job-search pipeline](https://github.com/joshdengxd/job-search-skills/blob/main/assets/pipeline.svg) | `dda5f275a0f51c95c6160208018462f5d7de10c3` |

Update these assets deliberately from their upstream sources; there is no automatic synchronization. `tests/e2e/pages.spec.ts` covers How it works text, guide links, locally loaded diagrams and full-size links with and without JavaScript, in both themes and at mobile and desktop widths.
