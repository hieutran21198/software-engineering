import {test, expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import YAML from 'yaml';
import {fixtureRepository, fingerprint, git} from '../fixtures.js';
import {editingRepository, editingFiles, tenant, read, changedPaths} from './editing-fixtures.js';
import {openRepository, openArtifact, openFlow, region, refresh, noOverflow, layoutFacts, showSidebar, treeItem, setHistory} from './workbench.js';
// The flow page: Starts when and Ends with, numbered steps with grouped
// supports and six step actions, gaps and exclusions, the Model disclosure,
// the Diagram view, and the source page of a code or test support.
const flowPage = page => region(page, 'Flow page');
const sourcePage = page => region(page, 'Source page');
const step = (page, n) => flowPage(page).locator('.flow-steps > li').nth(n - 1);
const stepHead = (page, n) => step(page, n).locator('.step-head');
const flowPath = tenant + 'specifications/flows/member-login.md';
const flowValue = async (root, path = flowPath) => YAML.parse((await read(root, path)).match(/^---\n([\s\S]*?)\n---/)[1]).flow;
async function expand(page, n) {
  const head = stepHead(page, n);
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  return step(page, n);
}

// One flow with a loop, a support shared by two steps, observed test evidence
// and a code source longer than one excerpt.
const loginFlow = (title = 'Member login') => '---\nflow:\n  id: member-login\n  artifact: tenant\n  title: ' + title + '\n  trigger: A member signs in.\n  outcome: A session exists.\n  entry_steps: [check]\n  steps:\n    - id: check\n      title: Check member\n      supports: [need, code, shared]\n    - id: issue\n      title: Issue session\n      supports: [shared, check-test]\n  transitions:\n    - {from: check, to: issue}\n    - {from: issue, to: check, condition: Retry}\n  support:\n    - {id: need, kind: element, artifact: tenant, element: requirements/need.md, requires: The need, basis: documented}\n    - {id: code, kind: implementation, path: src/login.js, requires: Login code, basis: static}\n    - {id: shared, kind: implementation, path: src/session.js, requires: Session code, basis: static}\n    - {id: check-test, kind: test, path: test/login.test.js, requires: Login test, basis: observed, evidence: [test/login.test.js]}\n  gaps: [No runtime trace]\n  exclusions: [Password recovery]\n---\n# ' + title + '\n';
const longSource = '<script>window.flowInjected=true</script>\r\nexport const login = true;\r\n' + '// filler line\n'.repeat(900) + 'export const SECOND_PART = true;\n';
function readingFiles() {
  const files = editingFiles();
  files.set(flowPath, loginFlow());
  files.set('src/login.js', longSource);files.set('src/session.js', 'export const session = 1;\n');files.set('test/login.test.js', 'test("login", () => {});\n');
  return files;
}

test('create a flow; add, edit, move and remove steps, transitions and supports', async ({page}) => {
  const files = editingFiles();files.set('src/login.js', 'export const login = true;\n');
  // New flows are added while the artifact has an open change.
  files.set(tenant + 'changes/change-login/README.md', '# Login flow\n');files.set(tenant + 'changes/change-login/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  const f = await editingRepository(files), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const artifact = await openArtifact(page, 'Tenant');
    await artifact.getByRole('button', {name: '+ New flow', exact: true}).click();
    const create = artifact.getByRole('form', {name: 'Create flow'});
    await create.getByLabel('Title', {exact: true}).fill('Member login');await create.getByLabel('Starts when').fill('A member signs in.');
    await create.getByLabel('Ends with').fill('A session exists.');await create.getByLabel('First step').fill('Check member');await create.getByLabel('First step').press('Enter');
    await expect(flowPage(page).getByRole('heading', {level: 1})).toHaveText('Member login');
    await expect(flowPage(page).locator('.eyebrow')).toHaveText('Tenant / Flows');
    // Starts when and Ends with edit in place; Escape cancels.
    await flowPage(page).getByRole('button', {name: 'Edit Starts when', exact: true}).click();
    await flowPage(page).getByLabel('Starts when', {exact: true}).fill('A member submits the sign-in form.');
    await flowPage(page).getByRole('button', {name: 'Save', exact: true}).click();
    await expect(flowPage(page).getByLabel('Starts when', {exact: true})).toHaveCount(0);
    await expect(flowPage(page).getByRole('button', {name: 'Edit Starts when', exact: true})).toContainText('A member submits the sign-in form.');
    await flowPage(page).getByRole('button', {name: 'Edit Ends with', exact: true}).click();
    await flowPage(page).getByLabel('Ends with', {exact: true}).fill('Discarded.');await flowPage(page).getByLabel('Ends with', {exact: true}).press('Escape');
    await expect(flowPage(page).getByRole('button', {name: 'Edit Ends with', exact: true})).toContainText('A session exists.');
    // "+ Add step" appends after the last step by default.
    for (const title of ['Issue session', 'Audit']) {
      await flowPage(page).getByRole('button', {name: '+ Add step', exact: true}).click();
      const add = flowPage(page).getByRole('form', {name: 'Add step'});
      await add.getByLabel('Step title').fill(title);await add.getByLabel('Step title').press('Enter');
      await expect(flowPage(page).getByRole('button', {name: new RegExp(`^Step \\d: ${title}`)})).toBeVisible();
    }
    await expect(flowPage(page).getByRole('region', {name: 'Steps'}).getByRole('heading', {level: 2})).toHaveText('Steps 3');
    // The six step actions; the first step cannot move up.
    let detail = await expand(page, 1);
    for (const name of ['+ Add support', 'Rename step', 'Add a next step', 'Move down', 'Remove step']) await expect(detail.getByRole('button', {name, exact: true})).toBeEnabled();
    await expect(detail.getByRole('button', {name: 'Move up', exact: true})).toBeDisabled();
    // Add support: a knowledge document, then a code file.
    await detail.getByRole('button', {name: '+ Add support', exact: true}).click();
    let support = detail.getByRole('form', {name: 'Add support'});
    await expect(support.getByLabel('Artifact', {exact: true})).toHaveValue('tenant');
    await support.getByLabel('Document', {exact: true}).selectOption('requirements/need.md');
    await support.getByLabel('What the step needs from it').fill('The need to sign in.');
    await support.getByRole('button', {name: 'Add support', exact: true}).click();
    await expect(detail.getByRole('heading', {name: 'Knowledge', level: 3})).toBeVisible();
    await expect(detail.getByRole('button', {name: 'Need', exact: true})).toBeVisible();
    await detail.getByRole('button', {name: '+ Add support', exact: true}).click();
    support = detail.getByRole('form', {name: 'Add support'});
    await support.getByLabel('Support', {exact: true}).selectOption('implementation');
    await support.getByLabel('File in the repository').fill('src/login.js');
    await support.getByLabel('What the step needs from it').fill('Issues the session.');
    await support.getByLabel('Basis').selectOption('static');
    await support.getByRole('button', {name: 'Add support', exact: true}).click();
    await expect(detail.getByRole('heading', {name: 'Code', level: 3})).toBeVisible();
    await expect(detail.locator('.support-group').filter({hasText: 'Code'})).toContainText('src/login.js');
    await expect(stepHead(page, 1)).toContainText('1 knowledge');await expect(stepHead(page, 1)).toContainText('1 code');
    // A support of this flow joins step 2, so the two steps share it.
    detail = await expand(page, 2);
    await detail.getByRole('button', {name: '+ Add support', exact: true}).click();
    support = detail.getByRole('form', {name: 'Add support'});
    await support.getByLabel('Support', {exact: true}).selectOption('existing');
    await support.getByLabel('Support of this flow').selectOption({label: 'src/login.js'});
    await support.getByRole('button', {name: 'Add support', exact: true}).click();
    await expect(stepHead(page, 2)).toContainText('1 code');
    let flow = await flowValue(f.root);
    const codeId = flow.support.find(s => s.path === 'src/login.js').id;
    expect(flow.steps.map(s => s.supports || [])).toEqual([[flow.support.find(s => s.kind === 'element').id, codeId], [codeId], []]);
    // Remove: a shared support only leaves this step; a support of one step leaves the flow.
    await detail.getByRole('button', {name: 'Remove src/login.js from this step', exact: true}).click();
    await expect(stepHead(page, 2)).toContainText('No support');
    flow = await flowValue(f.root);expect(flow.support.map(s => s.id)).toContain(codeId);expect(flow.steps[1].supports || []).toEqual([]);
    detail = await expand(page, 1);
    await detail.getByRole('button', {name: 'Remove src/login.js from this step', exact: true}).click();
    await expect(stepHead(page, 1)).not.toContainText('code');
    await expect.poll(async () => (await flowValue(f.root)).support.map(s => s.id)).not.toContain(codeId);
    // Rename, move up, add a next step to an earlier step, and add then remove a new next step.
    detail = await expand(page, 3);
    await detail.getByRole('button', {name: 'Rename step', exact: true}).click();
    await detail.getByLabel('Step title').fill('Record audit');await detail.getByLabel('Step title').press('Enter');
    await expect(stepHead(page, 3)).toContainText('Record audit');
    await expect(detail.getByRole('button', {name: 'Move down', exact: true})).toBeDisabled();
    await detail.getByRole('button', {name: 'Move up', exact: true}).click();
    await expect(stepHead(page, 2)).toContainText('Record audit');
    await expect.poll(async () => (await flowValue(f.root)).steps.map(s => s.title)).toEqual(['Check member', 'Record audit', 'Issue session']);
    detail = await expand(page, 2);
    await detail.getByRole('button', {name: 'Add a next step', exact: true}).click();
    let next = detail.getByRole('form', {name: 'Add the next step'});
    await next.getByLabel('Next step').selectOption({label: '1. Check member'});await next.getByLabel('When (optional)').fill('Retry');
    await next.getByRole('button', {name: 'Add the next step', exact: true}).click();
    await expect(stepHead(page, 2)).toContainText('↩ 1 Check member when retry.');
    detail = await expand(page, 3);
    await detail.getByRole('button', {name: 'Add a next step', exact: true}).click();
    next = detail.getByRole('form', {name: 'Add the next step'});
    await next.getByLabel('Title of the new step').fill('Notify member');await next.getByRole('button', {name: 'Add the next step', exact: true}).click();
    await expect(stepHead(page, 4)).toContainText('Notify member');
    detail = await expand(page, 4);
    await detail.getByRole('button', {name: 'Remove step', exact: true}).click();
    await expect(flowPage(page).locator('.flow-steps > li')).toHaveCount(3);
    // Gaps and exclusions edit in place.
    await flowPage(page).getByRole('button', {name: 'Edit gaps', exact: true}).click();
    await flowPage(page).getByLabel('Gaps, one per line').fill('No runtime trace.');
    await flowPage(page).getByRole('region', {name: 'Gaps'}).getByRole('button', {name: 'Save', exact: true}).click();
    await expect(flowPage(page).getByLabel('Gaps, one per line')).toHaveCount(0);
    await expect(flowPage(page).getByRole('region', {name: 'Gaps'}).locator('.flow-gap')).toHaveText(['No runtime trace.']);
    await flowPage(page).getByRole('button', {name: 'Edit exclusions', exact: true}).click();
    await flowPage(page).getByLabel('Exclusions, one per line').fill('Password recovery.\nSingle sign-on.');
    await flowPage(page).getByRole('region', {name: 'Exclusions'}).getByRole('button', {name: 'Save', exact: true}).click();
    await expect(flowPage(page).getByRole('region', {name: 'Exclusions'}).getByRole('listitem')).toHaveText(['Password recovery.', 'Single sign-on.']);
    flow = await flowValue(f.root);
    expect(flow.trigger).toBe('A member submits the sign-in form.');expect(flow.outcome).toBe('A session exists.');
    expect(flow.entry_steps).toEqual(['check-member']);expect(flow.steps.map(s => s.id)).toEqual(['check-member', 'audit', 'issue-session']);
    expect(flow.support.map(s => s.kind)).toEqual(['element']);
    expect(flow.transitions).toEqual(expect.arrayContaining([{from: 'audit', to: 'check-member', condition: 'Retry'}]));
    expect(flow.gaps).toEqual(['No runtime trace.']);expect(flow.exclusions).toEqual(['Password recovery.', 'Single sign-on.']);
    // Diagram shows the flow canvas; selecting a step returns to Steps with it open.
    await flowPage(page).getByRole('group', {name: 'Flow view'}).getByRole('button', {name: 'Diagram', exact: true}).click();
    const diagram = flowPage(page).getByRole('group', {name: 'Flow diagram'});
    await expect(diagram.locator('.react-flow__node')).toHaveCount(3);
    await diagram.locator('.react-flow__node').filter({hasText: 'Issue session'}).click();
    await expect(flowPage(page).getByRole('group', {name: 'Flow view'}).getByRole('button', {name: 'Steps', exact: true})).toHaveAttribute('aria-pressed', 'true');
    await expect(stepHead(page, 3)).toHaveAttribute('aria-expanded', 'true');
    for (const width of [390, 1440]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page)).toBe(true);}
    expect(await layoutFacts(page)).toMatchObject({titles: ['Member login'], treesInMain: 0, modeControls: [], duplicates: []});
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([flowPath]);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('the Model disclosure shows participants and interactions; comments, model layer and unknown keys survive step edits', async ({page}) => {
  const files = editingFiles();
  files.set(tenant + 'specifications/domain-model.md', '---\nmodels:\n  - id: member\n    title: Member\n    description: The member who signs in.\n    sources: [requirements/need.md]\n---\n# Models\n');
  files.set(flowPath, '---\n# Flow comment\nflow:\n  id: member-login\n  artifact: tenant\n  title: Member login\n  trigger: Sign in\n  outcome: Session\n  entry_steps: [check]\n  steps:\n    - id: check\n      title: Check\n      supports: [need]\n      interactions:\n        - {from: member, to: member, action: Check membership, outcome: Membership checked., supports: [need]}\n  transitions: []\n  support:\n    - id: need\n      kind: element\n      artifact: tenant\n      element: requirements/need.md\n      requires: Need\n      basis: documented\n  participants:\n    - {id: member, artifact: tenant, model: member, requires: Signs in}\n    - {id: ghost, artifact: tenant, model: ghost, requires: Missing}\n  custom_key: keep\n---\n# Member login\n');
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);await openFlow(page, 'Tenant', 'Member login');
    const model = flowPage(page).locator('details.flow-model');
    await expect(model).not.toHaveAttribute('open', '');
    await model.locator('summary').click();
    await expect(model.getByRole('heading', {name: 'Participants', level: 3})).toBeVisible();
    await expect(model.getByRole('listitem').filter({hasText: /^member/})).toHaveText('member · Member — Signs in');
    await expect(model.getByRole('listitem').filter({hasText: /^ghost/})).toHaveText('ghost · tenant:ghost — Missing');
    await expect(model.getByRole('listitem').filter({hasText: /^Check:/})).toHaveText('Check: member → member: Check membership — Membership checked.');
    await expect(model.getByLabel('Front matter')).toHaveValue(/custom_key: keep/);
    await expect(model.getByRole('button', {name: 'Save front matter', exact: true})).toBeVisible();
    await flowPage(page).getByRole('button', {name: '+ Add step', exact: true}).click();
    const add = flowPage(page).getByRole('form', {name: 'Add step'});await add.getByLabel('Step title').fill('Done');await add.getByLabel('Step title').press('Enter');
    await expect(stepHead(page, 2)).toContainText('Done');
    const text = await read(f.root, flowPath);
    expect(text).toContain('# Flow comment');expect(text).toContain('custom_key: keep');
    expect(text).toContain('- {from: member, to: member, action: Check membership, outcome: Membership checked., supports: [need]}');
    expect(text).toContain('- {id: member, artifact: tenant, model: member, requires: Signs in}');
  } finally {await f.cleanup();}
});

