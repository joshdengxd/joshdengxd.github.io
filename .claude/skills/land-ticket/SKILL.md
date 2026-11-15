---
name: land-ticket
description: Land a ticket's approved PR and follow it through - confirm checks, verification and code review are green and the PR-phase criteria hold, run the refinement's landing steps, merge, confirm the merge really happened, wait for the deploy, have a fresh subagent check the deployed criteria on the live environment, then move the ticket to In review with the evidence and a checklist for the person (or, when the project says so, close it as Done). Use only when the user says "land #N", "merge and land this PR", or runs /land-ticket.
---

# Land Ticket

Last agent stage of the ticket workflow: create -> refine -> implement and verify -> land. The person has reviewed the PR and said "land it"; this skill does the follow-through so nothing is skipped.

## Workflow states (shared by the ticket skills)
Backlog -> Refined -> In progress -> In review -> Done.
This skill moves a ticket from In progress to **In review** (merged, deployed and re-checked; the person tries it), or straight to **Done** when the project sets "Landed tickets go to: Done" (the person then samples). When states are labels, each move replaces the previous state label. The user's "land it" request is the approval for the merge, for the landing steps listed in the PR body, for the state move and for the landing comment.

## Project settings
Read the project's `AGENTS.md` (section "Ticket workflow settings"): tracker and repo, identity (use it for every merge, API call and comment), default branch, how states are shown (board column or label; default label `in-review`), merge method (default squash), landed tickets go to (default In review), max wait (default 30 minutes), the deploy workflow, the deployed URL, and how to tell which commit is deployed. If a setting is missing, use the default and say so; where there is no default, ask. Deploy settings have no default; re-read them after the merge, since the ticket being landed may be the one that defines them.

## Inputs
- PR number (or the ticket number; then find its open PR).

## Steps
1. **Confirm the ask.** Check that the user asked to land this PR in this conversation, or started `drain-refined` in it (which lands the PRs it opens); otherwise stop.
2. **Pre-merge check.** Find the linked tickets (the PR title ends with `(#N)` or `(KEY-123)`; the body has one `Refs` line per ticket). With several, the steps below cover every one of them. Wait for the PR's checks to finish, at most the max wait. Stop and report if any of these fail:
   - all required checks on the PR are green (none reported, or still running at the max wait, counts as not green);
   - the PR head is the commit in the body's `Verified at` line;
   - the PR is mergeable and targets the default branch;
   - the PR description has the criteria table, every `local` criterion is **met**, and the code-review verdict is PASS or PASS-with-remarks;
   - every `PR` criterion holds, judged from the PR's own checks and merge state (record each with a link).
3. **Landing steps before merge**: take the steps from the PR body and check them against the refinement summary; any step not in the summary is not run. Run the "Before merge" steps and confirm each took effect. If one fails, stop before merging.
4. **Merge** with the project's merge method and delete the remote branch, and only if the PR head still equals the `Verified at` commit (`gh pr merge --match-head-commit <sha>`). Then read the PR state back from the code host; it must say merged. Do not trust the command's exit code alone.
5. **Landing steps after merge**: run the "After merge" steps and confirm each took effect.
6. **Wait for the deploy** (if the project deploys on merge): follow the deploy run to the end, at most the max wait. If it fails or times out, comment the failed run on the ticket, leave it In progress, and ask the user whether to retry, fix forward or revert.
7. **Check the deployed result.** Spawn a NEW subagent with fresh context and give it only the ticket's `deployed` criteria, the deployed URL and the merged commit. It first confirms the environment serves that commit, then checks each criterion. Read-only, except probes a criterion names, which it runs in a temporary clone in the scratch folder (never the main checkout, whose default branch must stay clean for step 9) and undoes as the criterion says: it may not edit, merge or post. For each criterion it records how it checked, what it saw, evidence, and met / not met / could not check.
8. **Move the ticket.**
   - All met: comment on the ticket with: the PR link, the deploy run, the `PR` and deployed check tables, and a short checklist for the person to try it. Then move it to **In review**, or, when the project sets "Landed tickets go to: Done", close it as completed and make sure the board shows **Done** (set it if the board's own workflow does not).
   - Anything not met: leave it In progress, comment the failing evidence, and ask the user whether to fix forward or revert. Do not revert on your own.
9. **Update the local checkout**: remove the ticket's worktree and local branch, then fetch and fast-forward the default branch. If it cannot fast-forward, stop and ask; never create a merge commit or force anything.
10. **Report**: merged commit, deploy result, ticket state, comment link. Next: the person tries it (and moves it to Done when it stopped at In review).

## Rules
- Never land without the user's explicit request for this PR (a `drain-refined` run the user started counts).
- Never run a landing step that is not in the refinement summary.
- Move a ticket to Done or close it only when every deployed criterion is met and the project sets "Landed tickets go to: Done"; otherwise the person does that after trying it. If the person finds a problem (in review, or after Done), they reopen it or move it back to In progress (small fix) or Refined (plan changes) with a comment, and `implement-and-verify-ticket` picks it up.
- Never skip a failed check, retry a failed deploy blindly, or revert without the user.
- One comment per landing; if you land again after a fix, update that comment in place.
