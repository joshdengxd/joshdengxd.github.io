import { readdirSync, readFileSync, statSync } from "node:fs";
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

type MdNode = {
  type: string;
  children?: MdNode[];
  position?: { start: { line: number } };
  value?: string;
  url?: string;
  alt?: string | null;
};

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

// Pictures in posts (ticket #41). A post names a file only by its bare name, `![alt text](diagram.svg "Caption")`; the file
// sits in the post's image folder (public/blog/<slug>/, copied into the site as it is) and the build maps the name to
// /blog/<slug>/<name>. Two steps: `checkImages` runs on the Markdown tree, before sanitizing (a data: URL would be
// stripped by the sanitizer and could no longer be named), and fails the build with the line; `figureImages` runs after
// rehype-sanitize, the same place as Shiki, and writes the <figure> from the sanitized `img` (a bare src, alt, title).
// Sanitizing itself is unchanged, and raw HTML stays refused.
export const IMAGE_EXTENSIONS = ["svg", "png", "jpg", "jpeg", "webp"] as const;
const IMAGE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
/** The type image-size reports for each allowed extension. */
const IMAGE_TYPES: Record<string, string> = { svg: "svg", png: "png", jpg: "jpg", jpeg: "jpg", webp: "webp" };

/** Where a post's pictures are: its slug (for the public path) and the folder that holds the files. */
export type ImageContext = { slug: string; imageDir?: string };

/** A picture problem. `line` is 1-based within the Markdown body; the loader adds the front matter and names the file. */
export class ImageError extends Error {
  constructor(
    message: string,
    readonly line?: number,
  ) {
    super(message);
    this.name = "ImageError";
  }
}

/** The file names in a folder (exact case, on every platform); none when the folder does not exist. */
function listFiles(dir: string): string[] {
  return statSync(dir, { throwIfNoEntry: false })?.isDirectory()
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name)
    : [];
}

/** Checks one picture name against the image folder and returns its real size (what the browser shows, EXIF turn included). */
function inspectImage(name: string, ctx: ImageContext | undefined): { width: number; height: number } {
  const shown = JSON.stringify(name);
  const where = ctx ? `public/blog/${ctx.slug}/` : "the post's image folder";
  if (/^[a-z][a-z0-9+.-]*:/i.test(name) || name.startsWith("//")) {
    throw new ImageError(
      `image ${shown}: remote and data URLs are not allowed; put the file in ${where} and use its file name`,
    );
  }
  if (/[\\/]/.test(name) || name.includes("..")) {
    throw new ImageError(`image ${shown}: use only a file name, not a path; the file sits in ${where}`);
  }
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "";
  if (!IMAGE_NAME.test(name) || !(ext in IMAGE_TYPES)) {
    throw new ImageError(
      `image ${shown}: the format must be ${IMAGE_EXTENSIONS.join(", ")} and the name only letters, digits, dot, hyphen or underscore`,
    );
  }
  if (!ctx?.imageDir || !listFiles(ctx.imageDir).includes(name)) {
    throw new ImageError(`image ${shown}: no such file in ${where}`);
  }
  let size: ReturnType<typeof imageSize>;
  try {
    size = imageSize(readFileSync(join(ctx.imageDir, name)));
  } catch (error) {
    throw new ImageError(`image ${shown}: cannot read the size (${(error as Error).message})`);
  }
  if (size.type !== IMAGE_TYPES[ext] || !size.width || !size.height) {
    throw new ImageError(`image ${shown}: the file is not a valid .${ext} image`);
  }
  const turned = (size.orientation ?? 1) >= 5; // EXIF 5-8: the browser shows the picture turned by 90 degrees
  return turned ? { width: size.height, height: size.width } : { width: size.width, height: size.height };
}

type FileData = { data: object };
const imagesOf = (file: FileData) => (file.data as { images?: ImageContext }).images;

/** Markdown tree step: every picture needs alt text, a bare file name that exists, and a paragraph of its own. */
const checkImages = () => (tree: object, file: FileData) => {
  const ctx = imagesOf(file);
  const walk = (node: MdNode, parent?: MdNode) => {
    const line = node.position?.start.line;
    if (node.type === "imageReference") {
      throw new ImageError('image: use the inline form ![alt text](file.png "Caption")', line);
    }
    if (node.type === "image") {
      try {
        if (!node.alt?.trim()) {
          throw new ImageError("image: alt text is required, write it inside the brackets: ![alt text](file.png)");
        }
        const others = (parent?.children ?? []).filter((c) => c !== node && !(c.type === "text" && !c.value?.trim()));
        if (parent?.type !== "paragraph" || others.length > 0) {
          throw new ImageError("image: put the picture in a paragraph of its own, with no other text or link");
        }
        inspectImage(node.url ?? "", ctx);
      } catch (error) {
        throw error instanceof ImageError ? new ImageError(error.message, line) : error;
      }
    }
    node.children?.forEach((child) => walk(child, node));
  };
  walk(tree as MdNode);
};

type HastNode = {
  type?: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** After rehype-sanitize: a paragraph that holds one `img` becomes <figure> with the size, lazy loading and the caption. */
const figureImages = () => (tree: object, file: FileData) => {
  const ctx = imagesOf(file);
  const toFigure = (img: HastNode): HastNode => {
    const name = String(img.properties?.src ?? "");
    const alt = String(img.properties?.alt ?? "").trim();
    if (!alt) {
      throw new ImageError(`image ${JSON.stringify(name)}: alt text is required`);
    }
    const { width, height } = inspectImage(name, ctx);
    const figure: HastNode = {
      type: "element",
      tagName: "figure",
      properties: {},
      children: [
        {
          type: "element",
          tagName: "img",
          properties: { src: `/blog/${ctx?.slug}/${name}`, alt, width, height, loading: "lazy", decoding: "async" },
          children: [],
        },
      ],
    };
    const caption = String(img.properties?.title ?? "").trim();
    if (caption) {
      figure.children?.push({
        type: "element",
        tagName: "figcaption",
        properties: {},
        children: [{ type: "text", value: caption }],
      });
    }
    return figure;
  };
  const walk = (node: HastNode) => {
    node.children = node.children?.map((child) => {
      if (child.tagName === "p") {
        const content = (child.children ?? []).filter((c) => !(c.type === "text" && !c.value?.trim()));
        if (content.length === 1 && content[0].tagName === "img") {
          return toFigure(content[0]);
        }
      }
      if (child.tagName === "img") {
        throw new ImageError(
          `image ${JSON.stringify(child.properties?.src ?? "")}: put the picture in a paragraph of its own`,
        );
      }
      walk(child);
      return child;
    });
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
    .use(checkImages)
    .use(remarkRehype)
    .use(rehypeSanitize, schema)
    .use(figureImages)
    .use(dropUnknownLanguages)
    .use(rehypeShikiFromHighlighter, highlighter, {
      theme: "css-variables",
      defaultLanguage: "text",
      fallbackLanguage: "text",
    })
    .use(rehypeStringify);
}

/**
 * Markdown to sanitized, highlighted HTML. Never outputs raw HTML from the source or a javascript: link.
 * `images` says where the post's pictures are; without it a picture is an error. A bad picture throws an ImageError.
 */
export async function renderMarkdown(markdown: string, images?: ImageContext): Promise<string> {
  processor ??= buildProcessor();
  return String(await (await processor).process({ value: markdown, data: { images } }));
}