test('read only on main: loops, shared support, evidence and the source page with escaped excerpts', async ({page}) => {
  const f = await fixtureRepository(readingFiles()), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);await openFlow(page, 'Tenant', 'Member login');
    const flow = flowPage(page);
    await expect(flow.getByRole('button', {name: /^Edit |^\+ Add step$/})).toHaveCount(0);
    await expect(flow.locator('.flow-box')).toHaveText(['Starts whenA member signs in.', 'Ends withA session exists.']);
    await expect(flow.getByText('Select a step to edit it.')).toHaveCount(0);
    await expect(stepHead(page, 1)).toContainText('1 knowledge');await expect(stepHead(page, 1)).toContainText('2 code');
    await expect(stepHead(page, 2)).toContainText('1 code');await expect(stepHead(page, 2)).toContainText('1 test');
    await expect(stepHead(page, 2)).toContainText('↩ 1 Check member when retry.');
    await expect(flow.getByRole('region', {name: 'Gaps'})).toContainText('No runtime trace');
    await expect(flow.getByRole('region', {name: 'Exclusions'})).toContainText('Password recovery');
    // Expanded steps group their supports; the shared support appears in both; no actions on main.
    const first = await expand(page, 1);
    await expect(first.getByRole('heading', {level: 3})).toHaveText(['Knowledge', 'Code']);
    await expect(first.locator('.support-group').filter({hasText: 'Code'}).getByRole('listitem')).toHaveCount(2);
    await expect(first.getByRole('button', {name: /^Remove |^Rename step$|^Move |^\+ Add support$|^Add a next step$/})).toHaveCount(0);
    const second = await expand(page, 2);
    await expect(second.getByRole('heading', {level: 3})).toHaveText(['Code', 'Tests']);
    await expect(second.locator('.support-group').filter({hasText: 'Code'})).toContainText('src/session.js');
    await expect(second.locator('.support-group').filter({hasText: 'Tests'})).toContainText('observed · 1 evidence file');
    expect(await layoutFacts(page)).toMatchObject({titles: ['Member login'], treesInMain: 0, modeControls: [], duplicates: []});
    // The source page reads a code support through the flow, escaped, one excerpt at a time.
    await expand(page, 1);
    await step(page, 1).getByRole('button', {name: 'src/login.js', exact: true}).click();
    const source = sourcePage(page);
    await expect(source.getByRole('heading', {level: 1})).toHaveText('login.js');
    await expect(source.locator('.eyebrow')).toHaveText('Member login / Supporting source');
    await expect(source.locator('pre')).toContainText('<script>window.flowInjected=true</script>');
    await expect(source.getByRole('status')).toHaveText('This is an excerpt of the source.');
    await expect(source.locator('pre')).not.toContainText('SECOND_PART');
    expect(await source.locator('script').count()).toBe(0);expect(await page.evaluate(() => window.flowInjected)).toBeUndefined();
    await source.getByRole('button', {name: 'Next excerpt', exact: true}).click();
    await expect(source.locator('pre')).toContainText('export const SECOND_PART = true;');
    await expect(source.locator('pre')).not.toContainText('flowInjected');
    await expect(source.getByRole('button', {name: 'Next excerpt', exact: true})).toHaveCount(0);
    for (const width of [390, 1440]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page)).toBe(true);}
    // Another source starts at its first excerpt; the eyebrow returns to the flow.
    await source.locator('.eyebrow').getByRole('button', {name: 'Member login', exact: true}).click();
    await expand(page, 2);
    await step(page, 2).getByRole('button', {name: 'test/login.test.js', exact: true}).click();
    await expect(sourcePage(page).getByRole('heading', {level: 1})).toHaveText('login.test.js');
    await expect(sourcePage(page).locator('pre')).toHaveText('test("login", () => {});\n');
    await expect(sourcePage(page).getByRole('button', {name: 'Next excerpt', exact: true})).toHaveCount(0);
    // Diagram: steps and transitions, with the loop label.
    await sourcePage(page).locator('.eyebrow').getByRole('button', {name: 'Member login', exact: true}).click();
    await flowPage(page).getByRole('button', {name: 'Diagram', exact: true}).click();
    const diagram = flowPage(page).getByRole('group', {name: 'Flow diagram'});
    await expect(diagram.locator('.react-flow__node')).toHaveCount(2);await expect(diagram.locator('.react-flow__edge')).toHaveCount(2);
    await expect(diagram.locator('.safe-edge-label')).toHaveText(['Retry']);
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('a source excerpt is highlighted and refreshes after the repository changes', async ({page}) => {
  const f = await fixtureRepository(readingFiles());
  try {
    await openRepository(page, f.root);await openFlow(page, 'Tenant', 'Member login');
    await expand(page, 2);
    await step(page, 2).getByRole('button', {name: 'src/session.js', exact: true}).click();
    const source = sourcePage(page);
    expect(await source.locator('.code-panel code').textContent()).toBe('export const session = 1;\n');
    await expect(source.locator('.code-panel .hljs-keyword').first()).toBeVisible();
    await writeFile(join(f.root, 'src/session.js'), 'export const session = 2;\n');
    await refresh(page);
    await expect(source.locator('pre')).toContainText('export const session = 2;');
  } finally {await f.cleanup();}
});

