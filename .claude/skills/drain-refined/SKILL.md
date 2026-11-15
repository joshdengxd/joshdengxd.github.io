---
name: drain-refined
description: Unattended drain loop - take every ticket in Refined, group compatible ones into shared PRs, then per group run implement (fresh subagent) -> behaviour check and code review (two more fresh subagents) -> fix rounds -> PR -> land-ticket, one group at a time, until no Refined ticket is left that can be done. Starting it is the approval for every state move, PR, landing step, merge and landing comment it makes; tickets end in In review, never Done. Use when the user says "drain refined", "ship all refined tickets", "do all the refined issues", or runs /drain-refined.
---

# Drain Refined

`implement-and-verify-ticket` and `land-ticket` run end to end for every Refined ticket, without stopping to ask. Speed comes from not waiting for a person between steps; correctness comes from gates no producer grades for itself: the project's checks, a fresh behaviour verifier, a fresh code reviewer, CI on the PR, and a fresh check on the deployed site. A ticket that cannot pass them is left for a person, never forced through.

## Approval and trust
Starting this skill is the user's explicit request to move, implement, open PRs for, run the landing steps of, merge and land every ticket it picks in this run (rung 3 of the trust ladder: agent does, person samples). It still never moves a ticket to Done and never closes one: the person tries each ticket in In review. It never reverts, force-pushes the default branch, skips or loosens a check, edits a test just to make it pass, or runs a landing step that is not in the refinement summary.

## Never ask mid-run
The sibling skills ask the user in some places. Inside this run every such point is replaced:
- an unrefined or too-big ticket, an unmet dependency, open items at the fix limit -> the group fails (section 7);
- red or unmergeable PR -> a fix round (section 5), then section 7;
- anything else a sibling would "stop and ask" about (a landing step fails, deploy fails, deployed check not met, the default branch cannot fast-forward) -> comment the evidence on the tickets, **stop the whole run**, report.

## Before starting
Read the project's `AGENTS.md` ("Ticket workflow settings"). Stop and say why if any of these is missing or wrong:
- check commands, run command, deploy workflow, deployed URL and how to tell the deployed commit are all set (a project still bootstrapping lands that ticket through `implement-and-verify-ticket` and `land-ticket` first);
- the identity is set, and calling the tracker with it returns that account with write access (pass the same identity instructions to every subagent);
- the main checkout's working tree is clean and on the default branch.
Also read: states, merge method, max fix rounds (default 3), max wait (default 30 minutes), scratch folder (default `drafts/`, git-ignored).

## Roles
- **Driver** (this session): the only one that writes to the tracker (state moves, comments) and the only one that opens and merges PRs and runs landing steps. It starts every subagent, runs `land-ticket`, keeps the ledger. It never enters a worktree and never reads diffs, code or full reports; it holds ticket lists, absolute paths, commit SHAs and the one-line JSON each subagent returns.
- **Subagents**: always fresh (`general-purpose`, never a fork), one job each, unattended: they make reasonable calls, never ask the user, never write to the tracker, never change anything outside the repo, and never start subagents of their own. Each prompt says so.
- **Run folder**: `<main checkout>/<scratch>/drain/<run-id>/`, passed to every subagent as an **absolute** path (never inside a worktree, which gets deleted). Each subagent writes its full report there as `<group>-<round>-<role>.md` and ends its final message with exactly one JSON line with absolute paths. A missing or unparseable JSON line counts as failure.

## Flow
```
loop:
  candidates = tickets in Refined, dependencies all In review or Done, not skipped this run
  if none: finish
  groups = one per ticket in dependency order (3 or fewer candidates), else planner subagent
  for each group, in order, one at a time:
    criteria file -> implement -> verify -> fix rounds -> PR + CI -> land
    on failure: split the group into single tickets and retry each once
  re-query
```
Strictly sequential, never parallel: every group branches from the default branch after the previous group has landed.

### 1. Candidates
List open tickets in Refined (board column or label, per settings). When the board is queried with `gh project item-list`, pass `--limit 200` (the default 30 silently drops items) and save the JSON to a file read as UTF-8 rather than piping it. Not a candidate: a ticket whose "Depends on" tickets are not yet In review or Done (report it at the end as blocked), or one already skipped in this run.

### 2. Plan
With 3 or fewer candidates, each ticket is its own group, in dependency order. Otherwise a planner subagent reads each ticket, its refinement summary and its PRD, and groups them:
- same files or modules, or one design decision shared by several tickets -> same group;
- a ticket that references another candidate goes with it or after it;
- a broad mechanical change (rename, sweep) goes alone and last;
- otherwise one ticket per group; small and independent is the default;
- a group must stay small enough for one reviewer to hold in their head.
Order: what others build on first, narrow before wide. Last line:
`{"groups":[{"tickets":[N,...],"theme":"...","why":"..."}]}`

### 3. Criteria file and implement (implementer subagent)
The driver moves every ticket in the group to **In progress** and writes `<run>/<group>-criteria.md`: per ticket, the acceptance criteria table (with phases) and the landing steps, copied from its refinement summary. Verifiers get this file, never the issue comments, so earlier failures or reviews do not leak in.

