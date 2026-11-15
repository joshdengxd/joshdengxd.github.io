---
name: land-ticket
description: Land a ticket's approved PR and follow it through - confirm checks and verification are green, merge, confirm the merge really happened, wait for the deploy, have a fresh subagent re-check the acceptance criteria on the deployed environment, then move the ticket to In review with the evidence and a checklist for the person to tick. Never moves a ticket to Done. Use only when the user says "land #N", "merge and land this PR", or runs /land-ticket.
---

# Land Ticket

Last agent stage of the ticket workflow: create -> refine -> implement and verify -> land. The person has reviewed the PR and said "land it"; this skill does the follow-through so nothing is skipped.

## Workflow states (shared by the four ticket skills)
Backlog -> Refined -> In progress -> In review -> Done.
This skill moves a ticket from In progress to **In review** (merged, deployed and re-checked; the person tries it). Only a person moves it to Done. When states are labels, each move replaces the previous state label. The user's "land it" request is the approval for the merge, the move and the landing comment.

## Project settings
Read the project's `AGENTS.md` (section "Ticket workflow settings"): tracker and repo, default branch, how states are shown (board column or label; default label `in-review`), merge method (default squash), the deploy workflow and where the deployed environment is. If a setting is missing, use the default below and say so; where there is no default, ask. Deploy settings have no default.

## Inputs
- PR number (or the ticket number; then find its open PR).

## Steps
1. **Confirm the ask.** Check that the user asked to land this PR in this conversation, or started `drain-refined` in it (which lands the PRs it opens); otherwise stop.
2. **Pre-merge check.** Find the linked tickets (the PR title ends with `(#N)` or `(KEY-123)`; the body has one `Refs` line per ticket). With several, steps 5 and 6 cover every one of them. Stop and report if any of these fail:
   - all required checks on the PR are green;
   - the PR is mergeable and targets the default branch;
   - the PR description has the acceptance criteria table and every criterion is **met**.
3. **Merge** with the project's merge method and delete the remote branch. Then read the PR state back from the code host; it must say merged. Do not trust the command's exit code alone.
4. **Wait for the deploy** (if the project deploys on merge): follow the deploy run to the end. If it fails, comment the failed run on the ticket, leave it In progress, and ask the user whether to retry, fix forward or revert.
5. **Check the deployed result.** Spawn a NEW subagent with fresh context and give it only the ticket's acceptance criteria and the deployed URL. Read-only: it may not edit, merge or post. For each criterion it records how it checked, what it saw, evidence, and met / not met / could not check. Criteria that only make sense locally (a build flag, a unit test) are marked "checked before merge" with a link to the PR table.
6. **Move the ticket.**
   - All met: move it to **In review** and comment on the ticket with: the PR link, the deploy run, the deployed check table, and a short checklist for the person to tick while trying it themselves.
   - Anything not met: leave it In progress, comment the failing evidence, and ask the user whether to fix forward or revert. Do not revert on your own.
7. **Update the local checkout**: remove the ticket's worktree and local branch, then fetch and fast-forward the default branch. If it cannot fast-forward, stop and ask; never create a merge commit or force anything.
8. **Report**: merged commit, deploy result, ticket state, comment link. Next: the person tries it and moves it to Done.

## Rules
- Never land without the user's explicit request for this PR (a `drain-refined` run the user started counts).
- Never move a ticket to Done and never close it; the person does that after trying it. If the person finds a problem in review, they move it back to In progress (or Refined if the plan must change) with a comment.
- Never skip a failed check, retry a failed deploy blindly, or revert without the user.
- One comment per landing; if you land again after a fix, update that comment in place.
