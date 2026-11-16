"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { THEME_KEY } from "../theme";
import styles from "./shell.module.css";

type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const current = (): Theme => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
// No button in the server HTML: without JavaScript the toggle could not work, so it is not shown.
const onServer = () => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, current, onServer);

  // React may reset <html> attributes on a development remount; re-apply the stored choice before paint.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      }
    } catch {}
  }, []);

  if (theme === null) {
    return null;
  }

  function toggle() {
    const next: Theme = current() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={label}
      aria-pressed={theme === "light"}
      onClick={toggle}
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        data-icon={theme === "dark" ? "sun" : "moon"}
      >
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : (
          <path d="M20.9 13.1A9 9 0 0 1 10.9 3a9 9 0 1 0 10 10.1Z" />
        )}
      </svg>
      <span className={styles.tooltip} aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