// Product bug: the source page sets the highlighted HTML with innerHTML, and
// HTML parsing turns CR LF into LF, so the excerpt is not the exact file text.
test.fixme('a source excerpt keeps the exact line endings of the file', async ({page}) => {
  const files = readingFiles();files.set('src/session.js', 'export const session = 1;\r\n');
  const f = await fixtureRepository(files);
  try {
    await openRepository(page, f.root);await openFlow(page, 'Tenant', 'Member login');
    await expand(page, 2);await step(page, 2).getByRole('button', {name: 'src/session.js', exact: true}).click();
    await expect(sourcePage(page).locator('pre')).toContainText('export const session');
    expect(await sourcePage(page).locator('.code-panel code').textContent()).toBe('export const session = 1;\r\n');
  } finally {await f.cleanup();}
});

// Product bug: SourcePage keeps the cursor of a later excerpt across a refresh.
// When the source changed, the server rejects the stale cursor and Retry repeats it.
test.fixme('the source page returns to the first excerpt when the repository changes', async ({page}) => {
  const f = await fixtureRepository(readingFiles());
  try {
    await openRepository(page, f.root);await openFlow(page, 'Tenant', 'Member login');
    await expand(page, 1);await step(page, 1).getByRole('button', {name: 'src/login.js', exact: true}).click();
    await sourcePage(page).getByRole('button', {name: 'Next excerpt', exact: true}).click();
    await expect(sourcePage(page).locator('pre')).toContainText('SECOND_PART');
    await writeFile(join(f.root, 'src/login.js'), 'export const login = "changed";\n' + longSource);
    await refresh(page);
    await expect(sourcePage(page).locator('pre')).toContainText('export const login = "changed";');
  } finally {await f.cleanup();}
});

