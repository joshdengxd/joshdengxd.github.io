import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AA_LARGE,
  AA_NORMAL,
  CODE_SURFACE_ROLE,
  CODE_TEXT_ROLES,
  codeColours,
  codeContrastPairs,
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
    for (const prefix of [
      "--font-",
      "--step-",
      "--weight-",
      "--leading-",
      "--space-",
      "--radius-",
      "--duration-",
      "--ease-",
    ]) {
      expect(
        names.some((n) => n.startsWith(prefix)),
        prefix,
      ).toBe(true);
    }
    expect(names.filter((n) => n.startsWith("--step-")).length).toBeGreaterThanOrEqual(5);
  });

  it("dark is the default: :root carries the dark colours", () => {
    const block = /:root,\s*\[data-theme="dark"\]\s*\{/;
    expect(css).toMatch(block);
  });
});

describe("code colours (--shiki-*)", () => {
  it.each(["dark", "light"] as const)(
    "the %s theme defines the code background and every code text role as #rrggbb",
    (theme) => {
      const c = codeColours(css, theme);
      for (const role of [CODE_SURFACE_ROLE, ...CODE_TEXT_ROLES]) {
        expect(c[role], role).toMatch(/^#[0-9a-f]{6}$/i);
      }
    },
  );

  it("both themes define the same code roles, and they are exactly what Shiki's CSS-variables theme reads", () => {
    const expected = [CODE_SURFACE_ROLE, ...CODE_TEXT_ROLES].sort();
    expect(Object.keys(codeColours(css, "dark")).sort()).toEqual(expected);
    expect(Object.keys(codeColours(css, "light")).sort()).toEqual(expected);
  });

  it("keeps the code colours out of the shared (theme-independent) tokens", () => {
    expect(Object.keys(sharedTokens(css)).some((n) => n.startsWith("--shiki-"))).toBe(false);
  });
});

describe("WCAG 2.2 AA contrast, every code colour on the code background of both themes", () => {
  const pairs = codeContrastPairs(css);

  it("checks every pair", () => {
    expect(pairs).toHaveLength(2 * CODE_TEXT_ROLES.length);
  });

  it.each(pairs.map((p) => [p.theme, p.text, p] as const))("%s: %s on the code background", (_theme, _text, p) => {
    expect(p.required).toBe(AA_NORMAL);
    expect(p.ratio).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe("WCAG 2.2 AA contrast, every text and surface pair of both themes", () => {
  const pairs = contrastPairs(css);

  it("checks every pair", () => {
    // 2 themes x 2 surfaces x (3 text + 2 display roles)
    expect(pairs).toHaveLength(2 * SURFACE_ROLES.length * (TEXT_ROLES.length + DISPLAY_ROLES.length));
  });

  it.each(pairs.map((p) => [p.theme, p.text, p.surface, p] as const))("%s: %s on %s", (_theme, text, _surface, p) => {
    const required = (TEXT_ROLES as readonly string[]).includes(text) ? AA_NORMAL : AA_LARGE;
    expect(p.required).toBe(required);
    expect(p.ratio).toBeGreaterThanOrEqual(required);
  });
});

describe("the picture plate (--color-plate)", () => {
  const dark = themeColours(css, "dark");
  const light = themeColours(css, "light");

  it("is a #rrggbb colour in both themes, and the same light colour in both", () => {
    expect(dark["--color-plate"]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(light["--color-plate"]).toBe(dark["--color-plate"]);
  });

  it("is the light theme's ground, so a light picture sits on it as on the page", () => {
    expect(dark["--color-plate"]).toBe(light["--color-ground"]);
  });

  it("stands out from the dark ground by at least 3:1, so the edge of the picture is visible", () => {
    expect(contrast(dark["--color-plate"], dark["--color-ground"])).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it("carries the light theme's ink at AA for normal text, as a broken picture's alt text would", () => {
    expect(contrast(light["--color-ink"], dark["--color-plate"])).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});
