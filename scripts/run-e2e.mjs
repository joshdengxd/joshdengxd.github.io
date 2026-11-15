// Builds the site, then runs the Playwright suite against `out/`. A script, because `VAR=1 command` does not work in
// Windows shells.
//   node scripts/run-e2e.mjs fixture   (default) build with the blog test fixture (BLOG_FIXTURES=1): *.fixture.spec.ts
//   node scripts/run-e2e.mjs default   the deployed build, no fixture; also runs the fixture guard: *.default.spec.ts
//   add --webkit (npm run e2e:webkit) to also run menu-sheet.spec.ts in WebKit; local only, CI runs Chromium only.
//   Needs `npx playwright install webkit` once; this script installs nothing.
// Specs without either word in their name run on both builds. Extra arguments go to `playwright test`.
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const webkit = args.includes("--webkit");
const [build = "fixture", ...extra] = args.filter((a) => a !== "--webkit");
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
run(["npx playwright test", ...extra].join(" "), { E2E_BUILD: build, ...(webkit ? { E2E_WEBKIT: "1" } : {}) });
