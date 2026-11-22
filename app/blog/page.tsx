import { getPosts } from "@/lib/posts/loader";
import { blogMetadata } from "./_components/metadata";
import { PostList } from "./_components/post-list";
import styles from "./blog.module.css";

export const metadata = blogMetadata(
  "Blog",
  "A personal journal of what’s been on my mind and what I’m learning along the way.",
  "/blog/",
);

export default async function Page() {
  const posts = await getPosts();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Blog</h1>
      <p className={styles.lead}>
        I think of this blog as a journal. It’s where I write about what’s been on my mind and what I’m learning along
        the way. If something here helps you, I’m glad I shared it.
      </p>
      <PostList posts={posts} empty="No posts yet." />
    </div>
  );
}
