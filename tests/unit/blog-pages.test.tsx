import { spawnSync } from "node:child_process";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { PostDate } from "@/app/blog/_components/post-date";
import { PostList } from "@/app/blog/_components/post-list";
import BlogPage, { metadata as blogMeta } from "@/app/blog/page";
import { generateStaticParams as slugParams } from "@/app/blog/[slug]/page";
import { generateStaticParams as tagParams } from "@/app/blog/tags/[tag]/page";
import { GET as rss } from "@/app/rss.xml/route";
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

describe("/blog/ with no posts (the deployed state)", () => {
  it("says there are no posts yet, links the feed, and is indexable", async () => {
    render(await BlogPage());
    expect(screen.getByRole("heading", { level: 1, name: "Blog" })).toBeInTheDocument();
    expect(screen.getByText("No posts yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RSS feed" })).toHaveAttribute("href", "/rss.xml");
    expect(blogMeta.robots).toBeUndefined();
    expect(blogMeta.alternates?.types).toEqual({ "application/rss+xml": "/rss.xml" });
    expect(blogMeta.description).toBeTruthy();
  });

  it("generates one hidden _none page per dynamic route, so the static export has something to build", async () => {
    expect(await slugParams()).toEqual([{ slug: "_none" }]);
    expect(await tagParams()).toEqual([{ tag: "_none" }]);
  });

  it("serves an empty feed", async () => {
    const res = await rss();
    expect(res.headers.get("content-type")).toContain("application/rss+xml");
    expect(await res.text()).not.toContain("<item>");
  });
});

describe("the post list", () => {
  it("shows date, title link, summary and tag links, in the order given", () => {
    const posts = [post(), post({ slug: "older", title: "Older post", tags: ["x"] })];
    render(<PostList posts={posts} empty="none" />);
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual(["First post", "Older post"]);
    expect(screen.getByRole("link", { name: "First post" })).toHaveAttribute("href", expect.stringMatching(/^\/blog\/first-post\/?$/));
    expect(screen.getByRole("link", { name: "agents" })).toHaveAttribute("href", expect.stringMatching(/^\/blog\/tags\/agents\/?$/));
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

  it("fails when there is no build", () => {
    expect(run("tests/fixtures/no-such-out").status).toBe(1);
  });
});
