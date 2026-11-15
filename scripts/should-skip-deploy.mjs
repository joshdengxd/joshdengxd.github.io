// Decides whether a deploy run can skip build + deploy because the live site already serves this commit.
// Used by the `plan` job in .github/workflows/deploy.yml. Fail-safe: anything unclear means deploy.
// Usage (CI): EVENT_NAME=... FORCE=... SHA=... node scripts/should-skip-deploy.mjs  (writes `skip=true|false` to $GITHUB_OUTPUT)
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const SITE_URL = "https://joshdengxd.github.io/";

/** The full SHA in `<meta name="commit" content="...">`, or null when the tag is missing or not a 40-hex SHA. */
export function extractCommit(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\bname\s*=\s*["']commit["']/i.test(tag)) {
      continue;
    }
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]?.trim().toLowerCase();
    return content && /^[0-9a-f]{40}$/.test(content) ? content : null;
  }
  return null;
}

/** Pure decision: skip only when the live commit is a real SHA equal to `sha`. */
export function shouldSkip(liveCommit, sha) {
  return (
    typeof liveCommit === "string" &&
    /^[0-9a-f]{40}$/i.test(liveCommit) &&
    liveCommit.toLowerCase() === String(sha ?? "").toLowerCase()
  );
}

/**
 * `{ skip, reason }` for one run. `push` and `force` never skip; a failed fetch, a non-2xx answer or a missing meta never skips.
 * `fetchImpl` is injectable for tests.
 */
export async function decide({ eventName, force = false, sha, url = SITE_URL, fetchImpl = fetch }) {
  if (eventName === "push") {
    return { skip: false, reason: "push to main always builds and deploys" };
  }
  if (force) {
    return { skip: false, reason: "force=true: redeploying regardless of the live commit" };
  }
  let html;
  try {
    const res = await fetchImpl(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      return { skip: false, reason: `live site answered HTTP ${res.status}: deploying` };
    }
    html = await res.text();
  } catch (err) {
    return { skip: false, reason: `could not read the live site (${err?.message ?? err}): deploying` };
  }
  const live = extractCommit(html);
  if (live === null) {
    return { skip: false, reason: 'no valid <meta name="commit"> on the live site: deploying' };
  }
  if (shouldSkip(live, sha)) {
    return { skip: true, reason: `live site already serves ${live}: skipping build and deploy` };
  }
  return { skip: false, reason: `live site serves ${live}, this run is ${sha}: deploying` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { skip, reason } = await decide({
    eventName: process.env.EVENT_NAME,
    force: process.env.FORCE === "true",
    sha: process.env.SHA,
  });
  console.log(`should-skip-deploy: ${reason}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `skip=${skip}\n`);
  } else {
    console.log(`skip=${skip}`);
  }
}
