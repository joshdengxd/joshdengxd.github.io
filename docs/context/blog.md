# Blog engine (ticket #6)

Read when you add a post or touch `lib/posts/`, `app/blog/` or `app/sitemap.ts`.

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
- `lib/posts/`: `loader.ts` (split `---`, `yaml`, `zod` strict schema in `schema.ts`, duplicate slugs, sorting, tags), `markdown.ts` (unified: remark-parse, remark-gfm, remark-rehype, rehype-sanitize, Shiki, rehype-stringify; build time only), `dates.ts`.
- `/blog/`, `/blog/<slug>/`, `/blog/tags/<tag>/`, `/sitemap.xml` (every public route, see `pages.md`; the blog part is `/blog/`, posts, tag pages). Blog page metadata comes from `pageMetadata` through `blogMetadata`. Home shows the three newest posts (Latest posts) or "No posts yet".
- Static export refuses a dynamic route with no pages, so with no posts or tags each dynamic route generates one hidden page, `_none`: the 404 content with `noindex`, never linked, never in the sitemap.
- Dates: HTML has `<time datetime=UTC>` with the UTC date; a client component swaps it for the reader's locale and zone after hydration.

## Code highlighting (ticket #16)
- Shiki 4 at build time through `@shikijs/rehype/core`, after `rehype-sanitize`: post content is sanitized exactly as before, then Shiki replaces each `<pre>` with its own markup. Nothing is loaded or run in the browser.
- Languages (`HIGHLIGHT_LANGUAGES` in `markdown.ts`): ts, tsx, js, jsx, json, bash, shell, yaml, md, css, html, diff, csharp (Shiki's aliases such as `sh`, `yml`, `cs` work too). Another language, no language, or Shiki's special languages (`ansi`) give plain code, no build error.
- Colours: Shiki's CSS-variables theme. The HTML only holds `var(--shiki-*)` references; the values are in `design-language/tokens.css` for both themes (roles in `design-language/README.md`, ratios on `/design/`). Change a colour there, and `tests/unit/tokens.test.ts` re-checks the 4.5:1 contrast.
- Layout: text keeps the reading measure; a code block may use the full width of the page column (long lines scroll inside it). The taste inspector's off-centre check needs boxes at the right margin on the post page at 768 px, and the wider block gives it that.
- The regex engine is Shiki's JavaScript one (no WebAssembly file, works in Vitest and the Next build).
- Why author text cannot leak: the Shiki output is built from the code text only. Its attributes are `class` (`shiki css-variables`, `line`), `style` (`var(--shiki-*)`) and `tabindex`; a `language-*` class the author wrote is dropped before Shiki reads it when that language is not loaded, and Shiki drops the element anyway. `tests/unit/posts-markdown.test.ts` has the check, including footnote ids (they are still the only ids).

## Images in posts (ticket #41)
- Put the file in `public/blog/<slug>/` (the post's slug) and write `![alt text](diagram.svg "Caption")` in the post: the file name only. The page serves it as `/blog/<slug>/diagram.svg`. Formats: `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp` (no GIF or video; motion is ticket #10). The caption (the Markdown title string) is optional.
- The picture must stand alone in its own paragraph (not in a sentence, link, list or table). Alt text is required.
- Each of these fails `npm run build` with `content/posts/<file>.md: body: line N: <message>`: empty alt text, a remote URL, a path (`/` or `..`), a data URL, a file that is not in the post's folder, another format, a file whose size cannot be read, a picture that is not alone in its paragraph.
- Output: `<figure><div><img ...></div><figcaption>...</figcaption></figure>`. `lib/posts/markdown.ts` (`rehypePictures`) writes it after `rehype-sanitize`, so sanitizing is unchanged and raw HTML is still refused. The `<img>` gets the file's real `width` and `height` (read with `image-size`; an SVG needs a `viewBox` or width and height), `loading="lazy"` and `decoding="async"`; CSS makes it `max-width: 100%; height: auto`, so the space is reserved from the aspect ratio and nothing shifts when the file loads.
- Look: the `<div>` is a plate in `--color-plate` (`#f3f0e6` in both themes, tokens.css), so a light diagram stays readable on the dark theme. The caption is muted text under it.
- Without an image folder (`renderMarkdown(markdown)` with no second argument, as the `/design/` sample does) pictures are dropped.
- Fixture: the fixture post ends with a picture; its file is `tests/fixtures/post-images/blog-engine-fixture/diagram.svg`, never in `public/`. `scripts/build-fixture.mjs` copies that folder into `out/blog/` after the build, and `check:fixture` fails if a fixture slug is in any path under `out/`.

## Test fixture
- `tests/fixtures/posts/` holds two test posts (one with code blocks in several languages, one with an unknown and one with no language, and a GFM table; the second sits 30 minutes after midnight UTC for the time-zone tests). They load only when `BLOG_FIXTURES=1`.
- `npm run e2e` builds with the flag through `scripts/run-e2e.mjs fixture` (which calls `scripts/build-fixture.mjs`, Windows-safe). The default build never reads them; `npm run e2e:default` tests that build (home shows "No posts yet").
- `npm run check:fixture` fails when a fixture slug or title is anywhere in `out/`; CI runs it after the default build and `deploy.yml` runs it before upload.
