import { themeScript, THEME_KEY } from "@/app/theme";

function runHeadScript() {
  document.documentElement.setAttribute("data-theme", "dark");
  new Function(themeScript)();
  return document.documentElement.getAttribute("data-theme");
}

describe("theme script in <head>", () => {
  afterEach(() => localStorage.clear());

  it("keeps dark when nothing is stored", () => {
    expect(runHeadScript()).toBe("dark");
  });

  it("switches to light when light is stored", () => {
    localStorage.setItem(THEME_KEY, "light");
    expect(runHeadScript()).toBe("light");
  });

  it("ignores any other stored value", () => {
    localStorage.setItem(THEME_KEY, "purple");
    expect(runHeadScript()).toBe("dark");
  });
});
