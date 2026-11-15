# Design language

The site's visual language: the direction, why it was chosen, what was rejected, and the tokens the site imports.

- Tokens: [`tokens.css`](tokens.css), imported once by the root layout (`app/layout.tsx`).
- Specimen: `/design/` shows every token, both themes and the contrast ratio of every text and surface pair. It is not linked from the site, not in the sitemap, and carries `noindex`.
- Fonts: [`fonts/`](fonts/), self-hosted and loaded with `next/font/local` (`app/fonts.ts`).

## Direction: D5, "name as a monument", stacked, two-tone name

![D5, dark (the default)](decision/round-4-two-tone/d5-ochre-sage-panel.png)

The name, in condensed heavy uppercase, fills the left of the first screen on two lines: **JOSH** in ochre, **DENG** in sage. A narrow panel on the right, one step lighter than the ground, holds the navigation and the short intro. The current page in the navigation is ochre.

### Why
- It is a personal site, and the name is the subject: one dominant element on the first screen instead of a hero picture the site does not have yet.
- The owner asked for muted greens and ochres. Deep green ground with ochre and sage reads calm and unlike the cream-and-terracotta or violet palettes that generated pages default to.
- Two tones split the name into its two words without a second typeface or any ornament.
- The panel separates the navigation from the name by a step in tone, not by a line or a shadow.

### Light theme

![D5, light (by the toggle)](decision/round-4-two-tone/d5-light.png)

Dark is the default for every visitor, also without JavaScript. Light is available only through the theme toggle, and the choice is remembered in `localStorage` (key `theme`). A small first-party script in `<head>` applies a stored choice before the first paint, so there is no flash.

## How it was chosen

The taste skill dealt five directions. The owner picked "name as a monument"; then five variants of it, then five colourways of the stacked variant, then five two-tone versions.

The owner picked at each round; the other options were not picked. The descriptions say what each mockup shows.

### Round 1: five directions

| | Direction | Result |
|---|---|---|
| ![Name as a monument](decision/round-1-directions/1-name-as-monument.png) | Name as a monument: the name set very large as the first screen. | **Picked** |
| ![The page is the object](decision/round-1-directions/2-page-is-the-object.png) | The page is the object: a sheet of paper on a dark olive stage. | Not picked |
| ![The contact sheet](decision/round-1-directions/3-contact-sheet.png) | The contact sheet: a light page built on a grid of picture frames. | Not picked |
| ![The pinned poster](decision/round-1-directions/4-pinned-poster.png) | The pinned poster: words pinned across a dark screen while the page scrolls. | Not picked |
| ![The split stage](decision/round-1-directions/5-split-stage.png) | The split stage: a light page split into two columns. | Not picked |

### Round 2: five variants of the name as a monument

| | Variant | Result |
|---|---|---|
| ![A](decision/round-2-variants/a-bottom-sage.png) | A: the name on one line along the bottom, green ground. | Not picked |
| ![B](decision/round-2-variants/b-centre-bone.png) | B: the name centred on a bone ground, links in the corners. | Not picked |
| ![C](decision/round-2-variants/c-stacked-ochre.png) | C: the name stacked on two lines in condensed Archivo, a narrow side panel; ochre ground. | **Picked** (the layout) |
| ![D](decision/round-2-variants/d-split-corners.png) | D: first and last name in opposite corners. | Not picked |
| ![E](decision/round-2-variants/e-letter-as-status.png) | E: one letter of the name replaced by a status disc. | Not picked |

### Round 3: five colourways of the stacked layout

| | Colourway | Result |
|---|---|---|
| ![C1](decision/round-3-colourways/c1-forest-on-white.png) | C1: forest green on white. | Not picked |
| ![C2](decision/round-3-colourways/c2-white-on-forest.png) | C2: white on forest green. | Not picked |
| ![C3](decision/round-3-colourways/c3-forest-on-sage.png) | C3: forest green on sage. | Not picked |
| ![C4](decision/round-3-colourways/c4-sage-on-deep-green.png) | C4: sage on deep green, ochre for the current page. | **Picked** (the ground) |
| ![C5](decision/round-3-colourways/c5-two-tone.png) | C5: the name in two tones on white. | Not picked; its two tones led to round 4 |

### Round 4: five two-tone versions on deep green

| | Version | Result |
|---|---|---|
| ![D1](decision/round-4-two-tone/d1-sage-ochre.png) | D1: JOSH sage, DENG ochre. | Not picked |
| ![D2](decision/round-4-two-tone/d2-bone-sage.png) | D2: JOSH bone, DENG sage. | Not picked |
| ![D3](decision/round-4-two-tone/d3-sage-bone.png) | D3: JOSH sage, DENG bone. | Not picked |
| ![D4](decision/round-4-two-tone/d4-sage-moss.png) | D4: JOSH sage, DENG moss. | Not picked |
| ![D5](decision/round-4-two-tone/d5-ochre-sage-panel.png) | D5: JOSH ochre, DENG sage, panel one step lighter. Its light version is shown above. | **Picked** |

