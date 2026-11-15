---
name: implement-and-verify-ticket
description: Implement a refined ticket in an isolated worktree, then show it works before a PR is opened - type check, lint, unit tests and the e2e tests covering the change pass, and a fresh subagent checks every acceptance criterion (in a browser with Chrome DevTools MCP where it can be seen, otherwise by a test or API call) and records evidence. Fix and re-verify with a new subagent until everything passes, then open a PR (never merge). Use when the user says "implement this ticket", "implement #N", or runs /implement-and-verify-ticket.
---

# Implement and Verify Ticket

Third stage of the ticket workflow: create -> refine -> implement and verify -> land. The agent that wrote the code is biased toward it, and "it compiles" is not "it works". So the gate is evidence: the project's own checks, plus every acceptance criterion checked by a fresh subagent that never saw the implementer's reasoning.

## Workflow states (shared by the four ticket skills)
Backlog -> Refined -> In progress -> In review -> Done.
This skill moves a ticket from Refined to **In progress** when work starts; it stays there until `land-ticket`. Only a person moves a ticket to Done. When states are labels, each move replaces the previous state label. The user's request to implement this ticket is the approval for that move.

## Project settings
Read the project's `AGENTS.md` (section "Ticket workflow settings"): tracker and repo, default branch, how states are shown (board column or label; default label `in-progress`), and the commands for type check, lint, unit, e2e and running the app. If a setting is missing, use the default below and say so; where there is no default, ask. Commands have no default.

## Inputs
- A ticket in Refined, with its refinement summary (from `refine-ticket`).
- Optional: max fix rounds (default 3).

A ticket moved back to In progress after review is fine: read the review comment first and fix what it names. If the ticket is not refined, say so and suggest `refine-ticket` first; continue only if the user insists. If it is too big to implement and verify in one sitting, stop and send it back to refinement to be split.

## Steps
1. **Start.** Move the ticket to **In progress**. Create a branch and worktree from the latest default branch. Never work on the default branch.
2. **Implement** what the refinement summary says. Add or update tests, including an end-to-end test for the new behaviour when the project has a suite.
3. **Checks.** Run type check, lint, unit tests and the end-to-end tests that cover the change. All must pass before step 4.
4. **Verification.** Spawn a NEW subagent with fresh context. Give it only: the acceptance criteria, how to reach the app, and the step 3 output. It must not edit files; it may run the app and the existing tests. For each criterion it records:
   - how it checked: in a browser with Chrome DevTools MCP when the behaviour is visible there, otherwise by running an existing test or an API call;
   - what it saw, with evidence (screenshot, test or command output, any console error or failed network call);
   - status: **met**, **not met**, or **could not check** (with the reason).

   It runs the app locally, or follows `live-env-local-test` itself when the change only makes sense inside a real environment.
5. **Decide.**
   - Every check green and every criterion **met**: go to step 6.
   - Otherwise: fix, rerun all of step 3, and verify again with another NEW subagent. At the max rounds, stop and hand the open items to the user; the ticket stays In progress until they decide.
6. **PR.** Open a PR to the default branch:
   - title: the ticket title followed by the ticket reference in parentheses: `(#N)` for GitHub, `(KEY-123)` for Jira;
   - body: `Refs #N` or `Refs KEY-123` (never `Closes`/`Fixes`/`Resolves`, so merging does not close the ticket and skip In review), the criteria table (criterion, how checked, status, evidence) and the check results.
   Leave it for a person to review; landing is `land-ticket`.

## Rules
- The verifier never sees the implementer's reasoning or earlier verdicts.
- **Could not check** never counts as met.
- Never skip, disable or loosen a check, and never edit a test just to make it pass.
- Merge is always a human decision: a person asks for it (`land-ticket`) or starts a `drain-refined` run.
- If this skill already runs inside a subagent that cannot start its own subagents, stop after step 3 and return; the caller starts the verifier and the fix rounds.
- For a code-level review of the diff (where each criterion is implemented, what tests cover it, loose ends), add `verify-against-criteria`. This skill shows behaviour; that one reads the code.
