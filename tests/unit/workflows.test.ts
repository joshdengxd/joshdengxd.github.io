import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

// Parsed YAML is untyped on purpose; the tests assert its shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Y = any;
type Doc = Record<string, Y>;
const load = (name: string) => {
  const text = readFileSync(join(process.cwd(), ".github", name), "utf8");
  return { text, doc: parse(text) as Doc };
};
const stepsOf = (job: Y): Y[] => job.steps ?? [];
const usesOf = (doc: Doc): string[] =>
  Object.values<Y>(doc.jobs).flatMap((j) => stepsOf(j).flatMap((s) => (s.uses ? [s.uses as string] : [])));

/** Every `uses:` line is pinned to a 40-hex SHA and has a `# vX.Y.Z` comment. */
function expectPinned(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => /^\s*(- )?uses:/.test(l));
  expect(lines.length).toBeGreaterThan(0);
  for (const l of lines) {
    expect(l).toMatch(/uses: [\w.-]+\/[\w./-]+@[0-9a-f]{40} # v\d+(\.\d+)*$/);
  }
}

describe("dependabot-auto-merge.yml", () => {
  const { text, doc } = load("workflows/dependabot-auto-merge.yml");
  const jobs = Object.entries<Y>(doc.jobs);

  it("triggers only on pull_request, never pull_request_target", () => {
    expect(doc.on).toBe("pull_request");
    expect(text).not.toContain("pull_request_target");
  });

  it("has no workflow-level permissions and one job, not named checks, with exactly the two write permissions", () => {
    expect(doc.permissions).toEqual({});
    expect(jobs.map(([name]) => name)).toEqual(["dependabot-auto-merge"]);
    expect(jobs[0][1].name).toBeUndefined();
    expect(jobs[0][1].permissions).toEqual({ contents: "write", "pull-requests": "write" });
  });

  it("runs only for PRs opened and last pushed by dependabot[bot] in this repo", () => {
    const cond = String(jobs[0][1].if).replace(/\s+/g, " ").trim();
    expect(cond).toBe(
      "github.event.pull_request.user.login == 'dependabot[bot]' && github.actor == 'dependabot[bot]' && github.repository == 'joshdengxd/joshdengxd.github.io'",
    );
  });

  it("pins every action by full SHA with a version comment, and checks nothing out", () => {
    expectPinned(text);
    expect(usesOf(doc)).toEqual([expect.stringMatching(/^dependabot\/fetch-metadata@[0-9a-f]{40}$/)]);
    expect(text).not.toMatch(/actions\/checkout/);
    expect(text).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
  });

  it("enables --auto --squash only for semver-patch or semver-minor, with URL and token passed through env", () => {
    const steps = stepsOf(jobs[0][1]);
    const meta = steps.find((s) => s.uses);
    expect(meta.id).toBe("metadata");
    const merge = steps.find((s) => s.run);
    expect(merge.if).toBe(
      "steps.metadata.outputs.update-type == 'version-update:semver-patch' || steps.metadata.outputs.update-type == 'version-update:semver-minor'",
    );
    expect(merge.run).toBe('gh pr merge --auto --squash "$PR_URL"');
    expect(merge.env).toEqual({
      PR_URL: "${{ github.event.pull_request.html_url }}",
      GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
    });
    expect(merge.run).not.toContain("${{");
  });
});

describe("deploy.yml", () => {
  const { text, doc } = load("workflows/deploy.yml");

  it("runs on push to main, daily, and by hand with a force input (default false)", () => {
    expect(doc.on.push).toEqual({ branches: ["main"] });
    expect(doc.on.schedule).toHaveLength(1);
    expect(doc.on.schedule[0].cron).toMatch(/^\d+ \d+ \* \* \*$/);
    expect(doc.on.workflow_dispatch.inputs.force).toMatchObject({ type: "boolean", default: false });
  });

  it("keeps least-privilege permissions, the concurrency group and pinned actions", () => {
    expect(doc.permissions).toEqual({ contents: "read" });
    expect(doc.concurrency).toEqual({ group: "pages", "cancel-in-progress": false });
    expect(doc.jobs.build.permissions).toEqual({ contents: "read", pages: "read" });
    expect(doc.jobs.deploy.permissions).toEqual({ pages: "write", "id-token": "write" });
    expect(doc.jobs.plan.permissions).toEqual({ contents: "read" });
    expectPinned(text);
  });

  it("plan job decides with the tested script; build and deploy are skipped (green) when it says skip", () => {
    const decide = stepsOf(doc.jobs.plan).find((s) => s.id === "decide");
    expect(decide.run).toBe("node scripts/should-skip-deploy.mjs");
    expect(decide.env).toEqual({
      EVENT_NAME: "${{ github.event_name }}",
      FORCE: "${{ inputs.force }}",
      SHA: "${{ github.sha }}",
    });
    expect(doc.jobs.plan.outputs.skip).toBe("${{ steps.decide.outputs.skip }}");
    expect(doc.jobs.build.needs).toBe("plan");
    expect(doc.jobs.build.if).toBe("needs.plan.outputs.skip != 'true'");
    expect(doc.jobs.deploy.needs).toBe("build");
    expect(doc.jobs.deploy.if).toBeUndefined();
  });

  it("still builds, guards against the test fixture, and deploys", () => {
    const runs = stepsOf(doc.jobs.build).map((s) => s.run);
    expect(runs).toEqual(expect.arrayContaining(["npm ci", "npm run build", "npm run check:fixture"]));
    expect(runs.indexOf("npm run build")).toBeLessThan(runs.indexOf("npm run check:fixture"));
    expect(stepsOf(doc.jobs.deploy).some((s) => String(s.uses).startsWith("actions/deploy-pages@"))).toBe(true);
  });
});

