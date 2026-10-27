import {test, expect} from '@playwright/test';
import {fixtureRepository, identity, versionRecord} from '../fixtures.js';
import {diagramScopesRepository} from './diagram-scopes-fixture.js';
import {openRepository, openArtifact, region, documentPage, main, noOverflow} from './workbench.js';
// The Diagrams section of the artifact page and the document opened at a diagram
// (specifications/diagram-scopes.md, Artifact page and Document focus).
const shots = process.env.DIAGRAM_SCREENSHOT_DIR;
// The flow "Place an order" has the same title as a diagram, so selectors stay in the Diagrams region.
const diagrams = page => region(page, 'Diagrams');
const items = page => diagrams(page).getByRole('listitem');
const lines = item => item.locator('.doc-title > span');
// The Ordering diagrams in the document order of the page: Specifications by title, then each document's index.
const ORDERING = [
  ['Order data model', 'Data model · Order data › Entities', /^Source: ordering:specifications\/order-data\.md#entities; /],
  ['Fallback sample', 'Flowchart · Order data › Reader fallback sample', /^Illustrative$/],
  ['Order lifecycle', 'State · Order lifecycle › States and events', /^Source: ordering:specifications\/order-lifecycle\.md#states-and-events; /],
  ['Place an order', 'Sequence · Orders API › Create an order', /^Source: ordering:specifications\/orders-api\.md#create-an-order; ordering:place-order; /],
  ['Idempotency check of the order handler', 'Flowchart · Orders API › Idempotency check', /^No source line$/],
];
const scrollTop = page => main(page).evaluate(node => node.scrollTop);
// The page area scrolls, not the document: a tall viewport shows the whole artifact page.
async function capture(page, path, width) {
  await expect(page.getByText('Reading the overview…')).toHaveCount(0);
  const size = page.viewportSize();
  await page.setViewportSize({width, height: 2200});
  await page.screenshot({path});
  await page.setViewportSize(size);
}

for (const width of [1440, 390]) {
  test(`the Ordering page lists its diagrams, and an item opens the document at its figure, at ${width} pixels`, async ({page}) => {
    await page.setViewportSize({width, height: width < 500 ? 844 : 1000});
    const f = await diagramScopesRepository();
    try {
      await openRepository(page, f.root);
      const artifact = await openArtifact(page, 'Ordering');
      // The section follows Flows, with its title, summary and three lines in each item.
      await expect(diagrams(page).getByRole('heading', {level: 2})).toHaveText('Diagrams 5');
      expect(await artifact.locator('section.section').evaluateAll(sections => sections.map(s => s.id))).toEqual(
        ['artifact-section-requirements', 'artifact-section-specifications', 'artifact-section-decisions', 'artifact-section-flows', 'artifact-section-diagrams', 'artifact-section-versions']);
      await expect(region(page, 'Specifications').getByRole('listitem')).toHaveText(['Order data', 'Order lifecycle', 'Orders API']);
      await expect(region(page, 'Flows').getByRole('listitem')).toHaveText(['Place an order']);
      await expect(items(page)).toHaveCount(5);
      for (const [i, [title, location, source]] of ORDERING.entries()) {
        await expect(lines(items(page).nth(i)).nth(0)).toHaveText(title === 'Order lifecycle' ? /^Order lifecycle\s*Stale$/ : title);
        await expect(lines(items(page).nth(i)).nth(1)).toHaveText(location);
        await expect(lines(items(page).nth(i)).nth(2)).toHaveText(source);
      }
      // Only the stale diagram has the badge; its title is the stale text.
      await expect(diagrams(page).getByText('Stale', {exact: true})).toHaveCount(1);
      await expect(items(page).nth(2).locator('.status-badge')).toHaveAttribute('title', 'Stale: payments:specifications/payment-worker.md changed; recheck pending.');
      // Five items need no "Show all" control.
      await expect(diagrams(page).getByRole('button', {name: /^Show (all|first)/})).toHaveCount(0);
      expect(await noOverflow(page)).toBe(true);
      if (shots) await capture(page, `${shots}/artifact-ordering-${width}.png`, width);

      // The item opens the document at its figure: in view, focused, with tabindex -1 and its label.
      await items(page).filter({hasText: 'Idempotency check of the order handler'}).getByRole('button').click();
      await expect(documentPage(page).getByRole('heading', {level: 1})).toHaveText('Orders API');
      const figure = documentPage(page).locator('figure.diagram-block[data-diagram-index="1"]');
      await expect(figure).toBeFocused();
      await expect(figure).toHaveAttribute('tabindex', '-1');
      await expect(figure).toHaveAttribute('aria-label', 'Diagram 2: Idempotency check of the order handler');
      await expect(figure.locator('> svg')).toHaveCount(1);
      await expect(figure).toBeInViewport();
      expect(await scrollTop(page)).toBeGreaterThan(0);
      await expect(documentPage(page).locator('figure.diagram-block[tabindex]')).toHaveCount(1);
      expect(await noOverflow(page)).toBe(true);
      if (shots) await page.screenshot({path: `${shots}/document-focus-${width}.png`});

      // Browser Back returns to the artifact page and its item.
      await page.goBack();
      await expect(region(page, 'Artifact page').getByRole('heading', {level: 1})).toHaveText('Ordering');
      await expect(items(page).filter({hasText: 'Idempotency check of the order handler'}).getByRole('button')).toBeFocused();

      // The stale state diagram opens with its own label.
      await items(page).filter({hasText: 'Order lifecycle'}).getByRole('button').click();
      const state = documentPage(page).locator('figure.diagram-block[data-diagram-index="0"]');
      await expect(state).toBeFocused();
      await expect(state).toHaveAttribute('aria-label', 'Diagram 1: Order lifecycle');
      await expect(state).toBeInViewport();
      if (shots) await page.screenshot({path: `${shots}/document-state-${width}.png`});
      await page.goBack();

      // An artifact without diagrams has no Diagrams section; its other sections stay.
      await openArtifact(page, 'Payments');
      await expect(region(page, 'Specifications').getByRole('listitem')).toHaveText(['Payment worker']);
      await expect(diagrams(page)).toHaveCount(0);
      await expect(region(page, 'Artifact page').locator('#artifact-section-diagrams')).toHaveCount(0);
    } finally {
      await f.cleanup();
    }
  });

  test(`more than five diagrams show "Show all N", and an index without a figure opens the document at the top, at ${width} pixels`, async ({page}) => {
    await page.setViewportSize({width, height: width < 500 ? 844 : 1000});
    // A sixth record names an index that Order data has no figure for.
    await page.route('**/api/repository/query', async route => {
      if (route.request().postDataJSON()?.section !== 'overview') return route.continue();
      const response = await route.fetch(), json = await response.json();
      const element = json.data.artifacts.find(a => a.id === 'ordering').elements.find(e => e.source === 'working' && e.path === 'specifications/order-data.md');
      element.diagrams.push({index: 7, type: 'gantt', title: null, heading: null, source: null, stale: null});
      await route.fulfill({response, json});
    });
    const f = await diagramScopesRepository();
    try {
      await openRepository(page, f.root);
      await openArtifact(page, 'Ordering');
      await expect(diagrams(page).getByRole('heading', {level: 2})).toHaveText('Diagrams 6');
      await expect(items(page)).toHaveCount(5);
      await diagrams(page).getByRole('button', {name: 'Show all 6 diagrams'}).click();
      await expect(items(page)).toHaveCount(6);
      // Another type keeps its name; a record without a heading has no heading part.
      await expect(lines(items(page).nth(2))).toHaveText(['gantt diagram', 'gantt · Order data', 'No source line']);
      await expect(diagrams(page).getByRole('button', {name: 'Show first 5 diagrams'})).toHaveAttribute('aria-expanded', 'true');
      expect(await noOverflow(page)).toBe(true);
      await items(page).nth(2).getByRole('button').click();
      await expect(documentPage(page).getByRole('heading', {level: 1})).toHaveText('Order data');
      // The two figures render, and the page stays at the top with no figure focused.
      await expect(documentPage(page).locator('figure.diagram-block > svg, figure.diagram-block .diagram-note')).toHaveCount(2);
      await page.waitForTimeout(300);
      expect(await scrollTop(page)).toBe(0);
      await expect(documentPage(page).locator('figure.diagram-block[tabindex]')).toHaveCount(0);
      expect(await page.evaluate(() => document.activeElement?.closest('figure') ?? null)).toBe(null);
    } finally {
      await f.cleanup();
    }
  });
}

test('a repository without diagrams shows no Diagrams section', async ({page}) => {
  const base = 'docs/artifacts/tenant/';
  const f = await fixtureRepository(new Map([
    [base + 'README.md', identity('Tenant', '1.0.0')],
    [base + 'specifications/identity.md', '# Identity\n\nNo diagram here.\n\n```js\nconst plain = true;\n```\n'],
    [base + 'versions/1.0.0/README.md', versionRecord('change-initial')],
    [base + 'changes/change-initial/README.md', '# Initial\n'],
    [base + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan\n'],
  ]));
  try {
    await openRepository(page, f.root);
    await openArtifact(page, 'Tenant');
    await expect(region(page, 'Specifications').getByRole('listitem')).toHaveText(['Identity']);
    await expect(region(page, 'Diagrams')).toHaveCount(0);
  } finally {
    await f.cleanup();
  }
});
