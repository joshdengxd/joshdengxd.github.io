"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { HOME_LABEL, isHome } from "./links";
import { NavLinks } from "./nav-links";
import { ProfileLinks } from "./profile-links";
import styles from "./shell.module.css";
import { ThemeToggle } from "./theme-toggle";

const subscribe = () => () => {
  // Hydration is the only change; no external subscription is needed.
};
const onClient = () => true;
const onServer = () => false;

/**
 * The D5 shell around every page. Wide screens: the panel on the right is the header (navigation, toggle).
 * Phones: one top row with the wordmark and a Menu disclosure; before hydration navigation stays in normal flow.
 * The panel is the same on every page, home included (ticket #33): the wordmark first, then the links. On home the wordmark
 * is the one home link (current page) and the big name in the page is a plain heading. Secondary controls live in navigation utilities.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const home = isHome(pathname);
  const enhanced = useSyncExternalStore(subscribe, onClient, onServer);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const menu = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    // Removing the focused contents must leave a usable keyboard position.
    if (menu.current?.contains(document.activeElement)) {
      button.current?.focus();
    }
    setOpen(false);
  }, []);

  // User actions close the sheet. A late pathname update must not close a reopened sheet.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        close();
        button.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (
        open &&
        e.target instanceof Node &&
        !menu.current?.contains(e.target) &&
        !button.current?.contains(e.target)
      ) {
        close();
      }
    };
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onResize = (event: MediaQueryListEvent) => {
      if (event.matches) {
        close();
      }
    };
    desktop.addEventListener("change", onResize);
    window.addEventListener("popstate", close);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      desktop.removeEventListener("change", onResize);
      window.removeEventListener("popstate", close);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [close, open]);

  return (
    <div className={styles.shell} data-home={home ? "" : undefined} data-enhanced={enhanced ? "" : undefined}>
      <header className={styles.panel}>
        <div className={styles.bar}>
          <Link href="/" aria-label={HOME_LABEL} aria-current={home ? "page" : undefined} className={styles.wordmark}>
            <span className="name-first">Josh</span> <span className="name-last">Deng</span>
          </Link>
          {enhanced && (
            <button
              ref={button}
              type="button"
              className={styles.menuButton}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => (open ? close() : setOpen(true))}
            >
              Menu
            </button>
          )}
        </div>
        <div
          ref={menu}
          id={panelId}
          hidden={!open}
          className={styles.menu}
          onClick={(e) => {
            if (e.target instanceof Element && e.target.closest("a")) {
              close();
            }
          }}
        >
          {open && (
            <div className={styles.sheet}>
              <NavLinks />
              <div className={styles.utilities}>
                <ThemeToggle />
                <ProfileLinks />
              </div>
            </div>
          )}
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
