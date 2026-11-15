---
name: implement-and-verify-ticket
description: Implement a refined ticket in an isolated worktree, then show it works before a PR is opened - type check, lint, unit tests and the e2e tests covering the change pass, a fresh subagent checks every local acceptance criterion (in a browser with Chrome DevTools MCP where it can be seen, otherwise by a test or command) and records evidence, and a second fresh subagent reviews the code against the criteria. Fix and re-verify with new subagents until everything passes, then open a PR (never merge). Also resumes a ticket sent back from review. Use when the user says "implement this ticket", "implement #N", or runs /implement-and-verify-ticket.
---

# Implement and Verify Ticket

Third stage of the ticket workflow: create -> refine -> implement and verify -> land. The agent that wrote the code is biased toward it, and "it compiles" is not "it works". So the gate is evidence: the project's own checks, plus every acceptance criterion checked by fresh subagents that never saw the implementer's reasoning.

## Workflow states (shared by the ticket skills)
Backlog -> Refined -> In progress -> In review -> Done.
This skill moves a ticket from Refined (or back from In review) to **In progress** when work starts; it stays there until `land-ticket`. Only a person moves a ticket to Done. When states are labels, each move replaces the previous state label. The user's request to implement this ticket is the approval for that move and for comments it posts.

## Project settings
Read the project's `AGENTS.md` (section "Ticket workflow settings"): tracker and repo, identity (use it for every push, PR and tracker call), default branch, how states are shown (board column or label; default label `in-progress`), check commands (type check, lint, unit, e2e), run command, max fix rounds (default 3). If a setting is missing, use the default and say so; where there is no default, ask. Commands have no default, with one exception: when this ticket's refinement is the one that defines them, use the commands it adds to `AGENTS.md` on the branch.

## Inputs
- A ticket in Refined with its refinement summary (from `refine-ticket`), or a ticket being resumed (see step 1).
- The acceptance criteria and landing steps come only from the refinement summary.

If the ticket is not refined, say so and suggest `refine-ticket` first; continue only if the user insists. If it is too big to implement and verify in one sitting, stop and send it back to refinement to be split.

## Steps
1. **Start.**
   - **Dependencies**: every ticket in its "Depends on" line should be In review or Done. If not, say which and continue only if the user insists.
   - **Resume or new**: look for an open PR whose only `Refs` line is this ticket. If there is one, continue on its branch: read the PR's review comments and the ticket comments since the last push, and fix what they name. Otherwise (no PR, a closed PR, or a PR shared with other tickets) create a new branch and worktree from the latest default branch; read the ticket comments for why earlier attempts failed. Never work on the default branch.
   - **Coming back from In review** (the person found a problem): comment on open tickets that depend on this one that it is being reworked.
   - Move the ticket to **In progress**.
2. **Implement** what the refinement summary says, following the current docs for the installed versions of every library and tool the change touches (`current-docs`); list the docs consulted for the PR. Add or update tests, including an end-to-end test for the new behaviour when the project has a suite. Do not run landing steps or change anything outside the repo (settings, labels, rulesets, hosting); those belong to `land-ticket`.
3. **Checks.** Run type check, lint, unit tests and the end-to-end tests that cover the change. All must pass before step 4.
4. **Behaviour check.** Spawn a NEW subagent with fresh context. Give it only: the acceptance criteria, how to start the app, and the step 3 output. It must not edit files; it may run the app, the existing tests, and any probe a criterion names (in a temporary clone, removed afterwards). It starts the app with the run command on a free port, confirms it is serving this commit, and stops it before returning. For each `local` criterion it records:
   - how it checked: in a browser with Chrome DevTools MCP when the behaviour is visible there, otherwise by running a test or command;
   - what it saw, with evidence (screenshot, test or command output, any console error or failed network call);
   - status: **met**, **not met**, or **could not check** (with the reason).
   `PR` and `deployed` criteria are listed as **on PR** or **after merge**, not judged.
5. **Code review.** Spawn another NEW subagent running `verify-against-criteria` on the branch. It does not see step 4's result.
6. **Decide.**
   - Every check green, every `local` criterion **met**, and the review PASS or PASS-with-remarks: go to step 7.
   - Otherwise: fix, rerun all of step 3, and run steps 4 and 5 again with NEW subagents. At the max fix rounds, stop and hand the open items to the user; the ticket stays In progress until they decide.
7. **PR.** Open a PR to the default branch (or update the existing one):
   - title: the ticket title followed by the ticket reference in parentheses: `(#N)` for GitHub, `(KEY-123)` for Jira;
   - body: `Refs #N` or `Refs KEY-123` (never `Closes`/`Fixes`/`Resolves`, so merging does not close the ticket and skip In review); `Verified at <commit sha>`; the criteria table (criterion, phase, how checked, status, evidence); the code-review verdict; the docs consulted (library, version, topic, source); the check results; the landing steps copied from the refinement summary.
   Every push after verification means verifying again and rewriting the body, `Verified at` included. Leave it for a person to review; landing is `land-ticket`.

## When a ticket goes back
| Event | Ticket goes to | Moved by | Next |
|---|---|---|---|
| Review asks for changes | stays In progress | - | this skill again; it continues on the PR |
| PR closed without merging | Refined (or Backlog if the plan is wrong), with a comment why | whoever closes it | refine again if needed, then this skill on a new branch |
| Deploy or deployed check fails after merge | stays In progress | `land-ticket` | this skill on a new branch to fix forward, or a person reverts |
| A revert is merged | Refined, with a comment linking the revert | the person who reverts | refine again if needed |
| The person finds a problem in In review, or reopens it after Done | In progress (small fix) or Refined (plan changes), with a comment | the person | this skill (it reads the comment) |
| `drain-refined` skips it | In progress (Backlog if it needs refinement), with a comment | `drain-refined` | this skill, or refine first |

## Rules
- The verifiers never see the implementer's reasoning or earlier verdicts.
- **Could not check** never counts as met.
- Never skip, disable or loosen a check, and never edit a test just to make it pass.
- Merge is always a human decision: a person asks for it (`land-ticket`) or starts a `drain-refined` run.
- If this skill already runs inside a subagent that cannot start its own subagents, stop after step 3 and return; the caller starts the verifiers and the fix rounds.
