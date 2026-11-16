import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1100, height: 500 },
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`utilities at ${viewport.width}x${viewport.height}: ordered, reachable, one visible copy`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const phone = viewport.width < 1024;
    const toggle = page.getByRole("button", { name: "Switch to light theme" });
    if (phone) {
      await expect(toggle).toHaveCount(0);
      await page.getByText("Menu", { exact: true }).click();
    }
    await expect(toggle).toHaveCount(1);
    const github = page.getByRole("link", { name: /^GitHub/ });
    const linkedin = page.getByRole("link", { name: /^LinkedIn/ });
    for (const control of [toggle, github, linkedin]) {
      await expect(control).toHaveCount(1);
      await control.scrollIntoViewIfNeeded();
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
    const [t, g, l] = await Promise.all([toggle.boundingBox(), github.boundingBox(), linkedin.boundingBox()]);
    expect(t!.x + t!.width).toBeLessThanOrEqual(g!.x);
    expect(g!.x + g!.width).toBeLessThanOrEqual(l!.x);
    expect(Math.abs(t!.y - g!.y)).toBeLessThanOrEqual(1);
    const nav = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
    expect(t!.y).toBeGreaterThanOrEqual(nav.y + nav.height + 16);
    if (!phone) {
      expect(t!.y + t!.height).toBeGreaterThan(viewport.height - 50);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator("footer")).toHaveCount(0);
    if (phone) {
      await toggle.click();
      await expect(page.locator("details")).toHaveAttribute("open", "");
      await page.getByText("Menu", { exact: true }).click();
      await expect(page.getByRole("link", { name: /^GitHub/ })).toHaveCount(0);
    }
  });
}

test("destination icons and matching tooltips on hover and keyboard focus in both themes", async ({ page }) => {
  await page.goto("/about/");
  for (const [destination, icon] of [
    ["light", "sun"],
    ["dark", "moon"],
  ]) {
    const label = `Switch to ${destination} theme`;
    const button = page.getByRole("button", { name: label });
    await expect(button.locator("svg")).toHaveAttribute("data-icon", icon);
    await expect(button.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await button.hover({ position: { x: 12, y: 16 } });
    await expect(button.locator("span")).toHaveText(label);
    await expect(button.locator("span")).toBeVisible();
    await page.mouse.move(10, 10);
    await page.keyboard.press("Tab");
    await button.focus();
    await expect(button.locator("span")).toBeVisible();
    await expect(button).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
  }
});

for (const width of [320, 390]) {
  test(`no JavaScript ${width}px: profiles remain usable inside Menu only`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width, height: 568 } });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("link", { name: /^GitHub/ })).toHaveCount(0);
    await page.getByText("Menu", { exact: true }).click();
    await expect(page.getByRole("button")).toHaveCount(0);
    for (const name of ["GitHub", "LinkedIn"]) {
      const link = page.getByRole("link", { name: new RegExp(`^${name} \\(opens in a new tab\\)$`) });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /me/);
    }
    await context.close();
  });
}
