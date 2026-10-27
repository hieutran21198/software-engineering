import {test, expect} from '@playwright/test';
import {fixtureRepository, inPlaceFixture} from '../fixtures.js';
import {diagramScopesFiles, diagramScopesRepository} from './diagram-scopes-fixture.js';
import {openRepository, openArtifact, openWork, region, main, documentPage, noOverflow} from './workbench.js';
// The system entry of the diagram scopes contract (artifact-plane
// specifications/diagram-scopes.md, Home page and Artifact page): the System
// section of Current work, the owner table links of a system view, and the
// System view link after "Read the overview".
const shots = process.env.SYSTEM_ENTRY_SCREENSHOT_DIR;
const work = page => region(page, 'Work page');
const artifactPage = page => region(page, 'Artifact page');
const system = page => work(page).getByRole('region', {name: 'System', exact: true});
const title = page => main(page).getByRole('heading', {level: 1});
const purposeLine = page => artifactPage(page).locator('.purpose-more');
const sectionTitles = page => work(page).locator('h2.section-title').allTextContents();
const collect = page => {const errors = [];page.on('pageerror', e => errors.push(e.message));return errors;};
async function shot(page, name) {
  if (!shots) return;
  const width = page.viewportSize().width;
  await page.screenshot({path: `${shots}/${name}-${width}.png`, fullPage: true});
}
// A second system view of platform sorts before system-overview.md by path, not by title;
// storefront's follows by artifact title and has no diagram.
const deployment = '---\nsystem_view: true\n---\n\n# Zeta deployment views\n\n```mermaid\nflowchart LR\n    a --> b\n```\n\nSource: platform:specifications/a-deployment.md; current snapshot.\n';
const context = '---\nsystem_view: true\n---\n\n# Storefront context\n\nThe storefront in its context, as a table.\n';
async function severalViews() {
  const files = await diagramScopesFiles();
  files.set('docs/artifacts/platform/specifications/a-deployment.md', deployment);
  files.set('docs/artifacts/storefront/specifications/storefront-context.md', context);
  return fixtureRepository(files);
}

for (const width of [1440, 390]) {
  test(`DP1, DP2, DP5 at ${width} pixels: the System section opens the system view, its owner tables open the owning artifacts, and the artifact page links back`, async ({page}) => {
    const f = await diagramScopesRepository(), errors = collect(page);
    try {
      await page.setViewportSize({width, height: width < 500 ? 844 : 1000});
      await openRepository(page, f.root);
      // The section sits before Dependencies, with its summary, muted line and one item.
      await expect(system(page).getByRole('heading', {level: 2})).toHaveText('System 1');
      expect(await sectionTitles(page)).toEqual(['Uncommitted knowledge', 'System 1', 'Dependencies']);
      await expect(system(page).locator('p.muted')).toHaveText('Views of the whole system. Their tables link to the artifacts that own each part.');
      const items = system(page).getByRole('listitem');
      await expect(items).toHaveCount(1);
      await expect(items.locator('.doc-title > span')).toHaveText(['Bookshop system overview', 'Platform · 3 diagrams']);
      expect(await noOverflow(page)).toBe(true);
      await shot(page, 'home');
      // The item opens the document page of the system view; Back returns to Current work.
      await items.getByRole('button').click();
      await expect(title(page)).toHaveText('Bookshop system overview');
      await expect(documentPage(page).locator('.eyebrow')).toContainText('Platform / Specifications');
      await expect(documentPage(page).locator('figure.diagram-block > svg')).toHaveCount(3);
      expect(await noOverflow(page)).toBe(true);
      await shot(page, 'system-view');
      await page.goBack();
      await expect(work(page)).toBeVisible();
      await expect(system(page)).toBeVisible();
      // DP2: each owner table link opens the knowledge of its owning artifact.
      await items.getByRole('button').click();
      for (const [link, owner] of [['Orders API', 'Ordering'], ['Order data', 'Ordering'], ['Payment worker', 'Payments'], ['Storefront web app', 'Storefront']]) {
        await expect(title(page)).toHaveText('Bookshop system overview');
        await documentPage(page).getByRole('button', {name: link, exact: true}).first().click();
        await expect(title(page)).toHaveText(link);
        await expect(documentPage(page).locator('.eyebrow')).toContainText(`${owner} / Specifications`);
        if (width < 500) expect(await noOverflow(page)).toBe(true);
        await page.goBack();
      }
      // DP5: the artifact page links to the system view after "Read the overview"; Back returns to it.
      await openArtifact(page, 'Ordering');
      await expect(purposeLine(page)).toHaveText(/Read the overview · System view: Bookshop system overview$/);
      expect(await noOverflow(page)).toBe(true);
      await shot(page, 'ordering');
      await purposeLine(page).getByRole('button', {name: 'Bookshop system overview', exact: true}).click();
      await expect(title(page)).toHaveText('Bookshop system overview');
      await page.goBack();
      await expect(title(page)).toHaveText('Ordering');
      // The owning artifact of the view links to it too.
      await openArtifact(page, 'Platform');
      await expect(purposeLine(page)).toHaveText(/Read the overview · System view: Bookshop system overview$/);
      expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });

  test(`DP1, DP5 at ${width} pixels: several system views are ordered by artifact title, then path, with the plural link`, async ({page}) => {
    const f = await severalViews(), errors = collect(page);
    try {
      await page.setViewportSize({width, height: width < 500 ? 844 : 1000});
      await openRepository(page, f.root);
      await expect(system(page).getByRole('heading', {level: 2})).toHaveText('System 3');
      const items = system(page).getByRole('listitem');
      await expect(items).toHaveCount(3);
      await expect(items.locator('.doc-title > span')).toHaveText(['Zeta deployment views', 'Platform · 1 diagram', 'Bookshop system overview', 'Platform · 3 diagrams', 'Storefront context', 'Storefront · No diagram']);
      expect(await noOverflow(page)).toBe(true);
      await shot(page, 'home-several');
      await items.nth(2).getByRole('button').click();
      await expect(title(page)).toHaveText('Storefront context');
      await page.goBack();
      await expect(system(page)).toBeVisible();
      // The plural form has one link for each document, in the same order.
      await openArtifact(page, 'Payments');
      await expect(purposeLine(page)).toHaveText(/Read the overview · System views: Zeta deployment views, Bookshop system overview, Storefront context$/);
      await expect(purposeLine(page).getByRole('button')).toHaveText(['Read the overview', 'Zeta deployment views', 'Bookshop system overview', 'Storefront context']);
      expect(await noOverflow(page)).toBe(true);
      await shot(page, 'payments-several');
      await purposeLine(page).getByRole('button', {name: 'Storefront context', exact: true}).click();
      await expect(title(page)).toHaveText('Storefront context');
      await page.goBack();
      await expect(title(page)).toHaveText('Payments');
      expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });

  test(`DP1, DP5 at ${width} pixels: a repository without system views has no System section and an unchanged purpose line`, async ({page}) => {
    const f = await fixtureRepository(inPlaceFixture()), errors = collect(page);
    try {
      await page.setViewportSize({width, height: width < 500 ? 844 : 1000});
      await openRepository(page, f.root);
      await expect(work(page).getByRole('region', {name: 'Dependencies', exact: true})).toBeVisible();
      await expect(system(page)).toHaveCount(0);
      expect(await sectionTitles(page)).toEqual(['Uncommitted knowledge', 'Dependencies']);
      await openArtifact(page, 'Tenant');
      await expect(purposeLine(page)).toHaveText('Current version · Established dependencies. Read the overview');
      await openWork(page);
      await expect(system(page)).toHaveCount(0);
      expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });
}
