import { getPosts } from "@/lib/posts/loader";
import { blogMetadata } from "./_components/metadata";
import { PostList } from "./_components/post-list";
import styles from "./blog.module.css";

export const metadata = blogMetadata(
  "Blog",
  "Learning notes on agent-assisted software delivery, newest first.",
  "/blog/",
);

export default async function Page() {
  const posts = await getPosts();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Blog</h1>
      <p className={styles.lead}>
        Learning notes on agent-assisted software delivery, newest first. <a href="/rss.xml">RSS feed</a>
      </p>
      <PostList posts={posts} empty="No posts yet." />
    </div>
  );
}
