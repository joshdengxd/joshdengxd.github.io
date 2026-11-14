# Static export notes (from the PRD-0001 architecture review, 2026-11-14)

Read when working on build, routing, metadata, content or CI. Verify against current docs before relying on a detail.

## Next.js export
- `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`. No `basePath`: this is a user site at the domain root.
- Set `metadataBase` to `https://joshdengxd.github.io` so social preview URLs are absolute. Use one URL form (trailing slash) in canonical tags, sitemap and RSS.
- RSS: route handler with `export const dynamic = 'force-static'`. Add `sitemap.ts` and `robots.ts`.
- Dynamic pages (posts, projects): `generateStaticParams` with `dynamicParams = false`.
- Next 16 removed `next lint`: run ESLint directly with a flat config.
- Do not let `actions/configure-pages` rewrite `next.config`.

## Content
- Front matter is validated with a schema (for example zod); a bad file fails the build.
- YAML turns `2026-11-14` into midnight UTC. Keep dates as ISO strings in UTC and convert for display in the reader's locale and time zone on the client; render the UTC date in the HTML for no-JS readers.
- Markdown via remark/rehype at build, raw HTML off (or rehype-sanitize). Highlight code at build time if needed.
- Fixture post only when `INCLUDE_FIXTURES=1`; never in the deployed build.

## Theme
- Default from CSS `prefers-color-scheme`. Saved choice in `localStorage`, applied by a small first-party inline script in `<head>` before first paint. Toggle hidden until JS runs. `suppressHydrationWarning` on `<html>`.

## Fonts
- Use `next/font/local` with font files in the repo (licences in `design-language/`), so the build does not fetch from a font service.

## CI/CD
- PR workflow: lint, type check, unit, build, e2e. Use `pull_request`, never `pull_request_target`.
- Deploy workflow: `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`; `github-pages` environment; concurrency group with `cancel-in-progress: false`.
- Permissions: `contents: read` by default; `pages: write` and `id-token: write` only on the deploy job. Pin actions by commit SHA. Dependabot for npm and actions.
- Branch rules: a ruleset needs each required check to have run once before it can be required.

## Verification
- Browser checks can run against the dev server; when routing, 404 or trailing-slash behaviour matters, also check the static build (`out/`) served locally.
- Useful e2e: click through every page and fail on any 404 or console error.
