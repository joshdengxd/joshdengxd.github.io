// The blog fixture build (BLOG_FIXTURES=1): home's Latest posts lists the two fixture posts, newest first.
// Run by `npm run e2e`.
import { expect, test } from "@playwright/test";

test("Latest posts lists the fixture posts, newest first, each linking to its page", async ({ page }) => {
  await page.goto("/");
  const latest = page.getByRole("region", { name: "Latest posts" });
  await expect(latest).not.toContainText("No posts yet");
  await expect(latest.getByRole("heading", { level: 3 })).toHaveText([
    "Second fixture post, just after midnight UTC",
    "Fixture post for the blog engine",
  ]);
  await expect(latest.getByRole("link", { name: "Fixture post for the blog engine" })).toHaveAttribute(
    "href",
    "/blog/blog-engine-fixture/",
  );
  await expect(latest.getByText("A test post with a code block and a table")).toBeVisible();
  await expect(latest.getByRole("link", { name: "All posts" })).toHaveAttribute("href", "/blog/");

  await latest.getByRole("link", { name: "Fixture post for the blog engine" }).click();
  await expect(page).toHaveURL("/blog/blog-engine-fixture/");
});
