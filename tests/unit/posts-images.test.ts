import { join } from "node:path";
import { loadPostsFrom, parsePost } from "@/lib/posts/loader";
import { ImageError, renderMarkdown } from "@/lib/posts/markdown";

// Pictures in posts (ticket #41). Files for these tests: tests/fixtures/images-unit/ (a 3x2 PNG, an SVG with only a viewBox
// of 120x60, a text file named .png, a .gif).
const FILE = "content/posts/my-post.md";
const DIR = join(process.cwd(), "tests", "fixtures", "images-unit");
const ctx = { slug: "my-post", imageDir: DIR };

// Front matter takes lines 1-6 and one blank line follows, so the body starts on line 8.
const post = (body: string) =>
  `---\ntitle: A post\ndate: 2026-11-15T18:00:00Z\ntags: [learning]\nsummary: What this post is about.\n---\n\n${body}\n`;
const build = (body: string, imageDir: string | undefined = DIR) => parsePost(FILE, "my-post", post(body), imageDir);
const failure = (body: string, imageDir?: string) =>
  build(body, imageDir).then(
    () => {
      throw new Error("expected the post to fail");
    },
    (e: Error) => e.message,
  );

describe("a picture becomes a figure", () => {
  it("writes the real size of an SVG (its viewBox) and a PNG, the public path, lazy loading and the caption", async () => {
    const html = (await build('![A small box](viewbox-only.svg "Figure 1: a box")\n\n![Three by two](tiny.png)')).html;
    expect(html).toBe(
      [
        '<figure><img src="/blog/my-post/viewbox-only.svg" alt="A small box" width="120" height="60" loading="lazy" decoding="async">' +
          "<figcaption>Figure 1: a box</figcaption></figure>",
        '<figure><img src="/blog/my-post/tiny.png" alt="Three by two" width="3" height="2" loading="lazy" decoding="async"></figure>',
      ].join("\n"),
    );
  });

  it("is a figure without a caption when there is no title, and escapes caption and alt text", async () => {
    const html = await renderMarkdown('![a <b> "q"](tiny.png "x <i>y</i> & z")\n\n![plain](tiny.png)', ctx);
    expect(html).toContain("<figcaption>x &#x3C;i>y&#x3C;/i> &#x26; z</figcaption>");
    expect(html).toContain('alt="a <b> &#x22;q&#x22;"');
    expect(html.match(/<figcaption>/g)).toHaveLength(1);
    expect(html.match(/<figure>/g)).toHaveLength(2);
    expect(html).not.toContain("<i>");
  });

  it("keeps the text of the post around the figure", async () => {
    const html = await renderMarkdown("Before.\n\n![Three by two](tiny.png)\n\nAfter.", ctx);
    expect(html).toMatch(/^<p>Before\.<\/p>\n<figure>.*<\/figure>\n<p>After\.<\/p>$/s);
  });

  it("works for the fixture post, from public path to size", async () => {
    const [fixture] = (await loadPostsFrom(["tests/fixtures/posts"])).filter((p) => p.slug === "blog-engine-fixture");
    expect(fixture.html).toContain(
      '<img src="/blog/blog-engine-fixture/diagram.svg" alt="Diagram of a Markdown file turning into a figure" width="800" height="400" loading="lazy" decoding="async">',
    );
    expect(fixture.html).toContain("<figcaption>Figure 1: the build turns the picture into a figure</figcaption>");
    expect(fixture.html.match(/<figure>/g)).toHaveLength(2);
  });
});

