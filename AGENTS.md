# Project
Personal website of joshdengxd: who I am, how I think about agent-assisted software delivery, what my public repos do, and a blog of learning notes. The site itself is built with my own shared skills ([josh-shared-skills](https://github.com/joshdengxd/josh-shared-skills)), so its issues and PRs are the demo. Audience: engineers and engineering leaders.

## Look before asking
Search the code, docs, the issue and its refinement comment first. Ask the user only when they cannot answer it.

## Language
Everything in this repo and on GitHub (code, docs, issues, PRs, commits, comments) is in English.

## Workflow (every change)
0. Larger work starts as a PRD in `docs/prd/NNNN-name.md` (numbered; see `docs/prd/README.md`), reviewed by the user. PRDs are files, not issues.
1. `create-ticket`: PRD -> ticket drafts in `drafts/tickets/` -> user approves -> GitHub issues in Backlog. No code without a ticket.
2. `refine-ticket`: one refinement summary on the issue, approved by the user -> Refined.
3. `implement-and-verify-ticket`: worktree, implement, checks green, fresh subagent verifies each acceptance criterion with evidence -> PR (`Refs #N`, title ends `(#N)`) -> In progress.
4. `verify-against-criteria`: fresh subagent, read-only code review of the PR.
5. The user reviews the PR and says "land #N" -> `land-ticket`: merge, deploy, fresh subagent re-checks on the live site -> In review.
6. The user tries it and moves it to Done.
7. `wrap-up` at the end of a session.

## Ticket workflow settings
(read by create-ticket, refine-ticket, implement-and-verify-ticket, land-ticket)
- Tracker: GitHub issues in joshdengxd/joshdengxd.github.io
- Default branch: main; merge method: squash
- States: board "Personal site" (https://github.com/users/joshdengxd/projects/1), field Status: Backlog, Refined, In progress, In review, Done. New tickets are added to the board in Backlog. Done = the user closes the issue (the board's built-in workflow moves it). No state labels.
- Labels: `ticket`, `prd-NNNN`
- PRDs: `docs/prd/NNNN-name.md`; ticket drafts: `drafts/tickets/` (git-ignored)
- Checks: not set yet (ticket 1 records them here)
- Deploy: GitHub Actions on merge to main -> https://joshdengxd.github.io (set up in ticket 1)

## Commands
Not set yet. The scaffold issue defines build / test / lint / run; record them here when it lands.

## Boundaries
- Never merge, publish or post on GitHub without the user's approval.
- No personal data beyond what the user approved for the site. No former-employer internals (names of internal systems, URLs, code, tickets). No local file paths.
- Skills in `.claude/skills/` are copied from josh-shared-skills; change them there, not here.

## Context index
See `docs/context/INDEX.md`.
