import {test, expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fingerprint} from '../fixtures.js';
import {conceptRepository, conceptFiles, branchRepository, declaring, declarations, version} from '../concept-fixtures.js';
import {openRepository, openArtifact, openDocument, region, noOverflow, layoutFacts, refresh} from './workbench.js';
// The concept page (specifications/concept-pages.md, Concept page) and the Impact
// concept rows (Existing pages, Impact), at 1440 and 390 pixels.
const conceptPage = page => region(page, 'Concept page');
// Narrow layouts hide Refresh; the repository events read the change there.
const reread = async page => {if (await page.getByRole('button', {name: 'Refresh', exact: true}).isVisible()) await refresh(page);};
const impactPage = page => region(page, 'Impact page');
const heading = page => conceptPage(page).getByRole('heading', {level: 1});
const flows = page => conceptPage(page).getByRole('region', {name: 'Flows', exact: true});
const flowRow = (page, title) => flows(page).getByRole('button', {name: new RegExp('^' + title)});
async function askImpact(page, path) {
  await page.getByRole('button', {name: 'More', exact: true}).click();
  await page.getByRole('menuitem', {name: /^Impact/}).click();
  const form = impactPage(page).getByRole('form', {name: 'Ask what a change affects'});
  await form.getByLabel('File or document path', {exact: true}).fill(path);
  await form.getByRole('button', {name: 'Show impact', exact: true}).click();
  await expect(impactPage(page).getByRole('group', {name: 'Show tiers'})).toBeVisible({timeout: 30000});
}
const conceptRow = (page, title) => impactPage(page).getByRole('region', {name: 'Direct', exact: true}).locator('.impact-row').filter({has: page.locator('.impact-title', {hasText: new RegExp(`^${title}$`)})});
// A concept page opens from its Impact row: the declaring document affects every model it declares.
async function openConcept(page, title) {
  await askImpact(page, declaring);
  await conceptRow(page, title).click();
  await impactPage(page).getByRole('complementary', {name: 'Selected entity'}).getByRole('button', {name: 'Open concept', exact: true}).click();
  await expect(heading(page)).toContainText(title);
}

