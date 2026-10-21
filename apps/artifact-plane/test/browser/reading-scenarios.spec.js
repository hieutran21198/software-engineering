import {test, expect} from '@playwright/test';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {openRepository, openDocument, region, tree} from './workbench.js';
import {measure, report} from './measure.js';
import {fixtureRepository, git, identity, versionRecord} from '../fixtures.js';
import {conceptFiles, add, declaring, declarations, version, delivery} from '../concept-fixtures.js';
import {createFlowService} from '../../server/flow-index.js';
import {createFlowMcpServer} from '../../server/flow-mcp.js';
// Reading scenarios S-A to S-F of the approved concept pages design
// (specifications/concept-pages.md, Validation). The counting rule is the one of
// S1–S8: every click, fill, selection and key press after the repository opens
// on Current work; a fill counts 1 and a scroll counts 0. DESIGN holds the design
// count of each route at 1440 and 390 px; a measured count may not exceed it.
// The first measurement (task 10 of change-concept-pages) equals DESIGN for every
// route, so DESIGN is also the measured baseline.
// The design states 390 px counts only for S-E; at 390 px a route through the
// sidebar adds the Navigation drawer press, and the `/` key opens the drawer itself.
// S-D (interaction kinds) is P1 and outside this change, so it is not measured.
test.describe.configure({timeout: 120000});
const DESIGN = {
  'S-A browse': {1440: 2, 390: 3}, 'S-A all descriptions': {1440: 1, 390: 2}, 'S-A search': {1440: 3, 390: 3},
  'S-B open change': {1440: 2, 390: 2}, 'S-B delivered change': {1440: 3, 390: 4},
  'S-C concept name known': {1440: 4, 390: 4},
  'S-E Properties': {1440: 1, 390: 2}, 'S-E search': {1440: 3, 390: 3},
};
const MODELS = 'ADD models used in dependency gates', ADD = 'Artifact-Driven Development';
const artifact = {id: 'artifact', title: 'Artifact', description: 'One unit of knowledge with its own versions and changes.', sources: ['specifications/knowledge.md']};
const change = {id: 'change', title: 'Change', description: 'One proposed change of an artifact.', sources: ['specifications/knowledge.md']};
const release = {id: 'release', title: 'Release', description: 'A published package of established versions.', sources: ['specifications/delivery.md']};
const reworded = {...version, description: 'Contains the complete resulting artifact knowledge and provenance of one change.'};
const commit = (root, message) => {git(root, 'add', '-A');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
// An ADD-like repository: add declares Artifact, Change and Version; flow gates of
// add and flow explore of plane use Version. On main, the delivered change
// change-version-wording changed the Version declaration (add 1.1.0). On branch
// work, the open change change-version-records declares Delivery record and edits
// the describing document knowledge.md.
async function readingRepository() {
  const files = conceptFiles();
  files.set(declaring, declarations([artifact, change, version]));
  const f = await fixtureRepository(files);
  const put = async (path, text) => {await mkdir(join(f.root, path, '..'), {recursive: true});await writeFile(join(f.root, path), text);};
  await put(declaring, declarations([artifact, change, reworded]));
  await put(add + 'README.md', identity(ADD, '1.1.0'));
  await put(add + 'versions/1.1.0/README.md', versionRecord('change-version-wording'));
  await put(add + 'changes/change-version-wording/README.md', '# Clarify the version wording\n\n## Reason and scope\n\nThe version description names provenance.\n');
  await put(add + 'changes/change-version-wording/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  commit(f.root, 'Deliver change-version-wording');
  git(f.root, 'switch', '-q', '-c', 'work');
  await put(declaring, declarations([artifact, change, reworded, delivery]));
  await put(add + 'specifications/knowledge.md', '# Knowledge and execution contract\n\nVersions hold knowledge and provenance.\n');
  await put(add + 'changes/change-version-records/README.md', '# Record version delivery\n\n## Reason and scope\n\nReviewers need the delivery record as a concept.\n');
  await put(add + 'changes/change-version-records/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  commit(f.root, 'Start change-version-records');
  return {...f, put};
}
const conceptPage = page => region(page, 'Concept page');
const heading = page => conceptPage(page).getByRole('heading', {level: 1});
const search = page => page.getByLabel('Search knowledge', {exact: true});
const affected = page => region(page, 'Change page').getByRole('region', {name: 'Change brief', exact: true})
  .locator('.brief-rows details').filter({has: page.locator('.brief-question', {hasText: 'What is affected?'})});
// The Navigation drawer press of a narrow layout; a wide layout shows the sidebar.
async function drawer(p) {
  const toggle = p.getByRole('button', {name: 'Navigation', exact: true});
  if (await toggle.isVisible() && (await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await expect(tree(p)).toBeVisible();
}
// The jump route: '/', the query, Enter. The concepts load when the filter first
// has text; Enter waits until the concept row shows, as a reader sees it first.
async function jump(p, query, row) {
  await p.keyboard.press('/');
  await expect(search(p)).toBeFocused();
  await search(p).fill(query);
  await expect(tree(p).locator('.tree-row.concept', {hasText: row})).toBeVisible();
  await search(p).press('Enter');
}
async function finish(m, name, width) {
  const scenario = `${name} at ${width}`, design = DESIGN[name][width];
  const result = await m.finish(scenario, {width, design});
  await report(result, 'reading-scenarios');
  expect(result.unexpectedChanges, scenario).toEqual([]);
  expect(result.actions, `${scenario} actions: ${result.log.join(' | ')}`).toBeLessThanOrEqual(design);
  return result;
}
async function versionPage(page) {
  await expect(heading(page)).toHaveText('Version');
  await expect(conceptPage(page)).toContainText(reworded.description);
  await expect(conceptPage(page)).toContainText('Described in Knowledge and execution contract · Change-owned delivery contract');
}

for (const width of [1440, 390]) test.describe(`at ${width} pixels`, () => {
  test.use({viewport: {width, height: width < 500 ? 844 : 1000}});
  const name = key => `${key} (design ${DESIGN[key][width]} actions at ${width} px)`;
  async function scenario(page, run, prepare) {
    const f = await readingRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
    try {
      if (prepare) await prepare(f);
      await openRepository(page, f.root);
      await run(f);
      expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  }

  test(name('S-A browse'), async ({page}) => scenario(page, async f => {
    const m = measure(page, f.root), p = m.page;await m.begin();
    await drawer(p);
    await tree(p).getByRole('treeitem', {name: ADD, exact: true}).click();
    const concepts = region(p, 'Artifact page').getByRole('region', {name: 'Concepts', exact: true});
    // The row shows the first sentence of the description: the gist costs no action.
    await expect(concepts.getByRole('button', {name: /^Version /})).toContainText(reworded.description);
    await concepts.getByRole('button', {name: /^Version /}).click();
    await versionPage(page);
    await finish(m, 'S-A browse', width);
  }));

  test(name('S-A all descriptions'), async ({page}) => scenario(page, async f => {
    const m = measure(page, f.root), p = m.page;await m.begin();
    await drawer(p);
    await tree(p).getByRole('treeitem', {name: ADD, exact: true}).click();
    const concepts = region(p, 'Artifact page').getByRole('region', {name: 'Concepts', exact: true});
    for (const model of [artifact, change, reworded]) await expect(concepts).toContainText(model.description);
    await finish(m, 'S-A all descriptions', width);
  }));

  test(name('S-A search'), async ({page}) => scenario(page, async f => {
    const m = measure(page, f.root), p = m.page;await m.begin();
    // The open change change-version-records also matches; Enter opens the concept whose title equals the filter.
    await jump(p, 'version', 'Version');
    await versionPage(page);
    await finish(m, 'S-A search', width);
  }));

  test(name('S-B open change'), async ({page}) => scenario(page, async f => {
    const m = measure(page, f.root), p = m.page;await m.begin();
    await region(p, 'Work page').getByRole('button', {name: /^(Open|Continue) Record version delivery$/}).click();
    const row = affected(page);
    // The summary names the concepts whose declaration changed.
    await expect(row.locator('.brief-answer')).toHaveText(/^New concept: Delivery record\. /, {timeout: 30000});
    await affected(p).locator('summary').click();
    const texts = (await row.locator('.brief-items > li .grow').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim());
    expect(texts).toContain(`Delivery record — new declaration in ${MODELS}`);
    expect(texts).toContain('Version — describing document changed: Knowledge and execution contract');
    await finish(m, 'S-B open change', width);
  }));

  test(name('S-B delivered change'), async ({page}) => scenario(page, async f => {
    const m = measure(page, f.root), p = m.page;await m.begin();
    await drawer(p);
    await p.getByRole('navigation', {name: 'Navigation'}).getByRole('switch', {name: 'Show history'}).click();
    await tree(p).getByRole('treeitem', {name: /^Clarify the version wording/}).first().click();
    await expect(region(page, 'Change page').getByRole('heading', {level: 1})).toHaveText('Clarify the version wording');
    const row = affected(page);
    await expect(row.locator('.brief-answer')).toHaveText(/^Changed declaration: Version\./, {timeout: 30000});
    await affected(p).locator('summary').click();
    const texts = (await row.locator('.brief-items > li .grow').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim());
    expect(texts).toContain(`Version — declaration changed in ${MODELS}`);
    await finish(m, 'S-B delivered change', width);
  }));

  test(name('S-C concept name known'), async ({page}) => scenario(page, async f => {
    const m = measure(page, f.root), p = m.page;await m.begin();
    await jump(p, 'version', 'Version');
    await expect(heading(page)).toHaveText('Version');
    await conceptPage(p).locator('details.concept-code > summary').click();
    const code = conceptPage(page).locator('details.concept-code');
    // Labelled as inferred and concept-level, grouped by step and flow.
    await expect(code.locator('summary')).toContainText('Code and tests in the steps of these flows · 2 code files, 1 test file');
    await expect(code.locator('summary .kind-tag')).toHaveText('static');
    await expect(code.locator('.concept-group')).toHaveCount(2);
    await expect(code).toContainText('Resolve implementation dependency gates · Artifact-Driven Development');
    await expect(code).toContainText('Inferred from the steps where Version takes part. Not declared on the concept.');
    await expect(code.getByRole('button', {name: 'src/gates.js', exact: true})).toBeVisible();
    await finish(m, 'S-C concept name known', width);
  }));

  test(name('S-E Properties'), async ({page}) => scenario(page, async f => {
    // Not measured: the author has the declaring document open and saves it with Release added.
    const doc = await openDocument(page, ADD, 'Specifications', MODELS);
    await f.put(declaring, declarations([artifact, change, reworded, delivery, release]));
    // No Refresh: at both widths the saved document reaches the open page by live reload.
    // The Properties section is hidden in its collapsed disclosure at 390 px, so the wait reads it by class.
    const properties = doc.locator('section.document-properties');
    await expect(properties).toContainText('Release', {timeout: 15000});
    const m = measure(page, f.root), p = m.page;await m.begin();
    // At 1440 px Properties are open: the new concept and its badge show with 0 actions.
    // At 390 px they are in the collapsed Properties disclosure.
    const disclosure = region(p, 'Document page').locator('details.properties-disclosure > summary');
    if (await disclosure.isVisible()) await disclosure.click();
    await expect(properties).toContainText('Declares Artifact, Change, Delivery record +New, Release +New, Version');
    await expect(properties.locator('.concept-name', {hasText: 'Release'}).locator('.diff-badge')).toBeVisible();
    if (width === 1440) expect(m.state.actions, 'actions to see the new concept').toBe(0);
    await region(p, 'Document page').getByRole('region', {name: 'Properties'}).getByRole('button', {name: 'Release', exact: true}).click();
    await expect(heading(page)).toContainText('Release');
    await expect(conceptPage(page)).toContainText('No flow uses Release yet.');
    await finish(m, 'S-E Properties', width);
  }));

  test(name('S-E search'), async ({page}) => scenario(page, async f => {
    const m = measure(page, f.root), p = m.page;await m.begin();
    await jump(p, 'release', 'Release');
    await expect(heading(page)).toContainText('Release');
    await expect(heading(page).locator('.diff-badge')).toHaveText('+New');
    await expect(conceptPage(page)).toContainText('No flow uses Release yet.');
    await finish(m, 'S-E search', width);
  }, async f => f.put(declaring, declarations([artifact, change, reworded, delivery, release]))));
});

// S-F: an agent asks for the concept Change by its title. One get_concept call
// answers the description, the sources, the declaration state, the flows with
// their interactions, the inferred code and tests, and the open changes.
test('S-F: one get_concept call by title answers the concept (design 1 call)', async () => {
  const f = await readingRepository(), stateDir = await mkdtemp(join(tmpdir(), 'plane-reading-'));
  const service = createFlowService({stateDir, roots: [f.root], embedder: {signature: 'test', embed: async texts => texts.map(() => [1, 0])}});
  const app = createFlowMcpServer({service, roots: [f.root]}), client = new Client({name: 'reading-test', version: '1'});
  const [a, b] = InMemoryTransport.createLinkedPair();
  let calls = 0;
  const callTool = client.callTool.bind(client);
  client.callTool = (...args) => {calls++;return callTool(...args);};
  try {
    await app.server.connect(b);await client.connect(a);
    const result = await client.callTool({name: 'get_concept', arguments: {path: f.root, concept: 'Change'}});
    expect(result.isError).toBeUndefined();
    const concept = result.structuredContent.data.concept;
    expect([concept.logicalId, concept.title, concept.description]).toEqual(['add:change', 'Change', change.description]);
    expect(concept.sources).toEqual([{path: add + 'specifications/knowledge.md', title: 'Knowledge and execution contract', missing: false}]);
    expect(concept.declaredIn).toEqual({path: declaring, title: MODELS});
    expect('declaration' in concept).toBe(true);expect(concept.declaration).toBeNull();
    expect(concept.flows.map(x => [x.flow, x.participant, x.interactions.length])).toEqual([['add:gates', 'consumer', 2]]);
    expect(concept.implementation.basis).toBe('static');
    expect(concept.implementation.groups.flatMap(g => g.code.map(c => c.path))).toEqual(['src/gates.js']);
    expect(concept.branchChanged.map(d => d.path)).toContain(add + 'specifications/knowledge.md');
    expect(concept.changes.open.map(c => c.change)).toContain('change-version-records');
    expect(calls, 'MCP tool calls').toBe(1);
    await report({scenario: 'S-F', calls, design: 1}, 'reading-scenarios');
  } finally {
    await client.close();await app.close();await service.close();
    await rm(stateDir, {recursive: true, force: true});await f.cleanup();
  }
});
