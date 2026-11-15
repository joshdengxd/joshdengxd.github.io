/** The skills installed in `.claude/skills/`, one line each, keyed by folder name. A unit test compares the keys with the folders both ways. */
export type SkillGroup = "ticket-cycle" | "supporting";

export const SKILLS: Readonly<Record<string, { group: SkillGroup; line: string }>> = {
  "create-ticket": {
    group: "ticket-cycle",
    line: "Turns a PRD into ticket drafts, then tracker issues in Backlog once I approve.",
  },
  "refine-ticket": {
    group: "ticket-cycle",
    line: "Works a ticket through with me until it has checkable acceptance criteria, landing steps and an out-of-scope list.",
  },
  "implement-and-verify-ticket": {
    group: "ticket-cycle",
    line: "Implements in a worktree, runs the checks, then has fresh subagents verify each criterion and review the code before a PR opens.",
  },
  "verify-against-criteria": {
    group: "ticket-cycle",
    line: "A read-only reviewer that checks a branch against the ticket's criteria and reports with evidence.",
  },
  "land-ticket": {
    group: "ticket-cycle",
    line: "Merges the verified PR, follows the deploy, and has a fresh subagent check the live site.",
  },
  "drain-refined": {
    group: "ticket-cycle",
    line: "The unattended run: takes every Refined ticket through implement, verify, PR and landing with machine gates only.",
  },
  "current-docs": {
    group: "supporting",
    line: "Looks up the current docs for the exact library versions in use before code is written or reviewed.",
  },
  "agent-context-template": {
    group: "supporting",
    line: "Keeps the repository's agent context (AGENTS.md and a small index) accurate.",
  },
  "wrap-up": {
    group: "supporting",
    line: "End-of-session routine: save what worked, update the docs, tidy, commit.",
  },
};

export const SKILL_GROUPS: readonly { group: SkillGroup; title: string }[] = [
  { group: "ticket-cycle", title: "The ticket cycle" },
  { group: "supporting", title: "Supporting skills" },
];

export const skillsIn = (group: SkillGroup) =>
  Object.entries(SKILLS)
    .filter(([, s]) => s.group === group)
    .map(([name, s]) => ({ name, line: s.line }));
