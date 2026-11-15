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

test("the site icon is served", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
});

test("unknown URL shows the site's own 404 page", async ({ page }) => {
  const res = await page.goto("/no-such-page/");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("This page does not exist.")).toBeVisible();
  await page.getByRole("link", { name: "Back to the home page" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText(/under construction/i)).toBeVisible();
});
