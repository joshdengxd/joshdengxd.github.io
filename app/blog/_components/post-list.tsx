import Link from "next/link";
import type { Post } from "@/lib/posts/loader";
import styles from "../blog.module.css";
import { PostDate } from "./post-date";
import { TagLinks } from "./tag-links";

/** Posts as given (the caller sorts, newest first), or the empty state when there are none. */
export function PostList({ posts, empty }: { posts: Post[]; empty: string }) {
  if (posts.length === 0) {
    return <p className={styles.empty}>{empty}</p>;
  }
  return (
    <ol className={styles.list}>
      {posts.map((post) => (
        <li key={post.slug}>
          <article className={styles.item}>
            <p className={styles.meta}>
              <PostDate iso={post.date} />
            </p>
            <h2 className={styles.itemTitle}>
              <Link href={`/blog/${post.slug}/`}>{post.title}</Link>
            </h2>
            <p className={styles.summary}>{post.summary}</p>
            <TagLinks tags={post.tags} />
          </article>
        </li>
      ))}
    </ol>
  );
}
