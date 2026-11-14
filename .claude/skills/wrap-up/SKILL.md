---
name: wrap-up
description: End-of-session routine that turns what just worked into long-term memory (the successful path, commands, pitfalls), updates project docs, tidies, commits, and reports in a few lines. Use when the user says "wrap up" or runs /wrap-up.
---

# Wrap-up

The point: an agent working in the same domain for months should get better at it. After a task succeeds, capture the path that worked so the next session follows it instead of rediscovering it.

## 1. Remember the successful path
For each task completed this session, write or update ONE memory entry:
- **Goal**: what was being done, in one line.
- **Path that worked**: the steps, commands and files, in order.
- **Pitfalls**: what failed first and why; what to avoid.
- **How to verify**: the check that proved it worked.
- **Date and where it applies** (repo, service, environment).

Search existing memories first and update the matching one; never add a near-duplicate. Delete entries that turned out wrong. One short index line per entry. Record user preferences and corrections too (what to do differently, and why).

## 2. Update project files
Docs, trackers, runbooks touched today: make them consistent. A new team rule belongs in the repo's rules file (AGENTS.md), not only in memory.

## 3. Tidy
Remove scratch files and stop background jobs you started. Do not touch files you did not create.

## 4. Commit and push
Commit with a concise message. Push only if a remote already exists; never force-push; never bypass hooks. Never commit secrets.

## 5. Report (6 lines max)
What was saved, commit hash and push status, what is still open, and the first step for next time.

## Do not store
Secrets, tokens, personal data, anything the repo or git history already records.
