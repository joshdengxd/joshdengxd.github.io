import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import DesignPage, { metadata } from "@/app/design/page";
import sitemap from "@/app/sitemap";

describe("/design/ specimen", () => {
  it("is noindex", () => {
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("shows a contrast ratio for every pair of both themes", async () => {
    const { container } = render(await DesignPage());
    const rows = container.querySelectorAll("tr[data-pair]");
    expect(rows).toHaveLength(20);
    for (const row of rows) expect(row.textContent).toMatch(/\d+\.\d\d:1/);
    expect(container.textContent).not.toMatch(/fails/);
  });

  it("shows a highlighted code sample and the ratio of every code colour, in both themes", async () => {
    const { container } = render(await DesignPage());
    expect(container.querySelectorAll("pre.shiki")).toHaveLength(1);
    expect(container.querySelectorAll('pre.shiki span[style*="--shiki-token-"]').length).toBeGreaterThan(0);
    const rows = container.querySelectorAll("li[data-code-pair]");
    expect(rows).toHaveLength(10);
    for (const row of rows) {
      expect(row.textContent).toMatch(/dark \d+\.\d\d:1 passes, light \d+\.\d\d:1 passes/);
    }
  });

  it("has no toggle of its own (the toggle is in the shell)", async () => {
    render(await DesignPage());
    expect(screen.queryByRole("button", { name: "Light theme" })).toBeNull();
  });
});

describe("sitemap", () => {
  it("lists the home page and the blog, not the specimen", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://joshdengxd.github.io/");
    expect(urls.some((u) => u.includes("/design/"))).toBe(false);
  });
});

describe("font licences", () => {
  const dir = join(process.cwd(), "design-language", "fonts");
  const readme = readFileSync(join(process.cwd(), "design-language", "README.md"), "utf8");

  it.each(readdirSync(dir).filter((f) => f.endsWith(".woff2")))("%s is listed with its OFL licence", (file) => {
    const line = readme.split("\n").find((l) => l.includes(file));
    expect(line, `${file} in README`).toBeDefined();
    expect(line).toMatch(/OFL/);
    const licence = /\(fonts\/(OFL-[\w-]+\.txt)\)/.exec(line!)?.[1];
    expect(licence).toBeDefined();
    expect(readFileSync(join(dir, licence!), "utf8")).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/);
  });
});