for (const width of [1440, 390]) test.describe(`at ${width} pixels`, () => {
  test.use({viewport: {width, height: width < 500 ? 844 : 1000}});

  test('CPA7, CPA2: an Impact concept row opens the Version page; rows toggle, Code and tests opens, and the action opens Impact', async ({page}) => {
    test.setTimeout(90000);
    const f = await conceptRepository(), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
    try {
      await openRepository(page, f.root);
      await askImpact(page, declaring);
      // The model rows read concept with the title; the detail has Open concept and no entity path line.
      const row = conceptRow(page, 'Version');
      await expect(row.locator('.impact-kind')).toHaveText('concept');
      await row.click();
      const detail = impactPage(page).getByRole('complementary', {name: 'Selected entity'});
      await expect(detail.getByRole('heading', {level: 3})).toHaveText('Version');
      await expect(detail.locator('h3 + p.impact-path')).toHaveCount(0);
      await expect(detail).toContainText('declares model');
      await detail.getByRole('button', {name: 'Open concept', exact: true}).click();
      const concept = conceptPage(page);
      // The contract order and wording.
      await expect(heading(page)).toHaveText('Version');
      await expect(concept.locator('.eyebrow')).toHaveText('Artifact-Driven Development / Concept');
      const text = (await concept.innerText()).replace(/\s+/g, ' ');
      const order = ['Artifact-Driven Development / Concept', 'Version', 'What does Version affect?', version.description,
        'Described in Knowledge and execution contract · Change-owned delivery contract', 'Flows 2', 'Explore a local ADD repository · Artifact Plane',
        'Supply complete version knowledge and provenance.', 'Resolve implementation dependency gates', 'Provide complete published knowledge used to resolve the supplying contract.',
        'Code and tests in the steps of these flows · 2 code files, 1 test file', 'Declared as a model in ADD models used in dependency gates.'];
      let at = -1;for (const part of order) {const next = text.indexOf(part, at + 1);expect(next, part).toBeGreaterThan(at);at = next;}
      await expect(concept.locator('details.concept-code summary .kind-tag')).toHaveText('static');
      await expect(concept.locator('details.concept-code')).not.toHaveAttribute('open', '');
      // One row opens at a time; the open row shows the role, Open flow and the interactions.
      const gates = flowRow(page, 'Resolve implementation dependency gates'), explore = flowRow(page, 'Explore a local ADD repository');
      await expect(gates).toHaveAttribute('aria-expanded', 'false');await expect(explore).toHaveAttribute('aria-expanded', 'false');
      await gates.click();
      await expect(gates).toHaveAttribute('aria-expanded', 'true');
      await expect(flows(page)).toContainText('Role: contract · Open flow');
      await expect(flows(page)).toContainText('Resolve contracts and selectors — Change → Version: Select the current established version');
      await expect(flows(page)).toContainText('Wait for upstream publication — Version → Change: Gate dependent implementation on publication');
      await explore.click();
      await expect(explore).toHaveAttribute('aria-expanded', 'true');await expect(gates).toHaveAttribute('aria-expanded', 'false');
      await expect(flows(page)).toContainText('Load metadata first and scoped details on demand — Repository snapshot → Version: Select declared version knowledge');
      await expect(flows(page)).not.toContainText('Role: contract');
      // Code and tests opens to groups with step links, the flow and artifact line, file links and the footnote.
      await concept.locator('details.concept-code > summary').click();
      const code = concept.locator('details.concept-code');
      await expect(code.locator('.concept-group')).toHaveCount(2);
      await expect(code.locator('.concept-group').first()).toContainText('Resolve contracts and selectors, Wait for upstream publication');
      await expect(code.locator('.concept-group').first()).toContainText('Resolve implementation dependency gates · Artifact-Driven Development');
      await expect(code.locator('.concept-group').first()).toContainText('No test file.');
      await expect(code).toContainText('Inferred from the steps where Version takes part. Not declared on the concept.');
      // Layout: one h1, unique names, no horizontal scroll, with a row and the details open.
      expect(await layoutFacts(page)).toMatchObject({titles: ['Version'], treesInMain: 0, duplicates: []});
      expect(await noOverflow(page)).toBe(true);
      // A file link opens the source through its flow; Back returns to the concept page.
      await code.getByRole('button', {name: 'test/reader.test.js', exact: true}).click();
      await expect(region(page, 'Source page').getByRole('heading', {level: 1})).toHaveText('reader.test.js');
      await expect(region(page, 'Source page').locator('.eyebrow')).toContainText('Explore a local ADD repository');
      await page.goBack();
      await expect(heading(page)).toHaveText('Version');
      // An interaction step link opens the flow page.
      await flowRow(page, 'Resolve implementation dependency gates').click();
      await flows(page).getByRole('button', {name: 'Wait for upstream publication, Gate dependent implementation on publication', exact: true}).click();
      await expect(region(page, 'Flow page').getByRole('heading', {level: 1})).toHaveText('Resolve implementation dependency gates');
      await page.goBack();
      // The action opens Impact for the concept and its describing documents.
      await conceptPage(page).getByRole('button', {name: 'What does Version affect?', exact: true}).click();
      await expect(impactPage(page).getByRole('heading', {level: 1})).toHaveText('What does Version affect?');
      await expect(impactPage(page).getByRole('group', {name: 'Show tiers'})).toBeVisible({timeout: 30000});
      const changed = impactPage(page).getByLabel('Changed', {exact: true});
      await expect(changed).toContainText('model:add:version');
      await expect(changed).toContainText('docs/artifacts/add/specifications/knowledge.md');
      await expect(changed).toContainText('docs/artifacts/add/specifications/delivery.md');
      expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });

  test('the links of the artifact, document and flow pages open the concept page', async ({page}) => {
    test.setTimeout(90000);
    const f = await conceptRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
    try {
      await openRepository(page, f.root);
      const artifact = await openArtifact(page, 'Artifact-Driven Development');
      await artifact.getByRole('region', {name: 'Concepts', exact: true}).getByRole('button', {name: /^Version /}).click();
      await expect(heading(page)).toHaveText('Version');
      await expect(flows(page)).toBeVisible();
      const doc = await openDocument(page, 'Artifact-Driven Development', 'Specifications', 'ADD models used in dependency gates');
      const disclosure = doc.locator('details.properties-disclosure > summary');
      if (await disclosure.isVisible()) await disclosure.click();
      await doc.getByRole('region', {name: 'Properties'}).getByRole('button', {name: 'Version', exact: true}).click();
      await expect(heading(page)).toHaveText('Version');
      // The flow opens from the concept page; its participant link returns to it.
      await flowRow(page, 'Explore a local ADD repository').click();
      await flows(page).getByRole('button', {name: 'Open flow', exact: true}).click();
      const flow = region(page, 'Flow page');
      await expect(flow.getByRole('heading', {level: 1})).toHaveText('Explore a local ADD repository');
      await flow.locator('details.flow-model > summary').click();
      await flow.locator('details.flow-model').getByRole('button', {name: 'Open concept Version', exact: true}).click();
      await expect(heading(page)).toHaveText('Version');
      await page.goBack();
      await expect(region(page, 'Flow page').getByRole('heading', {level: 1})).toHaveText('Explore a local ADD repository');
      expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });

  test('CPA3, CPA5: an unused model shows the sparse line; a missing source shows the error with its fix link; a removed concept shows its diagnostic', async ({page}) => {
    test.setTimeout(90000);
    const f = await conceptRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
    try {
      await openRepository(page, f.root);
      await openConcept(page, 'Release');
      await expect(conceptPage(page)).toContainText('No flow uses Release yet.');
      await expect(flows(page)).toHaveCount(0);
      await expect(conceptPage(page).locator('details')).toHaveCount(0);
      await expect(conceptPage(page)).toContainText('Declared as a model in ADD models used in dependency gates.');
      expect(await layoutFacts(page)).toMatchObject({titles: ['Release'], duplicates: []});
      expect(await noOverflow(page)).toBe(true);
      // A declaration that the knowledge no longer holds: the diagnostic text and the eyebrow link only.
      await writeFile(join(f.root, declaring), declarations([version]));
      await reread(page);
      await expect(conceptPage(page).getByRole('status')).toHaveText('No concept add:release is declared in the selected knowledge.');
      await expect(conceptPage(page).getByRole('button')).toHaveCount(1);
      await expect(conceptPage(page).getByRole('button', {name: 'Artifact-Driven Development', exact: true})).toBeVisible();
      await writeFile(join(f.root, declaring), conceptFiles().get(declaring));
      await reread(page);
      // Ledger has a missing source: the error Notice with the fix link, and no closing line.
      await openConcept(page, 'Ledger');
      const alert = conceptPage(page).getByRole('alert');
      await expect(alert).toContainText('Model add:ledger sources do not exist: specifications/ledger.md.');
      await expect(conceptPage(page)).not.toContainText('Declared as a model in');
      expect(await layoutFacts(page)).toMatchObject({titles: ['Ledger'], duplicates: []});
      expect(await noOverflow(page)).toBe(true);
      await alert.getByRole('button', {name: 'Fix in ADD models used in dependency gates', exact: true}).click();
      await expect(region(page, 'Document page').getByRole('heading', {level: 1})).toHaveText('ADD models used in dependency gates');
      expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });

  test('CPA4: on a branch the branch line names the changed documents and the open change; a new declaration has the New badge', async ({page}) => {
    test.setTimeout(90000);
    const f = await branchRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
    try {
      await openRepository(page, f.root);
      await openConcept(page, 'Version');
      const line = conceptPage(page).locator('p', {hasText: 'Changed on this branch:'});
      await expect(line).toHaveText('Changed on this branch: ADD models used in dependency gates, Knowledge and execution contract. Open change in Artifact-Driven Development: Add the delivery record concept');
      await expect(heading(page).locator('.diff-badge')).toHaveCount(0);
      expect(await layoutFacts(page)).toMatchObject({titles: ['Version'], duplicates: []});
      expect(await noOverflow(page)).toBe(true);
      await openConcept(page, 'Delivery record');
      await expect(heading(page).locator('.diff-badge')).toHaveText('+New');
      await expect(conceptPage(page)).toContainText('No flow uses Delivery record yet.');
      await line.getByRole('button', {name: 'Add the delivery record concept', exact: true}).click();
      await expect(region(page, 'Change page').getByRole('heading', {level: 1})).toHaveText('Add the delivery record concept');
      await page.goBack();
      await conceptPage(page).locator('p', {hasText: 'Changed on this branch:'}).getByRole('button', {name: 'ADD models used in dependency gates, changed on this branch', exact: true}).click();
      await expect(region(page, 'Document page').getByRole('heading', {level: 1})).toHaveText('ADD models used in dependency gates');
      expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });
});
