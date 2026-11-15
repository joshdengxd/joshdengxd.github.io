// Pictures in posts (ticket #41), on the default build (the deployed one): the fixture post's picture must not be there.
import { expect, test } from "@playwright/test";

test("the default build has no fixture picture and no figure on the blog pages", async ({ page, request }) => {
  expect((await request.get("/blog/blog-engine-fixture/diagram.svg")).status()).toBe(404);
  expect((await request.get("/blog/blog-engine-fixture/")).status()).toBe(404);
  await page.goto("/blog/");
  await expect(page.locator("figure")).toHaveCount(0);
});
