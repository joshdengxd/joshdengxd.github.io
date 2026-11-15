import { getPosts } from "@/lib/posts/loader";
import { blogMetadata } from "./_components/metadata";
import { PostList } from "./_components/post-list";
import styles from "./blog.module.css";

export const metadata = blogMetadata("Blog", "My weekly learning notes on building software with agents.", "/blog/");

export default async function Page() {
  const posts = await getPosts();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Blog</h1>
      <p className={styles.lead}>My learning notes on building software with agents, posted weekly. Newest first.</p>
      <PostList posts={posts} empty="No posts yet." />
    </div>
  );
}
