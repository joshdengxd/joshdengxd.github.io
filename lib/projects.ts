/** The public repos shown on the site. A typed list: no network at build, so the build is deterministic and offline. */
export type Project = {
  slug: string;
  name: string;
  repoUrl: string;
  /** One line, plain words. */
  summary: string;
};

export const GITHUB_OWNER_URL = "https://github.com/joshdengxd";

export const PROJECTS: readonly Project[] = [
  {
    slug: "josh-shared-skills",
    name: "josh-shared-skills",
    repoUrl: `${GITHUB_OWNER_URL}/josh-shared-skills`,
    summary: "Agent skills for the delivery cycle: refine, build and evaluate, ship, investigate with data.",
  },
  {
    slug: "job-search-skills",
    name: "job-search-skills",
    repoUrl: `${GITHUB_OWNER_URL}/job-search-skills`,
    summary:
      "Agent skills for an evidence-based job search: posting checks, tailoring from verified facts, independent audits.",
  },
  {
    slug: "this-site",
    name: "This site",
    repoUrl: `${GITHUB_OWNER_URL}/joshdengxd.github.io`,
    summary: "This personal site and blog, built with the shared skills as a live demo.",
  },
];

export const projectPath = (slug: string) => `/projects/${slug}/`;

export const findProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
