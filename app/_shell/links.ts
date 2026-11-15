// What the shell links to. The only personal details in the shell are the name and these two profiles.
export const NAV = [
  { href: "/about/", label: "About" },
  { href: "/projects/", label: "Projects" },
  { href: "/blog/", label: "Blog" },
  { href: "/how-this-site-is-built/", label: "How this site is built" },
] as const;

export const HOME_LABEL = "Xindong Deng (Josh), home";
export const GITHUB_URL = "https://github.com/joshdengxd";
export const LINKEDIN_URL = "https://www.linkedin.com/in/josh-deng-edm";

/** Path without the trailing slash ("/" stays "/"); the static export and the client may differ here. */
export function trimSlash(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

export const isHome = (pathname: string | null) => pathname !== null && trimSlash(pathname) === "/";

/** True when `pathname` is the page `href` or one of its sub-pages (`/blog/a-post/` marks Blog). */
export function isCurrent(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  const path = trimSlash(pathname);
  const target = trimSlash(href);
  if (target === "/") return path === "/";
  return path === target || path.startsWith(`${target}/`);
}
