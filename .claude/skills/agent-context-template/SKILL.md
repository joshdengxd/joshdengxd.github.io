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
build / type check / lint / unit / e2e / run (exact commands; the ticket skills read them from here;
"run" starts the app the way it is deployed, which is what verifiers check)

## Architecture constraints
- Layers and allowed dependencies (a small table)
- Where new code goes

## Conventions
Naming, error handling, testing. Current framework versions and the syntax to use (and deprecated patterns to avoid).
Stack (docs source: Context7, via `current-docs`): one line per library: name, installed version, Context7 id.

## Boundaries
Never touch: generated files, migrations without review, production configs.

## Ticket workflow settings
(read by create-ticket, refine-ticket, implement-and-verify-ticket, verify-against-criteria, land-ticket, drain-refined)
- Tracker: GitHub issues in <owner/repo> (or Jira project <KEY>)
- Identity: the account every tracker call, push and merge uses, and how
  (e.g. gh with GH_TOKEN=$(gh auth token --user <account>) on each call; never switch the active account)
- Default branch: main; merge method: squash
- Changes without a ticket (skill syncs, docs, PRD edits): <path, e.g. a PR titled "chore: ..." landed like a ticket (asked for, or by an unattended run the owner started)>
- Max wait: 30 min for PR checks and for a deploy
- States: board <name/number> columns Backlog, Refined, In progress, In review, Done
  (no board: labels refined, in-progress, in-review; Backlog = no label)
  Board ids for scripted moves: project <id>, Status field <id>, options <name=id, ...>
- Landed tickets go to: In review (step by step: the person tries it and moves it to Done) | Done (unattended, `drain-refined`: land-ticket closes it after the deployed check passes; the person samples)
- Done: closing the issue; check whether the board moves it, or say that the agent sets it. Reopened or sent back:
  In progress for a small fix, Refined if the plan changes, always with a comment.
- Labels: ticket, prd-NNNN
- PRDs: docs/prd/NNNN-name.md
- Ticket drafts: drafts/tickets/; scratch and run reports: drafts/ (both git-ignored)
- Checks: the Commands section above
- Browser checks: local app via the run command (Chrome DevTools MCP); deployed: <URL>
- Deploy: <workflow> on merge to main -> <deployed URL>; deployed commit shown at <where>
- Max fix rounds: 3

## Context index
See docs/context/INDEX.md
```

## Maintenance
When an agent makes a repeated mistake, add the rule here. When a rule stops being true, delete it.
