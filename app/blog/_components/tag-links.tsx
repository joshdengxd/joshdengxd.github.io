import Link from "next/link";
import styles from "../blog.module.css";

/** A post's tags, each a link to its tag page (works without JavaScript). */
export function TagLinks({ tags }: { tags: string[] }) {
  return (
    <ul className={styles.tags} aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag}>
          <Link href={`/blog/tags/${tag}/`}>{tag}</Link>
        </li>
      ))}
    </ul>
  );
}
