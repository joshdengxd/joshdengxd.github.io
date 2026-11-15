import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { imageDirFor, parsePost } from "@/lib/posts/loader";
import { ImageError, renderMarkdown, type ImageContext } from "@/lib/posts/markdown";

// A 3x2 PNG (header and IHDR only: enough for the size reader), and an SVG with a viewBox and no width or height.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAEUlEQVR4nGNgYGD4z4AKGAAYMAEBoAnqBwAAAABJRU5ErkJggg==",
  "base64",
);
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect width="600" height="300"/></svg>';

let root: string;
let ctx: ImageContext;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "post-images-"));
  const dir = join(root, "public", "blog", "my-post");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "diagram.svg"), SVG);
  writeFileSync(join(dir, "photo.png"), PNG);
  writeFileSync(join(dir, "broken.svg"), "<svg></svg>");
  writeFileSync(join(dir, "anim.gif"), "GIF89a");
  ctx = { slug: "my-post", dir, label: "public/blog/my-post/" };
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

const render = (markdown: string) => renderMarkdown(markdown, ctx);
const failure = async (markdown: string) => {
  try {
    await render(markdown);
  } catch (error) {
    return error as ImageError;
  }
  throw new Error("expected the picture to fail");
};

describe("pictures in posts", () => {
  it("turns a picture with a caption into a figure with its real size", async () => {
    const html = await render('![A diagram of boxes](diagram.svg "Figure 1: boxes")');
    expect(html).toBe(
      '<figure><div><img src="/blog/my-post/diagram.svg" alt="A diagram of boxes" width="600" height="300" loading="lazy" decoding="async"></div><figcaption>Figure 1: boxes</figcaption></figure>',
    );
  });

  it("reads the size of a PNG, and leaves the caption out when there is none", async () => {
    const html = await render("![A photo](photo.png)");
    expect(html).toContain('width="3" height="2"');
    expect(html).toContain("<figure>");
    expect(html).not.toContain("figcaption");
  });

  it("escapes the caption and the alt text", async () => {
    const html = await render('![a "quoted" <b>](diagram.svg "<script>x</script> & more")');
    expect(html).not.toContain("<script");
    expect(html).toContain(String.raw`alt="a &#x22;quoted&#x22; <b>"`); // inside the attribute it is text
    expect(html).toContain("</figcaption>");
  });

  it("keeps text before and after, one figure per picture", async () => {
    const html = await render("Before.\n\n![One](diagram.svg)\n\nBetween.\n\n![Two](photo.png)\n\nAfter.\n");
    expect(html.match(/<figure>/g)).toHaveLength(2);
    expect(html).toContain("<p>Before.</p>");
    expect(html).toContain("<p>After.</p>");
  });

  it.each([
    ["a remote URL", "![x](https://example.com/a.png)", "not a URL or a path"],
    ["a protocol-relative URL", "![x](//example.com/a.png)", "not a URL or a path"],
    ["a path", "![x](images/diagram.svg)", "not a URL or a path"],
    ["a parent path", "![x](../diagram.svg)", "not a URL or a path"],
    ["a hidden file", "![x](.diagram.svg)", "not a URL or a path"],
    ["a data URL", "![x](data:image/png;base64,AAAA)", "not a URL or a data URL"],
    ["a javascript: URL", "![x](javascript:alert(1))", "not a URL or a data URL"],
    ["another format", "![x](anim.gif)", "must be svg, png, jpg, jpeg, webp"],
    ["no extension", "![x](diagram)", "must be svg, png, jpg, jpeg, webp"],
    ["a missing file", "![x](nothing.svg)", 'the picture "nothing.svg" is not in public/blog/my-post/'],
    ["a file with no readable size", "![x](broken.svg)", "cannot be read"],
    ["empty alt text", "![](diagram.svg)", "needs alt text"],
    ["blank alt text", "![   ](diagram.svg)", "needs alt text"],
  ])("fails for %s", async (_name, markdown, message) => {
    const error = await failure(`Text.\n\n${markdown}\n`);
    expect(error).toBeInstanceOf(ImageError);
    expect(error.message).toContain(message);
    expect(error.line).toBe(3);
  });

  it.each([
    ["inside a sentence", "Some text ![x](diagram.svg) more text"],
    ["next to another picture", "![x](diagram.svg) ![y](photo.png)"],
    ["inside a link", "[![x](diagram.svg)](https://example.com/)"],
    ["in a list item", "- ![x](diagram.svg)"],
    ["in a table", "| A |\n| - |\n| ![x](diagram.svg) |"],
  ])("fails for a picture %s", async (_name, markdown) => {
    expect((await failure(markdown)).message).toContain("alone in its own paragraph");
  });

  it("drops pictures when there is no image folder (the /design/ sample)", async () => {
    const html = await renderMarkdown("Text.\n\n![x](https://example.com/a.png)\n\n![y](diagram.svg)\n\nEnd.");
    expect(html).not.toContain("<img");
    expect(html).toContain("<p>Text.</p>");
    expect(html).toContain("<p>End.</p>");
  });

  it("does not let raw HTML bring a picture or an event handler", async () => {
    const html = await render('![x](diagram.svg "t")\n\n<img src="diagram.svg" onerror="alert(1)">');
    expect(html).not.toMatch(/onerror/);
    expect(html.match(/<img/g)).toHaveLength(1);
  });
});

describe("pictures through parsePost", () => {
  const post = (body: string) =>
    `---\ntitle: A post\ndate: 2026-11-15T18:00:00Z\ntags: [a]\nsummary: S.\n---\n\n${body}\n`;
  const FILE = "content/posts/my-post.md";
  const parse = (body: string) => parsePost(FILE, "my-post", post(body), "public/blog/my-post", root);

  it("renders the picture from the post's image folder", async () => {
    expect((await parse("![Boxes](diagram.svg)")).html).toContain('src="/blog/my-post/diagram.svg"');
  });

  it("names the file and the line in the file", async () => {
    // front matter is lines 1-6, a blank line 7, the body starts on line 8
    await expect(parse("Text.\n\n![](diagram.svg)")).rejects.toThrow(
      `${FILE}: body: line 10: a picture needs alt text`,
    );
    await expect(parse("![x](https://example.com/a.png)")).rejects.toThrow(`${FILE}: body: line 8: `);
  });

  it("looks in public/blog/<slug>/ for real posts and in the fixture folder for fixtures", () => {
    expect(imageDirFor("content/posts", "a-post")).toBe("public/blog/a-post");
    expect(imageDirFor("tests/fixtures/posts", "a-post")).toBe("tests/fixtures/post-images/a-post");
  });
});
