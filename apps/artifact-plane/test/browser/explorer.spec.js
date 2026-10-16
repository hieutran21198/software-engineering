import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  fixtureRepository,
  sourceFixture,
  orderingFixture,
  fingerprint,
  git,
} from "../fixtures.js";

test("B1-B7: explore, expand, select, pan, zoom, proposals, diagnostics, refresh; no repository writes", async ({
  page,
}) => {
  const files = sourceFixture();
  files.set(
    "docs/artifacts/tenant/versions/1.0.0/specifications/identity.md",
    '# Identity\n\nStable identity rules.\n<script>window.compromised=true</script><img src="https://hostile.example/x" onerror="window.compromised=true"><a href="javascript:window.compromised=true">Unsafe link</a>',
  );
  const fixture = await fixtureRepository(files);
  const before = await fingerprint(fixture.root),
    beforeStatus = git(fixture.root, "status", "--porcelain=v1");
  const errors = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4311"))
      external.push(request.url());
  });
  try {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Artifact Plane", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Repository path").fill(fixture.root);
    await page.getByRole("button", { name: "Open repository" }).click();
    const nav = page.getByRole("navigation", { name: "Artifacts" });
    await expect(nav.getByRole("button", { name: /Tenant/ })).toBeVisible();
    await nav.getByRole("button", { name: /Initial/ }).click();
    const panel = page.getByRole("complementary", {
      name: "Selection details",
    });
    await expect(
      panel.getByText("No established version", { exact: true }),
    ).toBeVisible();
    await expect(
      panel.getByText("Active change: change-initial"),
    ).toBeVisible();
    await nav.getByRole("button", { name: /Authentication/ }).click();
    await expect(panel.getByText("Active change: change-login")).toBeVisible();await panel.getByText("Dependencies",{exact:true}).click();
    await expect(
      panel.getByRole("heading", { name: "Established dependencies" }),
    ).toBeVisible();
    await expect(
      panel
        .locator(".relationship")
        .filter({
          has: page.getByRole("heading", { name: "Upstream", exact: true }),
        })
        .getByRole("button", { name: "tenant", exact: true })
        .first(),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Expand Authentication", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Expand Tenant", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Specifications in Authentication",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Specifications in Tenant", exact: true })
      .click();
    await page.getByRole("button", {name:"Historical documents in Authentication",exact:true}).click();
    await page.getByRole("button", {name:"change-login in Authentication",exact:true}).click();
    await page.getByRole("button", {name:"change-login · Specifications in Authentication",exact:true}).click();
    await expect(page.locator(".react-flow__node-element")).toHaveCount(3);
    // Select an actual canvas element; Markdown remains inert.
    const identity = page
      .locator(".react-flow__node-element")
      .filter({ hasText: "specifications/identity.md" });
    await identity.click();
    await expect(
      panel.getByRole("heading", {
        name: "specifications/identity.md",
        exact: true,
      }),
    ).toBeVisible();
    await panel.getByRole("button",{name:"Read document",exact:true}).click();await expect(page.getByRole("region",{name:"Knowledge reader"})).toContainText("Stable identity rules.");
    expect(await page.evaluate(() => window.compromised)).toBeUndefined();
    await expect(page.getByRole("region",{name:"Knowledge reader"}).locator("a[href], img, script")).toHaveCount(0);await page.getByRole("button",{name:"Back to graph",exact:true}).click();
    // Built-in zoom and fit controls actually change viewport state.
    const viewport = page.locator(".canvas-surface .react-flow__viewport");
    const initialTransform = await viewport.getAttribute("style");
    await page.getByRole("button", { name: "Zoom In", exact: true }).click();
    await expect
      .poll(() => viewport.getAttribute("style"))
      .not.toBe(initialTransform);
    await page.getByRole("button", { name: "Fit View", exact: true }).click();
    const pane = page.locator(".canvas-surface .react-flow__pane");
    const box = await pane.boundingBox();
    const beforePan = await viewport.getAttribute("style");
    await page.mouse.move(box.x + 25, box.y + box.height - 110);
    await page.mouse.down();
    await page.mouse.move(box.x + 95, box.y + box.height - 80, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => viewport.getAttribute("style")).not.toBe(beforePan);
    const zoom = () =>
      viewport.evaluate((el) =>
        Number(el.style.transform.match(/scale\(([^)]+)\)/)[1]),
      );
    const beforeCollapseZoom = await zoom();
    await page
      .getByRole("button", { name: "Collapse Tenant", exact: true })
      .click();
    await expect(page.locator(".react-flow__node-element")).toHaveCount(2);
    expect(await zoom()).toBe(beforeCollapseZoom);
    await expect(
      page.locator(".safe-edge-label").filter({ hasText: "removal proposed" }),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Planning", exact: true }).click();
    await expect(
      page.locator(".safe-edge-label").filter({ hasText: "removal proposed" }),
    ).toHaveCount(0);
    await expect(
      page
        .locator(".safe-edge-label")
        .filter({ hasText: "addition proposed" }),
    ).toHaveCount(1);
    await page.getByText(/repository diagnostic/).click();
    await expect(
      page.getByText("unresolved-reference", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Refresh", exact: true }),
    ).toBeEnabled();
    expect(await fingerprint(fixture.root)).toEqual(before);
    expect(git(fixture.root, "status", "--porcelain=v1")).toBe(beforeStatus);
    await writeFile(
      join(
        fixture.root,
        "docs/artifacts/tenant/versions/1.0.0/specifications/identity.md",
      ),
      "# Updated identity",
    );
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await panel.getByRole('button',{name:'Read document',exact:true}).click();
    await expect(page.getByRole('region',{name:'Knowledge reader'}).getByRole('heading',{name:'Updated identity',exact:true})).toBeVisible();
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
    await page.screenshot({
      path: "test-results/explorer.png",
      fullPage: true,
    });
  } finally {
    await fixture.cleanup();
  }
});