## Tokens

All tokens are CSS custom properties in [`tokens.css`](tokens.css).

### Colour (per theme)

Two surfaces and five text roles. Text roles appear at any size and need WCAG 2.2 AA for normal text (4.5:1) on both surfaces. The name roles are used only for the name, set large and heavy, so they need AA for large text (3:1). `tests/unit/tokens.test.ts` checks all 20 pairs (2 surfaces x 5 roles x 2 themes); `/design/` shows each ratio.

| Role | Use | Dark (default) | Light |
|---|---|---|---|
| `--color-ground` | page ground | `#1e2c23` | `#f3f0e6` |
| `--color-panel` | the panel, one step lighter | `#2a3b2f` | `#dfe5d6` |
| `--color-ink` | running text | `#c2d2b8` | `#2c4a35` |
| `--color-muted` | secondary notes | `#98a694` | `#57645a` |
| `--color-accent` | links, current page, focus | `#c49a5a` | `#855a21` |
| `--color-name-first` | JOSH | `#c49a5a` | `#a8742f` |
| `--color-name-last` | DENG | `#a9bd9d` | `#3f6447` |

Contrast (text on ground / on panel):

| Role | Needs | Dark | Light |
|---|---|---|---|
| ink | 4.5 | 9.17 / 7.48 | 8.61 / 7.63 |
| muted | 4.5 | 5.71 / 4.66 | 5.46 / 4.83 |
| accent | 4.5 | 5.64 / 4.60 | 5.29 / 4.69 |
| name-first | 3 | 5.64 / 4.60 | 3.54 / 3.14 |
| name-last | 3 | 7.26 / 5.92 | 5.89 / 5.22 |

### Code colours

Code blocks in posts are highlighted at build time with Shiki's CSS-variables theme, so the built HTML carries no colour of its own, only `var(--shiki-*)`. The values live in [`tokens.css`](tokens.css), per theme, in the same ochre and sage palette. Every text role must reach WCAG 2.2 AA for normal text (4.5:1) on `--shiki-background`; `tests/unit/tokens.test.ts` checks all 24 pairs (12 roles x 2 themes) and `/design/` shows a highlighted sample with each ratio.

| Role | Use | Dark (default) | Light |
|---|---|---|---|
| `--shiki-background` | the code block background (the panel colour) | `#2a3b2f` | `#dfe5d6` |
| `--shiki-foreground` | plain code text | `#c2d2b8` | `#2c4a35` |
| `--shiki-token-comment` | comments | `#98a694` | `#57645a` |
| `--shiki-token-keyword` | keywords | `#d4a762` | `#7a501a` |
| `--shiki-token-string` | strings, plain | `#a9bd9d` | `#3f6447` |
| `--shiki-token-string-expression` | strings, quoted values | `#d9c08a` | `#6b5516` |
| `--shiki-token-constant` | constants, numbers, names | `#e0b887` | `#6e4a10` |
| `--shiki-token-function` | function names | `#e8d6a8` | `#5a4a12` |
| `--shiki-token-parameter` | parameters | `#b4c7a4` | `#35553d` |
| `--shiki-token-punctuation` | punctuation | `#a3b09f` | `#4f5c52` |
| `--shiki-token-link` | links | `#c49a5a` | `#855a21` |
| `--shiki-token-inserted` | diff: added lines (sage) | `#8fc47d` | `#2e6b3a` |
| `--shiki-token-deleted` | diff: removed lines (muted terracotta) | `#e3937a` | `#954529` |

Contrast on the code background (needs 4.5): see `/design/` for every ratio; the lowest are the link colour, 4.60 in dark and 4.69 in light. Added and removed lines of a `diff` block differ in colour, and the leading `+` and `-` still say which is which (colour is not the only cue): added 5.87 / 4.97, removed 4.94 / 5.16 (dark / light).

Changes from the mockup values, to pass the checks: dark ink is a lighter sage (`#c2d2b8`, so running text is not soft grey) while DENG keeps `#a9bd9d`; dark muted `#8c9a88` became `#98a694`; light muted `#5d6a5e` became `#57645a`; light accent text is a darker ochre (`#855a21`), while the light JOSH keeps the mockup's `#a8742f` because it is only ever large.

### Type

One family, Archivo (variable weight and width): condensed (`--stretch-name: 62%`) and heavy (`800`) for the name, normal width for text. JetBrains Mono only for code. Five steps:

| Token | Value | Use |
|---|---|---|
| `--step-name` | `min(43svh, 30vw)` | the name (`--step-name-narrow`, `min(43svh, 48vw)`, on phones) |
| `--step-title` | `clamp(2rem, 1.25rem + 3vw, 3.5rem)` | page and section titles |
| `--step-lead` | `1.5rem` | navigation, intro lines; the large-text size (24px) |
| `--step-body` | `1.0625rem` | running text |
| `--step-small` | `0.875rem` | small print and code |

