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
 * The panel is the same on every page, home included (ticket #33): the wordmark first, then the links. On home the wordmark
 * is the one home link (current page) and the big name in the page is a plain heading. Secondary controls live in navigation utilities.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const home = isHome(pathname);
  const menu = useRef<HTMLDetailsElement>(null);

  const button = useRef<HTMLElement>(null);

  // The sheet is closed by what the visitor does, never by the path changing: a late path change (slow
  // network, quick taps) would close a sheet the visitor had just reopened.
  // Links inside it close it in their click handler (see onClick below), also the link of the current page,
  // which changes no path. Back and forward (popstate), Escape and a click or tap outside close it here.
  useEffect(() => {
    const close = () => {
      if (menu.current) {
        menu.current.open = false;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !menu.current?.open) {
        return;
      }
      close();
      button.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (menu.current?.open && e.target instanceof Node && !menu.current.contains(e.target)) {
        close();
      }
    };
    window.addEventListener("popstate", close);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", close);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className={styles.shell} data-home={home ? "" : undefined}>
      <header className={styles.panel}>
        <div className={styles.bar}>
          <Link href="/" aria-label={HOME_LABEL} aria-current={home ? "page" : undefined} className={styles.wordmark}>
            <span className="name-first">Josh</span> <span className="name-last">Deng</span>
          </Link>
          <details ref={menu} className={styles.menu}>
            <summary ref={button} className={styles.menuButton}>
              Menu
            </summary>
            <div
              className={styles.sheet}
              onClick={(e) => {
                if (e.target instanceof Element && e.target.closest("a") && menu.current) {
                  menu.current.open = false;
                }
              }}
            >
              <NavLinks />
              <div className={styles.utilities}>
                <ThemeToggle />
                <ProfileLinks />
              </div>
            </div>
          </details>
        </div>
        <div className={styles.wide}>
          <NavLinks />
          <div className={styles.utilities}>
            <ThemeToggle />
            <ProfileLinks />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </div>
  );
}
