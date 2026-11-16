// Builds the site with the blog test fixture (BLOG_FIXTURES=1) for the e2e tests. A script, because
// `VAR=1 command` does not work in Windows shells. The default `npm run build` never sets the flag.
// The fixture posts' pictures live in tests/fixtures/post-images/<slug>/ (never in public/, so a default build cannot
// serve them); after the build they are copied into out/blog/<slug>/ where the post's <img> points.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";

const result = spawnSync("npm run build", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, BLOG_FIXTURES: "1" },
});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
if (existsSync("tests/fixtures/post-images")) {
  cpSync("tests/fixtures/post-images", "out/blog", { recursive: true });
}
