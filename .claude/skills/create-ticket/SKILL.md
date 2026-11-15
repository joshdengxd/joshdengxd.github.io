---
name: create-ticket
description: Turn a PRD (or a single request) into well-formed tickets - drafts them locally in a fixed format with checkable acceptance criteria and dependencies, waits for the user's approval, then creates them in the tracker (GitHub issues or Jira) in dependency order and puts them in Backlog. Re-runs never create duplicates. Use when the user says "create tickets from this PRD", "split this into tickets", "create a ticket for X", or runs /create-ticket.
---

# Create Ticket

First stage of the ticket workflow: create -> refine -> implement and verify -> land. A ticket written well here saves a round of guessing in every later stage.

## Workflow states (shared by the ticket skills)
Backlog -> Refined -> In progress -> In review -> Done.
This skill puts tickets in **Backlog**. Only a person moves a ticket to Done. When states are labels, each move replaces the previous state label.

## Project settings
Read the project's `AGENTS.md` (section "Ticket workflow settings"): tracker and repo, identity (the account to create tickets as), labels, how states are shown (board column or label), and the drafts folder. If a setting is missing, use the default below and say so; where there is no default, ask.
- Drafts folder: `drafts/tickets/` (must be git-ignored).
- Labels: `ticket`, plus `prd-NNNN` when the ticket comes from a PRD.
- States: board column if the project has a board; otherwise no label means Backlog.

## Inputs
- A PRD file (preferred), or a description of one piece of work, or deferred-work drafts prepared by `refine-ticket` (already approved there: skip to step 5).

## Steps
1. **Read.** The PRD (goals, requirements, scope, proposed tickets) and the tracker's existing tickets with the same PRD label, so nothing is created twice.
2. **Draft.** One file per ticket in the drafts folder, named `NN-short-slug.md`:
   ```
   ---
   title: "<imperative, specific>"
   labels: [ticket, prd-NNNN]
   depends_on: [<draft numbers>]
   issue:            # filled in after creation
   ---
   ## Context      (link to the PRD and section it comes from; what exists today)
   ## Goal         (one sentence: the outcome)
   ## Scope
   ## Out of scope
   ## Acceptance criteria   (numbered)
   ```
3. **Check each draft** before showing it:
   - one goal; small enough to implement and verify in one sitting, otherwise split it;
   - every acceptance criterion can be checked by a person or an agent (in a browser, by a command or a test) and says what is observed, not how it is built;
   - scope and out of scope do not overlap with another ticket; dependencies point backwards only;
   - nothing contradicts the PRD; nothing is added that the PRD does not ask for.
4. **Show** a table (number, title, depends on, criteria count) and the drafts. **Stop for approval.** Apply edits to the drafts and show them again.
5. **Create** the approved tickets in dependency order (create any label that does not exist yet). Replace `depends_on` draft numbers with real ticket references in one line at the top of the body: `Depends on #12, #13` (or Jira keys; `Depends on: none` when there are none). Other skills read that line. Add the labels and put each ticket in Backlog. Write the new ticket number into the draft's `issue:` field.
6. **Report** the list of created tickets with links. Next: `refine-ticket` on the first ticket with no open dependencies.

## Rules
- Never create anything in the tracker before the user approves the drafts.
- Re-running is safe: a draft with `issue:` set, or a tracker ticket with the same title (and the same PRD label, when there is one), is skipped.
- Every reference a reader needs is a link they can click: the PRD as a link to its file in the repo (or its page in the wiki), other tickets as ticket references. A bare name like "PRD-0001" is not enough.
- Implementation detail belongs in the refinement, not here; a ticket says what must be true, not how.
- Write tickets in the project's tracker language.
