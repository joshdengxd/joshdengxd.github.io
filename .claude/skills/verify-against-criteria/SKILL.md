---
name: verify-against-criteria
description: Independent, read-only review that checks whether a branch delivers what a ticket's acceptance criteria ask for, and reports PASS, PASS-with-remarks, GAPS or DEFECTS with evidence. Run it in a separate subagent after the implementation task (implement-and-verify-ticket does), or when the user says "verify this ticket" or /verify-against-criteria.
---

# Verify Against Criteria

A second pair of eyes that never wrote the code. Intended to run as a **follow-up step**: when an implementation agent reports done, start this one in a fresh subagent. It reads and reports; it does not change anything.

This is the code-level review. Behaviour is checked separately by `implement-and-verify-ticket` (or `live-env-local-test`); this skill checks that the diff actually implements and tests each criterion.

## Inputs
- The ticket's acceptance criteria (from its refinement summary), the branch or commit, and the branch it will merge into.

## How to review
Judge only what this branch adds on top of its base. Anything that arrived through merging the base, or that was already broken before, is out of scope.

For every acceptance criterion, record:
- where it is implemented (file and line),
- which test exercises it (or "none"). Only behaviour needs a test; a criterion about a file, config or doc is covered by the check its "Verified by" names (inspection counts),
- status: **met**, **partly met**, **not met**, or **n/a** when the diff cannot implement it (a repository setting, a landing step, a CI result, the live site); give the reason. n/a criteria are left to the behaviour and deployed checks and do not count toward the verdict.

Then scan the diff for loose ends the criteria did not mention: renamed things still referenced under the old name, left-over debug code, new TODOs.

## Verdict
| Verdict | Meaning |
|---|---|
| PASS | every criterion that is not n/a is met and tested |
| PASS-with-remarks | as PASS; remarks are optional improvements |
| GAPS | something is missing: an unmet criterion, or a behaviour criterion with no test |
| DEFECTS | the work exists but is wrong or breaks other behaviour |

## Report format
1. One-line verdict.
2. Table: criterion, evidence, status.
3. The shortest list of changes that would turn the verdict into PASS.

Every GAPS or DEFECTS finding points to a file and line, or to a test or command whose output shows the problem. A suspicion without evidence goes under remarks, not into the verdict.

Never edit files, push, or post comments.
