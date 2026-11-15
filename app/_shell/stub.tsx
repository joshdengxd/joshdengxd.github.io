import type { Metadata } from "next";
import styles from "./stub.module.css";

/** Metadata for a page that is only a placeholder: its own title, kept out of search results. */
export function stubMetadata(title: string): Metadata {
  return { title: `${title} · Xindong Deng (Josh)`, robots: { index: false, follow: true } };
}

/** A section that exists so the navigation never leads to a 404; its real content comes in a later ticket. */
export function Stub({ title, line }: { title: string; line: string }) {
  return (
    <div className={styles.stub}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.placeholder}>
        <strong>Placeholder.</strong> {line}
      </p>
    </div>
  );
}
