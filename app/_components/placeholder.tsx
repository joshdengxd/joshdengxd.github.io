import type { ReactNode } from "react";
import styles from "./placeholder.module.css";

/**
 * Text that stands in for real copy: a visible "Placeholder:" label, the muted colour, and `data-placeholder`, so
 * `grep -r data-placeholder out/` lists every one still left.
 */
export function Placeholder({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={className ? `${styles.placeholder} ${className}` : styles.placeholder} data-placeholder="">
      <span className={styles.label}>Placeholder:</span> {children}
    </p>
  );
}