test('an invalid flow record keeps its title and shows an honest error', async ({page}) => {
  const files = editingFiles();
  files.set(flowPath, '---\nflow:\n  id: member-login\n  title: [unclosed\n---\n# Member login\n');
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);await showSidebar(page);
    await treeItem(page, /^Tenant/).first().click();await treeItem(page, /^Flows/).first().click();
    await page.getByRole('tree', {name: 'Knowledge'}).locator('[role=treeitem][aria-level="3"]').first().click();
    await expect(flowPage(page).getByRole('heading', {level: 1})).toHaveText('Member login');
    await expect(flowPage(page).getByRole('alert')).toHaveText('Flow does not exist in selected context');
    await expect(flowPage(page).getByRole('button', {name: /^Edit |^\+ Add step$/})).toHaveCount(0);
  } finally {await f.cleanup();}
});

test('an affected-flow chip of a unit opens the flow, and Refresh reloads its detail', async ({page}) => {
  const files = readingFiles();
  files.set('docs/artifacts/units-of-work/login/README.md', '---\nunit_of_work: login\nchanges: []\nacceptance:\n  - id: login\n    criterion: Members sign in.\nevidence: []\naffected_flows:\n  - artifact: tenant\n    flow: member-login\n    effect: modify\nflow_assessment: Review member login.\n---\n# Login outcome\n');
  const f = await fixtureRepository(files);let details = 0;
  page.on('request', request => {if (request.url().endsWith('/api/flows/query') && request.postDataJSON()?.operation === 'detail') details++;});
  try {
    await openRepository(page, f.root);
    await setHistory(page, true);
    await treeItem(page, /^Login outcome/).first().click();
    await region(page, 'Unit page').getByRole('region', {name: 'Affected flows'}).getByRole('button', {name: /^Member login/}).click();
    await expect(flowPage(page).getByRole('heading', {level: 1})).toHaveText('Member login');
    await expect(stepHead(page, 2)).toContainText('↩ 1 Check member');
    await expect.poll(() => details).toBeGreaterThan(0);
    const count = details;await refresh(page);
    await expect.poll(() => details).toBeGreaterThan(count);
    await expect(flowPage(page).getByRole('heading', {level: 1})).toHaveText('Member login');
  } finally {await f.cleanup();}
});

