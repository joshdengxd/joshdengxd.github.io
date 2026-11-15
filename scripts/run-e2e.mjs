// Builds the site, then runs the Playwright suite against `out/`. A script, because `VAR=1 command` does not work in
// Windows shells.
//   node scripts/run-e2e.mjs fixture   (default) build with the blog test fixture (BLOG_FIXTURES=1): *.fixture.spec.ts
//   node scripts/run-e2e.mjs default   the deployed build, no fixture; also runs the fixture guard: *.default.spec.ts
// Specs without either word in their name run on both builds. Extra arguments go to `playwright test`.
import { spawnSync } from "node:child_process";

const [build = "fixture", ...extra] = process.argv.slice(2);
if (build !== "fixture" && build !== "default") {
  console.error(`run-e2e: unknown build "${build}" (use fixture or default)`);
  process.exit(1);
}

function run(command, env = {}) {
  const result = spawnSync(command, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (build === "fixture") {
  run("node scripts/build-fixture.mjs");
} else {
  run("npm run build");
  run("npm run check:fixture");
}
run(["npx playwright test", ...extra].join(" "), { E2E_BUILD: build });
