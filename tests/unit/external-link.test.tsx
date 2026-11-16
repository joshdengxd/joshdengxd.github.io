import { opensInNewTab } from "./new-tab-name";
import { render, screen } from "@testing-library/react";
import { ExternalLink } from "@/app/_components/external-link";
import { ProfileLinks } from "@/app/_shell/profile-links";

describe("ExternalLink (ticket #44)", () => {
  it("opens in a new tab and adds the hidden note to the accessible name", () => {
    render(
      <ExternalLink href="https://example.com/" className="x">
        Example
      </ExternalLink>,
    );
    const link = screen.getByRole("link", { name: opensInNewTab("Example") });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("x");
    expect(link.querySelector(".visually-hidden")).toHaveTextContent("(opens in a new tab)");
  });

  it("keeps `me` on the two profile links", () => {
    render(<ProfileLinks />);
    for (const name of ["GitHub", "LinkedIn"]) {
      const link = screen.getByRole("link", { name: opensInNewTab(name) });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")?.split(" ").sort()).toEqual(["me", "noopener", "noreferrer"]);
    }
  });
});
