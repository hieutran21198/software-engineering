import { test, expect } from "@playwright/test";
import {
  fixtureRepository,
  orderingFixture,
  fingerprint,
} from "../fixtures.js";

test("B10: pointer/keyboard inspector resizing, bounds, Markdown reflow, selection, and stacked layout", async ({
  page,
}) => {
  const files = orderingFixture();
  const requirementPath =
    "requirements/a-long-requirement-with-a-descriptive-filename-for-readers.md";
  files.set(
    `docs/artifacts/knowledge/versions/1.0.0/${requirementPath}`,
    "# Long requirement\n\n" +
      "This requirement explains how readers inspect knowledge and follow its dependencies. ".repeat(
        16,
      ),
  );
  const fixture = await fixtureRepository(files),
    before = await fingerprint(fixture.root);
  try {
    await page.goto("/");
    await page.getByLabel("Repository path").fill(fixture.root);
    await page.getByRole("button", { name: "Open repository" }).click();
    await page
      .getByRole("navigation", { name: "Artifacts" })
      .getByRole("button", { name: /Knowledge/ })
      .click();
    const panel = page.getByRole("complementary", {
      name: "Selection details",
    });
    await panel
      .getByRole("button", { name: "Requirements in inspector", exact: true })
      .click();
    await panel.locator(".element-list-item").first().click();
    const divider = page.getByRole("separator", {
      name: "Resize details panel",
    });
    await expect(divider).toBeVisible({ timeout: 2000 });
    await expect(divider).toHaveAttribute("aria-valuenow", "340");
    const width = () =>
      panel.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect(await width()).toBe(340);
    const box = await divider.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + 300, {
      steps: 10,
    });
    await page.mouse.up();
    await expect.poll(width).toBe(460);
    await divider.focus();
    await divider.press("ArrowLeft");
    await expect.poll(width).toBe(480);
    await divider.press("ArrowRight");
    await expect.poll(width).toBe(460);
    await divider.press("Home");
    await expect.poll(width).toBe(240);
    const narrowHeight = await panel
      .locator(".markdown p")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: "test-results/narrow-inspector.png",
      fullPage: true,
    });
    await divider.press("End");
    await expect.poll(width).toBe(640);
    const wideHeight = await panel
      .locator(".markdown p")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(wideHeight).toBeLessThan(narrowHeight);
    await expect(
      panel.getByRole("heading", { name: requirementPath, level: 2 }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Fit View", exact: true }).click();
    expect(
      await page.locator(".canvas-area").evaluate((el) => el.scrollTop),
    ).toBe(0);
    await page.screenshot({
      path: "test-results/resized-inspector.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 900, height: 900 });
    await expect.poll(width).toBe(420);
    expect(
      (await page.locator(".canvas-area").boundingBox()).width,
    ).toBeGreaterThanOrEqual(300);
    await page.setViewportSize({ width: 700, height: 1000 });
    await expect(divider).toBeHidden();
    await expect.poll(width).toBe(700);
    await expect(
      panel.getByRole("heading", { name: requirementPath, level: 2 }),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/stacked-inspector.png",
      fullPage: true,
    });
    expect(await fingerprint(fixture.root)).toEqual(before);
  } finally {
    await fixture.cleanup();
  }
});
