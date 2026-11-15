import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { GITHUB_OWNER_URL, repoUrl, SITE_REPO_URL } from "@/lib/site";

const ROOT = process.cwd();
const SOURCE = /\.(?:[cm]?[jt]sx?|css|json|ya?ml)$/;
const SKIP = new Set(["node_modules", ".next", "out", ".git", "drafts", "package-lock.json"]);

/** Source files: app/, lib/, scripts/ and the config files at the top level (tests and docs are not source). */
function sourceFiles(dir: string, top = false): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (SKIP.has(entry.name)) {
      return [];
    }
    if (entry.isDirectory()) {
      return top && !["app", "lib", "scripts"].includes(entry.name) ? [] : sourceFiles(path);
    }
    return SOURCE.test(entry.name) ? [path] : [];
  });
}

describe("the site's GitHub URLs", () => {
  it("are defined once, in lib/site.ts", () => {
    expect(GITHUB_OWNER_URL).toBe("https://github.com/joshdengxd");
    expect(repoUrl("josh-shared-skills")).toBe(`${GITHUB_OWNER_URL}/josh-shared-skills`);
    expect(SITE_REPO_URL).toBe(`${GITHUB_OWNER_URL}/joshdengxd.github.io`);
  });

  it("appear as a literal in no other source file", () => {
    const files = sourceFiles(ROOT, true).map((f) => relative(ROOT, f).split("\\").join("/"));
    expect(files).toContain("lib/site.ts");
    expect(files).toContain("app/layout.tsx");
    const offenders = files.filter(
      (f) => f !== "lib/site.ts" && readFileSync(join(ROOT, f), "utf8").includes("https://github.com/joshdengxd"),
    );
    expect(offenders).toEqual([]);
  });
});
