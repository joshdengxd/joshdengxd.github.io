// Runs after `next build`. Next.js 16.4 static export names each prefetch segment file by joining the
// segment path with "." (for example about/__next.about.__PAGE__.txt), and the client router asks for that
// name. On Windows the export takes the segment path with "\" separators, so it writes
// about/__next.about/__PAGE__.txt instead, and every prefetch of a nested page 404s.
// This moves such files to the flat name the client requests. On Linux (CI, deploy) there is nothing to move.
import { readdirSync, renameSync, rmdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const out = process.argv[2] ?? "out";

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(join(dir, e.name)) : [join(dir, e.name)],
  );
}

function removeEmptyDirs(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) removeEmptyDirs(join(dir, e.name));
  if (readdirSync(dir).length === 0) rmdirSync(dir);
}

let moved = 0;
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const path = join(dir, e.name);
    if (e.name.startsWith("__next.")) {
      for (const file of filesUnder(path)) {
        const flat = `${e.name}.${relative(path, file).split(sep).join(".")}`;
        renameSync(file, join(dir, flat));
        moved++;
      }
      removeEmptyDirs(path);
    } else {
      walk(path);
    }
  }
}

if (statSync(out, { throwIfNoEntry: false })?.isDirectory()) walk(out);
if (moved) console.log(`flatten-export-segments: moved ${moved} segment file(s) to the names the client requests`);
