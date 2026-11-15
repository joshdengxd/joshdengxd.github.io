import { issueUrl, PARTS, pullUrl, REPO_URL, SKILLS_NOT_USED, WORKFLOW } from "@/lib/build-log";

describe("lib/build-log", () => {
  it("builds issue and PR links for this repo only", () => {
    expect(REPO_URL).toBe("https://github.com/joshdengxd/joshdengxd.github.io");
    expect(issueUrl(7)).toBe(`${REPO_URL}/issues/7`);
    expect(pullUrl(11)).toBe(`${REPO_URL}/pull/11`);
  });

  it("lists the parts #2 to #7 with the PRs that landed them (#7's number is not known yet)", () => {
    const prs = Object.fromEntries(PARTS.map((p) => [p.issue, p.pr]));
    expect(prs).toMatchObject({ 2: 11, 3: 12, 4: 14, 5: 19, 6: 20, 7: null, 15: 18, 16: 21 });
    expect(new Set(PARTS.map((p) => p.issue)).size).toBe(PARTS.length);
  });

  it("names the five shared skills not used here, each with a reason", () => {
    expect(SKILLS_NOT_USED.map((s) => s.skill)).toEqual([
      "deploy-to-staging",
      "run-e2e-automation",
      "live-env-local-test",
      "prod-release-gate",
      "log-analysis",
    ]);
    for (const { why } of SKILLS_NOT_USED) {
      expect(why.trim().length).toBeGreaterThan(20);
    }
  });

  it("describes the ticket cycle with the shared skills' names", () => {
    expect(WORKFLOW.map((w) => w.skill)).toEqual([
      "create-ticket",
      "refine-ticket",
      "implement-and-verify-ticket",
      "land-ticket",
    ]);
  });
});