test('project tabs keep their own flow page, and an empty tab reads no flows', async ({page}) => {
  const a = await fixtureRepository(readingFiles()), bFiles = readingFiles();bFiles.set(flowPath, loginFlow('Project B login'));
  const b = await fixtureRepository(bFiles), requests = [];
  page.on('request', request => {if (request.url().endsWith('/api/flows/query')) requests.push(request.postDataJSON());});
  try {
    await openRepository(page, a.root);await openFlow(page, 'Tenant', 'Member login');
    const active = () => page.getByRole('tabpanel').filter({visible: true});
    await page.getByRole('button', {name: 'New project tab', exact: true}).click();
    await active().getByLabel('Repository path').fill(b.root);await active().getByRole('button', {name: 'Open repository', exact: true}).click();
    await expect(active().getByRole('region', {name: 'Work page'})).toBeVisible();
    // Open the flow inside the active tab: the shared helpers expect one tree.
    const tree = active().getByRole('tree', {name: 'Knowledge'});
    await tree.getByRole('treeitem', {name: /^Tenant/}).click();await tree.getByRole('treeitem', {name: /^Flows/}).click();
    await tree.getByRole('treeitem', {name: /^Project B login/}).click();
    await expect(active().getByRole('region', {name: 'Flow page'}).getByRole('heading', {level: 1})).toHaveText('Project B login');
    expect(requests.filter(r => r.operation === 'detail').every(r => [a.root, b.root].includes(r.path))).toBe(true);
    await page.getByRole('tab').first().click();
    await expect(active().getByRole('region', {name: 'Flow page'}).getByRole('heading', {level: 1})).toHaveText('Member login');
    await page.getByRole('button', {name: 'New project tab', exact: true}).click();
    await expect(active().getByLabel('Repository path')).toHaveValue('');
    const count = requests.length;await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(active().getByLabel('Repository path')).toBeVisible();
    expect(requests.length).toBe(count);
  } finally {await a.cleanup();await b.cleanup();}
});

