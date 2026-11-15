import { readdirSync } from "node:fs";
import { join } from "node:path";
import { SKILL_GROUPS, SKILLS, skillsIn } from "@/lib/skills";

const installed = readdirSync(join(process.cwd(), ".claude", "skills"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

describe("lib/skills", () => {
  it("lists no skill that is absent from .claude/skills", () => {
    expect(Object.keys(SKILLS).filter((name) => !installed.includes(name))).toEqual([]);
  });

  it("leaves no installed skill unlisted", () => {
    expect(installed.filter((name) => !(name in SKILLS))).toEqual([]);
  });

  it("puts the six ticket-cycle skills and the three supporting skills in their groups", () => {
    expect(skillsIn("ticket-cycle").map((s) => s.name)).toEqual([
      "create-ticket",
      "refine-ticket",
      "implement-and-verify-ticket",
      "verify-against-criteria",
      "land-ticket",
      "drain-refined",
    ]);
    expect(skillsIn("supporting").map((s) => s.name)).toEqual(["current-docs", "agent-context-template", "wrap-up"]);
    expect(SKILL_GROUPS.map((g) => g.group)).toEqual(["ticket-cycle", "supporting"]);
  });

  it("gives every skill a real one-line text", () => {
    for (const { line } of Object.values(SKILLS)) {
      expect(line.trim().length).toBeGreaterThan(20);
    }
  });
});
