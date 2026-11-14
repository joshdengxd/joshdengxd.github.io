---
name: refine-ticket
description: Work through a ticket (Jira or GitHub issue) with the user until it is clear enough to implement, keep one living refinement summary on the ticket, and move it to Refined. Use when the user says "refine this ticket", "refine #N", names a ticket to nail down, or runs /refine-ticket.
---

# Refine Ticket

Second stage of the ticket workflow: create -> refine -> implement and verify -> land. A short conversation that replaces guessing later. The agent researches and proposes; the user decides.

## Workflow states (shared by the four ticket skills)
Backlog -> Refined -> In progress -> In review -> Done.
This skill moves a ticket from Backlog to **Refined**. Only a person moves a ticket to Done. When states are labels, each move replaces the previous state label.

## Project settings
Read the project's `AGENTS.md` (section "Ticket workflow settings"): tracker and repo, how states are shown (board column or label; default label `refined`), and the project's docs (PRDs, context index). If a setting is missing, use the default below and say so; where there is no default, ask.

## Stage 1: Read
Open the ticket, its comments, linked items, its PRD if any, and the tickets it depends on. If the ticket already carries a refinement summary, start from it. If it is closed or Done, ask before doing anything. If a dependency is not landed yet, say so.

## Stage 2: Research
Start a research subagent to look through the code and docs. It reports back: where the change would land, patterns the codebase already uses for similar work, and risks. It makes no edits.

## Stage 3: Decide together
Take the open points one at a time: scope, approach, affected files, edge cases, acceptance criteria, what is explicitly out of scope, and how each criterion will be verified (browser, command, test). For each point, suggest an answer with a reason and let the user accept or change it. Settle small points quickly; spend the time on the ones that could send the work in different directions.

## Stage 4: Write it up
Draft the summary: what and why, decisions taken, where to change, acceptance criteria with how each is verified, out of scope, remaining risks. Check that:
- each acceptance criterion is something a reviewer can actually check, and comes from a decision in stage 3;
- no question is left open;
- the summary describes the final agreed plan only: no version labels, no history of earlier options.

## Stage 5: Publish
Show the draft and wait for the user's go-ahead. Then:
1. Post it as the ticket's single refinement summary. On later runs, edit that comment in place rather than adding another.
2. If the agreed criteria differ from the ticket body, update the body's criteria to match (or point the body to the summary).
3. Move the ticket to **Refined**, and tell the user the next step is `implement-and-verify-ticket`.

## Rules
- Never post or move anything before the user approves the summary.
- Refinement does not write code or create branches; that is the next stage.
