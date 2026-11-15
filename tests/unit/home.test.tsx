import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import NotFound from "@/app/not-found";

describe("placeholder pages", () => {
  it("home shows the placeholder sentence", () => {
    render(<Home />);
    expect(screen.getByText(/under construction/i)).toBeInTheDocument();
  });

  it("home shows the name as its heading, revealed line by line", () => {
    render(<Home />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Josh Deng" });
    expect(h1.querySelectorAll(".reveal-mask > .reveal-line")).toHaveLength(2);
    expect(h1.querySelector(".name-first")).toHaveTextContent("Josh");
    expect(h1.querySelector(".name-last")).toHaveTextContent("Deng");
  });

  it("home does not link to the design specimen", () => {
    const { container } = render(<Home />);
    expect(container.querySelector('a[href^="/design"]')).toBeNull();
  });

  it("404 links back home", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });
});
