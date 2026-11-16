import { ExternalLink } from "../_components/external-link";
import { PageLayout, Section } from "../_components/page-layout";
import pageStyles from "../_components/page.module.css";
import { Placeholder } from "../_components/placeholder";
import { pageMetadata } from "@/lib/metadata";
import { MERGED_PRS_URL, PROJECT_BOARD_URL, SITE_REPO_URL } from "@/lib/site";
import { SKILL_GROUPS, skillsIn } from "@/lib/skills";

export const metadata = pageMetadata({
  title: "How this site is built",
  description:
    "The ticket cycle, the skills this site is built with, what it is made of, and where the full record of changes lives.",
  path: "/how-this-site-is-built/",
});

/** The ticket cycle, in order: the skill that does each step and what it hands on. */
const WORKFLOW: readonly { skill: string; step: string }[] = [
  { skill: "create-ticket", step: "A PRD becomes ticket drafts, then tracker issues in Backlog once I approve." },
  {
    skill: "refine-ticket",
    step: "One refinement summary per ticket: acceptance criteria, landing steps, out of scope.",
  },
  {
    skill: "implement-and-verify-ticket",
    step: "Implement in a worktree, run the checks, then fresh subagents check each criterion and review the code. A PR opens; the machine checks must pass before anything merges.",
  },
  {
    skill: "land-ticket",
    step: "On my go (or when I start an unattended run): merge, deploy, and a fresh subagent checks the live site.",
  },
];

const MADE_OF: readonly string[] = [
  "A static Next.js site on GitHub Pages.",
  "Blog posts are Markdown, rendered at build time.",
  "Design tokens live in the repository.",
  "Unit and end-to-end tests, with checks on every pull request.",
];

const RECORD: readonly { name: string; href: string; text: string }[] = [
  { name: "Project board", href: PROJECT_BOARD_URL, text: "every ticket and its state" },
  { name: "Merged pull requests", href: MERGED_PRS_URL, text: "every change that landed" },
  { name: "Repository", href: SITE_REPO_URL, text: "the code, docs and skills" },
];

export default function Page() {
  return (
    <PageLayout
      title="How this site is built"
      lead="Every change here goes through a ticket, checks and a pull request. Agents, code and tests verify the work; I decide what gets built and sample the results. The record is public."
    >
      <Section title="Workflow">
        <ol className={pageStyles.rows}>
          {WORKFLOW.map(({ skill, step }) => (
            <li key={skill} className={pageStyles.row}>
              <code className={pageStyles.term}>{skill}</code>
              <span className={pageStyles.rowText}>{step}</span>
            </li>
          ))}
        </ol>
        <Placeholder>A walk through one real ticket, from refinement to the live check, comes here.</Placeholder>
      </Section>
      <Section title="Skills used">
        {SKILL_GROUPS.map(({ group, title }) => (
          <div key={group} className={pageStyles.group} data-skill-group={group}>
            <h3 className={pageStyles.groupTitle}>{title}</h3>
            <ul className={pageStyles.rows}>
              {skillsIn(group).map(({ name, line }) => (
                <li key={name} className={pageStyles.row}>
                  <code className={pageStyles.term}>{name}</code>
                  <span className={pageStyles.rowText}>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="What it is made of">
        <ul className={pageStyles.list}>
          {MADE_OF.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>
      <Section title="The record">
        <ul className={pageStyles.rows}>
          {RECORD.map(({ name, href, text }) => (
            <li key={href} className={pageStyles.row}>
              <ExternalLink className={`${pageStyles.link} ${pageStyles.linkStart}`} href={href}>
                {name}
              </ExternalLink>
              <span className={pageStyles.rowText}>{text}</span>
            </li>
          ))}
        </ul>
      </Section>
    </PageLayout>
  );
}
