---
name: drain-refined
description: Unattended drain loop - take every ticket in Refined, group compatible ones into shared PRs, then per group run implement (fresh subagent) -> behaviour check and code review (two more fresh subagents) -> fix rounds -> PR -> land-ticket, one group at a time, until no Refined ticket is left that can be done. Starting it is the approval for every state move, PR, merge and landing comment it makes; tickets end in In review, never Done. Use when the user says "drain refined", "ship all refined tickets", "do all the refined issues", or runs /drain-refined.
---

# Drain Refined

The ticket workflow (create -> refine -> implement and verify -> land) run end to end for every Refined ticket, without stopping to ask. Speed comes from not waiting for a person between steps; correctness comes from gates no producer grades for itself: the project's checks, a fresh behaviour verifier, a fresh code reviewer, CI on the PR, and a fresh check on the deployed site. A ticket that cannot pass them is left for a person, never forced through.

## Approval and trust
Starting this skill is the user's explicit request to move, implement, open PRs for, merge and land every ticket it picks in this run (rung 3 of the trust ladder: agent does, person samples). It still never moves a ticket to Done and never closes one: the person tries each ticket in In review. It never reverts, force-pushes the default branch, skips or loosens a check, or edits a test just to make it pass.

## Never ask mid-run
The sibling skills ask the user in some places. Inside this run every such point is replaced:
- a missing setting, an unrefined or too-big ticket, open items at the fix limit -> the group fails (section 8);
- red or unmergeable PR -> a fix round (section 5), then section 8;
- anything else a sibling would "stop and ask" about (deploy failed, deployed check not met, the default branch cannot fast-forward, a landing step fails) -> comment the evidence on the tickets, **stop the whole run**, report.

## Project settings
Read the project's `AGENTS.md` ("Ticket workflow settings"): tracker and repo, default branch, how states are shown, merge method, check commands, run command, deploy and deployed URL, drafts folder (default `drafts/`, must be git-ignored). Re-read it at the start of every round and after every merge: a ticket landed earlier in the run may have filled in a setting.

**Missing checks are never green.** If check or run commands are not set, the only candidate allowed this round is a ticket whose refinement defines them; it adds them to `AGENTS.md` on its own branch, and its verifiers use the branch's `AGENTS.md`. Every other ticket waits until it has landed. If no such ticket exists, stop and report.

Stop before starting, and say why, if: the main checkout's working tree is not clean, it is not on the default branch, or the tracker cannot be reached with write access.

## Roles
- **Driver** (this session): the only one that writes to the tracker (state moves, comments) and the only one that opens and merges PRs. It starts every subagent, runs `land-ticket`, keeps the ledger. It never enters a worktree and never reads diffs, code or full reports; it holds ticket lists, absolute paths, commit SHAs and the one-line JSON each subagent returns.
- **Subagents**: always fresh (`general-purpose`, never a fork), one job each, unattended: they make reasonable calls, never ask the user, never write to the tracker, and never start subagents of their own. Each prompt says so.
- **Run folder**: `<main checkout>/<drafts>/drain/<run-id>/`, passed to every subagent as an **absolute** path (never inside a worktree, which gets deleted). Each subagent writes its full report there as `<group>-<round>-<role>.md` and ends its final message with exactly one JSON line with absolute paths. A missing or unparseable JSON line counts as failure.

## Flow
```
loop:
  candidates = tickets in Refined, dependencies all In review or Done, not skipped this run
  if none: finish
  plan = planner subagent groups and orders the candidates
  for each group, in order, one at a time:
    criteria file -> implement -> verify (behaviour + code review) -> fix rounds -> PR + CI -> land
    on failure: split the group into single tickets and retry each once
  re-query
```
Strictly sequential, never parallel: every group branches from the default branch after the previous group has landed.

### 1. Candidates
List open tickets in Refined (board column or label, per settings). When the board is queried with `gh project item-list`, pass `--limit 200` (the default 30 silently drops items) and save the JSON to a file read as UTF-8 rather than piping it. Not a candidate: a ticket whose "Depends on" tickets are not yet In review or Done (report it at the end as blocked), or one already skipped in this run.

### 2. Plan (planner subagent)
Give it the candidate ticket numbers and the repo. It reads each ticket, its refinement summary and its PRD, and groups them:
- same files or modules, or one design decision shared by several tickets -> same group;
- a ticket that references another candidate goes with it or after it;
- a broad mechanical change (rename, sweep) goes alone and last;
- otherwise one ticket per group; small and independent is the default;
- a group must stay small enough for one reviewer to hold in their head.
Order: what others build on first (a ticket that defines checks or deploy goes first), narrow before wide. Last line:
`{"groups":[{"tickets":[N,...],"theme":"...","why":"..."}]}`

### 3. Criteria file and implement (implementer subagent)
The driver moves every ticket in the group to **In progress**. It then writes `<run>/<group>-criteria.md`: for each ticket, the acceptance criteria and landing steps copied verbatim from its refinement summary (the summary wins over the body). Verifiers get this file, never the issue comments, so earlier failures or reviews do not leak in.

