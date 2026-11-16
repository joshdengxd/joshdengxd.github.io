# PRD-0001: Personal site v1

- Status: Approved (2026-11-14)
- Created: 2026-11-14
- Tickets: GitHub issues labelled `prd-0001`
- Amendment 2026-11-15: the workflow runs in two modes, unattended (`drain-refined`: only machine gates decide, the owner starts the run and samples the results) and step by step (the owner reviews and approves by hand). Wherever this PRD says the owner reviews or merges, read it as the step-by-step mode; irreversible actions outside the repository stay with the owner in both. Approved text otherwise unchanged. Tracked in issue #28.
- Amended 2026-11-15: no RSS feed (Pages table, requirement 9 and ticket 5 no longer include it).
- Amended 2026-11-15: Home is the first screen and the footer only (no focus line, featured repos or latest posts); About has no links section. The original lines below stay. Tracked in issue #45.

## Summary
A personal website that introduces me, shares how I think about agent-assisted software delivery, explains what my public repos do, and hosts a blog. The site is built with my own shared skills, so its issues and PRs are a public record of that workflow.

**v1 is the framework, not the content.** It delivers the stack, the architecture, the agent workflow wired into the repo, the design system, and every page as a working skeleton. Real copy, posts and images come later, in their own issues.

## Positioning
Software developer by background (since 2018), now training myself to be an **AI-native builder**. I like building useful things that help people.

Tone: show the work and the thinking.

## Goals
1. **Workflow in the repo.** Every change goes create ticket -> refine ticket -> implement and verify ticket -> code review -> land ticket, using the skills in `.claude/skills/`. The skills define the ticket and PR formats; CI makes the checks visible.
2. **Stack and architecture chosen and documented**, with the reasons.
3. **Design system** chosen deliberately (not a default template): type, colour, spacing, light and dark.
4. **Page skeletons** ready for content: Home, About, Projects, Blog, How this site is built, 404.
5. **Blog engine** ready: adding a post is adding one Markdown file.

## Audience
- Engineering leaders: in about 10 seconds, understand who I am and what I am good at.
- Engineers: enough depth to judge the work (repos, workflow record, posts).

## Non-goals (v1)
Real page copy, blog posts, photos, CMS, comments, newsletter, contact form, analytics or tracking, cookies, custom domain. The site is English only.

## Pages (skeletons in v1)
| Page | Will hold (content in later issues) |
|---|---|
| Home | Short intro, what I focus on, featured repos, latest posts. |
| About | Background, what I am learning, how I work, links (GitHub, LinkedIn). |
| Projects | One card and one page each for: josh-shared-skills, job-search-skills, this site. |
| Blog | Post list (newest first) with tags, post page, RSS. Shows an empty state while there are no posts. |
| How this site is built | The workflow, with links to the issues and PRs that built each part. |
| 404 | Simple page back to Home. |

Skeletons use clearly marked placeholder text only.

## Requirements
1. Posts are Markdown files with front matter (title, date, tags, summary). Front matter is validated and a bad file fails the build. Adding a post needs no code change.
2. Dates are stored in UTC (ISO 8601) and shown in the reader's locale and time zone. Without JavaScript, the UTC date is shown.
3. Markdown is rendered to HTML at build time, with raw HTML disabled. No MDX.
4. Navigation on every page; current page marked.
5. Dark theme by default for every visitor (and without JavaScript); a toggle switches to a light theme, the choice is remembered, and there is no flash of the wrong theme.
6. Responsive from 320 px wide.
7. Accessibility: WCAG 2.2 AA, full keyboard use, visible focus, alt text.
8. Content is readable without JavaScript.
9. Each page has a title, description, canonical URL and social preview metadata with absolute URLs. The site has a sitemap, robots file and RSS feed.
10. No third-party scripts, trackers or cookies at runtime. Fonts are font files in the repo (licences noted in `design-language/`), not fetched from a font service.

## Privacy
- Shown (the same as on LinkedIn): name "Xindong Deng (Josh)", location "Alberta, Canada", past employers and titles, GitHub, LinkedIn (https://www.linkedin.com/in/josh-deng-edm).
- Not shown: email, phone, city, street address.
- No former-employer internals: no internal system names, URLs, code or tickets. Work is described in general terms.
- Commits use the account's GitHub noreply address. A privacy check runs before every push.

## Technical approach (details settled in ticket 1)
| Area | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), static export, at or above the latest security release | My main stack; static export runs on GitHub Pages with no server. |
| Language | TypeScript, strict | |
| Content | Markdown files in `content/`, parsed and rendered at build | Simple; no runtime cost; posts are plain files. |
| Styling | Plain CSS with design tokens (CSS custom properties) | Small, no framework lock-in; tokens come from `design-language/` (ticket 3). |
| Checks | ESLint, TypeScript check, Vitest, Playwright | `implement-and-verify-ticket` requires checks and e2e to be green. |
| Verification | Browser checks run locally before merge, and on the live site after merge | No staging environment is needed for a static site. |
| CI/CD | GitHub Actions: checks on every PR; build and deploy to GitHub Pages on merge to main; least-privilege permissions, pinned actions, Dependabot | |
| Branch rules | main changes only through a PR with green checks; the owner merges (see the amendment of 2026-11-15) | Nothing reaches main unchecked. |
| Design | Direction chosen with the open-source taste skill (MIT, Leonxlnx/taste-skill) as a dev tool | Avoids a generic template look; checked in a real browser. |

Implementation notes from the architecture review are in `docs/context/static-export-notes.md`.

Only the shared skills this repo uses are copied in (see `docs/context/skills-source.md`); others, such as staging deploys and release gates, are added when the site needs them.

## Delivery
Tickets (each refined before work starts):
1. **Scaffold, CI, deploy:** Next.js static export, TypeScript, ESLint, Vitest, Playwright; CI on PRs; deploy to Pages on merge; a placeholder home page live.
2. **Workflow wiring:** labels, branch rules with the checks from ticket 1, Dependabot; commands recorded in AGENTS.md.
3. **Design system:** pick a direction with the taste skill; tokens for type, colour, spacing; light and dark; font files and licences. Lives in its own folder, `design-language/` (the decisions and their reasons, plus the token source the site imports).
4. **Layout shell:** header, navigation, footer, theme toggle, skip link, 404.
5. **Blog engine:** post loader, front-matter validation, list with tags, post page, RSS, empty state; a test-only fixture post behind a build flag.
6. **Page skeletons:** Home (including latest posts), About, Projects (three repo pages), How this site is built, with placeholder text.

## Later (not v1)
Quality gates (Lighthouse and automated accessibility checks in CI) and a full review and fix pass, once the first real posts exist.

## Done when
All six tickets are merged, the live site meets the requirements for the pages that exist, and each ticket's issue shows its refinement comment and a PR with verification evidence.
