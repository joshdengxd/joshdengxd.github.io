import { findRawHtml, HIGHLIGHT_LANGUAGES, renderMarkdown } from "@/lib/posts/markdown";

describe("the Markdown pipeline", () => {
  it("renders headings, emphasis, links, code and GFM tables", async () => {
    const html = await renderMarkdown(
      "## Title\n\nSome *emphasis* and a [link](https://example.com/).\n\n```ts\nconst a = 1;\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |\n",
    );
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<em>emphasis</em>");
    expect(html).toContain('<a href="https://example.com/">link</a>');
    expect(html).toContain('<pre class="shiki css-variables"');
    expect(html).toContain('<code><span class="line">');
    expect(html).toContain("<table>");
  });

  it("never outputs raw HTML from the source", async () => {
    const html = await renderMarkdown('<script>alert(1)</script>\n\n<div onclick="x()">hi</div>\n\nText <img src=x onerror=alert(1)>');
    expect(html).not.toMatch(/<script|<div|onclick|onerror|<img/);
  });

  it.each([
    "[x](javascript:alert(1))",
    "[x](JaVaScRiPt:alert(1))",
    "[x](vbscript:alert(1))",
    "[x](data:text/html;base64,PHNjcmlwdD4=)",
    "![x](javascript:alert(1))",
    "<javascript:alert(1)>",
  ])("never outputs a script link for %s", async (markdown) => {
    const html = await renderMarkdown(markdown);
    expect(html).not.toMatch(/(href|src)="(javascript|vbscript|data):/i);
  });

  it("keeps ordinary relative and https links", async () => {
    const html = await renderMarkdown("[a](/blog/) [b](https://example.com) [c](#top)");
    expect(html).toContain('href="/blog/"');
    expect(html).toContain('href="https://example.com"');
  });

  it("keeps footnote links working: every # href has one matching id, once prefixed", async () => {
    const html = await renderMarkdown("Text[^1] and more[^note].\n\n[^1]: First note.\n[^note]: Second note.\n");
    const hrefs = [...html.matchAll(/href="#([^"]*)"/g)].map((m) => m[1]);
    const ids = [...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]);
    // two references and two back-references, each with exactly one matching id (reference, entry, back-reference)
    expect(hrefs).toHaveLength(4);
    for (const href of hrefs) expect(ids.filter((id) => id === href)).toHaveLength(1);
    expect(hrefs).toEqual(expect.arrayContaining(["user-content-fn-1", "user-content-fnref-1", "user-content-fn-note"]));
    // prefixed once, never twice; the only other id is the footnote heading that aria-describedby points at
    expect(hrefs.every((v) => /^user-content-(fn|fnref)-[\w-]+$/.test(v))).toBe(true);
    expect(ids.filter((id) => id !== "footnote-label").every((v) => /^user-content-(fn|fnref)-[\w-]+$/.test(v))).toBe(true);
    expect(html).toContain('aria-describedby="footnote-label"');
    expect(ids).toContain("footnote-label");
    // nothing unsafe came with the footnotes
    expect(html).not.toMatch(/(href|src)="(?!#|\/|https?:)/i);
    expect(html).not.toMatch(/<script|\son\w+=/i);
  });

  it("escapes angle brackets in code", async () => {
    expect(await renderMarkdown("`<b>`")).toContain("&#x3C;b>");
  });
});

describe("code highlighting", () => {
  const block = (lang: string, code = "const a = 1; // note") => "```" + lang + "\n" + code + "\n```";

  it("highlights a block with a known language with --shiki-token-* variables and no colour value", async () => {
    const html = await renderMarkdown(block("ts"));
    expect(html).toMatch(/style="color:var\(--shiki-token-keyword\)">const</);
    expect(html).toMatch(/--shiki-token-comment\)">\/\/ note</);
    expect(html).toContain("background-color:var(--shiki-background);color:var(--shiki-foreground)");
    // every style attribute holds only var(--shiki-*) references: no hex, rgb(), hsl() or named colour
    for (const [, style] of html.matchAll(/style="([^"]*)"/g)) {
      expect(style).not.toMatch(/#[0-9a-f]{3}|rgb|hsl|oklch/i);
      expect(style).toMatch(/var\(--shiki-[a-z-]+\)/);
    }
  });

  it.each(HIGHLIGHT_LANGUAGES)("loads %s", async (lang) => {
    const code = lang === "json" ? '{"a": [1, true, null]}' : lang === "diff" ? "- old\n+ new" : "const a = 1; // note";
    const html = await renderMarkdown(block(lang, code));
    expect(html).toContain('<pre class="shiki css-variables"');
    expect(html).toContain("var(--shiki-");
  });

  it("understands the common aliases of the loaded languages", async () => {
    for (const alias of ["sh", "yml", "cs", "typescript", "javascript"]) {
      expect(await renderMarkdown(block(alias)), alias).toContain("--shiki-token-");
    }
  });

  it.each([
    ["an unknown language", block("brainfuck")],
    ["no language", block("")],
    ["a Shiki special language that is not loaded", block("ansi")],
    ["a language that looks like markup", block('x" onload="alert(1)')],
    ["a prototype-ish name", block("constructor")],
  ])("renders %s as plain code, without an error", async (_name, markdown) => {
    const html = await renderMarkdown(markdown);
    expect(html).toContain('<pre class="shiki css-variables"');
    expect(html).toContain("const a = 1; // note");
    expect(html).not.toMatch(/--shiki-token-/);
    expect(html).not.toMatch(/language-|brainfuck|onload|ansi|constructor/);
  });

  it("lets an author control nothing but the code text: no id, event handler or class comes from the source", async () => {
    const evil = [
      '```ts id="evil" class="evil" onclick="x()" {1,3} title="y"',
      'const s = "</code></pre><img src=x onerror=alert(1)>"; // <b id="z">',
      "```",
      "",
      '```ts" id="evil" onload="x',
      "plain",
      "```",
      "",
      "Footnote[^1].",
      "",
      "[^1]: Note.",
    ].join("\n");
    const html = await renderMarkdown(evil);
    const tags = [...html.matchAll(/<(\w+)[^>]*>/g)].map((m) => m[1]);
    expect(tags).not.toContain("img");
    expect(tags).not.toContain("script");
    // the attacker's text may appear as escaped code text, never as an attribute
    expect(html).not.toMatch(/\s(id|class|onclick|onerror|onload|title)="(evil|x\(\)|y|alert|x)/);
    expect(html).not.toMatch(/<[^>]*\s(onclick|onerror|onload)=/);
    // inside the code blocks, only class (shiki, css-variables, line), style (var(--shiki-*)) and tabindex
    const blocks = [...html.matchAll(/<pre\b[\s\S]*?<\/pre>/g)].map((m) => m[0]);
    expect(blocks).toHaveLength(2);
    for (const b of blocks) {
      const names = new Set([...b.matchAll(/<[a-z]+\s([^>]*)>/g)].flatMap((m) => [...m[1].matchAll(/([a-z-]+)="/g)].map((x) => x[1])));
      for (const n of names) expect(["class", "style", "tabindex"]).toContain(n);
      for (const [, v] of b.matchAll(/class="([^"]*)"/g)) expect(v).toMatch(/^(shiki css-variables|line)$/);
    }
    // the footnote ids are still the only ids, prefixed once
    const ids = [...html.matchAll(/<[a-z][^>]*?\sid="([^"]*)"/g)].map((m) => m[1]);
    expect(ids.filter((id) => id !== "footnote-label").every((v) => /^user-content-(fn|fnref)-[\w-]+$/.test(v))).toBe(true);
    expect(ids).toContain("user-content-fn-1");
  });

  it("escapes markup in the code text", async () => {
    const html = await renderMarkdown(block("html", "<script>alert(1)</script>"));
    expect(html).not.toContain("<script");
    expect(html).toContain("&#x3C;");
  });

  it("keeps raw HTML and javascript: links out, with highlighting on", async () => {
    const html = await renderMarkdown("<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n" + block("ts"));
    expect(html).not.toMatch(/<script|javascript:/i);
    expect(html).toContain("--shiki-token-keyword");
  });

  it("does not highlight inline code", async () => {
    expect(await renderMarkdown("`const a = 1{:ts}`")).toBe("<p><code>const a = 1{:ts}</code></p>");
  });
});

describe("findRawHtml", () => {
  it("finds block and inline HTML, with 1-based lines", () => {
    expect(findRawHtml("text\n\n<div>x</div>\n\nand <b>b</b> here")).toEqual([3, 5, 5]);
  });

  it("ignores code and autolinks", () => {
    expect(findRawHtml("`<b>`\n\n```\n<div>\n```\n\n<https://example.com>")).toEqual([]);
  });
});
