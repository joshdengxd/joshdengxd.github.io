import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import NotFound from "@/app/not-found";

describe("placeholder pages", () => {
  it("home shows the placeholder sentence", () => {
    render(<Home />);
    expect(screen.getByText(/under construction/i)).toBeInTheDocument();
  });

  it("404 links back home", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });
});
