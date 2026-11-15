import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { GITHUB_URL, HOME_LABEL, isCurrent, LINKEDIN_URL, NAV, trimSlash } from "@/app/_shell/links";
import { SiteShell } from "@/app/_shell/site-shell";
import { ThemeToggle } from "@/app/_shell/theme-toggle";
import AboutPage, { metadata as aboutMetadata } from "@/app/about/page";
import BlogPage, { metadata as blogMetadata } from "@/app/blog/page";
import HowPage, { metadata as howMetadata } from "@/app/how-this-site-is-built/page";
import ProjectsPage, { metadata as projectsMetadata } from "@/app/projects/page";
import { THEME_KEY } from "@/app/theme";

const nav = vi.hoisted(() => ({ pathname: "/" as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

describe("current page", () => {
  it("compares paths without the trailing slash", () => {
    expect(trimSlash("/about/")).toBe("/about");
    expect(trimSlash("/")).toBe("/");
    expect(isCurrent("/about", "/about/")).toBe(true);
    expect(isCurrent("/about/", "/about/")).toBe(true);
  });

  it("marks the section of a sub-page, and nothing on unknown or prefix-alike paths", () => {
    expect(isCurrent("/blog/a-post/", "/blog/")).toBe(true);
    expect(isCurrent("/projects/x", "/projects/")).toBe(true);
    expect(isCurrent("/blogroll/", "/blog/")).toBe(false);
    expect(isCurrent("/_not-found", "/about/")).toBe(false);
    expect(isCurrent(null, "/about/")).toBe(false);
    expect(isCurrent("/about/", "/")).toBe(false);
    expect(isCurrent("/", "/")).toBe(true);
  });
});

describe("shell", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("on an inner page: wordmark home, the four sections with the current one marked, footer links", () => {
    nav.pathname = "/blog/";
    render(<SiteShell>page</SiteShell>);
    const wordmark = screen.getByRole("link", { name: HOME_LABEL });
    expect(wordmark).toHaveAttribute("href", "/");
    expect(wordmark).not.toHaveAttribute("aria-current");

    // Two navigations in the DOM: the phone sheet and the wide panel; CSS shows one at a time.
    const navs = screen.getAllByRole("navigation", { name: "Main" });
    expect(navs).toHaveLength(2);
    for (const n of navs) {
      const links = within(n).getAllByRole("link");
      // next/link applies the trailingSlash setting only in the build; the built HTML is checked in e2e.
      const shown = links.map((l) => [l.textContent, trimSlash(l.getAttribute("href")!)]);
      expect(shown).toEqual(NAV.map((i) => [i.label, trimSlash(i.href)]));
      expect(links.filter((l) => l.getAttribute("aria-current") === "page").map((l) => l.textContent)).toEqual(["Blog"]);
    }

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "GitHub" })).toHaveAttribute("href", GITHUB_URL);
    expect(within(footer).getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", LINKEDIN_URL);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("on home: no small wordmark, no footer line, no section marked", () => {
    nav.pathname = "/";
    render(<SiteShell>page</SiteShell>);
    expect(screen.queryByRole("link", { name: HOME_LABEL })).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
  });

  it("the phone menu is a details sheet labelled Menu", () => {
    nav.pathname = "/about/";
    const { container } = render(<SiteShell>page</SiteShell>);
    const details = container.querySelector("details")!;
    expect(details.querySelector("summary")).toHaveTextContent("Menu");
    expect(within(details).getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("the toggle switches to light and remembers it, and back", async () => {
    render(<ThemeToggle />);
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

describe("placeholder pages", () => {
  it.each([
    ["About", AboutPage, aboutMetadata],
    ["Projects", ProjectsPage, projectsMetadata],
    ["Blog", BlogPage, blogMetadata],
    ["How this site is built", HowPage, howMetadata],
  ])("%s has its title, a marked placeholder line and noindex", (title, Page, metadata) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText("Placeholder.")).toBeInTheDocument();
    expect(metadata.title).toBe(`${title} · Xindong Deng (Josh)`);
    expect(metadata.robots).toMatchObject({ index: false });
  });
});
