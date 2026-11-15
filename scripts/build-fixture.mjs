// Builds the site with the blog test fixture (BLOG_FIXTURES=1) for the e2e tests. A script, because
// `VAR=1 command` does not work in Windows shells. The default `npm run build` never sets the flag.
import { spawnSync } from "node:child_process";

const result = spawnSync("npm run build", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, BLOG_FIXTURES: "1" },
});
process.exit(result.status ?? 1);
