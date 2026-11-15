import { contentDirs, groupByTag, loadPostsFrom, parsePost, sortPosts, splitFrontMatter } from "@/lib/posts/loader";

const FILE = "content/posts/my-post.md";
const good = (over: Record<string, string> = {}) => {
  const fm: Record<string, string> = {
    title: "A post",
    date: "2026-11-15T18:00:00Z",
    tags: "[learning, agents]",
    summary: "What this post is about.",
    ...over,
  };
  const lines = Object.entries(fm)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join("\n")}\n---\n\nBody text.\n`;
};
const fails = (raw: string, slug = "my-post") => parsePost(FILE, slug, raw).then(
  () => {
    throw new Error("expected the post to fail");
  },
  (e: Error) => e.message,
);

describe("front matter validation", () => {
  it("accepts a valid post", async () => {
    const post = await parsePost(FILE, "my-post", good());
    expect(post).toMatchObject({ slug: "my-post", title: "A post", date: "2026-11-15T18:00:00Z", tags: ["learning", "agents"] });
    expect(post.html).toBe("<p>Body text.</p>");
  });

  it.each(["title", "date", "tags", "summary"])("fails a missing %s, naming the file and the field", async (field) => {
    expect(await fails(good({ [field]: "" }))).toMatch(new RegExp(`^${FILE}: ${field}: `));
  });

  it("fails an extra field, naming it", async () => {
    expect(await fails(good({ tag: "[x]" }))).toBe(`${FILE}: tag: unknown field (allowed: title, date, tags, summary)`);
  });

  it.each([
    ["a date without a time", "2026-11-15"],
    ["a time without Z", "2026-11-15T18:00:00"],
    ["an offset instead of Z", "2026-11-15T18:00:00+02:00"],
    ["a date that does not exist", "2026-02-31T10:00:00Z"],
    ["text", "yesterday"],
  ])("fails %s in date", async (_name, date) => {
    expect(await fails(good({ date }))).toMatch(new RegExp(`^${FILE}: date: `));
  });

  it("reports a bare date once", async () => {
    expect((await fails(good({ date: "2026-11-15" }))).split("\n")).toHaveLength(1);
  });

  it("keeps a YAML date as a string (YAML 1.2), so a bare date is refused, not turned into midnight", async () => {
    expect(await fails(good({ date: "2026-11-15" }))).toContain("full UTC timestamp");
  });

  it.each([
    ["an empty list", "[]"],
    ["a tag that is not a slug", "[Not A Slug]"],
    ["a tag with an underscore", "[a_b]"],
    ["a repeated tag", "[a, a]"],
    ["six tags", "[a, b, c, d, e, f]"],
    ["a string instead of a list", "agents"],
  ])("fails %s in tags", async (_name, tags) => {
    expect(await fails(good({ tags }))).toMatch(new RegExp(`^${FILE}: tags`));
  });

  it("fails a title over 120 characters", async () => {
    expect(await fails(good({ title: "x".repeat(121) }))).toMatch(`${FILE}: title: `);
  });

  it("fails a repeated key (YAML 1.2)", async () => {
    expect(await fails(good().replace("---\n", "---\ntitle: Again\n"))).toMatch(`${FILE}: front matter: `);
  });

  it("names every problem, one per line", async () => {
    const message = await fails("---\ntitle: T\nextra: 1\n---\n");
    expect(message.split("\n")).toEqual(
      expect.arrayContaining([expect.stringContaining(`${FILE}: date: `), expect.stringContaining(`${FILE}: extra: `)]),
    );
  });

  it("fails a file without a --- block", async () => {
    expect(await fails("Just text.")).toBe(`${FILE}: front matter: the file must start with a --- block`);
    expect(await fails("---\ntitle: T\n")).toBe(`${FILE}: front matter: the --- block is never closed`);
  });

  it.each(["Bad_Slug", "UPPER", "two--hyphens", "-lead", "tags"])("fails the file name %s", async (slug) => {
    expect(await fails(good(), slug)).toMatch(`${FILE}: file name: `);
  });

  it("does not evaluate JavaScript front matter", async () => {
    expect(await fails("---js\n({title: 'x'})\n---\n")).toMatch(`${FILE}: front matter: `);
  });
});

describe("splitFrontMatter", () => {
  it("handles Windows line endings and says where the body starts", () => {
    expect(splitFrontMatter(FILE, "---\r\ntitle: T\r\n---\r\nBody\r\n")).toEqual({
      yaml: "title: T",
      body: "Body\n",
      bodyLine: 4,
    });
  });
});

describe("raw HTML", () => {
  it("fails the build, naming the file and the line in the file", async () => {
    const raw = good().replace("Body text.", "First line.\n\n<div>raw</div>\n");
    // front matter takes lines 1-6; the body starts on line 7: blank, "First line." (8), blank, html (10)
    expect(await fails(raw)).toBe(`${FILE}: body: line 10: raw HTML is not allowed, use Markdown`);
  });

  it("also fails inline HTML", async () => {
    expect(await fails(good().replace("Body text.", "Some <b>bold</b> text."))).toMatch(`${FILE}: body: line 8`);
  });

  it("does not mistake code or autolinks for HTML", async () => {
    const raw = good().replace("Body text.", "Use `<div>` here.\n\n```html\n<div>x</div>\n```\n\n<https://example.com>");
    const post = await parsePost(FILE, "my-post", raw);
    expect(post.html).toContain("&#x3C;div>");
  });
});

describe("sorting and tags", () => {
  const p = (slug: string, date: string, tags: string[]) => ({ slug, date, tags }) as never;
  const posts = [
    p("old", "2026-01-01T00:00:00Z", ["a"]),
    p("new", "2026-03-01T00:00:00Z", ["a", "b"]),
    p("mid-b", "2026-02-01T00:00:00Z", ["b"]),
    p("mid-a", "2026-02-01T00:00:00Z", ["a"]),
  ];

  it("sorts newest first, ties by slug", () => {
    expect(sortPosts(posts).map((x: { slug: string }) => x.slug)).toEqual(["new", "mid-a", "mid-b", "old"]);
  });

  it("groups by tag: tags alphabetical, posts newest first", () => {
    expect(groupByTag(posts).map((g) => [g.tag, g.posts.map((x) => x.slug)])).toEqual([
      ["a", ["new", "mid-a", "old"]],
      ["b", ["new", "mid-b"]],
    ]);
  });

  it("gives no tags for no posts", () => {
    expect(groupByTag([])).toEqual([]);
  });
});

describe("loading from folders", () => {
  it("fails a duplicate slug, naming both files", async () => {
    await expect(loadPostsFrom(["tests/fixtures/dup-a", "tests/fixtures/dup-b"])).rejects.toThrow(
      "tests/fixtures/dup-b/same-slug.md: file name: the slug \"same-slug\" is already used by tests/fixtures/dup-a/same-slug.md",
    );
  });

  it("skips a folder that does not exist", async () => {
    expect(await loadPostsFrom(["no/such/folder"])).toEqual([]);
  });

  it("loads the fixture posts newest first", async () => {
    const posts = await loadPostsFrom(["tests/fixtures/posts"]);
    expect(posts.map((x) => x.slug)).toEqual(["blog-engine-fixture-early", "blog-engine-fixture"]);
    expect(posts[1].html).toContain("<table>");
    expect(posts[1].html).toContain("<pre><code");
  });
});

describe("the fixture flag", () => {
  it("reads the fixture folder only when BLOG_FIXTURES is 1", () => {
    expect(contentDirs({})).toEqual(["content/posts"]);
    expect(contentDirs({ BLOG_FIXTURES: "0" })).toEqual(["content/posts"]);
    expect(contentDirs({ BLOG_FIXTURES: "true" })).toEqual(["content/posts"]);
    expect(contentDirs({ BLOG_FIXTURES: "1" })).toEqual(["content/posts", "tests/fixtures/posts"]);
  });

  it("the real posts folder never holds a fixture", async () => {
    const slugs = (await loadPostsFrom(contentDirs({}))).map((x) => x.slug);
    expect(slugs.filter((s) => s.includes("fixture"))).toEqual([]);
  });
});
