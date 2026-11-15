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

  return (
    <button type="button" className={styles.toggle} aria-pressed={theme === "light"} onClick={toggle}>
      Light theme
    </button>
  );
}
