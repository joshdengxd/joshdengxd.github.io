// The deployed build (no blog fixture): home's Latest posts is empty. Run by `npm run e2e:default`.
import { expect, test } from "@playwright/test";

test("Latest posts says 'No posts yet' and links to /blog/", async ({ page }) => {
  await page.goto("/");
  const latest = page.getByRole("region", { name: "Latest posts" });
  await expect(latest).toContainText("No posts yet.");
  const link = latest.getByRole("link", { name: "Go to the blog" });
  await expect(link).toHaveAttribute("href", "/blog/");
  await link.click();
  await expect(page).toHaveURL("/blog/");
  await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
});

test("the default build has no fixture post anywhere on the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Fixture post for the blog engine")).toHaveCount(0);
  await expect(page.locator('a[href*="blog-engine-fixture"]')).toHaveCount(0);
});
