import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";

const POST = "/blog/how-my-agents-learn-the-way-i-work/";
const TITLE = "How My Agents Learn the Way I Work";
const PARTICLE_GRID = `${POST}particle-grid-web.webp`;
const PARTICLE_GRID_SHA256 = "bfc06a05988d1f1309a7059ed182f5431b4efd946c7f85af7f48402c6d74d4e5";

test("the wrap-up post is discoverable and loads the approved animated particle figure", async ({ page, request }) => {
  await page.goto("/blog/");
  await expect(page.getByRole("link", { name: TITLE })).toHaveAttribute("href", POST);
  await page.goto(POST);
  await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();

  const figure = page.locator("figure").filter({ hasText: "Six work durations with a peak of 40 in every preview." });
  const image = figure.getByRole("img", { name: /six synchronized previews/i });
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute("src", PARTICLE_GRID);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(960);

  const response = await request.get(PARTICLE_GRID);
  expect(response.ok()).toBe(true);
  expect(
    createHash("sha256")
      .update(await response.body())
      .digest("hex"),
  ).toBe(PARTICLE_GRID_SHA256);
});
