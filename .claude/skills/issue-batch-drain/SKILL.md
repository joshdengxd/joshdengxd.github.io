---
name: issue-batch-drain
description: Work through a backlog of refined issues by clustering them into reviewable PRs, then handing each cluster to its own implementer subagent and a separate verifier subagent. Experimental; the user approves the plan first. Use when the user says "batch implement the backlog" or /issue-batch-drain.
---

# Issue Batch Drain

An orchestration pattern for clearing many small, already-refined issues without losing the thread. The orchestrator plans and keeps a ledger; subagents do the work.

## Plan
1. Read every refined issue (with its agreed scope).
2. Cluster issues that touch the same modules or depend on the same design decision, so one cluster = one PR a reviewer can hold in their head.
3. Order the clusters by dependency: anything others build on goes first; clusters that depend on nothing and carry little risk go in the middle; broad mechanical changes go last.
4. Present the clusters, the order and the reason for each. **Stop for approval.** This pattern is not run unattended.

## Execute
Take the approved clusters one at a time, never in parallel:
1. Start a fresh **implementer** subagent for the cluster. It works in its own worktree, implements and runs the checks (steps 1-3 of `implement-and-verify-ticket` if installed).
2. Start a different fresh **verifier** subagent for that branch (step 4 of `implement-and-verify-ticket`, plus `verify-against-criteria` if installed). The orchestrator starts it, because a subagent usually cannot start its own. On failure, send the findings to a new implementer and repeat, within the fix-round limit; on success, the implementer opens the PR.
3. Add one row to the ledger: cluster, PR link, verdict, open remarks. The orchestrator carries nothing else forward.

## If a cluster stalls
Stop and tell the user which cluster, what was tried and what blocked it. Do not force it through and do not start the next cluster on top of it.

## Finish
Hand the user the ledger. Merging stays with people.
