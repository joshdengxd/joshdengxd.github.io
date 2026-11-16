import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { imageSize } from "image-size";
import rehypeSanitize, { defaultSchema, type Options } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighter } from "shiki";
import { createCssVariablesTheme } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { unified } from "unified";
import { NEW_TAB_NOTE } from "../external-links";
import { SITE_ORIGIN } from "../site";

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

type HastNode = {
  type?: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  position?: { start: { line: number } };
};

// Pictures in posts (ticket #41). A step after rehype-sanitize, like Shiki, so sanitizing is unchanged. A post names a
// picture by file name only, `![alt text](diagram.svg "Caption")`; the file lives in the post's image folder
// (public/blog/<slug>/) and the page serves it as /blog/<slug>/<file>. The step turns the sanitized <img> into a
// <figure> with the file's real size on the <img> (width and height), so the page reserves the space before the file
// loads. Anything else fails the build with the line: a remote URL, a path, a data URL, a missing file, another format,
// empty alt text, or a picture that is not alone in its paragraph. Without an image context (the /design/ sample)
// pictures are dropped.
export const IMAGE_FORMATS = ["svg", "png", "jpg", "jpeg", "webp"] as const;
const IMAGE_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Where a post's pictures are: `dir` is read from disk, `label` is shown in messages, `slug` gives the URL. */
export type ImageContext = { slug: string; dir: string; label: string };

/** A picture that cannot be built; `line` is the 1-based line in the Markdown. */
export class ImageError extends Error {
  constructor(
    readonly line: number,
    message: string,
  ) {
    super(message);
    this.name = "ImageError";
  }
}

const isElement = (node: HastNode, tag: string) => node.type === "element" && node.tagName === tag;

function figureFor(img: HastNode, ctx: ImageContext): HastNode {
  const line = img.position?.start.line ?? 1;
  const { alt, src, title } = img.properties ?? {};
  if (typeof alt !== "string" || alt.trim() === "") {
    throw new ImageError(line, "a picture needs alt text: ![what the picture shows](file.svg)");
  }
  if (typeof src !== "string" || src === "") {
    throw new ImageError(line, `a picture must be the name of a file in ${ctx.label}, not a URL or a data URL`);
  }
  if (!IMAGE_FILE_NAME.test(src)) {
    throw new ImageError(line, `the picture "${src}" must be only a file name in ${ctx.label}, not a URL or a path`);
  }
  const extension = src.slice(src.lastIndexOf(".") + 1).toLowerCase();
  if (!src.includes(".") || !(IMAGE_FORMATS as readonly string[]).includes(extension)) {
    throw new ImageError(line, `the picture "${src}" must be ${IMAGE_FORMATS.join(", ")}`);
  }
  // An exact name match, so a name that works on Windows (case-insensitive) cannot 404 on the host (case-sensitive).
  const path = join(ctx.dir, src);
  if (!existsSync(ctx.dir) || !readdirSync(ctx.dir).includes(src)) {
    throw new ImageError(line, `the picture "${src}" is not in ${ctx.label}`);
  }
  let size: { width: number; height: number };
  try {
    const { width: w, height: h, orientation } = imageSize(readFileSync(path));
    // A JPEG whose EXIF orientation is 5-8 is shown turned a quarter: the box is the other way round.
    const [width, height] = orientation !== undefined && orientation >= 5 ? [h, w] : [w, h];
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
      throw new Error("no size");
    }
    size = { width, height };
  } catch {
    throw new ImageError(line, `the size of the picture "${src}" cannot be read (is the file valid?)`);
  }
  const caption = typeof title === "string" ? title.trim() : "";
  const plate: HastNode = {
    type: "element",
    tagName: "div",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "img",
        properties: {
          src: `/blog/${ctx.slug}/${src}`,
          alt,
          width: size.width,
          height: size.height,
          loading: "lazy",
          decoding: "async",
        },
        children: [],
      },
    ],
  };
  const figcaption: HastNode[] = caption
    ? [{ type: "element", tagName: "figcaption", properties: {}, children: [{ type: "text", value: caption }] }]
    : [];
  return { type: "element", tagName: "figure", properties: {}, children: [plate, ...figcaption] };
}

const rehypePictures = () => (tree: object, file: { data: object }) => {
  const ctx = (file.data as { images?: ImageContext }).images;
  const walk = (node: HastNode, top: boolean) => {
    const children = node.children;
    if (!children) {
      return;
    }
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const content = isElement(child, "p") ? child.children?.filter((c) => c.type !== "text" || c.value?.trim()) : [];
      const alone = content?.length === 1 && isElement(content[0], "img") ? content[0] : undefined;
      if (alone) {
        if (ctx && !top) {
          throw new ImageError(
            alone.position?.start.line ?? 1,
            "a picture must stand at the top level, not in a list or a quote",
          );
        }
        if (ctx) {
          children[i] = figureFor(alone, ctx);
        } else {
          children.splice(i--, 1);
        }
      } else if (isElement(child, "img")) {
        if (!ctx) {
          children.splice(i--, 1);
          continue;
        }
        throw new ImageError(child.position?.start.line ?? 1, "a picture must stand alone in its own paragraph");
      } else {
        walk(child, false);
      }
    }
  };
  walk(tree as HastNode, true);
};

// Links to other sites (ticket #44). A step after rehype-sanitize, so the sanitize rules still strip whatever an author
// writes by hand (a raw `target` never gets here). Every `a` with an absolute http(s) href to another origin opens in a
// new tab and says so in its accessible name, the same markup as the ExternalLink component. Same-origin and relative
// links are left alone.
function isExternalHref(href: unknown): boolean {
  if (typeof href !== "string" || !/^https?:\/\//i.test(href)) {
    return false;
  }
  try {
    return new URL(href).origin !== SITE_ORIGIN;
  } catch {
    return false;
  }
}

const rehypeExternalLinks = () => (tree: object) => {
  const walk = (node: HastNode) => {
    if (isElement(node, "a") && isExternalHref(node.properties?.href)) {
      node.properties = { ...node.properties, target: "_blank", rel: ["noopener", "noreferrer"] };
      node.children = [
        ...(node.children ?? []),
        {
          type: "element",
          tagName: "span",
          properties: { className: ["visually-hidden"] },
          children: [{ type: "text", value: NEW_TAB_NOTE }],
        },
      ];
      return;
    }
    node.children?.forEach(walk);
  };
  walk(tree as HastNode);
};

type Processor = {
  process(input: { value: string; data: { images?: ImageContext } }): Promise<{ toString(): string }>;
};
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
    .use(rehypeExternalLinks)
    .use(rehypePictures)
    .use(dropUnknownLanguages)
    .use(rehypeShikiFromHighlighter, highlighter, {
      theme: "css-variables",
      defaultLanguage: "text",
      fallbackLanguage: "text",
    })
    .use(rehypeStringify);
}

/**
 * Markdown to sanitized, highlighted HTML. Never outputs raw HTML from the source or a javascript: link. `images` says
 * where the post's pictures are; without it pictures are dropped. Throws ImageError for a picture that cannot be built.
 */
export async function renderMarkdown(markdown: string, images?: ImageContext): Promise<string> {
  processor ??= buildProcessor();
  return String(await (await processor).process({ value: markdown, data: { images } }));
}
