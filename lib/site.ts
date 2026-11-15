/** Where the site lives. One form (with the trailing slash on pages) in canonical tags, the sitemap and the feed. */
export const SITE_ORIGIN = "https://joshdengxd.github.io";
export const SITE_NAME = "Xindong Deng (Josh)";

/** The site's GitHub URLs, defined once; a unit test keeps the owner URL out of every other source file. */
export const GITHUB_OWNER_URL = "https://github.com/joshdengxd";
export const repoUrl = (name: string) => `${GITHUB_OWNER_URL}/${name}`;
export const SITE_REPO_URL = repoUrl("joshdengxd.github.io");
