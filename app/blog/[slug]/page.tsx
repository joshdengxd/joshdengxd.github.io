import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/posts/loader";
import { SITE_NAME } from "@/lib/site";
import { blogMetadata, hiddenMetadata, rssLink } from "../_components/metadata";
import { PostDate } from "../_components/post-date";
import { TagLinks } from "../_components/tag-links";
import styles from "../blog.module.css";

// Only the posts found at build time exist; any other URL is the 404 page.
export const dynamicParams = false;

// A static export refuses a dynamic route with nothing to generate, so with no posts one hidden page, `_none`, is
// generated. It renders the 404 content with noindex, and is never linked, listed or in the sitemap.
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.length > 0 ? posts.map((post) => ({ slug: post.slug })) : [{ slug: "_none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPosts()).find((p) => p.slug === slug);
  if (!post) return hiddenMetadata;
  return {
    ...blogMetadata(post.title, post.summary, `/blog/${post.slug}/`),
    openGraph: { type: "article", title: `${post.title} · ${SITE_NAME}`, description: post.summary, publishedTime: post.date },
    alternates: { canonical: `/blog/${post.slug}/`, types: rssLink },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = (await getPosts()).find((p) => p.slug === slug);
  if (!post) notFound();
  return (
    <article className={styles.page}>
      <header className={styles.postHeader}>
        <h1 className={styles.postTitle}>{post.title}</h1>
        <div className={styles.postMeta}>
          <p className={styles.meta}>
            <PostDate iso={post.date} />
          </p>
          <TagLinks tags={post.tags} />
        </div>
      </header>
      <div className={styles.prose} dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
