import { render, screen, within } from "@testing-library/react";
import { HOME_LABEL, LINKEDIN_URL } from "@/app/_shell/links";
import { GITHUB_OWNER_URL } from "@/lib/site";
import NotFound, { metadata as notFoundMetadata } from "@/app/not-found";
import { HomeView } from "@/app/_home/home-view";

const Home = () => <HomeView />;

describe("home page and 404", () => {
  it("home shows the name as a plain heading (not a link), revealed line by line", () => {
    render(<Home />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Josh Deng" });
    expect(within(h1).queryByRole("link")).toBeNull();
    expect(h1.querySelectorAll(".reveal-mask > .reveal-line")).toHaveLength(2);
    expect(h1.querySelector(".name-first")).toHaveTextContent("Josh");
    expect(h1.querySelector(".name-last")).toHaveTextContent("Deng");
    expect(screen.queryByRole("link", { name: HOME_LABEL })).toBeNull(); // the home link is the shell's wordmark
  });

  it("home does not link to the design specimen", () => {
    const { container } = render(<Home />);
    expect(container.querySelector('a[href^="/design"]')).toBeNull();
  });

  it("home has the GitHub and LinkedIn links", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", GITHUB_OWNER_URL);
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", LINKEDIN_URL);
  });

  it("404 has a title and links back home", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText("This page does not exist.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the home page" })).toHaveAttribute("href", "/");
    expect(notFoundMetadata.title).toBe("Page not found");
  });
});
