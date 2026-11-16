# Static export notes (from the PRD-0001 architecture review, 2026-11-14)

Read when working on build, routing, metadata, content or CI. Verify against current docs before relying on a detail.

## Next.js export
- `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`. No `basePath`: this is a user site at the domain root.
- Set `metadataBase` to `https://joshdengxd.github.io` so social preview URLs are absolute. Use one URL form (trailing slash) in canonical tags and sitemap. A page's own `openGraph` or `twitter` replaces the parent's whole (shallow merge): use `pageMetadata` (`lib/metadata.ts`), see `pages.md`.
- Add `sitemap.ts` and `robots.ts`.
- Dynamic pages (posts, projects): `generateStaticParams` with `dynamicParams = false`.
- Next 16 removed `next lint`: run ESLint directly with a flat config.
- Do not let `actions/configure-pages` rewrite `next.config`.

## Content
- Front matter is validated by the strict Zod schema in `lib/posts/schema.ts`; a bad file fails the build.
- The loader uses the `yaml` package's default YAML 1.2 schema: dates stay strings. The Zod schema requires a full UTC timestamp ending in `Z` (for example `2026-11-15T18:00:00Z`); a bare date or an offset fails the build. Convert for display in the reader's locale and time zone on the client; render the UTC date in the HTML for no-JS readers. See `blog.md` and `tests/unit/posts-loader.test.ts`.
- Markdown via remark/rehype at build, raw HTML off (or rehype-sanitize). Highlight code at build time if needed.
- Fixture posts only when `BLOG_FIXTURES=1` (see `blog.md`); never in the deployed build: `deploy.yml` runs `npm run check:fixture` after the build.

## Theme
- Default is dark for everyone (not `prefers-color-scheme`); light only by the toggle. Saved choice in `localStorage`, applied by a small first-party inline script in `<head>` before first paint. Toggle hidden until JS runs. `suppressHydrationWarning` on `<html>`.

## Fonts
- Use `next/font/local` with font files in the repo (licences in `design-language/`), so the build does not fetch from a font service.

## CI/CD
- The `checks` job runs lint, format check, type check, unit tests, a default build and the fixture guard on every PR and manual run. Playwright Chromium e2e runs against both fixture and default builds only on manual runs and Dependabot PRs; ordinary PRs record passing local e2e results at the verified SHA, as required by `AGENTS.md`. Use `pull_request`, never `pull_request_target`.
- Deploy workflow: `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`; `github-pages` environment; concurrency group with `cancel-in-progress: false`.
- Permissions: `contents: read` by default; `pages: write` and `id-token: write` only on the deploy job. Pin actions by commit SHA. Dependabot for npm and actions.
- Branch rules: a ruleset needs each required check to have run once before it can be required.

## Verification
- Before merge, browser verifiers check the static build (`out/`) served locally with the run command in `AGENTS.md`; the dev server differs from Pages in routing and 404 behaviour. After merge, check the live site and confirm its commit meta matches the merged SHA. E2E also serves `out/`; fixture builds must never be deployed.
- Useful e2e: click through every page and fail on any 404 or console error.

## Windows builds
- Next.js 16.4 export writes nested prefetch segment files into folders on Windows (`about/__next.about/__PAGE__.txt`) while the client asks for the flat name (`about/__next.about.__PAGE__.txt`), so every prefetch of a nested page 404s. `npm run build` runs `scripts/flatten-export-segments.mjs` after `next build` to move them; on Linux (CI, deploy) it moves nothing.
