import { SITE_NAME, SITE_ORIGIN } from "../site";
import type { Post } from "./loader";

/** Escapes text for XML and drops the control characters XML 1.0 cannot carry. */
export function escapeXml(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 for the posts (already newest first). No items when there are no posts: still a valid feed. */
export function buildFeed(posts: Post[], origin = SITE_ORIGIN): string {
  const items = posts.map((post) => {
    const url = `${origin}/blog/${post.slug}/`;
    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
      `      <description>${escapeXml(post.summary)}</description>`,
      ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
      "    </item>",
    ].join("\n");
  });
  const lastBuild = posts[0] ? [`    <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>`] : [];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${SITE_NAME}: blog`)}</title>`,
    `    <link>${escapeXml(`${origin}/blog/`)}</link>`,
    "    <description>Learning notes on agent-assisted software delivery.</description>",
    "    <language>en</language>",
    ...lastBuild,
    `    <atom:link href="${escapeXml(`${origin}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
