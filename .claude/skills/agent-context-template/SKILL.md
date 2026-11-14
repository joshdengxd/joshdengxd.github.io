---
name: agent-context-template
description: Create or improve a repo's agent context (AGENTS.md or CLAUDE.md plus a small context index) so agents follow the project's architecture and current syntax. Use when starting agent-assisted work in a repo or when agents keep making the same mistakes.
---

# Agent Context Template

Good context is short, specific and discoverable. Put the rules at the top; push detail into an index the agent opens only when needed (progressive context discovery).

## Steps
1. Inspect the repo: layout, build/test/lint commands, framework versions, conventions.
2. Write `AGENTS.md` (under ~100 lines) using the template below.
3. Create `docs/context/INDEX.md`: one line per topic file ("when to read it"), plus the topic files: architecture constraints, framework guidance for the versions actually used, testing conventions, deployment.
4. Test it: give a fresh agent a small task and see whether it follows the constraints. Fix gaps in the context, not in the prompt.

## AGENTS.md template
```
# Project
One paragraph: what it is, who uses it.

## Look before asking
Search code, docs and the ticket first. Ask the user only when they cannot answer it.

## Commands
build / test / lint / run (exact commands)

## Architecture constraints
- Layers and allowed dependencies (a small table)
- Where new code goes

## Conventions
Naming, error handling, testing. Current framework versions and the syntax to use (and deprecated patterns to avoid).

## Boundaries
Never touch: generated files, migrations without review, production configs.

## Ticket workflow settings
(read by create-ticket, refine-ticket, implement-and-verify-ticket, land-ticket)
- Tracker: GitHub issues in <owner/repo> (or Jira project <KEY>)
- Default branch: main; merge method: squash
- States: board <name/number> columns Backlog, Refined, In progress, In review, Done
  (no board: labels refined, in-progress, in-review; Backlog = no label)
- Labels: ticket, prd-NNNN
- PRDs: docs/prd/NNNN-name.md; ticket drafts: drafts/tickets/ (git-ignored)
- Checks: <type check>, <lint>, <unit>, <e2e>; run app: <command>
- Deploy: <workflow> on merge to main -> <deployed URL>

## Context index
See docs/context/INDEX.md
```

## Maintenance
When an agent makes a repeated mistake, add the rule here. When a rule stops being true, delete it.
