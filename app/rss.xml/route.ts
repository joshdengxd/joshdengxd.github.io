import { buildFeed } from "@/lib/posts/feed";
import { getPosts } from "@/lib/posts/loader";

// Static export: only GET, and only when forced static. Written to out/rss.xml.
export const dynamic = "force-static";

export async function GET() {
  return new Response(buildFeed(await getPosts()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