test("invalid path error and empty artifact directory are usable", async ({
  page,
}) => {
  const fixture = await fixtureRepository(
    new Map([["docs/artifacts/.keep", ""]]),
  );
  try {
    await page.goto("/");
    await page.getByLabel("Repository path").fill("/does/not/exist/plane");
    await page.getByRole("button", { name: "Open repository" }).click();
    await expect(page.getByRole("alert")).toContainText("does not exist");
    await page.getByLabel("Repository path").fill(fixture.root);
    await page.getByRole("button", { name: "Open repository" }).click();
    await expect(
      page.getByRole("heading", { name: "No artifacts found" }),
    ).toBeVisible();
  } finally {
    await fixture.cleanup();
  }
});

test("B8-B9: collapsible type groups, logical source order, compact records, and reference reveal", async ({
  page,
}) => {
  const fixture = await fixtureRepository(orderingFixture());
  const before = await fingerprint(fixture.root);
  try {
    await page.goto("/");
    await page.getByLabel("Repository path").fill(fixture.root);
    await page.getByRole("button", { name: "Open repository" }).click();
    await page
      .getByRole("navigation", { name: "Artifacts" })
      .getByRole("button", { name: /Knowledge/ })
      .click();
    await page
      .getByRole("button", { name: "Expand Knowledge", exact: true })
      .click();
    await expect(page.locator(".react-flow__node-element")).toHaveCount(0);
    expect(await page.locator(".canvas-type").allTextContents()).toEqual([
      "▸ Requirements1",
      "▸ Specifications1",
      "▸ Decisions1",
      "▸ Tasks5",
      "▸ Historical documents1",
    ]);
    await page
      .getByRole("button", { name: "Tasks in Knowledge", exact: true })
      .click();
    const records = page.locator(".react-flow__node-element");
    await expect(records).toHaveCount(5);
    await page.getByRole("button", {name:"Historical documents in Knowledge",exact:true}).click();
    await page.getByRole("button", {name:"change-next in Knowledge",exact:true}).click();
    await page.getByRole("button", {name:"change-next · Tasks in Knowledge",exact:true}).click();
    await expect(records).toHaveCount(10);
    const order = [
      "tasks/README.md",
      "tasks/2-reader.md",
      "tasks/10-validation.md",
      "tasks/nested/2-detail.md",
      "tasks/nested/10-detail.md",
    ];
    expect(await records.locator("strong").allTextContents()).toEqual([
      ...order,
      ...order,
    ]);
    expect(
      await records
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).height)),
    ).toBe(52);
    expect(
      await records
        .first()
        .locator(".element-node")
        .evaluate((el) => getComputedStyle(el).paddingBottom),
    ).toBe("6px");
    const panel = page.getByRole("complementary", {
      name: "Selection details",
    });
    await panel.getByRole('button',{name:'Tasks in inspector',exact:true}).click();
    expect(await panel.locator('.element-list-item span').allTextContents()).toEqual(order);
    await expect(
      panel.getByRole("button", { name: "Tasks in inspector", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await page
      .getByRole("button", { name: "Specifications in Knowledge", exact: true })
      .click();
    await page.getByRole("button", {name:"change-next · Specifications in Knowledge",exact:true}).click();
    await expect(records).toHaveCount(12);
    // A hidden target's category opens when its resolved reference is selected.
    await panel
      .getByRole("button", {
        name: "knowledge / requirements/need.md",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Requirements in Knowledge",
        exact: true,
      }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      panel.getByRole("heading", { name: "requirements/need.md", exact: true, level: 2 }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Tasks in Knowledge", exact: true })
      .click();
    await expect(records).toHaveCount(8);
    await page.getByRole("button", { name: "Fit View", exact: true }).click();
    await page.screenshot({
      path: "test-results/grouped-canvas.png",
      fullPage: true,
    });
    expect(await fingerprint(fixture.root)).toEqual(before);
  } finally {
    await fixture.cleanup();
  }
});

test('B11: history references reveal only their source and collapse preserves details', async ({page}) => {
  const files=orderingFixture();
  files.set('docs/artifacts/knowledge/versions/1.0.0/specifications/contract.md', '# History reference\n\n```yaml\nreferences:\n  - artifact: knowledge\n    element: requirements/need.md\n    requires: proposed requirement\n    status: proposed\n    change: change-next\n```\n');
  const fixture=await fixtureRepository(files),before=await fingerprint(fixture.root);
  try {
    await page.goto('/');
    await page.getByLabel('Repository path').fill(fixture.root);
    await page.getByRole('button',{name:'Open repository'}).click();
    await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Knowledge/}).click();
    await page.getByRole('button',{name:'Expand Knowledge',exact:true}).click();
    const history=page.getByRole('button',{name:'Historical documents in Knowledge',exact:true});
    await expect(history).toHaveAttribute('aria-expanded','false');
    await page.getByRole('button',{name:'Requirements in Knowledge',exact:true}).click();
    await expect(page.locator('.react-flow__node-element')).toHaveCount(1);
    await page.getByRole('button',{name:'Specifications in Knowledge',exact:true}).click();
    const panel=page.getByRole('complementary',{name:'Selection details'});
    await panel.locator('.reference').filter({hasText:'proposed · resolved'}).getByRole('button',{name:'knowledge / requirements/need.md',exact:true}).click();
    await expect(history).toHaveAttribute('aria-expanded','true');
    await expect(page.getByRole('button',{name:'change-next · Requirements in Knowledge',exact:true})).toHaveAttribute('aria-expanded','true');
    await expect(panel.locator('.details-meta')).toContainText('change:change-next');
    await page.getByRole('button',{name:'Fit View',exact:true}).click();
    await history.click();
    await expect(page.locator('.react-flow__node-element')).toHaveCount(2);
    await expect(panel.locator('.details-meta')).toContainText('change:change-next');
    expect(await fingerprint(fixture.root)).toEqual(before);
  } finally { await fixture.cleanup(); }
});
