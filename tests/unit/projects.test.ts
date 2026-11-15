import { findProject, PROJECTS, projectPath } from "@/lib/projects";

const PUBLIC_REPOS = [
  "https://github.com/joshdengxd/josh-shared-skills",
  "https://github.com/joshdengxd/job-search-skills",
  "https://github.com/joshdengxd/joshdengxd.github.io",
];

describe("lib/projects", () => {
  it("lists exactly the three public repos", () => {
    expect(PROJECTS.map((p) => p.repoUrl)).toEqual(PUBLIC_REPOS);
    expect(PROJECTS.map((p) => p.slug)).toEqual(["josh-shared-skills", "job-search-skills", "this-site"]);
  });

  it("has unique URL-safe slugs and a name and one-line summary for each", () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of PROJECTS) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(p.name.trim()).not.toBe("");
      expect(p.summary.trim()).not.toBe("");
      expect(p.summary).not.toContain("\n");
    }
  });

  it("builds the page path with a trailing slash and finds a project by slug", () => {
    expect(projectPath("this-site")).toBe("/projects/this-site/");
    expect(findProject("this-site")?.name).toBe("This site");
    expect(findProject("nope")).toBeUndefined();
  });
});
