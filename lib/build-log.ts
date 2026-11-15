/** "How this site is built": the parts of this site, each with its issue and PR, and the shared skills not used here. */
import { GITHUB_OWNER_URL } from "./projects";

export const REPO_URL = `${GITHUB_OWNER_URL}/joshdengxd.github.io`;

/** Links are built for this repo only, from the numbers. */
export const issueUrl = (n: number) => `${REPO_URL}/issues/${n}`;
export const pullUrl = (n: number) => `${REPO_URL}/pull/${n}`;

export type Part = {
  name: string;
  /** What it adds, in a few words. */
  what: string;
  issue: number;
  /** The PR that landed it; null while its number is not known (the page then says so). */
  pr: number | null;
};

export const PARTS: readonly Part[] = [
  { name: "Scaffold", what: "static Next.js site, checks and deploy to GitHub Pages", issue: 2, pr: 11 },
  { name: "Workflow", what: "the shared skills, copied in, and the ticket workflow settings", issue: 3, pr: 12 },
  { name: "Design", what: "tokens, fonts and the specimen page", issue: 4, pr: 14 },
  { name: "Layout shell", what: "navigation, theme toggle, skip link, footer links, 404", issue: 5, pr: 19 },
  { name: "Blog engine", what: "Markdown posts, list, tags, post page, RSS", issue: 6, pr: 20 },
  { name: "Page skeletons", what: "every page with placeholders, metadata, sitemap, robots, social image", issue: 7, pr: null },
  { name: "Dependency fix", what: "the minimatch alert in the lint toolchain", issue: 15, pr: 18 },
  { name: "Code highlighting", what: "build-time syntax highlighting in posts", issue: 16, pr: 21 },
];

/** The ticket cycle, in order: the skill that does each step and what it hands on. */
export const WORKFLOW: readonly { skill: string; step: string }[] = [
  { skill: "create-ticket", step: "A PRD becomes ticket drafts, then tracker issues in Backlog once I approve." },
  { skill: "refine-ticket", step: "One refinement summary per ticket: acceptance criteria, landing steps, out of scope." },
  {
    skill: "implement-and-verify-ticket",
    step: "Implement in a worktree, run the checks, then fresh subagents check each criterion and review the code. A PR opens.",
  },
  { skill: "land-ticket", step: "After my go: merge, deploy, and a fresh subagent checks the live site." },
];

/** Shared skills this site does not use, each with the reason. Names are from the josh-shared-skills README. */
export const SKILLS_NOT_USED: readonly { skill: string; why: string }[] = [
  { skill: "deploy-to-staging", why: "There is no staging environment: GitHub Pages deploys straight from main after the checks." },
  { skill: "run-e2e-automation", why: "The end-to-end tests run on the local build in CI, not on a shared non-production environment." },
  { skill: "live-env-local-test", why: "It needs a real non-production environment to route requests to a local server, and a static site has none." },
  { skill: "prod-release-gate", why: "A static site has no canary or traffic to watch, and a bad deploy is reverted with a PR." },
  { skill: "log-analysis", why: "A static site has no logs or metrics to query." },
];
