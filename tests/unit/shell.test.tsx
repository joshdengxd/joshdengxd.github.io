import { opensInNewTab } from "./new-tab-name";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HOME_LABEL, isCurrent, LINKEDIN_URL, NAV, trimSlash } from "@/app/_shell/links";
import { GITHUB_OWNER_URL } from "@/lib/site";
import { SiteShell } from "@/app/_shell/site-shell";
import { ThemeToggle } from "@/app/_shell/theme-toggle";
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

  it("on an inner page: wordmark home, the four sections with the current one marked, navigation profile links", () => {
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
      expect(links.filter((l) => l.getAttribute("aria-current") === "page").map((l) => l.textContent)).toEqual([
        "Blog",
      ]);
    }

    expect(screen.queryByRole("contentinfo")).toBeNull();
    const footer = screen.getByRole("banner");
    expect(within(footer).getAllByRole("link", { name: opensInNewTab("GitHub") })[0]).toHaveAttribute(
      "href",
      GITHUB_OWNER_URL,
    );
    expect(within(footer).getAllByRole("link", { name: opensInNewTab("LinkedIn") })[0]).toHaveAttribute(
      "href",
      LINKEDIN_URL,
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("on home: the wordmark is the one home link and the current page, no section marked, the same navigation utilities", () => {
    nav.pathname = "/";
    render(<SiteShell>page</SiteShell>);
    const wordmark = screen.getByRole("link", { name: HOME_LABEL });
    expect(wordmark).toHaveAttribute("href", "/");
    expect(wordmark).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("contentinfo")).toBeNull();
    const footer = screen.getByRole("banner");
    expect(within(footer).getAllByRole("link", { name: opensInNewTab("GitHub") })[0]).toHaveAttribute(
      "href",
      GITHUB_OWNER_URL,
    );
    expect(within(footer).getAllByRole("link", { name: opensInNewTab("LinkedIn") })[0]).toHaveAttribute(
      "href",
      LINKEDIN_URL,
    );
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: HOME_LABEL })).toHaveLength(1);
  });

  it("the phone menu is a details sheet labelled Menu", () => {
    nav.pathname = "/about/";
    const { container } = render(<SiteShell>page</SiteShell>);
    const details = container.querySelector("details")!;
    expect(details.querySelector("summary")).toHaveTextContent("Menu");
    expect(within(details).getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  describe("the Menu sheet closes by what the visitor does, not by the path", () => {
    const openSheet = () => {
      nav.pathname = "/about/";
      const view = render(<SiteShell>page</SiteShell>);
      const details = view.container.querySelector("details")!;
      details.open = true;
      return { ...view, details };
    };

    it("closes when a link in it is clicked, also the link of the current page", () => {
      const { details } = openSheet();
      fireEvent.click(within(details).getByRole("link", { name: "About" }));
      expect(details.open).toBe(false);
      details.open = true;
      fireEvent.click(within(details).getByRole("link", { name: "Blog" }));
      expect(details.open).toBe(false);
    });

    it("stays open when something else in it is clicked, or when the path changes by itself", () => {
      const { details, rerender } = openSheet();
      fireEvent.click(within(details).getByRole("button", { name: /Switch to (light|dark) theme/ }));
      expect(details.open).toBe(true);
      nav.pathname = "/projects/";
      rerender(<SiteShell>page</SiteShell>);
      expect(details.open).toBe(true);
    });

    it("closes on Escape and returns focus to the Menu button; Escape does nothing when it is closed", () => {
      const { details } = openSheet();
      fireEvent.keyDown(document, { key: "Enter" });
      expect(details.open).toBe(true);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(details.open).toBe(false);
      expect(details.querySelector("summary")).toHaveFocus();
      (document.activeElement as HTMLElement).blur();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(document.activeElement).toBe(document.body);
    });

    it("closes on a click outside it", () => {
      const { details } = openSheet();
      fireEvent.click(screen.getByRole("main"));
      expect(details.open).toBe(false);
    });

    it("closes on back and forward (popstate)", () => {
      const { details } = openSheet();
      fireEvent(window, new PopStateEvent("popstate"));
      expect(details.open).toBe(false);
    });
  });

  it("the toggle switches to light and remembers it, and back", async () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole("button", { name: /Switch to (light|dark) theme/ });
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
