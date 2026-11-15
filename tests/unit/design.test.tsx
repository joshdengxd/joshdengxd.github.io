import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DesignPage, { metadata } from "@/app/design/page";
import sitemap from "@/app/sitemap";
import { THEME_KEY } from "@/app/theme";

describe("/design/ specimen", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("is noindex", () => {
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("shows a contrast ratio for every pair of both themes", () => {
    const { container } = render(<DesignPage />);
    const rows = container.querySelectorAll("tr[data-pair]");
    expect(rows).toHaveLength(20);
    for (const row of rows) expect(row.textContent).toMatch(/\d+\.\d\d:1/);
    expect(container.textContent).not.toMatch(/fails/);
  });

  it("the toggle switches to light and remembers it, and back", async () => {
    render(<DesignPage />);
    const toggle = screen.getByRole("button", { name: "Light theme" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
    await waitFor(() => expect(toggle).toHaveAttribute("aria-pressed", "true"));
    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    await waitFor(() => expect(toggle).toHaveAttribute("aria-pressed", "false"));
  });
});

describe("sitemap", () => {
  it("lists only the home page", () => {
    expect(sitemap().map((e) => e.url)).toEqual(["https://joshdengxd.github.io/"]);
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
