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
4. The user reviews the PR and says "land #N" -> `land-ticket`: PR criteria, landing steps, merge, deploy, fresh subagent checks the deployed criteria on the live site -> In review.
5. The user tries it and closes the issue (Done), or sends it back with a comment.
6. `wrap-up` at the end of a session.

Batch mode: `drain-refined` runs steps 3-4 unattended for every Refined ticket (grouped PRs, fresh verifiers, bounded fix rounds). The user starting it is the approval for its merges and landing steps; tickets still end in In review for the user to try. It needs Commands and Deploy set first.

## Ticket workflow settings
(read by create-ticket, refine-ticket, implement-and-verify-ticket, verify-against-criteria, land-ticket, drain-refined)
- Tracker: GitHub issues in joshdengxd/joshdengxd.github.io
- Identity: joshdengxd. Run gh with `GH_TOKEN=$(gh auth token --user joshdengxd)` on each call and push with that token as an HTTP auth header; never switch the active gh account.
- Default branch: main; merge method: squash
- Changes without a ticket (skill syncs, docs, PRD edits): a PR titled `chore: ...`, `checks` green, the user merges it.
- Max wait: 30 min for PR checks and for a deploy
- States: board "Personal site" (https://github.com/users/joshdengxd/projects/1), field Status: Backlog, Refined, In progress, In review, Done. New tickets are added to the board in Backlog. No state labels.
  Board ids: project `PVT_kwHOFRG3Ts4Brp0g`, Status field `PVTSSF_lAHOFRG3Ts4Brp0gzhp7iN8`, options Backlog `38d84374`, Refined `4468383d`, In progress `caa18168`, In review `5c7bb449`, Done `19ddfbc8`.
- Done: the user closes the issue (the board's built-in workflow moves it). Reopened or sent back: In progress for a small fix, Refined if the plan changes, with a comment.
- Labels: `ticket`, `prd-NNNN`
- PRDs: `docs/prd/NNNN-name.md`
- Ticket drafts: `drafts/tickets/`; scratch and run reports: `drafts/` (both git-ignored)
- Checks: the Commands section below
- Browser checks: local app via the run command (Chrome DevTools MCP); deployed: https://joshdengxd.github.io
- Deploy: GitHub Actions on merge to main -> https://joshdengxd.github.io; deployed commit: not set yet (#2 records it)
- Max fix rounds: 3

## Commands
Not set yet. #2 defines build / type check / lint / unit / e2e / run and records them here; "run" serves the static build `out/`, which is what Pages serves and what verifiers check.

## Boundaries
- Never merge, publish or post on GitHub without the user's approval (a `drain-refined` run the user started approves its own merges and landing comments). Any automated merge outside that (for example Dependabot) needs this line changed first.
- No personal data beyond what the user approved for the site. No former-employer internals (names of internal systems, URLs, code, tickets). No local file paths.
- Skills in `.claude/skills/` are copied from josh-shared-skills; change them there, not here.

## Context index
See `docs/context/INDEX.md`.
