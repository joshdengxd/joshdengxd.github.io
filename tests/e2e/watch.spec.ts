/* eslint-disable no-console -- Synthetic console events exercise the browser error watcher. */
import { expect, test } from "@playwright/test";
import { watch } from "./watch";

test("watch captures failed responses, console errors and uncaught errors independently", async ({ page }) => {
  await page.goto("/");
  const problems = watch(page);
  await page.route("**/__watcher-check/*", (route) => {
    const status = Number(new URL(route.request().url()).pathname.split("/").at(-1));
    return route.fulfill({ status, body: "watcher check" });
  });
  for (const status of [200, 399, 400, 404, 500]) {
    await page.evaluate(async (status) => {
      await fetch(`/__watcher-check/${status}`);
    }, status);
  }
  for (const status of [400, 404, 500]) {
    expect(problems).toContain(`${status} ${new URL(`/__watcher-check/${status}`, page.url()).href}`);
  }
  expect(problems.some((problem) => /^(200|399) /.test(problem))).toBe(false);

  await page.evaluate(() => {
    console.log("watcher informational message");
    console.warn("watcher warning message");
    console.error("watcher console failure");
    setTimeout(() => {
      throw new Error("watcher uncaught failure");
    }, 0);
  });
  await expect.poll(() => problems.includes("console: watcher console failure")).toBe(true);
  await expect.poll(() => problems.includes("pageerror: watcher uncaught failure")).toBe(true);
  expect(problems.join("\n")).not.toContain("watcher informational message");
  expect(problems.join("\n")).not.toContain("watcher warning message");

  // A separate observer starts empty and does not clear the first observer's evidence.
  const laterProblems = watch(page);
  expect(laterProblems).toEqual([]);
  await page.evaluate(() => console.error("watcher later failure"));
  await expect.poll(() => laterProblems).toEqual(["console: watcher later failure"]);
  expect(problems).toContain("console: watcher console failure");
  expect(problems).toContain("console: watcher later failure");
});
