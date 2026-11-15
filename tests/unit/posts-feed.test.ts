import { XMLParser, XMLValidator } from "fast-xml-parser";
import { buildFeed, escapeXml } from "@/lib/posts/feed";
import type { Post } from "@/lib/posts/loader";

const post = (over: Partial<Post> = {}): Post => ({
  slug: "first-post",
  title: "First post",
  date: "2026-11-15T23:30:00Z",
  tags: ["learning"],
  summary: "A summary.",
  html: "<p>Body</p>",
  ...over,
});
const parse = (xml: string) => new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" }).parse(xml).rss;

describe("the feed", () => {
  it("is a well-formed RSS 2.0 channel with no items when there are no posts", () => {
    const xml = buildFeed([]);
    expect(XMLValidator.validate(xml)).toBe(true);
    const rss = parse(xml);
    expect(rss["@version"]).toBe("2.0");
    expect(rss.channel.title).toBeTruthy();
    expect(rss.channel.link).toBe("https://joshdengxd.github.io/blog/");
    expect(rss.channel.description).toBeTruthy();
    expect(rss.channel.item).toBeUndefined();
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("lastBuildDate");
  });

  it("points to itself with atom:link rel=self", () => {
    const link = parse(buildFeed([])).channel["atom:link"];
    expect(link).toMatchObject({ "@href": "https://joshdengxd.github.io/rss.xml", "@rel": "self" });
  });

  it("has one item per post, in the order given, with link, guid, date and tags", () => {
    const xml = buildFeed([post(), post({ slug: "second", title: "Second", date: "2026-11-01T08:05:09Z", tags: ["a", "b"] })]);
    expect(XMLValidator.validate(xml)).toBe(true);
    const items = parse(xml).channel.item;
    expect(items.map((i: { title: string }) => i.title)).toEqual(["First post", "Second"]);
    expect(items[0].link).toBe("https://joshdengxd.github.io/blog/first-post/");
    expect(items[0].guid["#text"]).toBe("https://joshdengxd.github.io/blog/first-post/");
    expect(items[0].description).toBe("A summary.");
    expect(items[1].category).toEqual(["a", "b"]);
  });

  it("writes RFC 822 dates in GMT", () => {
    const xml = buildFeed([post(), post({ slug: "second", date: "2026-11-01T08:05:09Z" })]);
    expect(xml).toContain("<pubDate>Sun, 15 Nov 2026 23:30:00 GMT</pubDate>");
    expect(xml).toContain("<pubDate>Sun, 01 Nov 2026 08:05:09 GMT</pubDate>");
    expect(xml).toContain("<lastBuildDate>Sun, 15 Nov 2026 23:30:00 GMT</lastBuildDate>");
  });

  it("escapes markup characters in text", () => {
    const xml = buildFeed([post({ title: 'Cats & <dogs> "quoted"', summary: "5 < 6 && 7 > 3 'ok'" })]);
    expect(XMLValidator.validate(xml)).toBe(true);
    expect(xml).toContain("<title>Cats &amp; &lt;dogs&gt; &quot;quoted&quot;</title>");
    expect(parse(xml).channel.item.description).toBe("5 < 6 && 7 > 3 'ok'");
  });

  it("drops control characters XML cannot carry", () => {
    expect(escapeXml("a\u0000b\u0008c\u001Fd")).toBe("abcd");
    expect(XMLValidator.validate(buildFeed([post({ title: "x\u0000y" })]))).toBe(true);
  });
});
