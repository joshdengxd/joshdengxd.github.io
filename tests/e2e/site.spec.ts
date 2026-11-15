import { expect, test } from "@playwright/test";

test("home shows the placeholder and the build commit", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByText(/under construction/i)).toBeVisible();
  await expect(page.locator('meta[name="commit"]')).toHaveAttribute("content", /^[0-9a-f]{40}$/);
  expect(errors).toEqual([]);
});

test("unknown URL shows the site's own 404 page", async ({ page }) => {
  const res = await page.goto("/no-such-page/");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("This page does not exist.")).toBeVisible();
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);
});
