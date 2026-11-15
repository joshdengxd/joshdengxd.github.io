# Blog engine (ticket #6)

Read when you add a post or touch `lib/posts/`, `app/blog/`, `app/rss.xml/` or `app/sitemap.ts`.

## Add a post
One file: `content/posts/<slug>.md`. The file name is the slug (`^[a-z0-9]+(-[a-z0-9]+)*$`, not `tags`). Front matter, all four keys required, no others:
```
---
title: Plain title (1-120 characters)
date: 2026-11-15T18:00:00Z
tags: [agents, learning]
summary: One or two sentences (1-300 characters).
---
```
- `date` is a full UTC timestamp ending in `Z`. A date alone or an offset fails the build.
- `tags` is 1-5 slugs; each gets a page at `/blog/tags/<tag>/`.
- Raw HTML in the body fails the build (message: file, `body`, line). Use Markdown only. Fenced code blocks are highlighted at build time (see Code highlighting).
- A bad file fails `npm run build` with `content/posts/<file>.md: <field>: <message>`.

## Pipeline and pages
- `lib/posts/`: `loader.ts` (split `---`, `yaml`, `zod` strict schema in `schema.ts`, duplicate slugs, sorting, tags), `markdown.ts` (unified: remark-parse, remark-gfm, remark-rehype, rehype-sanitize, Shiki, rehype-stringify; build time only), `feed.ts` (RSS 2.0 by hand), `dates.ts`.
- `/blog/`, `/blog/<slug>/`, `/blog/tags/<tag>/`, `/rss.xml`, `/sitemap.xml` (every public route, see `pages.md`; the blog part is `/blog/`, posts, tag pages). Blog page metadata comes from `pageMetadata` through `blogMetadata`. Home shows the three newest posts (Latest posts) or "No posts yet".
- Static export refuses a dynamic route with no pages, so with no posts or tags each dynamic route generates one hidden page, `_none`: the 404 content with `noindex`, never linked, never in the sitemap or feed.
- Dates: HTML has `<time datetime=UTC>` with the UTC date; a client component swaps it for the reader's locale and zone after hydration.

## Code highlighting (ticket #16)
- Shiki 4 at build time through `@shikijs/rehype/core`, after `rehype-sanitize`: post content is sanitized exactly as before, then Shiki replaces each `<pre>` with its own markup. Nothing is loaded or run in the browser.
- Languages (`HIGHLIGHT_LANGUAGES` in `markdown.ts`): ts, tsx, js, jsx, json, bash, shell, yaml, md, css, html, diff, csharp (Shiki's aliases such as `sh`, `yml`, `cs` work too). Another language, no language, or Shiki's special languages (`ansi`) give plain code, no build error.
- Colours: Shiki's CSS-variables theme. The HTML only holds `var(--shiki-*)` references; the values are in `design-language/tokens.css` for both themes (roles in `design-language/README.md`, ratios on `/design/`). Change a colour there, and `tests/unit/tokens.test.ts` re-checks the 4.5:1 contrast.
- Layout: text keeps the reading measure; a code block may use the full width of the page column (long lines scroll inside it). The taste inspector's off-centre check needs boxes at the right margin on the post page at 768 px, and the wider block gives it that.
- The regex engine is Shiki's JavaScript one (no WebAssembly file, works in Vitest and the Next build).
- Why author text cannot leak: the Shiki output is built from the code text only. Its attributes are `class` (`shiki css-variables`, `line`), `style` (`var(--shiki-*)`) and `tabindex`; a `language-*` class the author wrote is dropped before Shiki reads it when that language is not loaded, and Shiki drops the element anyway. `tests/unit/posts-markdown.test.ts` has the check, including footnote ids (they are still the only ids).

## Test fixture
- `tests/fixtures/posts/` holds two test posts (one with code blocks in several languages, one with an unknown and one with no language, and a GFM table; the second sits 30 minutes after midnight UTC for the time-zone tests). They load only when `BLOG_FIXTURES=1`.
- `npm run e2e` builds with the flag through `scripts/run-e2e.mjs fixture` (which calls `scripts/build-fixture.mjs`, Windows-safe). The default build never reads them; `npm run e2e:default` tests that build (home shows "No posts yet").
- `npm run check:fixture` fails when a fixture slug or title is anywhere in `out/`; CI runs it after the default build and `deploy.yml` runs it before upload.
