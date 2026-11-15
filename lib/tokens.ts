// Reads design-language/tokens.css (the single source of the tokens) and computes WCAG contrast.
// Used at build time by the /design/ specimen and by the unit tests.

export type Theme = "dark" | "light";
export const THEMES: Theme[] = ["dark", "light"];

export const SURFACE_ROLES = ["--color-ground", "--color-panel"] as const;
// Text roles appear at any size: AA for normal text, 4.5:1.
export const TEXT_ROLES = ["--color-ink", "--color-muted", "--color-accent"] as const;
// Display roles are used only for the name (heavy, far above 24px): AA for large text, 3:1.
export const DISPLAY_ROLES = ["--color-name-first", "--color-name-last"] as const;

export const AA_NORMAL = 4.5;
export const AA_LARGE = 3;

export type Declarations = Record<string, string>;

/** Custom properties declared in rule blocks whose selector list contains `selector`. */
export function declarationsFor(css: string, selector: string): Declarations {
  const out: Declarations = {};
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  for (const [, selectors, body] of stripped.matchAll(blockRe)) {
    const list = selectors.split(",").map((s) => s.trim());
    if (!list.includes(selector)) continue;
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      out[name] = value.trim();
    }
  }
  return out;
}

export function themeColours(css: string, theme: Theme): Declarations {
  const all = declarationsFor(css, `[data-theme="${theme}"]`);
  return Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith("--color-")));
}

/** Tokens that do not change with the theme (type, spacing, radius, motion). */
export function sharedTokens(css: string): Declarations {
  const all = declarationsFor(css, ":root");
  return Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith("--color-")));
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type Pair = {
  theme: Theme;
  text: string;
  surface: string;
  textValue: string;
  surfaceValue: string;
  ratio: number;
  required: number;
  passes: boolean;
};

/** Every text and display role against every surface, for both themes. */
export function contrastPairs(css: string): Pair[] {
  const pairs: Pair[] = [];
  for (const theme of THEMES) {
    const c = themeColours(css, theme);
    for (const surface of SURFACE_ROLES) {
      for (const [roles, required] of [
        [TEXT_ROLES, AA_NORMAL],
        [DISPLAY_ROLES, AA_LARGE],
      ] as const) {
        for (const text of roles) {
          const ratio = contrast(c[text], c[surface]);
          pairs.push({
            theme,
            text,
            surface,
            textValue: c[text],
            surfaceValue: c[surface],
            ratio,
            required,
            passes: ratio >= required,
          });
        }
      }
    }
  }
  return pairs;
}
