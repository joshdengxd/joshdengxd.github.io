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
- Raw HTML in the body fails the build (message: file, `body`, line). Use Markdown only. Fenced code blocks are highlighted at build time (see Code highlighting). Pictures: see Images in posts.
- A bad file fails `npm run build` with `content/posts/<file>.md: <field>: <message>`.

## Pipeline and pages
- `lib/posts/`: `loader.ts` (split `---`, `yaml`, `zod` strict schema in `schema.ts`, duplicate slugs, sorting, tags), `markdown.ts` (unified: remark-parse, remark-gfm, a picture check, remark-rehype, rehype-sanitize, the picture figure step, Shiki, rehype-stringify; build time only), `dates.ts`.
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
- **Where:** `public/blog/<slug>/<file>`, one folder per post (the slug is the post's file name). Next copies `public/` into the site as it is, so the file is served at `/blog/<slug>/<file>`. Formats: `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`. No GIF or video (motion is ticket #10). Keep files small: nothing is resized or optimised.
- **Syntax:** `![alt text](diagram.svg "Caption")`, by file name only, on a paragraph of its own. The title string is the optional caption: with one the picture becomes `<figure>` with `<figcaption>`, without one a `<figure>` with no caption.
- **Rules (each fails `npm run build` with `content/posts/<file>.md: body: line N: image "<name>": <reason>`):** the alt text is not empty (there is no decorative form in posts); the source is a bare file name that exists, with the exact case, in `public/blog/<slug>/` (a remote or data URL, a path with a slash or `..`, another format, a missing file, or a file that is not the image its extension says all fail); the picture is alone in its paragraph (no text or link around it); no reference-style `![x][ref]`. Raw `<img>` is raw HTML and still fails.
- **No layout shift:** the build reads the real size of the file (`image-size`, pure JS, pinned; an SVG uses its `viewBox` or width and height; a JPEG's EXIF turn is applied) and writes `width` and `height` on the `<img>`, with `loading="lazy"` and `decoding="async"`. CSS gives `height: auto` and `max-width`, so the aspect ratio reserves the space before the file loads, and the picture never widens the page (320 px included).
- **Plate:** every picture sits on the light plate `--color-plate` (padding on the `<img>`; the caption below it keeps the page colours), in both themes, so a light diagram stays readable in the dark theme. Draw diagrams in dark ink. The colour, its contrast checks and `/design/` are described in `design-language/README.md`.
- **How:** two steps in `markdown.ts`. `checkImages` runs on the Markdown tree before sanitizing (it can still see a data: URL and the line, which the sanitizer would strip) and throws `ImageError`; `loader.ts` turns that into `PostError` with the file line. `figureImages` runs after `rehype-sanitize`, the same place as Shiki, and writes the `<figure>` from the sanitized `img` (bare `src`, `alt`, `title`); the caption becomes text, never an attribute. Sanitizing itself is unchanged. `renderMarkdown(md, { slug, imageDir })` needs the post's slug and folder; without them any picture is an error (the /design/ code sample has none).
- **Fixture:** the fixture post has two pictures (one with a caption, one without) of `tests/fixtures/post-images/blog-engine-fixture/diagram.svg`, an 800 x 400 SVG. The loader reads fixture pictures from `tests/fixtures/post-images/<slug>/` and `scripts/build-fixture.mjs` copies that folder into `out/blog/` after the fixture build only; never put it in `public/`. `npm run check:fixture` fails when a fixture slug is in any path under `out/`, so a leaked picture is caught. Unit tests: `tests/unit/posts-images.test.ts` (with files in `tests/fixtures/images-unit/`); e2e: `blog-images.fixture.spec.ts`, `blog-images.default.spec.ts`.

## Test fixture
- `tests/fixtures/posts/` holds two test posts (one with code blocks in several languages, one with an unknown and one with no language, a GFM table and two pictures; the second sits 30 minutes after midnight UTC for the time-zone tests). They load only when `BLOG_FIXTURES=1`.
- `npm run e2e` builds with the flag through `scripts/run-e2e.mjs fixture` (which calls `scripts/build-fixture.mjs`, Windows-safe). The default build never reads them; `npm run e2e:default` tests that build (home shows "No posts yet").
- `npm run check:fixture` fails when a fixture slug or title is anywhere in `out/`; CI runs it after the default build and `deploy.yml` runs it before upload.
