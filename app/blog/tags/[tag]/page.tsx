import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts, groupByTag } from "@/lib/posts/loader";
import { blogMetadata, hiddenMetadata } from "../../_components/metadata";
import { PostList } from "../../_components/post-list";
import styles from "../../blog.module.css";

export const dynamicParams = false;

// With no tags, one hidden `_none` page keeps the static export valid (see app/blog/[slug]/page.tsx).
export async function generateStaticParams() {
  const groups = groupByTag(await getPosts());
  return groups.length > 0 ? groups.map(({ tag }) => ({ tag })) : [{ tag: "_none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const group = groupByTag(await getPosts()).find((g) => g.tag === tag);
  if (!group) return hiddenMetadata;
  return blogMetadata(`Posts tagged ${tag}`, `Blog posts tagged ${tag}, newest first.`, `/blog/tags/${tag}/`);
}

export default async function Page({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const group = groupByTag(await getPosts()).find((g) => g.tag === tag);
  if (!group) notFound();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tagged {tag}</h1>
      <p className={styles.lead}>
        Posts tagged {tag}, newest first. <Link href="/blog/">All posts</Link>
      </p>
      <PostList posts={group.posts} empty="No posts with this tag." />
    </div>
  );
}
