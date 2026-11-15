import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeSanitize, { defaultSchema, type Options } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighter } from "shiki";
import { createCssVariablesTheme } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { unified } from "unified";

type MdNode = { type: string; children?: MdNode[]; position?: { start: { line: number } } };

// Build time only: nothing in here is imported by a client component, so none of it ships to the browser.
const parser = unified().use(remarkParse).use(remarkGfm);

/** Lines (1-based, within `markdown`) where the Markdown has raw HTML, block or inline. */
export function findRawHtml(markdown: string): number[] {
  const lines: number[] = [];
  const walk = (node: MdNode) => {
    if (node.type === "html" && node.position) {
      lines.push(node.position.start.line);
    }
    node.children?.forEach(walk);
  };
  walk(parser.parse(markdown) as MdNode);
  return lines;
}

// Second guard behind the build failure above: remark-rehype drops raw HTML (allowDangerousHtml stays off) and
// rehype-sanitize (the GitHub schema) removes anything unsafe, such as javascript: links.
// Footnote ids and their `#` links get the `user-content-` prefix once, from remark-rehype (its default clobberPrefix).
// rehype-sanitize would prefix ids a second time and leave the hrefs alone, which breaks every footnote link, so its
// own clobbering is switched off. The ids are then limited by an allow-list instead: the prefixed footnote ids
// (`user-content-fn-*`, `user-content-fnref-*`) and `footnote-label`, the one unprefixed id (the footnote heading that
// aria-describedby points at). Any other id is removed, so a post can never set one that the page's own scripts
// and styles use (`theme`, `__next`, `main`).
export const ALLOWED_ID = /^(?:user-content-fn-.+|user-content-fnref-.+|footnote-label)$/;
const attributes = defaultSchema.attributes ?? {};
export const schema: Options = {
  ...defaultSchema,
  clobber: [],
  attributes: {
    ...attributes,
    "*": [...(attributes["*"] ?? []).filter((a) => (Array.isArray(a) ? a[0] : a) !== "id"), ["id", ALLOWED_ID]],
  },
};

// Code highlighting (ticket #16): Shiki at build time, after rehype-sanitize. Sanitizing first means the post content is
// sanitized exactly as before, and Shiki's own markup (spans, a style attribute) is not stripped. Shiki replaces each
// <pre> with its own element tree, built from the code text only: the only attributes it writes are `class`, `style`
// (var(--shiki-*) references, never a colour value) and `tabindex`, so nothing an author writes (language, meta string,
// code text) can become an id, an event handler or a class. Nothing runs in the browser.
export const HIGHLIGHT_LANGUAGES = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "bash",
  "shell",
  "yaml",
  "md",
  "css",
  "html",
  "diff",
  "csharp",
];

// Every colour comes from the variables in design-language/tokens.css, so the theme switch needs nothing extra.
const CODE_THEME = createCssVariablesTheme({ name: "css-variables", variablePrefix: "--shiki-", fontStyle: true });

type HastNode = { tagName?: string; properties?: Record<string, unknown>; children?: HastNode[] };
type Processor = { process(markdown: string): Promise<{ toString(): string }> };
let processor: Promise<Processor> | undefined;

async function buildProcessor(): Promise<Processor> {
  const highlighter = await createHighlighter({
    themes: [CODE_THEME],
    langs: HIGHLIGHT_LANGUAGES,
    engine: createJavaScriptRegexEngine(),
  });
  const loaded = new Set(highlighter.getLoadedLanguages());

  // The sanitize schema keeps `language-*` classes on code. Before Shiki reads them, drop any that name a language that
  // is not loaded (this also keeps Shiki's special languages, such as ansi, out), so that block, and a block with no
  // language, falls to the default plain text below.
  const dropUnknownLanguages = () => (tree: object) => {
    const walk = (node: HastNode) => {
      const classes = node.properties?.className;
      if (node.tagName === "code" && Array.isArray(classes)) {
        const lang = classes.find((c) => typeof c === "string" && c.startsWith("language-"));
        if (typeof lang === "string" && !loaded.has(lang.slice("language-".length))) {
          delete node.properties?.className;
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree as HastNode);
  };

  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize, schema)
    .use(dropUnknownLanguages)
    .use(rehypeShikiFromHighlighter, highlighter, {
      theme: "css-variables",
      defaultLanguage: "text",
      fallbackLanguage: "text",
    })
    .use(rehypeStringify);
}

/** Markdown to sanitized, highlighted HTML. Never outputs raw HTML from the source or a javascript: link. */
export async function renderMarkdown(markdown: string): Promise<string> {
  processor ??= buildProcessor();
  return String(await (await processor).process(markdown));
}
