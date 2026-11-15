import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { renderMarkdown } from "@/lib/posts/markdown";
import {
  AA_LARGE,
  CODE_TEXT_ROLES,
  codeContrastPairs,
  contrastPairs,
  sharedTokens,
  THEMES,
  themeColours,
  type Theme,
} from "@/lib/tokens";
import styles from "./design.module.css";

export const metadata: Metadata = {
  title: "Design language",
  description: "Specimen of the site's design tokens.",
  robots: { index: false, follow: false },
};

const THEME_NAME: Record<Theme, string> = { dark: "Dark theme, the default", light: "Light theme, by the toggle" };

const TYPE_SAMPLES: { token: string; sample: string }[] = [
  { token: "--step-title", sample: "A title on two lines at most" },
  { token: "--step-lead", sample: "Navigation and short lead lines" },
  {
    token: "--step-body",
    sample: "Running text, at a measure of about sixty-five characters, in the full ink colour.",
  },
  { token: "--step-small", sample: "Small print: captions, table notes and code." },
];

// Highlighted at build time by the same pipeline as the posts, so this shows what a post code block looks like.
const CODE_SAMPLE = [
  "```ts",
  "// Say hello",
  "export function greet(name: string) {",
  "  return `Hi, ${name}`;",
  "}",
  "```",
  "",
  "```diff",
  "- const label = 'Hi';",
  "+ const label = `Hi, ${name}`;",
  "```",
].join("\n");

const role = (token: string) => token.replace(/^--color-/, "");

function readTokens(): string {
  return readFileSync(join(process.cwd(), "design-language", "tokens.css"), "utf8");
}

