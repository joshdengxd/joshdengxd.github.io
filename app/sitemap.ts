import type { MetadataRoute } from "next";
import { getPosts, groupByTag } from "@/lib/posts/loader";
import { PROJECTS, projectPath } from "@/lib/projects";
import { SITE_ORIGIN } from "@/lib/site";

export const dynamic = "force-static";

// Every public page. /design/ (the token specimen) is left out on purpose, and so are the hidden `_none` pages.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  return [
    { url: `${SITE_ORIGIN}/` },
    { url: `${SITE_ORIGIN}/about/` },
    { url: `${SITE_ORIGIN}/projects/` },
    ...PROJECTS.map(({ slug }) => ({ url: `${SITE_ORIGIN}${projectPath(slug)}` })),
    { url: `${SITE_ORIGIN}/how-this-site-is-built/` },
    { url: `${SITE_ORIGIN}/blog/`, lastModified: posts[0]?.date },
    ...posts.map((post) => ({ url: `${SITE_ORIGIN}/blog/${post.slug}/`, lastModified: post.date })),
    ...groupByTag(posts).map(({ tag, posts: tagged }) => ({
      url: `${SITE_ORIGIN}/blog/tags/${tag}/`,
      lastModified: tagged[0].date,
    })),
  ];
}
