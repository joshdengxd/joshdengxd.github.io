---
name: refine-ticket
description: Work through a ticket (Jira or GitHub issue) with the user until it is clear enough to implement, keep one living refinement summary on the ticket, and move it to Refined. Use when the user says "refine this ticket", "refine #N", names a ticket to nail down, or runs /refine-ticket.
---

# Refine Ticket

Second stage of the ticket workflow: create -> refine -> implement and verify -> land. A short conversation that replaces guessing later. The agent researches and proposes; the user decides.

## Workflow states (shared by the ticket skills)
Backlog -> Refined -> In progress -> In review -> Done.
This skill moves a ticket from Backlog to **Refined** (or keeps it in Refined when re-run). A ticket reaches Done by a person, or by `land-ticket` when the project sets "Landed tickets go to: Done". When states are labels, each move replaces the previous state label.

## Project settings
Read the project's `AGENTS.md` (section "Ticket workflow settings"): tracker and repo, identity (the account to post as), how states are shown (board column or label; default label `refined`), the project's docs (PRDs, context index), and the ticket drafts folder. If a setting is missing, use the default below and say so; where there is no default, ask.

## Stage 1: Read
Open the ticket, its comments, linked items, its PRD if any, and the tickets it depends on. If the ticket already carries a refinement summary, start from it. If it is closed or Done, ask before doing anything. If a dependency is not landed yet, say so.

## Stage 2: Research
For a non-trivial ticket, start a research subagent to look through the code and docs. It reports back: where the change would land, patterns the codebase already uses for similar work, what the current docs for the installed versions recommend for this kind of change (`current-docs`), and risks. It makes no edits. Skip it when the repo is tiny or the ticket touches only a few known files; say so.

## Stage 3: Decide together
Take the open points one at a time: scope, approach, affected files, edge cases, acceptance criteria, what is explicitly out of scope, and how each criterion will be verified. For each point, suggest an answer with a reason and let the user accept or change it. Settle small points quickly; spend the time on the ones that could send the work in different directions.

Settle these for every ticket:
- **Phase of each criterion**, when it can first be checked:
  - `local`: on the branch, before a PR (build, tests, browser on the local app, files);
  - `PR`: only once the PR exists (its CI run, its merge state);
  - `deployed`: only after merge and deploy (the live site, settings applied at landing).
- **Read-only checks.** Every criterion must be checkable by a verifier that does not change anything. If a criterion needs an action (push a test commit, open a throwaway PR, change a value and rebuild), name that probe in the criterion, including how it is undone; the verifier may run only named probes. Probes run in a temporary clone in the scratch folder, never in the main checkout or the ticket's worktree, and the clone is removed afterwards. Name any tool or file outside the repo a check needs (a script, git-ignored source files) with where to find it.
- **Landing steps.** Anything that changes the live system outside the repo (repository settings, rulesets, labels, a hosting switch, secrets) is not part of implementation. It is a landing step, before or after the merge, run by `land-ticket`. Note which criteria depend on it (they are then `deployed`). List every prerequisite as its own step (a setting another one needs turned on first), with how to confirm it took effect: `land-ticket` runs nothing that is not listed.
- **Deferred work.** Anything taken out of scope that should still happen becomes a new ticket draft.
- **Dependencies.** Confirm or correct the ticket's "Depends on" list.

## Stage 4: Write it up
Draft the summary with these sections:
- **What and why**
- **Decisions**
- **Where** (files and areas to change)
- **Landing steps** (only if any): `Before merge:` and `After merge:` lists, each step exact enough to run
- **Acceptance criteria**: table with #, criterion, phase, verified by
- **Out of scope** (with links to the tickets that cover deferred items)
- **Risks**

Check that:
- each acceptance criterion is something a reviewer can actually check, has a phase, and comes from a decision in stage 3;
- every criterion is checkable read-only or names its probe;
- no live-system change hides in Decisions instead of Landing steps;
- no question is left open;
- every document or ticket it mentions (PRD, design notes, other tickets) is a link the reader can click;
- the summary describes the final agreed plan only: no version labels, no history of earlier options.

Prepare alongside it, for the same approval:
- a `create-ticket` draft for each deferred item (in the ticket drafts folder);
- a proposed PRD edit, if the decisions change or contradict the PRD;
- the corrected "Depends on" line, if it changed.

## Stage 5: Publish
Show the summary, the deferred-ticket drafts and any PRD edit, and wait for the user's go-ahead. Then:
1. Post the summary as the ticket's single refinement summary. On later runs, edit that comment in place rather than adding another.
2. Make the summary the only list of acceptance criteria: in the ticket body, replace the criteria with a link to the summary comment, and update the "Depends on" line if it changed.
3. Create the deferred tickets with `create-ticket` (already approved here) and link them in the summary's Out of scope.
4. Apply the PRD edit through the project's normal change path (a PR when the default branch requires one).
5. Move the ticket to **Refined**, and tell the user the next step is `implement-and-verify-ticket`.

## Rules
- Never post, create or move anything before the user approves.
- Refinement does not write code or create branches; that is the next stage.