Prompt the implementer with the ticket numbers, the theme, the run folder, and: follow `implement-and-verify-ticket` steps 1-3 for the whole group as one branch, except that you do not move or comment on any ticket and do not ask anything:
- one worktree and branch from the latest default branch;
- implement everything each refinement summary says, including tests; change nothing outside the repo (landing steps are the driver's);
- run every check until all pass, push, leave the worktree in place;
- a ticket that is not refined enough or too big: return failed with `"kind":"needs-refinement"`.
Last line: `{"status":"ok","branch":"...","worktree":"...","sha":"<pushed head>","report":"..."}` or `{"status":"failed","ticket":N,"kind":"needs-refinement|other","reason":"..."}`.

### 4. Verify (two fresh subagents, never told each other's results or the implementer's reasoning)
Both get: the criteria file, the worktree, the commit `sha`, the run folder. Both first confirm the worktree's HEAD is that commit and echo it back.
- **Behaviour verifier** (`implement-and-verify-ticket` step 4). Prompt: "You are the verifier; do not start subagents." It starts the app with the run command on a free port, confirms it serves this build, checks every `local` criterion, runs only probes a criterion names (in a temporary clone under the run folder, removed afterwards), and stops the server before returning. Read-only otherwise. It writes the criteria table as markdown to its report. Last line: `{"sha":"...","all_met":true|false,"open":"...","report":"..."}` (`all_met` covers `local` criteria only).
- **Code reviewer**: `verify-against-criteria` on the commit against the default branch. Last line: `{"sha":"...","verdict":"PASS|PASS-with-remarks|GAPS|DEFECTS","report":"..."}`.

Pass = both echoed the right `sha`, `all_met` true, verdict PASS or PASS-with-remarks. "Could not check" is never met.

### 5. Fix rounds
On anything short of pass (including red CI in section 6), start a NEW implementer subagent in the same worktree with only the failing report paths: fix what they name, rerun all checks, push, return the new `sha`. Then verify again with two NEW subagents on that `sha`. Stop at the max fix rounds.

### 6. PR and CI
On pass, the driver opens one PR from the branch, first checking the remote branch head equals the verified `sha`. Title, `Refs` lines and body follow `implement-and-verify-ticket` step 7, with one `Refs #N` line per ticket and the primary (lowest) ticket in the title; build the body (with `Verified at <sha>`) from the behaviour report and criteria file with `--body-file`, without reading them into context. Wait for the PR's checks, at most the max wait (`gh pr checks --watch` under a timeout). Red checks, no checks, a timeout or an unmergeable PR go to a fix round; the push updates the PR, verification runs again on the new `sha`, and the driver rewrites the body from the new reports.

### 7. Land
Run `land-ticket` on the PR; this run is the request to land it. It runs the landing steps from the PR body that match the refinement summary, merges only if the PR head equals the `Verified at` commit, and gives its deployed check the `deployed` criteria. Each `Refs` ticket moves to **In review** with its own comment (the others may link to the primary ticket's comment for the evidence). Remove the group's worktree.

A failed landing step, failed deploy, deployed check not all met, or no fast-forward: stop the whole run; tickets stay In progress with the evidence commented. The next group would build on a broken default branch; a person decides whether to fix forward or revert.

### 8. Failure handling (keeps the loop finite)
When a group fails (implement failed, or still not passing after the fix rounds):
1. If the group had more than one ticket, split it and run each ticket alone through steps 3-7, once, in dependency order; before each, re-check its dependencies (one that failed in this split makes it blocked). If the group had opened a PR, close it with a comment linking the single-ticket attempts.
2. A single ticket that fails is skipped and never retried in this run:
   - `needs-refinement`: move it to **Backlog** (never back to Refined) with a comment saying what is unclear or why it must be split;
   - otherwise: leave it **In progress**, comment the reason and the open findings in one short paragraph, push its branch and link it. The next `implement-and-verify-ticket` run continues on that branch.
3. A PR opened for a failed single ticket stays open; never delete branches. Remove the worktrees of failed attempts after pushing.

Tickets that depend on a skipped ticket stay blocked and are reported.

## Finish
Report the ledger, one row per group: tickets, PR, rounds used, result (landed / skipped + reason / stopped). Then: tickets still blocked and why, tickets left In progress, and the final candidate query (should be empty). Next step for the person: try each ticket in In review and move it to Done. If a ticket goes back from In review, `implement-and-verify-ticket` tells its dependents.

## Rules
- One group at a time; the driver stays on the default branch in the main checkout.
- Every verifier is new: never reuse a subagent, never pass it the implementer's reasoning, earlier verdicts or issue comments.
- What was verified is what gets merged: same `sha` from verification to merge.
- No fix loop past the limit, no merge with anything short of pass, no continuing after a failed landing.
- Never move a ticket to Done, close it, or revert.
- One-shot: runs until nothing is left, then stops. For a recurring version, wrap it in a scheduler.
