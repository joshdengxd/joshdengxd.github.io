import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AA_LARGE,
  AA_NORMAL,
  contrast,
  contrastPairs,
  DISPLAY_ROLES,
  SURFACE_ROLES,
  sharedTokens,
  TEXT_ROLES,
  themeColours,
} from "@/lib/tokens";

const css = readFileSync(join(process.cwd(), "design-language", "tokens.css"), "utf8");

describe("contrast maths", () => {
  it("matches the WCAG reference values", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(contrast("#ffffff", "#ffffff")).toBe(1);
  });
});

describe("design tokens", () => {
  it.each(["dark", "light"] as const)("the %s theme defines every colour role as #rrggbb", (theme) => {
    const c = themeColours(css, theme);
    for (const role of [...SURFACE_ROLES, ...TEXT_ROLES, ...DISPLAY_ROLES]) {
      expect(c[role], role).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("both themes define the same roles", () => {
    expect(Object.keys(themeColours(css, "light")).sort()).toEqual(Object.keys(themeColours(css, "dark")).sort());
  });

  it("covers type, spacing, radius and motion", () => {
    const names = Object.keys(sharedTokens(css));
    for (const prefix of ["--font-", "--step-", "--weight-", "--leading-", "--space-", "--radius-", "--duration-", "--ease-"]) {
      expect(names.some((n) => n.startsWith(prefix)), prefix).toBe(true);
    }
    expect(names.filter((n) => n.startsWith("--step-")).length).toBeGreaterThanOrEqual(5);
  });

  it("dark is the default: :root carries the dark colours", () => {
    const block = /:root,\s*\[data-theme="dark"\]\s*\{/;
    expect(css).toMatch(block);
  });
});

describe("WCAG 2.2 AA contrast, every text and surface pair of both themes", () => {
  const pairs = contrastPairs(css);

  it("checks every pair", () => {
    // 2 themes x 2 surfaces x (3 text + 2 display roles)
    expect(pairs).toHaveLength(2 * SURFACE_ROLES.length * (TEXT_ROLES.length + DISPLAY_ROLES.length));
  });

  it.each(pairs.map((p) => [p.theme, p.text, p.surface, p] as const))(
    "%s: %s on %s",
    (_theme, text, _surface, p) => {
      const required = (TEXT_ROLES as readonly string[]).includes(text) ? AA_NORMAL : AA_LARGE;
      expect(p.required).toBe(required);
      expect(p.ratio).toBeGreaterThanOrEqual(required);
    },
  );
});