Weights, widths, leading and tracking are tokens too (`--weight-*`, `--stretch-*`, `--leading-*`, `--tracking-*`, `--measure`).

### Spacing, radius, motion
- Spacing: `--space-1` (0.25rem) to `--space-10` (8rem), `--margin-page`, `--width-panel`.
- Radius: `--radius-none` (square corners, the default) and `--radius-round` (kept for a control that must read as a switch).
- Motion: one effect in v1, the name revealed from below on load (`.reveal-mask` / `.reveal-line`, `--duration-reveal`, `--delay-reveal-step`, `--ease-out`, `--distance-reveal`). It is off under `prefers-reduced-motion: reduce`.

## Fonts and licences

Both families are under the SIL Open Font License 1.1. The files are the Latin subsets from the Fontsource packages (`@fontsource-variable/archivo` 5.3.0, `@fontsource-variable/jetbrains-mono` 5.3.0), copied into the repo; nothing is fetched from a font service at build or run time.

| File | Family | Axes | Licence |
|---|---|---|---|
| `archivo-latin-wdth-normal.woff2` | Archivo, by the Archivo Project Authors (Omnibus-Type) | weight 100-900, width 62-125% | OFL 1.1, [text](fonts/OFL-Archivo.txt) |
| `jetbrains-mono-latin-wght-normal.woff2` | JetBrains Mono, by the JetBrains Mono Project Authors | weight 100-800 | OFL 1.1, [text](fonts/OFL-JetBrains-Mono.txt) |

### Fallbacks and the name safety net

While Archivo loads (or if it never does) two layers keep the page from jumping or breaking; both live in `app/globals.css`:

1. **Tuned fallbacks** (`@font-face`, built from local fonts, adjusted to Archivo's metrics): "Archivo text fallback" is Arial (or Helvetica, Liberation Sans) scaled to Archivo's size and line metrics, so text barely moves when the real font arrives; "Archivo name fallback" is Arial Bold scaled to 62%, because the web face is condensed to 62% and Arial cannot condense, so the name would otherwise overflow a phone until the font arrives. They are listed after `--font-archivo-face` in `--font-text` and in `.name`.
2. **Safety net on the name**: `.name` has `max-width: 100%` and `overflow-wrap: anywhere`. Any device whose fallback is much wider than Arial (a system without Arial, a monospace default) breaks the name inside a word instead of scrolling the page sideways at 320 px. With the real font, or the tuned fallback, no word is wider than its line, so the net never acts and the name looks the same. There is no per-device font list.

`tests/e2e/name-fallback.spec.ts` checks the net: it blocks the `.woff2` request, forces the name's family to `monospace` with a style tag, and asserts no horizontal overflow at 320 and 390 px on every page, with JavaScript on and off.

## Taste skill gates and waivers

The taste skill's lint and its browser inspector run on the static build at 1440, 768 and 390 px, on `/`, `/about/`, `/projects/`, a project page, `/how-this-site-is-built/`, `/design/`, `/blog/` and a blog post page (fixture build), with 0 FAIL. Four inspector rules are waived in v1:

- `few-pictures`, `no-real-pictures`, `no-footage`: the picture floor (at least four real pictures). v1 has no content and no photographs yet.
- `still-page`: the motion minimum (at least eight moving elements). v1 has one deliberate effect, the name reveal.

A later ticket brings both back with real content and the motion layer.

Warnings left on purpose (the inspector only warns about these):
- `hero-void` on `/blog/` and the tag pages (about 29% of the first screen is empty at 1440 px): the empty block sits beside the reading column, the page's one rest; the list is held to the reading measure on purpose.
- `name-only-title` on the tag pages: the h1 is `Tagged <tag>` and the line under it repeats the tag in plain words.
- `grey-body` on `/about/` and the project pages (1440 px and down): the running text is the placeholder paragraphs, muted on purpose (4.5:1 or more) so they never read as final copy; real copy replaces them in the full ink.
- `hero-void` on `/about/`, `/projects/` and the project pages (about 30% of the first screen at 1440 px): the short title leaves the right of the reading column empty, the page's one rest, as on `/blog/`.
- Home (`/`) is a new layout: the D5 first screen (name and panel, one viewport high), and the footer line, nothing else (Focus, Featured repos and Latest posts were removed on 2026-11-15, #45). It passes with no WARN.
- `palette-cream` on `/design/`: the light theme's ground `#f3f0e6`, the owner's chosen light ground from the D5 light mockup. The specimen shows it; on the site it appears only after the toggle.
- `off-centre` on `/design/`: the theme samples sit inset in their own blocks, so the text in them stops short of the right margin.
