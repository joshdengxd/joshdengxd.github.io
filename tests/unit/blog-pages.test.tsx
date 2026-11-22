import { spawnSync } from "node:child_process";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { PostDate } from "@/app/blog/_components/post-date";
import { PostList } from "@/app/blog/_components/post-list";
import BlogPage, { metadata as blogMeta } from "@/app/blog/page";
import { generateStaticParams as slugParams } from "@/app/blog/[slug]/page";
import { generateStaticParams as tagParams } from "@/app/blog/tags/[tag]/page";
import sitemap from "@/app/sitemap";
import { formatUtcDate } from "@/lib/posts/dates";
import type { Post } from "@/lib/posts/loader";

const post = (over: Partial<Post> = {}): Post => ({
  slug: "first-post",
  title: "First post",
  date: "2026-11-15T23:30:00Z",
  tags: ["learning", "agents"],
  summary: "A summary.",
  html: "<p>Body</p>",
  ...over,
});

describe("/blog/ with the published posts", () => {
  it("lists the first post, opens with the journal introduction, and is indexable", async () => {
    render(await BlogPage());
    expect(screen.getByRole("heading", { level: 1, name: "Blog" })).toBeInTheDocument();
    expect(screen.queryByText("No posts yet.")).toBeNull();
    expect(screen.getByRole("link", { name: "How do I trust my agents more?" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/blog\/how-do-i-trust-my-agents-more\/?$/),
    );
    expect(
      screen.getByText(
        "I think of this blog as a journal. It’s where I write about what’s been on my mind and what I’m learning along the way. If something here helps you, I’m glad I shared it.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /rss|feed/i })).toBeNull();
    expect(blogMeta.robots).toBeUndefined();
    expect(blogMeta.alternates?.types).toBeUndefined();
    expect(blogMeta.description).toBe(
      "A personal journal of what’s been on my mind and what I’m learning along the way.",
    );
  });

  it("generates the post page and one page per tag, with no hidden _none page", async () => {
    expect(await slugParams()).toEqual([
      { slug: "how-my-agents-learn-the-way-i-work" },
      { slug: "how-do-i-trust-my-agents-more" },
    ]);
    expect((await tagParams()).map((p) => p.tag).sort()).toEqual(["agents", "learning", "verification"]);
  });

  it("lists the post and its tag pages in the sitemap", async () => {
    const urls = (await sitemap()).map((e) => e.url).join(" ");
    expect(urls).not.toContain("_none");
    expect(urls).toContain("/blog/how-do-i-trust-my-agents-more");
    expect(urls).toContain("/blog/how-my-agents-learn-the-way-i-work");
    for (const tag of ["agents", "learning", "verification"]) {
      expect(urls).toContain(`/blog/tags/${tag}`);
    }
  });
});

describe("the post list", () => {
  it("shows date, title link, summary and tag links, in the order given", () => {
    const posts = [post(), post({ slug: "older", title: "Older post", tags: ["x"] })];
    render(<PostList posts={posts} empty="none" />);
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual(["First post", "Older post"]);
    expect(screen.getByRole("link", { name: "First post" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/blog\/first-post\/?$/),
    );
    expect(screen.getByRole("link", { name: "agents" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/blog\/tags\/agents\/?$/),
    );
    expect(screen.getAllByText("A summary.")).toHaveLength(2);
  });

  it("shows the empty text for no posts", () => {
    render(<PostList posts={[]} empty="No posts with this tag." />);
    expect(screen.getByText("No posts with this tag.")).toBeInTheDocument();
  });
});

describe("dates", () => {
  it("formats the UTC date for the server and for readers without JavaScript", () => {
    expect(formatUtcDate("2026-11-15T23:30:00Z")).toBe("15 November 2026 (UTC)");
    expect(formatUtcDate("2026-11-16T00:30:00Z")).toBe("16 November 2026 (UTC)");
  });

  it("renders <time> with the UTC timestamp and the UTC text in the HTML", () => {
    expect(renderToString(<PostDate iso="2026-11-15T23:30:00Z" />)).toMatch(
      /^<time datetime="2026-11-15T23:30:00Z">15 November 2026 \(UTC\)<\/time>$/i,
    );
  });
});

describe("the fixture guard script", () => {
  const run = (dir: string) =>
    spawnSync(process.execPath, ["scripts/check-no-fixture.mjs", dir, "tests/fixtures/posts"], { encoding: "utf8" });

  it("passes a build without the fixture", () => {
    expect(run("tests/fixtures/out-clean").status).toBe(0);
  });

  it("fails a build that holds the fixture slug, naming the file", () => {
    const result = run("tests/fixtures/out-leak");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("blog-engine-fixture");
  });

  it("matches a non-ASCII fixture title in the build text", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/check-no-fixture.mjs", "tests/fixtures/out-unicode-leak", "tests/fixtures/posts-unicode"],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Café über naïve 日本語");
  });

  it("fails when there is no build", () => {
    expect(run("tests/fixtures/no-such-out").status).toBe(1);
  });
});
