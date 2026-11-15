// Builds the site with the blog test fixture (BLOG_FIXTURES=1) for the e2e tests. A script, because
// `VAR=1 command` does not work in Windows shells. The default `npm run build` never sets the flag.
import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";

const result = spawnSync("npm run build", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, BLOG_FIXTURES: "1" },
});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
// The fixture posts' pictures live in tests/fixtures/post-images/<slug>/, never in public/. Copy them into the fixture build
// only, as /blog/<slug>/<file>, where the posts point. The default build has none (npm run check:fixture guards that).
cpSync("tests/fixtures/post-images", "out/blog", { recursive: true });
