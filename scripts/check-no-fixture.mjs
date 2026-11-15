// Fails (exit 1) if the blog test fixture leaked into a build: the slug or the title of any post in
// tests/fixtures/posts/ appearing anywhere in out/ (HTML, feed, sitemap, Next.js data files).
// Run after `npm run build` in CI and in the deploy workflow. Usage: node scripts/check-no-fixture.mjs [out] [fixtures]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Slug and title of each fixture post. */
export function fixtureTerms(fixturesDir) {
  return readdirSync(fixturesDir)
    .filter((name) => name.endsWith(".md"))
    .flatMap((name) => {
      const title = /^title:\s*(.+?)\s*$/m.exec(readFileSync(join(fixturesDir, name), "utf8"))?.[1];
      return [name.slice(0, -3), title].filter(Boolean);
    });
}

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(join(dir, e.name)) : [join(dir, e.name)],
  );
}

/** The `[file, term]` pairs (files read as UTF-8, the same encoding as the fixture titles) found: a term in a file's text or in its path. Empty means clean. */
export function findLeaks(outDir, terms) {
  const leaks = [];
  for (const file of filesUnder(outDir)) {
    const text = readFileSync(file, "utf8");
    for (const term of terms) if (file.includes(term) || text.includes(term)) leaks.push([file, term]);
  }
  return leaks;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = process.argv[2] ?? "out";
  const fixtures = process.argv[3] ?? "tests/fixtures/posts";
  if (!statSync(out, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`check-no-fixture: ${out}/ does not exist; build first`);
    process.exit(1);
  }
  const terms = fixtureTerms(fixtures);
  if (terms.length === 0) {
    console.error(`check-no-fixture: no fixture posts found in ${fixtures}/, nothing to check`);
    process.exit(1);
  }
  const leaks = findLeaks(out, terms);
  if (leaks.length > 0) {
    for (const [file, term] of leaks) console.error(`check-no-fixture: "${term}" found in ${file}`);
    process.exit(1);
  }
  console.log(`check-no-fixture: ${terms.length} fixture terms, none in ${out}/`);
}
