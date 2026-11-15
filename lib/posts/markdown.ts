import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

type MdNode = { type: string; children?: MdNode[]; position?: { start: { line: number } } };

// Build time only: nothing in here is imported by a client component, so none of it ships to the browser.
const parser = unified().use(remarkParse).use(remarkGfm);

/** Lines (1-based, within `markdown`) where the Markdown has raw HTML, block or inline. */
export function findRawHtml(markdown: string): number[] {
  const lines: number[] = [];
  const walk = (node: MdNode) => {
    if (node.type === "html" && node.position) lines.push(node.position.start.line);
    node.children?.forEach(walk);
  };
  walk(parser.parse(markdown) as MdNode);
  return lines;
}

// Second guard behind the build failure above: remark-rehype drops raw HTML (allowDangerousHtml stays off) and
// rehype-sanitize (the GitHub schema) removes anything unsafe, such as javascript: links.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

/** Markdown to sanitized HTML. Never outputs raw HTML from the source or a javascript: link. */
export async function renderMarkdown(markdown: string): Promise<string> {
  return String(await processor.process(markdown));
}
