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
  /** Build-time content, with no README fetching. */
  howItWorks: readonly string[];
  guideLinks: readonly { label: string; href: string }[];
  diagram?: { src: string; width: number; height: number; alt: string; caption: string };
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
    ],
    howItWorks: [
      "Start with an idea or product requirements document. The create-ticket skill turns it into drafts for a person to approve. Refinement then records the agreed scope, acceptance criteria and landing steps in one summary on each ticket. Each criterion says whether it is checked locally, on the pull request or after deployment.",
      "An agent implements an approved ticket and runs the project's checks. Fresh agents independently verify the behaviour and review the code. The pull request carries the criteria, evidence and landing steps; the producer does not approve its own work.",
      "Landing checks the pull request, carries out the agreed landing steps, merges and waits for deployment. A fresh agent checks the deployed result, and the landing comment links the release evidence. Fix rounds are bounded; work that cannot pass stops for a decision.",
      "Step by step, a person approves the refinement, reviews the pull request and asks for landing. Starting an unattended drain-refined run authorizes its merges and landing steps; every machine gate must still pass, and a person samples the results afterwards. Irreversible production actions outside the repository stay with a person.",
      "To use the skills, copy the folders you need into Claude Code's or Codex's skills directory and configure your project's tracker, commands and deployment settings in AGENTS.md. They are instructions used by your agent, with supporting resources where needed. The source README has the installation details and full guide.",
    ],
    guideLinks: [
      { label: "Read the shared skills guide", href: `${repoUrl("josh-shared-skills")}/blob/main/README.md` },
    ],
    diagram: {
      src: "/projects/josh-shared-skills/cycle.svg",
      width: 1280,
      height: 780,
      alt: "Delivery cycle: refine, build and evaluate, run at scale, ship, investigate with data, foundations",
      caption:
        "The shared skills delivery cycle. The diagram includes optional staging and production tools; each project configures the stages it uses.",
    },
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
      "A set of agent skills for an evidence-based job search. They screen postings, tailor resumes from verified facts and independently audit the result. Nothing is submitted automatically. You press submit.",
    ],
    howItWorks: [
      "Start with one job posting, your hard requirements and a verified master resume. The posting is checked against those requirements first. A failed eligibility gate stops the job before tailoring begins.",
      "For a suitable posting, the skills tailor and format a resume from the master. They can reorder and trim verified facts, but cannot invent qualifications, experience or results. A claim check compares the tailored resume with its source.",
      "Scripts and fresh agents check the resume's readiness, followed by an independent resume audit. The ATS check is a local heuristic for parsing, formatting and keywords, not a score from an employer's system or a promise of an interview. Failed readiness and resume audits allow at most two fix rounds.",
      "A fresh agent also audits the filled, unsubmitted application form read-only. Form fixes allow at most three rounds before asking a person. The producer does not grade its own work, and the application remains unsubmitted until you press submit.",
      "A separate scheduled job-scan flow checks public ATS job boards, evaluates new postings and notifies you about strong fits. It never applies. The skills are composable, and your private requirements, resume and output files stay in your own project.",
    ],
    guideLinks: [
      { label: "Read the job-search skills guide", href: `${repoUrl("job-search-skills")}/blob/main/README.md` },
    ],
    diagram: {
      src: "/projects/job-search-skills/pipeline.svg",
      width: 1190,
      height: 590,
      alt: "Per-job pipeline: gate the posting, produce from verified facts, independently check the result, then a human submits",
      caption: "The per-job pipeline, from posting checks to an audited application that you submit.",
    },
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
    ],
    howItWorks: [
      "Project descriptions live in the repository alongside Markdown blog posts. During the build, the site validates each post's metadata, renders its Markdown and exports the pages as static files. GitHub Pages serves that output; it does not run a Next.js server.",
      "Shared design tokens define the colours, type and spacing across responsive pages. Fonts and other assets live in the repository, so the site does not fetch fonts from a third-party service. The written content is readable without JavaScript.",
      "A change starts with an approved ticket and refinement criteria. An agent implements it, runs local checks, and hands it to fresh agents for behaviour verification and code review. Pull request checks must pass too. Landing is authorized by my request or by starting an unattended run; it merges the change and waits for deployment. A fresh agent then verifies the live site.",
      "The issues and pull requests are the public record. How this site is built explains the workflow; the repository documentation covers the architecture and content conventions.",
    ],
    guideLinks: [
      { label: "How this site is built", href: "/how-this-site-is-built/" },
      { label: "Repository documentation", href: `${SITE_REPO_URL}/blob/main/docs/context/INDEX.md` },
    ],
    whyItExists: [
      "It is the place where I keep my learning notes: what I learn, how I got there and what I know. It is also where friends, and anyone I talk with about work, can see how I think, so we can discuss it.",
    ],
  },
];

export const projectPath = (slug: string) => `/projects/${slug}/`;

export const findProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
