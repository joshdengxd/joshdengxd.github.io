#!/usr/bin/env node
// Fetch current library docs from Context7's public API (no dependencies; Node 18+).
//   node docs.mjs search <library name>
//   node docs.mjs get <library id> "<topic>" [--version <v>] [--tokens <n>]
// Optional: CONTEXT7_API_KEY for higher rate limits. Sends only the library name, id and topic.
const [cmd, a, b, ...rest] = process.argv.slice(2);
const flag = (n, d) => { const i = rest.indexOf(`--${n}`); return i >= 0 ? rest[i + 1] : d; };
const headers = process.env.CONTEXT7_API_KEY ? { Authorization: `Bearer ${process.env.CONTEXT7_API_KEY}` } : {};
const base = "https://context7.com";

async function get(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

try {
  if (cmd === "search" && a) {
    const data = await (await get(`${base}/api/v1/search?query=${encodeURIComponent(a)}`)).json();
    for (const r of (data.results || []).slice(0, 8)) {
      const versions = (r.versions || []).filter((v) => !v.startsWith("__")).slice(-6).join(", ");
      console.log(`${r.id}  | ${r.title} | updated ${String(r.lastUpdateDate).slice(0, 10)} | trust ${r.trustScore} | versions: ${versions || "-"}`);
    }
  } else if (cmd === "get" && a && b) {
    // Git Bash on Windows turns an id like "/owner/repo" into an absolute path under its install folder; undo that.
    const id = a.replace(/^[A-Za-z]:\/.*?\/Git\//, "").replace(/^\//, "");
    const version = flag("version");
    const path = version ? `${id}/${version}` : id;
    const tokens = flag("tokens", "4000");
    const text = await (await get(`${base}/${path}/llms.txt?topic=${encodeURIComponent(b)}&tokens=${tokens}`)).text();
    console.log(`# Context7 ${path} — topic "${b}" — fetched ${new Date().toISOString().slice(0, 10)}\n`);
    console.log(text);
  } else {
    console.error('usage: node docs.mjs search <name> | get <id> "<topic>" [--version v] [--tokens n]');
    process.exit(2);
  }
} catch (e) {
  console.error(`context7: ${e.message}`);
  process.exit(1);
}
