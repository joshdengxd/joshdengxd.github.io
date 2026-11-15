// @ts-expect-error plain .mjs script without types
import { decide, extractCommit, shouldSkip } from "@/scripts/should-skip-deploy.mjs";

const A = "a".repeat(40);
const B = "b".repeat(40);
const page = (commit: string) => `<html><head><meta charset="utf-8"/><meta name="commit" content="${commit}"/></head></html>`;
const ok = (body: string) => async () => ({ ok: true, status: 200, text: async () => body });

describe("extractCommit", () => {
  it("reads the SHA from the commit meta, whatever the attribute order", () => {
    expect(extractCommit(page(A))).toBe(A);
    expect(extractCommit(`<meta content="${B}" name="commit">`)).toBe(B);
  });
  it("returns null when the tag is missing or not a 40-hex SHA", () => {
    expect(extractCommit("<html></html>")).toBeNull();
    expect(extractCommit(page("unknown"))).toBeNull();
    expect(extractCommit(page("abc123"))).toBeNull();
  });
});

describe("shouldSkip", () => {
  it("skips only when the live SHA equals this run's SHA", () => {
    expect(shouldSkip(A, A)).toBe(true);
    expect(shouldSkip(A, B)).toBe(false);
    expect(shouldSkip("unknown", "unknown")).toBe(false);
    expect(shouldSkip(null, A)).toBe(false);
  });
});

describe("decide", () => {
  it("skips a scheduled or manual run when the live commit equals the run's commit", async () => {
    for (const eventName of ["schedule", "workflow_dispatch"]) {
      const r = await decide({ eventName, sha: A, fetchImpl: ok(page(A)) });
      expect(r.skip).toBe(true);
      expect(r.reason).toContain("skipping build and deploy");
    }
  });
  it("deploys when the live commit differs", async () => {
    expect((await decide({ eventName: "schedule", sha: A, fetchImpl: ok(page(B)) })).skip).toBe(false);
  });
  it("deploys when the fetch fails, answers non-2xx, or has no commit meta", async () => {
    const boom = async () => {
      throw new Error("network down");
    };
    expect((await decide({ eventName: "schedule", sha: A, fetchImpl: boom })).skip).toBe(false);
    const down = async () => ({ ok: false, status: 503, text: async () => "" });
    expect((await decide({ eventName: "schedule", sha: A, fetchImpl: down })).skip).toBe(false);
    expect((await decide({ eventName: "schedule", sha: A, fetchImpl: ok("<html></html>") })).skip).toBe(false);
  });
  it("a push never skips and never fetches", async () => {
    const fetchImpl = vi.fn(ok(page(A)));
    expect((await decide({ eventName: "push", sha: A, fetchImpl })).skip).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("force=true redeploys even when the live commit equals the run's commit", async () => {
    expect((await decide({ eventName: "workflow_dispatch", force: true, sha: A, fetchImpl: ok(page(A)) })).skip).toBe(false);
  });
});
