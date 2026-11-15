"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent, NAV } from "./links";
import styles from "./shell.module.css";

// The pathname is known when each page is prerendered, so aria-current is in the static HTML (works without JS).
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={styles.nav}>
      <ul>
        {NAV.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} aria-current={isCurrent(pathname, href) ? "page" : undefined}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
