import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parse as parseYaml, type YAMLParseError } from "yaml";
import type { z } from "zod";
import { findRawHtml, ImageError, renderMarkdown } from "./markdown";
import { frontMatterSchema, RESERVED_SLUGS, SLUG_PATTERN, type FrontMatter } from "./schema";

export type Post = FrontMatter & {
  slug: string;
  /** Sanitized HTML of the body. */
  html: string;
};

/** A post that cannot be built. The message names the file and the field, so the build log says what to fix. */
export class PostError extends Error {
  constructor(file: string, field: string, message: string) {
    super(`${file}: ${field}: ${message}`);
    this.name = "PostError";
  }
}

const CONTENT_DIR = "content/posts";
const FIXTURE_DIR = "tests/fixtures/posts";
/** Pictures of the real posts: public/blog/<slug>/, served as /blog/<slug>/<file>. The fixture's are never in public/. */
const IMAGES_DIR = "public/blog";
const FIXTURE_IMAGES_DIR = "tests/fixtures/post-images";

/** The folder (relative to the project root) with the pictures of post `slug`, which sits in the posts folder `dir`. */
export function imageDirFor(dir: string, slug: string): string {
  return `${dir === FIXTURE_DIR ? FIXTURE_IMAGES_DIR : IMAGES_DIR}/${slug}`;
}

/** Splits the `---` block from the body. `bodyLine` is the 1-based line of the file where the body starts. */
export function splitFrontMatter(file: string, raw: string): { yaml: string; body: string; bodyLine: number } {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trimEnd() !== "---") {
    throw new PostError(file, "front matter", "the file must start with a --- block");
  }
  const end = lines.findIndex((line, i) => i > 0 && line.trimEnd() === "---");
  if (end === -1) {
    throw new PostError(file, "front matter", "the --- block is never closed");
  }
  return { yaml: lines.slice(1, end).join("\n"), body: lines.slice(end + 1).join("\n"), bodyLine: end + 2 };
}

/** The first line of a YAML error, with the line in the file (the parser counts from the line after the opening ---). */
function yamlProblem(error: YAMLParseError): string {
  // The parser's own "at line N, column M" counts inside the front matter, which would mislead; the file line replaces it.
  const text = error.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, "");
  const line = error.linePos?.[0].line;
  return line === undefined ? text : `line ${line + 1}: ${text}`;
}

/** Parses and validates one post file; `file` is only used in messages. Throws with the file and the field named. */
export async function parsePost(
  file: string,
  slug: string,
  raw: string,
  imageDir = imageDirFor(CONTENT_DIR, slug),
  root = process.cwd(),
): Promise<Post> {
  if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.includes(slug)) {
    throw new PostError(
      file,
      "file name",
      `the slug "${slug}" must be lower-case words joined by hyphens (a-z, 0-9, -), and "${RESERVED_SLUGS.join('" or "')}" is reserved for a route`,
    );
  }

  const { yaml, body, bodyLine } = splitFrontMatter(file, raw);

  let data: unknown;
  try {
    // YAML 1.2: a date stays a string; a repeated key is an error.
    data = parseYaml(yaml);
  } catch (error) {
    throw new PostError(file, "front matter", yamlProblem(error as YAMLParseError));
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new PostError(file, "front matter", "must list title, date, tags and summary");
  }

  const parsed = frontMatterSchema.safeParse(data);
  if (!parsed.success) {
    const problems = parsed.error.issues.flatMap((issue: z.core.$ZodIssue) =>
      issue.code === "unrecognized_keys"
        ? issue.keys.map((key) => `${file}: ${key}: unknown field (allowed: title, date, tags, summary)`)
        : [`${file}: ${issue.path.join(".") || "front matter"}: ${issue.message}`],
    );
    throw new Error(problems.join("\n"));
  }

  const rawHtml = findRawHtml(body);
  if (rawHtml.length > 0) {
    throw new PostError(file, "body", `line ${bodyLine + rawHtml[0] - 1}: raw HTML is not allowed, use Markdown`);
  }

  try {
    const images = { slug, dir: resolve(root, imageDir), label: `${imageDir}/` };
    return { ...parsed.data, slug, html: await renderMarkdown(body, images) };
  } catch (error) {
    if (error instanceof ImageError) {
      throw new PostError(file, "body", `line ${bodyLine + error.line - 1}: ${error.message}`);
    }
    throw error;
  }
}

/** Newest first; the slug breaks a tie so the order never changes between builds. */
export function sortPosts<T extends { date: string; slug: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.slug.localeCompare(b.slug));
}

/** Loads every `.md` file in the folders (paths relative to `root`); a duplicate slug fails. */
export async function loadPostsFrom(dirs: string[], root = process.cwd()): Promise<Post[]> {
  const posts = new Map<string, { post: Post; file: string }>();
  for (const dir of dirs) {
    const abs = resolve(root, dir);
    if (!statSync(abs, { throwIfNoEntry: false })?.isDirectory()) {
      continue;
    }
    for (const name of readdirSync(abs)
      .filter((n) => n.endsWith(".md"))
      .sort()) {
      const file = relative(root, join(abs, name)).split("\\").join("/");
      const slug = name.slice(0, -3);
      const post = await parsePost(file, slug, readFileSync(join(abs, name), "utf8"), imageDirFor(dir, slug), root);
      const earlier = posts.get(post.slug);
      if (earlier) {
        throw new PostError(file, "file name", `the slug "${post.slug}" is already used by ${earlier.file}`);
      }
      posts.set(post.slug, { post, file });
    }
  }
  return sortPosts([...posts.values()].map((p) => p.post));
}

/** The folders a build reads: the real posts, and the test fixture only when BLOG_FIXTURES=1. */
export function contentDirs(env: Record<string, string | undefined> = process.env): string[] {
  return env.BLOG_FIXTURES === "1" ? [CONTENT_DIR, FIXTURE_DIR] : [CONTENT_DIR];
}

let cached: Promise<Post[]> | undefined;

/** All posts, newest first. Cached during a build; read fresh in the dev server so edits show up. */
export function getPosts(): Promise<Post[]> {
  if (process.env.NODE_ENV !== "production") {
    return loadPostsFrom(contentDirs());
  }
  return (cached ??= loadPostsFrom(contentDirs()));
}

export type TagGroup = { tag: string; posts: Post[] };

/** Every tag with its posts (newest first), tags in alphabetical order. */
export function groupByTag(posts: Post[]): TagGroup[] {
  const groups = new Map<string, Post[]>();
  for (const post of sortPosts(posts)) {
    for (const tag of post.tags) {
      groups.set(tag, [...(groups.get(tag) ?? []), post]);
    }
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([tag, list]) => ({ tag, posts: list }));
}
