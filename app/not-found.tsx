import type { Metadata } from "next";
import Link from "next/link";
import styles from "./_shell/stub.module.css";

// Exported as 404.html, which GitHub Pages serves for unknown URLs; it renders inside the shell of the root layout.
export const metadata: Metadata = { title: "Page not found · Xindong Deng (Josh)" };

export default function NotFound() {
  return (
    <div className={styles.stub}>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.line}>This page does not exist.</p>
      <p>
        <Link href="/" className={styles.back}>
          Back to the home page
        </Link>
      </p>
    </div>
  );
}