test('switching the worktree leaves the source page and reads the flow of the other worktree', async ({page}) => {
  const f = await fixtureRepository(readingFiles()), other = f.root + '-flow-other';
  git(f.root, 'worktree', 'add', '-qb', 'other', other);
  try {
    await writeFile(join(other, flowPath), loginFlow('Other worktree login'));
    await openRepository(page, f.root);await openFlow(page, 'Tenant', 'Member login');
    await expand(page, 1);await step(page, 1).getByRole('button', {name: 'src/login.js', exact: true}).click();
    await expect(sourcePage(page).locator('pre')).toContainText('export const login');
    await page.getByRole('button', {name: /^Branch main/}).click();await page.getByRole('menuitemradio', {name: /^other/}).click();
    await expect(page.getByRole('button', {name: /^Branch other/})).toBeVisible();
    await expect(region(page, 'Work page')).toBeVisible();await expect(sourcePage(page)).toHaveCount(0);
    await openFlow(page, 'Tenant', 'Other worktree login');
    await expect(flowPage(page).getByRole('heading', {level: 1})).toHaveText('Other worktree login');
    await expect(stepHead(page, 1)).toHaveAttribute('aria-expanded', 'false');
  } finally {git(f.root, 'worktree', 'remove', '--force', other);await f.cleanup();}
});

