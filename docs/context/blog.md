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
- Raw HTML in the body fails the build (message: file, `body`, line). Use Markdown only; code blocks are plain `<pre><code>` (highlighting is a later ticket).
- A bad file fails `npm run build` with `content/posts/<file>.md: <field>: <message>`.

## Pipeline and pages
- `lib/posts/`: `loader.ts` (split `---`, `yaml`, `zod` strict schema in `schema.ts`, duplicate slugs, sorting, tags), `markdown.ts` (unified: remark-parse, remark-gfm, remark-rehype, rehype-sanitize, rehype-stringify; build time only), `feed.ts` (RSS 2.0 by hand), `dates.ts`.
- `/blog/`, `/blog/<slug>/`, `/blog/tags/<tag>/`, `/rss.xml`, `/sitemap.xml` (home, `/blog/`, posts, tag pages).
- Static export refuses a dynamic route with no pages, so with no posts or tags each dynamic route generates one hidden page, `_none`: the 404 content with `noindex`, never linked, never in the sitemap or feed.
- Dates: HTML has `<time datetime=UTC>` with the UTC date; a client component swaps it for the reader's locale and zone after hydration.

## Test fixture
- `tests/fixtures/posts/` holds two test posts (one with a code block and a GFM table; the second sits 30 minutes after midnight UTC for the time-zone tests). They load only when `BLOG_FIXTURES=1`.
- `npm run e2e` builds with the flag through `scripts/build-fixture.mjs` (Windows-safe). The default build never reads them.
- `npm run check:fixture` fails when a fixture slug or title is anywhere in `out/`; CI runs it after the default build and `deploy.yml` runs it before upload.
