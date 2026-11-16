import { repoUrl, SITE_REPO_URL } from "./site";

/** The public repos shown on the site. A typed list: no network at build, so the build is deterministic and offline. */
export type Project = {
  slug: string;
  name: string;
  repoUrl: string;
  /** One line, plain words. */
  summary: string;
  /** Paragraphs for the "What it does" section. */
  whatItDoes: readonly string[];
  /** Paragraphs for the "Why it exists" section. */
  whyItExists: readonly string[];
};

export const PROJECTS: readonly Project[] = [
  {
    slug: "josh-shared-skills",
    name: "josh-shared-skills",
    repoUrl: repoUrl("josh-shared-skills"),
    summary: "Agent skills for the delivery cycle: refine, build and evaluate, ship, investigate with data.",
    whatItDoes: [
      "A set of agent skills for a team's delivery cycle, from a vague ticket to a production release. They work with Claude Code and Codex.",
      "A ticket moves through four stages: create, refine, implement and verify, land. Each stage has its own skill and hands the next one a clear record: a refinement summary with acceptance criteria, a pull request with evidence, and a landing comment.",
      "Whatever agents, code and tests can verify is verified that way, by fresh agents and the project's checks. A person decides what gets built and takes any step that cannot be undone. The skills run unattended, one ticket after another, or one ticket at a time with a person trying each result.",
    ],
    whyItExists: [
      "These are the ways of working with agents that have worked best for me lately. I put them together as one set so they can be reused in any project. They are also a demo of my idea of this workflow, from a ticket to a live change that has been checked.",
    ],
  },
  {
    slug: "job-search-skills",
    name: "job-search-skills",
    repoUrl: repoUrl("job-search-skills"),
    summary:
      "Agent skills for an evidence-based job search: posting checks, tailoring from verified facts, independent audits.",
    whatItDoes: [
      "A set of agent skills for an evidence-based job search. They check a posting against your hard requirements first, tailor a resume from one verified master resume (they can reorder and trim it, never add to it), and have fresh agents audit the result. A scheduled scan watches public job boards and tells you only about strong fits.",
      "The producer never grades its own work: every quality gate runs in a new agent or a script. Nothing is submitted automatically. You press submit.",
    ],
    whyItExists: [
      "A job search is full of tedious work: reading postings, tailoring a resume, filling in a hundred forms. I built these skills to automate that part, with checks so that nothing untrue is claimed. Then the time goes to the part that needs a person: talking to people. I share them so friends who are looking for work can use them too.",
    ],
  },
  {
    slug: "this-site",
    name: "This site",
    repoUrl: SITE_REPO_URL,
    summary: "This personal site and blog, built with the shared skills.",
    whatItDoes: [
      "My personal site and blog: who I am, what I am learning, what my public repos do, and my notes. It is a static site built with Next.js and TypeScript and hosted on GitHub Pages.",
      "Every change to it goes through the same ticket workflow as the skills: a ticket is refined, an agent builds it, fresh agents and automated checks verify it, and it is published. The tickets and pull requests in the repository are the public record.",
    ],
    whyItExists: [
      "It is the place where I keep my learning notes: what I learn, how I got there and what I know. It is also where friends, and anyone I talk with about work, can see how I think, so we can discuss it.",
    ],
  },
];

export const projectPath = (slug: string) => `/projects/${slug}/`;

export const findProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