function TokenTable({ caption, tokens }: { caption: string; tokens: [string, string][] }) {
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Token</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map(([name, value]) => (
          <tr key={name}>
            <td>
              <code>{name}</code>
            </td>
            <td>
              <code>{value}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function DesignPage() {
  const css = readTokens();
  const shared = Object.entries(sharedTokens(css));
  const pick = (prefixes: string[]) => shared.filter(([k]) => prefixes.some((p) => k.startsWith(p)));
  const pairs = contrastPairs(css);
  const codePairs = codeContrastPairs(css);
  const codePair = (theme: (typeof THEMES)[number], role: string) => {
    const pair = codePairs.find((c) => c.theme === theme && c.text === role);
    if (!pair) {
      throw new Error(`No code contrast pair for ${theme} ${role}`);
    }
    return pair;
  };
  const codeHtml = await renderMarkdown(CODE_SAMPLE);

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <div className={styles.introText}>
          <h1 className={styles.title}>Design language</h1>
          <p className={styles.introLead}>
            Every token of direction D5, read from the token file the site imports. This page is a specimen for checking
            the tokens; it is not linked from the site.
          </p>
        </div>
        <p className={`name ${styles.nameSample}`} aria-label="Josh Deng, set in the name step">
          <span className="reveal-mask">
            <span className="reveal-line name-first">Josh</span>
          </span>
          <span className="reveal-mask">
            <span className="reveal-line name-last" style={{ "--reveal-index": 1 } as CSSProperties}>
              Deng
            </span>
          </span>
        </p>
      </header>

      <section className={styles.section} aria-labelledby="colour">
        <div className={styles.lead}>
          <h2 id="colour" className={styles.heading}>
            Colour
          </h2>
          <p>
            Text roles need 4.5:1 against both surfaces. The name colours are used only for the name, set large and
            heavy, so they need 3:1 (WCAG 2.2 AA, large text).
          </p>
        </div>
        <div className={styles.body}>
          {THEMES.map((theme) => {
            const colours = Object.entries(themeColours(css, theme));
            return (
              <div key={theme} data-theme={theme} className={styles.theme}>
                <h3 className={styles.subheading}>{THEME_NAME[theme]}</h3>
                <ul className={styles.swatches}>
                  {colours.map(([name, value]) => (
                    <li key={name} className={styles.swatch}>
                      <span className={styles.chip} style={{ background: `var(${name})` }} />
                      <span className={styles.swatchText}>
                        <code>{name}</code>
                        <code>{value}</code>
                      </span>
                    </li>
                  ))}
                </ul>
                <table className={styles.table}>
                  <caption className={styles.caption}>Contrast of every text and surface pair</caption>
                  <thead>
                    <tr>
                      <th scope="col">Text on surface</th>
                      <th scope="col">Sample</th>
                      <th scope="col">Ratio</th>
                      <th scope="col">Needs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairs
                      .filter((p) => p.theme === theme)
                      .map((p) => (
                        <tr key={`${p.text}-${p.surface}`} data-pair={`${theme} ${p.text} ${p.surface}`}>
                          <td>
                            {role(p.text)} on {role(p.surface)}
                          </td>
                          <td
                            className={
                              p.required === AA_LARGE ? `${styles.sample} ${styles.displaySample}` : styles.sample
                            }
                            style={{ background: `var(${p.surface})`, color: `var(${p.text})` } as CSSProperties}
                          >
                            {p.required === AA_LARGE ? "Name" : "Sample text"}
                          </td>
                          <td className={styles.number}>{p.ratio.toFixed(2)}:1</td>
                          <td className={styles.number}>
                            {p.required}:1 {p.passes ? "passes" : "fails"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="type">
        <div className={styles.lead}>
          <h2 id="type" className={styles.heading}>
            Type
          </h2>
          <p>
            One family, Archivo, variable in weight and width: condensed and heavy for the name (the name step is the
            name at the top of this page), normal width for text.{" "}
            {/* taste-skill-ignore: the next line names the code face in prose; it does not set text in it */}
            JetBrains Mono only for code. {/* taste-skill-ignore */}
            Both are served from this site.
          </p>
        </div>
        <div className={styles.body}>
          <ul className={styles.steps}>
            {TYPE_SAMPLES.map(({ token, sample }) => (
              <li key={token} className={styles.step}>
                <span
                  style={{ fontSize: `var(${token})` }}
                  className={token === "--step-title" ? styles.titleSample : undefined}
                >
                  {sample}
                </span>
                <code>{token}</code>
              </li>
            ))}
          </ul>
          <TokenTable
            caption="Type tokens"
            tokens={pick(["--font-", "--step-", "--weight-", "--stretch-", "--leading-", "--tracking-", "--measure"])}
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="space">
        <div className={styles.lead}>
          <h2 id="space" className={styles.heading}>
            Spacing
          </h2>
          <p>One scale for every gap and padding, plus the page margin and the width of the side panel.</p>
        </div>
        <div className={styles.body}>
          <ul className={styles.bars}>
            {pick(["--space-"]).map(([name]) => (
              <li key={name} className={styles.barRow}>
                <span className={styles.bar} style={{ width: `var(${name})` }} />
                <code>{name}</code>
              </li>
            ))}
          </ul>
          <TokenTable caption="Spacing tokens" tokens={pick(["--space-", "--margin-", "--width-"])} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="radius">
        <div className={styles.lead}>
          <h2 id="radius" className={styles.heading}>
            Radius
          </h2>
          <p>Square corners everywhere. The full round is kept for a control that must read as a switch.</p>
        </div>
        <div className={styles.body}>
          <ul className={styles.shapes}>
            {pick(["--radius-"]).map(([name]) => (
              <li key={name} className={styles.shapeItem}>
                <span className={styles.shape} style={{ borderRadius: `var(${name})` }} />
                <code>{name}</code>
              </li>
            ))}
          </ul>
          <TokenTable caption="Radius tokens" tokens={pick(["--radius-"])} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="motion">
        <div className={styles.lead}>
          <h2 id="motion" className={styles.heading}>
            Motion
          </h2>
          <p>
            One effect: the name rises from below on load, line by line. With reduced motion requested it is simply
            there.
          </p>
        </div>
        <div className={styles.body}>
          <TokenTable caption="Motion tokens" tokens={pick(["--duration-", "--delay-", "--ease-", "--distance-"])} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="code">
        <div className={styles.lead}>
          <h2 id="code" className={styles.heading}>
            Code
          </h2>
          <p>
            Code blocks use the code face at the small step, highlighted at build time with colours from the tokens.
          </p>
        </div>
        <div className={styles.body}>
          <div className={styles.code} dangerouslySetInnerHTML={{ __html: codeHtml }} />
          <ul
            className={styles.codeRoles}
            aria-label="Code colours and their contrast on the code background, 4.5:1 needed"
          >
            {CODE_TEXT_ROLES.map((role) => {
              const [dark, light] = THEMES.map((theme) => codePair(theme, role));
              return (
                <li
                  key={role}
                  data-code-pair={role}
                  className={styles.codeRole}
                  style={{ background: "var(--shiki-background)", color: `var(${role})` } as CSSProperties}
                >
                  <code>{`${role.replace(/^--shiki-/, "")}: dark ${dark.ratio.toFixed(2)}:1 ${dark.passes ? "passes" : "fails"}, light ${light.ratio.toFixed(2)}:1 ${light.passes ? "passes" : "fails"}`}</code>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
