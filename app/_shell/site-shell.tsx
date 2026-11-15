"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { HOME_LABEL, isHome } from "./links";
import { NavLinks } from "./nav-links";
import { ProfileLinks } from "./profile-links";
import styles from "./shell.module.css";
import { ThemeToggle } from "./theme-toggle";

/**
 * The D5 shell around every page. Wide screens: the panel on the right is the header (navigation, toggle).
 * Phones: one top row with the wordmark and a "Menu" sheet (<details>, so it opens without JavaScript).
 * On the home page the big name is the home mark, so there is no small wordmark and no footer line.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const home = isHome(pathname);
  const menu = useRef<HTMLDetailsElement>(null);

  // Close the sheet after a client-side navigation.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <div className={styles.shell} data-home={home ? "" : undefined}>
      <header className={styles.panel}>
        <div className={styles.bar}>
          {home ? null : (
            <Link href="/" aria-label={HOME_LABEL} className={styles.wordmark}>
              <span className="name-first">Josh</span> <span className="name-last">Deng</span>
            </Link>
          )}
          <details ref={menu} className={styles.menu}>
            <summary className={styles.menuButton}>Menu</summary>
            <div className={styles.sheet}>
              <NavLinks />
              <ThemeToggle />
            </div>
          </details>
        </div>
        <div className={styles.wide}>
          <NavLinks />
          <ThemeToggle />
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      {home ? null : (
        <footer className={styles.footer}>
          <p>Xindong Deng (Josh)</p>
          <ProfileLinks />
        </footer>
      )}
    </div>
  );
}