describe("a bad picture fails the build, with the file and the line", () => {
  // the picture is on body line 3, which is file line 10 (the body starts on line 8)
  const at = (picture: string) => `Intro.\n\n${picture}`;
  const message = (what: string) => `${FILE}: body: line 10: image ${what}`;

  it.each([
    [
      "a remote URL",
      "![x](https://example.com/a.png)",
      '"https://example.com/a.png": remote and data URLs are not allowed',
    ],
    [
      "a protocol-relative URL",
      "![x](//example.com/a.png)",
      '"//example.com/a.png": remote and data URLs are not allowed',
    ],
    [
      "a data URL",
      "![x](data:image/png;base64,AAAA)",
      '"data:image/png;base64,AAAA": remote and data URLs are not allowed',
    ],
    ["a javascript: URL", "![x](javascript:alert(1))", '"javascript:alert(1)": remote and data URLs are not allowed'],
    ["a path", "![x](images/tiny.png)", '"images/tiny.png": use only a file name, not a path'],
    ["a parent path", "![x](../tiny.png)", '"../tiny.png": use only a file name, not a path'],
    ["an absolute path", "![x](/tiny.png)", '"/tiny.png": use only a file name, not a path'],
    ["a backslash path", "![x](<a\\tiny.png>)", '"a\\\\tiny.png": use only a file name, not a path'],
    ["a missing file", "![x](nothing.png)", '"nothing.png": no such file in public/blog/my-post/'],
    ["a name in the wrong case", "![x](TINY.png)", '"TINY.png": no such file in public/blog/my-post/'],
    ["an unsupported format", "![x](notes.gif)", '"notes.gif": the format must be svg, png, jpg, jpeg, webp'],
    ["no extension", "![x](tiny)", '"tiny": the format must be svg, png, jpg, jpeg, webp'],
    ["a file that is not the image it says", "![x](fake.png)", '"fake.png": cannot read the size'],
  ])("%s", async (_name, picture, text) => {
    expect(await failure(at(picture))).toContain(message(text));
  });

  it("an empty alt text", async () => {
    expect(await failure(at("![](tiny.png)"))).toBe(
      `${FILE}: body: line 10: image: alt text is required, write it inside the brackets: ![alt text](file.png)`,
    );
    expect(await failure(at("![   ](tiny.png)"))).toContain("alt text is required");
  });

  it("a post with no image folder", async () => {
    expect(await failure(at("![x](tiny.png)"), join(DIR, "no-such-folder"))).toBe(
      message(`"tiny.png": no such file in public/blog/my-post/`),
    );
  });

  it("a picture in the middle of a paragraph, or inside a link", async () => {
    expect(await failure("Text ![x](tiny.png) more text.")).toBe(
      `${FILE}: body: line 8: image: put the picture in a paragraph of its own, with no other text or link`,
    );
    expect(await failure("[![x](tiny.png)](https://example.com)")).toContain("a paragraph of its own");
  });

  it("a reference-style picture", async () => {
    expect(await failure("![x][r]\n\n[r]: tiny.png")).toContain("use the inline form");
  });

  it("names the right line when the front matter is longer", async () => {
    const raw = post("![x](nothing.png)").replace("tags: [learning]", "tags:\n  - learning\n  - agents");
    await expect(parsePost(FILE, "my-post", raw, DIR)).rejects.toThrow(`${FILE}: body: line 10: image "nothing.png"`);
  });

  it("is an ImageError with the body line when the Markdown step is used alone", async () => {
    const error = await renderMarkdown("Intro.\n\n![x](nothing.png)", ctx).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ImageError);
    expect((error as ImageError).line).toBe(3);
  });

  it("any picture is refused where no image folder is given", async () => {
    await expect(renderMarkdown("![x](tiny.png)")).rejects.toThrow('image "tiny.png": no such file');
  });
});

describe("sanitizing is unchanged", () => {
  it("fails a post with an <img onerror> as raw HTML, as before", async () => {
    expect(await failure("<img src=x onerror=alert(1)>")).toBe(
      `${FILE}: body: line 8: raw HTML is not allowed, use Markdown`,
    );
  });

  it("removes an <img onerror>, a <script> and a javascript: link when the Markdown step is used on its own", async () => {
    const html = await renderMarkdown(
      "<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\n<script>alert(1)</script>",
      ctx,
    );
    expect(html).not.toMatch(/<img|<script|onerror|javascript:|<figure/i);
  });

  it("writes attributes only from the build: a hostile alt text or caption cannot add one", async () => {
    const html = await renderMarkdown(
      `![a" onerror="x()](tiny.png "c" onload="y()")\n\n![b](tiny.png "</figcaption><script>z()</script>")`,
      ctx,
    );
    expect(html).not.toMatch(/<script/);
    const attrs = [...html.matchAll(/<img\s([^>]*)>/g)].flatMap((m) =>
      [...m[1].matchAll(/([a-z-]+)=/g)].map((x) => x[1]),
    );
    expect(new Set(attrs)).toEqual(new Set(["src", "alt", "width", "height", "loading", "decoding"]));
  });
});
