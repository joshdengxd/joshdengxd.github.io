import { render, screen } from "@testing-library/react";
import { Placeholder } from "@/app/_components/placeholder";

describe("<Placeholder>", () => {
  it("shows the visible label 'Placeholder:' before its text and carries data-placeholder", () => {
    const { container } = render(<Placeholder>Real copy comes here.</Placeholder>);
    const el = container.querySelector("[data-placeholder]");
    expect(el).not.toBeNull();
    expect(el).toHaveTextContent(/^Placeholder: Real copy comes here\.$/);
    expect(screen.getByText("Placeholder:")).toBeVisible();
  });

  it("takes an extra class without losing its own", () => {
    const { container } = render(<Placeholder className="extra">x</Placeholder>);
    const el = container.querySelector("[data-placeholder]")!;
    expect(el).toHaveClass("extra");
    expect(el.className.split(" ").length).toBeGreaterThan(1);
  });
});