Prompt the implementer with the ticket numbers, the theme, the run folder, and: follow `implement-and-verify-ticket` steps 1-3 for the whole group as one branch, except that you do not move any ticket and do not ask anything:
- one worktree and branch from the latest default branch;
- implement everything each refinement summary says, including tests (an end-to-end test for new behaviour when the project has a suite);
- steps the refinement assigns to landing (for example a repo setting changed right before the merge) are not done now; return them, quoted from the refinement;
- run every check from the settings (the branch's `AGENTS.md` if this ticket defines them) until all pass, push, leave the worktree in place;
- a missing setting, or a ticket that is not refined enough or too big: return failed with `"kind":"needs-refinement"`.
Last line: `{"status":"ok","branch":"...","worktree":"...","sha":"<pushed head>","landing_steps":["..."],"report":"..."}` or `{"status":"failed","ticket":N,"kind":"needs-refinement|other","reason":"..."}`.

### 4. Verify (two fresh subagents, never told each other's results or the implementer's reasoning)
Both get: the criteria file, the worktree, the commit `sha`, the run folder. Both first confirm the worktree's HEAD is that commit and echo it back.
- **Behaviour verifier**. Prompt: "You are the verifier; do not start subagents." Start the app with the run command from the worktree's `AGENTS.md` on a free port no other run uses, confirm it serves this build, check every criterion in a browser (Chrome DevTools MCP) where it can be seen, otherwise by a test or command, and stop the server before returning. Read-only. Record per criterion how checked, what it saw, evidence, met / not met / could not check, as a markdown table in its report. Last line: `{"sha":"...","all_met":true|false,"open":"...","report":"..."}`.
- **Code reviewer**: `verify-against-criteria` on the commit against the default branch, for every ticket's criteria. Last line: `{"sha":"...","verdict":"PASS|PASS-with-remarks|GAPS|DEFECTS","report":"..."}`.

Pass = both echoed the right `sha`, `all_met` true, verdict PASS or PASS-with-remarks. "Could not check" is never met.

### 5. Fix rounds
On anything short of pass (including red CI in section 6), start a NEW implementer subagent in the same worktree with only the failing report paths: fix what they name, rerun all checks, push, return the new `sha`. Then verify again with two NEW subagents on that `sha`. At most 3 fix rounds per group.

### 6. PR and CI
On pass, the driver opens one PR from the branch to the default branch, first checking the remote branch head equals the verified `sha`:
- title: the primary (lowest) ticket's title and `(#N)`;
- body: one `Refs #N` line per ticket (never Closes/Fixes/Resolves), the last behaviour report's criteria table (built with `--body-file` from that file, without reading it into context), the check results, the code-review verdict, the landing steps.
Wait for the PR's checks to finish (`gh pr checks --watch`). Red checks or a PR that is not mergeable go to a fix round (the PR is updated by the push, and verification runs again on the new `sha`).

### 7. Land
1. **Landing steps**: run only steps that appear verbatim in the criteria file. If one is not there, or fails, stop the run before merging.
2. Run `land-ticket` on the PR; this run is the request to land it. Merge only if the PR head still equals the verified `sha` (`gh pr merge --match-head-commit <sha>`).
3. After the merge, fast-forward the default branch and re-read `AGENTS.md` before the deploy wait (the ticket may just have defined the deploy). If deploy is still undefined, stop the run.
4. `land-ticket`'s deployed check gets the criteria file; it first confirms the deployed site serves the merged commit (a build id in the page, or the deploy run for that commit) before judging. It covers every `Refs` ticket, and each moves to **In review** with its own comment (the others may link to the primary ticket's comment for the evidence).
5. Remove the group's worktree.

Deploy failure, deployed check not all met, or no fast-forward: stop the whole run, tickets stay In progress with the evidence commented. The next group would build on a broken default branch; a person decides whether to fix forward or revert.

### 8. Failure handling (keeps the loop finite)
When a group fails (implement failed, or still not passing after the fix rounds):
1. If the group had more than one ticket, split it and run each ticket alone through steps 3-7, once.
2. A single ticket that fails is skipped and never retried in this run:
   - `needs-refinement`: move it to **Backlog** (never back to Refined) with a comment saying what is unclear or why it must be split;
   - otherwise: leave it **In progress**, comment the reason and the open findings in one short paragraph, push its branch and link it.
3. A PR opened for a failed group stays open; never delete branches. Remove the worktrees of failed attempts after pushing.

Tickets that depend on a skipped ticket stay blocked and are reported.

## Finish
Report the ledger, one row per group: tickets, PR, rounds used, result (landed / skipped + reason / stopped). Then: tickets still blocked and why, and the final candidate query (should be empty). Next step for the person: try each ticket in In review and move it to Done.

## Rules
- One group at a time; the driver stays on the default branch in the main checkout.
- Every verifier is new: never reuse a subagent, never pass it the implementer's reasoning, earlier verdicts or issue comments.
- What was verified is what gets merged: same `sha` from verification to merge.
- No fix loop past the limit, no merge with anything short of pass, no continuing after a failed landing.
- Never move a ticket to Done, close it, or revert.
- One-shot: runs until nothing is left, then stops. For a recurring version, wrap it in a scheduler.
