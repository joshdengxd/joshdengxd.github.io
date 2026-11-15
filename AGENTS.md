# Project
Personal website of joshdengxd: who I am, how I think about agent-assisted software delivery, what my public repos do, and a blog of learning notes. The site itself is built with my own shared skills ([josh-shared-skills](https://github.com/joshdengxd/josh-shared-skills)), so its issues and PRs are the demo. Audience: engineers and engineering leaders.

## Look before asking
Search the code, docs, the issue and its refinement comment first. Ask the user only when they cannot answer it.

## Language
Everything in this repo and on GitHub (code, docs, issues, PRs, commits, comments) is in English.

## Workflow (every change)
0. Larger work starts as a PRD in `docs/prd/NNNN-name.md` (numbered; see `docs/prd/README.md`), reviewed by the user. PRDs are files, not issues.
1. `create-ticket`: PRD -> ticket drafts in `drafts/tickets/` -> user approves -> GitHub issues in Backlog. No code without a ticket (docs and skill syncs use the chore path in the settings below).
2. `refine-ticket`: one refinement summary on the issue (criteria with phases local / PR / deployed, landing steps, out of scope), approved by the user -> Refined. Deferred work always becomes its own ticket in the same approval.
3. `implement-and-verify-ticket`: -> In progress; worktree, implement, checks green, one fresh subagent checks each local criterion with evidence, another runs `verify-against-criteria` -> PR (`Refs #N`, title ends `(#N)`).
4. The user reviews the PR and says "land #N" -> `land-ticket`: PR criteria, landing steps, merge, deploy, fresh subagent checks the deployed criteria on the live site -> issue closed, Done.
5. The user samples the live site; a problem reopens the issue with a comment.
6. `wrap-up` at the end of a session.

Batch mode: `drain-refined` runs steps 3-4 unattended for every Refined ticket (grouped PRs, fresh verifiers, bounded fix rounds). The user starting it is the approval for its merges and landing steps; tickets end in Done once their deployed check passes. It needs Commands and Deploy set first.

## Ticket workflow settings
(read by create-ticket, refine-ticket, implement-and-verify-ticket, verify-against-criteria, land-ticket, drain-refined)
- Tracker: GitHub issues in joshdengxd/joshdengxd.github.io
- Identity: joshdengxd. Run gh with `GH_TOKEN=$(gh auth token --user joshdengxd)` on each call and push with that token as an HTTP auth header; never switch the active gh account.
- Default branch: main; merge method: squash
- Changes without a ticket (skill syncs, docs, PRD edits): a PR titled `chore: ...`, `checks` green, the user merges it.
- Auto-merge: Dependabot PRs whose update type is patch or minor (grouped PRs count as their highest type, security updates included) merge themselves once `checks` is green (`.github/workflows/dependabot-auto-merge.yml`, needs the repo setting "Allow auto-merge"); majors and everything else wait for the user. A merge made with the workflow token starts no push run, so the daily `deploy.yml` schedule deploys it within a day.
- Max wait: 30 min for PR checks and for a deploy
- States: board "Personal site" (https://github.com/users/joshdengxd/projects/1), field Status: Backlog, Refined, In progress, In review, Done. New tickets are added to the board in Backlog. No state labels.
  Board ids: project `PVT_kwHOFRG3Ts4Brp0g`, Status field `PVTSSF_lAHOFRG3Ts4Brp0gzhp7iN8`, options Backlog `38d84374`, Refined `4468383d`, In progress `caa18168`, In review `5c7bb449`, Done `19ddfbc8`.
- Landed tickets go to: Done. `land-ticket` closes the issue as completed once every deployed criterion is met, and sets the board to Done (the board's "Item closed" workflow is not relied on).
- Reopened or sent back: In progress for a small fix, Refined if the plan changes, with a comment.
- Labels: `ticket`, `prd-NNNN`
- PRDs: `docs/prd/NNNN-name.md`
- Ticket drafts: `drafts/tickets/`; scratch and run reports: `drafts/` (both git-ignored)
- Checks: the Commands section below
- Browser checks (Chrome DevTools MCP): before merge, locally against `out/` served by the run command; after merge, against the live site https://joshdengxd.github.io
- Deploy: `.github/workflows/deploy.yml` on push to main, daily (skips build and deploy when the live commit already equals main's head), or by hand (the `force` input redeploys regardless) -> https://joshdengxd.github.io; deployed commit: `<meta name="commit">` on every page holds the full SHA of the build
- Max fix rounds: 3

## Commands
Node 26 (`.nvmrc`). Install: `npm ci`; once per machine for e2e: `npx playwright install chromium`.
- Build: `npm run build` (static export to `out/`)
- Dev: `npm run dev` (dev server, http://localhost:3000; routing and 404 differ from Pages)
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Unit: `npm test` (Vitest, `tests/unit/`)
- e2e: `npm run e2e` (builds with the blog test fixture, `BLOG_FIXTURES=1`, through `scripts/run-e2e.mjs fixture`; serves `out/` on port 4173, runs Playwright Chromium, `tests/e2e/`). It leaves a fixture build in `out/`: never deploy or upload it. `npm run e2e:default` does the same on the default build (no fixture, then `check:fixture`). Specs named `*.fixture.spec.ts` run only on the fixture build, `*.default.spec.ts` only on the default one, all others on both.
- Fixture guard: `npm run check:fixture` (fails if the blog fixture's slug or title is anywhere in `out/`; run after the default `npm run build`)
- Run: `npm run build && npm run serve` (serves `out/` on http://localhost:3000, as Pages does; this is what verifiers check)
- CI: `.github/workflows/checks.yml`, one job `checks` on every PR: lint, type check, unit, default build + fixture guard, e2e on the fixture build, and e2e on the default build. `deploy.yml` runs the same guard after its build.

## Stack
Check code against the current docs for these versions before writing or approving it (`current-docs` skill; docs source Context7, id after the colon). Upgrades are their own tickets.
- Next.js 16.4.6: vercel/next.js (use `--version v16.4.5` or newer 16.x)
- React 19.3: reactjs/react.dev
- TypeScript 5.9: microsoft/typescript
- ESLint 9.39 + eslint-config-next 16.4.6: eslint/eslint
- Vitest 5.1 (Vite 8): vitest-dev/vitest
- Testing Library (react 16.3, dom 10.4, jest-dom 7.0): testing-library/react-testing-library
- Playwright 1.65: microsoft/playwright
- unified 11.0.5: unifiedjs/unified
- remark-parse 11.0.0: remarkjs/remark (parser; no own id, use `remarkjs/remark`)
- remark-gfm 4.0.1: remarkjs/remark-gfm
- remark-rehype 11.1.2: remarkjs/remark-rehype
- rehype-sanitize 6.0.0: rehypejs/rehype-sanitize
- rehype-stringify 10.0.1: rehypejs/rehype
- shiki 4.6.0 (build-time code highlighting, CSS-variables theme, JavaScript regex engine): shikijs/shiki
- @shikijs/rehype 4.6.0 (the rehype plugin; import the default export from `@shikijs/rehype/core`): shikijs/shiki (its docs live in the same repo)
- yaml 2.9.1 (post front matter): eemeli/yaml (use `--version v2.9.1`)
- zod 4.6.7 (front matter schema): colinhacks/zod (use `--version v4.6.7`)
- fast-xml-parser 5.12.0 (dev, feed test only): npm README
- GitHub Actions (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5, upload-artifact v7, dependabot/fetch-metadata v3.1.0): each action's README at its pinned tag
- npm override in `package.json`: `@typescript-eslint/typescript-estree` gets `minimatch ^11.0.1`, because its own `^10.2.2` range is in a Dependabot advisory (`>= 7.0.0, < 11.0.1`); scoped to that one package, since the other users need minimatch 3.x. Remove it when `@typescript-eslint/typescript-estree` requires minimatch >= 11.0.1.

## Boundaries
- Never merge, publish or post on GitHub without the user's approval (a `drain-refined` run the user started approves its own merges and landing comments). One automated merge is allowed: Dependabot patch and minor PRs, merged by `.github/workflows/dependabot-auto-merge.yml` through GitHub auto-merge once `checks` is green. Majors, failed checks and every other PR still need the user. Any other automated merge needs this line changed first.
- No personal data beyond what the user approved for the site. No former-employer internals (names of internal systems, URLs, code, tickets). No local file paths.
- Skills in `.claude/skills/` are copied from josh-shared-skills; change them there, not here.

## Context index
See `docs/context/INDEX.md`.