// Diagram labels: long, parallel, reverse and loop transitions stay readable.
async function geometry(page) {
  return flowPage(page).locator('.react-flow').evaluate(el => {
    const rect = e => {const r = e.getBoundingClientRect();return {x: r.x, y: r.y, w: r.width, h: r.height};};
    const nodes = [...el.querySelectorAll('.react-flow__node')].map(rect), labels = [...el.querySelectorAll('.safe-edge-label')].map(rect);
    const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y, bounds = rect(el);
    return {count: labels.length, clipped: labels.filter(a => a.x < bounds.x - 1 || a.y < bounds.y - 1 || a.x + a.w > bounds.x + bounds.w + 1 || a.y + a.h > bounds.y + bounds.h + 1).length,
      nodeOverlaps: labels.filter(a => nodes.some(b => intersects(a, b))).length, labelOverlaps: labels.filter((a, i) => labels.slice(i + 1).some(b => intersects(a, b))).length};
  });
}
test('diagram labels separate long parallel, reverse and loop transitions at wide and narrow widths', async ({page}) => {
  const long = 'A long parallel transition condition that must wrap without hiding text or blocking the next step. '.repeat(4).trim();
  const conditions = [['a', 'b', long], ['a', 'b', 'Second parallel transition'], ['b', 'a', 'Reverse retry transition'], ['b', 'b', 'Loop until the long validation condition succeeds'], ['b', 'c', 'Continue after validation']];
  const files = editingFiles();
  files.set(tenant + 'specifications/flows/labels.md', '---\nflow:\n  id: labels\n  artifact: tenant\n  title: Label geometry\n  trigger: Start\n  outcome: Done\n  entry_steps: [a]\n  steps:\n' + ['a', 'b', 'c'].map(id => `    - {id: ${id}, title: Step ${id} with a title that wraps onto several lines, supports: []}\n`).join('') + '  transitions:\n' + conditions.map(([from, to, condition]) => `    - {from: ${from}, to: ${to}, condition: "${condition}"}\n`).join('') + '  support: []\n---\n# Label geometry\n');
  const f = await fixtureRepository(files);
  try {
    await openRepository(page, f.root);await openFlow(page, 'Tenant', 'Label geometry');
    await flowPage(page).getByRole('button', {name: 'Diagram', exact: true}).click();
    await expect(flowPage(page).locator('.react-flow__node')).toHaveCount(3);
    for (const width of [1440, 700]) {
      await page.setViewportSize({width, height: 1000});
      await flowPage(page).getByRole('button', {name: 'Fit View', exact: true}).click();
      await expect.poll(() => geometry(page)).toMatchObject({count: 5, clipped: 0, nodeOverlaps: 0, labelOverlaps: 0});
      const disclosure = flowPage(page).locator('.safe-edge-disclosure');
      if ((await disclosure.getAttribute('open')) === null) {await disclosure.locator('summary').focus();await disclosure.locator('summary').press('Enter');}
      await expect(flowPage(page).getByText(long, {exact: true})).toBeVisible();
      await expect.poll(() => geometry(page)).toMatchObject({nodeOverlaps: 0, labelOverlaps: 0});
      await flowPage(page).getByRole('button', {name: 'Zoom In', exact: true}).click();
      await expect.poll(() => geometry(page)).toMatchObject({nodeOverlaps: 0, labelOverlaps: 0});
    }
  } finally {await f.cleanup();}
});
