import type { ReactNode } from "react";
import styles from "./page.module.css";

/** The frame of an inner page: the title, an optional lead line, then its sections. */
export function PageLayout({
  title,
  lead,
  longTitle = false,
  children,
}: {
  title: string;
  lead?: ReactNode;
  longTitle?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <h1 className={longTitle ? `${styles.title} ${styles.titleLong}` : styles.title}>{title}</h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      <div className={styles.sections}>{children}</div>
    </div>
  );
}

/** One titled section of an inner page (an h2). */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`h-${slug(title)}`}>
      <h2 id={`h-${slug(title)}`} className={styles.heading}>
        {title}
      </h2>
      {children}
    </section>
  );
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