describe("dependabot.yml", () => {
  const { doc } = load("dependabot.yml");
  it("groups GitHub Actions updates as minor and patch only", () => {
    const actions = doc.updates.find((u: Y) => u["package-ecosystem"] === "github-actions");
    const groups = Object.values<Y>(actions.groups);
    expect(groups).toHaveLength(1);
    expect(groups[0]["update-types"]).toEqual(["minor", "patch"]);
  });
});

describe("checks.yml", () => {
  const { doc } = load("workflows/checks.yml");

  /** The projects of playwright.config.ts with E2E_WEBKIT set or not (CI never sets it). */
  const projectsOf = async (webkit: boolean) => {
    vi.resetModules();
    vi.stubEnv("E2E_WEBKIT", webkit ? "1" : "");
    const config = (await import("../../playwright.config")).default;
    vi.unstubAllEnvs();
    return config.projects ?? [];
  };
  const browsersOf = async (webkit: boolean): Promise<string[]> =>
    [...new Set((await projectsOf(webkit)).map((p) => (p.use?.defaultBrowserType as string) ?? "chromium"))].sort();

  it("installs exactly the browsers the Playwright config runs in CI; WebKit is flag-only", async () => {
    const install = stepsOf(doc.jobs.checks).filter((s) => /playwright install/.test(s.run ?? ""));
    expect(install).toHaveLength(1);
    const words = String(install[0].run).split(/\s+/);
    expect(words).toContain("--with-deps");
    const installed = words.filter((w) => ["chromium", "firefox", "webkit"].includes(w)).sort();
    expect(await browsersOf(false)).toEqual(installed);
    expect(await browsersOf(false)).not.toContain("webkit");
    expect(await browsersOf(true)).toContain("webkit");
  });
});

describe("all workflows: light CI that cannot hang", () => {
  const files = ["checks.yml", "deploy.yml", "dependabot-auto-merge.yml"];
  const MAX_TIMEOUT: Record<string, number> = { checks: 8, plan: 2, build: 5, deploy: 6, "dependabot-auto-merge": 3 };
  const COND = "github.event_name == 'workflow_dispatch' || github.event.pull_request.user.login == 'dependabot[bot]'";

  it("every job has timeout-minutes, no larger than its limit", () => {
    for (const f of files) {
      for (const [name, job] of Object.entries<Y>(load(`workflows/${f}`).doc.jobs)) {
        expect(MAX_TIMEOUT[name], `${f}: no limit known for job ${name}`).toBeDefined();
        expect(typeof job["timeout-minutes"], `${f}: ${name} has no timeout-minutes`).toBe("number");
        expect(job["timeout-minutes"], `${f}: ${name} timeout too large`).toBeLessThanOrEqual(MAX_TIMEOUT[name]);
      }
    }
  });

  it("no workflow filters pull_request by paths or paths-ignore (a skipped required check blocks the PR)", () => {
    for (const f of files) {
      const { doc } = load(`workflows/${f}`);
      const pr = typeof doc.on === "object" ? doc.on.pull_request : undefined;
      expect(pr?.paths, `${f}: paths`).toBeUndefined();
      expect(pr?.["paths-ignore"], `${f}: paths-ignore`).toBeUndefined();
    }
  });

  it("checks.yml: PR and manual triggers, e2e only for manual or Dependabot, job still named checks", () => {
    const { doc } = load("workflows/checks.yml");
    expect(Object.keys(doc.on).sort()).toEqual(["pull_request", "workflow_dispatch"]);
    expect(Object.keys(doc.jobs)).toEqual(["checks"]);
    expect(doc.jobs.checks.name).toBeUndefined();
    const steps = stepsOf(doc.jobs.checks);
    const heavy = steps.filter(
      (s) => /playwright|npm run e2e/.test(s.run ?? "") || /upload-artifact/.test(s.uses ?? ""),
    );
    expect(heavy).toHaveLength(4);
    for (const s of heavy) {
      expect(String(s.if).replace(/\s+/g, " ")).toContain(COND);
    }
    const light = steps.filter((s) => !heavy.includes(s));
    for (const s of light) {
      expect(s.if).toBeUndefined();
    }
    const runs = light.map((s) => String(s.run));
    for (const r of ["npm ci", "npm run lint", "npm run format:check", "npm run typecheck", "npm test"]) {
      expect(runs).toContain(r);
    }
    expect(runs.some((r) => /npm run build\s+npm run check:fixture/.test(r))).toBe(true);
  });
});
