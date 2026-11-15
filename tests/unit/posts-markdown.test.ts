import { findRawHtml, renderMarkdown } from "@/lib/posts/markdown";

describe("the Markdown pipeline", () => {
  it("renders headings, emphasis, links, code and GFM tables", async () => {
    const html = await renderMarkdown(
      "## Title\n\nSome *emphasis* and a [link](https://example.com/).\n\n```ts\nconst a = 1;\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |\n",
    );
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<em>emphasis</em>");
    expect(html).toContain('<a href="https://example.com/">link</a>');
    expect(html).toContain('<pre><code class="language-ts">const a = 1;\n</code></pre>');
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

describe("findRawHtml", () => {
  it("finds block and inline HTML, with 1-based lines", () => {
    expect(findRawHtml("text\n\n<div>x</div>\n\nand <b>b</b> here")).toEqual([3, 5, 5]);
  });

  it("ignores code and autolinks", () => {
    expect(findRawHtml("`<b>`\n\n```\n<div>\n```\n\n<https://example.com>")).toEqual([]);
  });
});
