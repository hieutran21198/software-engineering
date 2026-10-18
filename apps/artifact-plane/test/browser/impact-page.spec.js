import {test, expect} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository, fingerprint, git, identity, versionRecord} from '../fixtures.js';
import {openRepository, openChange, openDocument, openFlow, region, noOverflow} from './workbench.js';
// The Impact page: the four entry points, tier toggles, kind and origin
// filters, one more hop, the detail panel with a path, the focused graph, the
// flow highlight, and the empty and stale states, at 1440 and 390 pixels.
const tenant = 'docs/artifacts/tenant/';
const impactPage = page => region(page, 'Impact page');
const flow = '---\nflow:\n  id: login\n  artifact: tenant\n  title: Member login\n  trigger: A member opens the sign-in form.\n  outcome: The member is signed in.\n  entry_steps: [start]\n  steps:\n    - id: start\n      title: Start the session\n      supports: [code]\n    - id: check\n      title: Check the identity rules\n      supports: [rules, login-test]\n    - id: audit\n      title: Record the attempt\n      supports: []\n  transitions:\n    - from: start\n      to: check\n    - from: check\n      to: audit\n  support:\n    - id: code\n      kind: implementation\n      path: src/login.js\n      requires: Sign the member in.\n      basis: static\n    - id: rules\n      kind: element\n      artifact: tenant\n      element: specifications/identity.md\n      requires: Identity rules.\n      basis: documented\n    - id: login-test\n      kind: test\n      path: test/login.test.js\n      requires: Prove sign-in.\n      basis: static\n  gaps: [The audit step has no support yet.]\n  exclusions: []\n---\n# Member login\n';
// Code: login imports signIn; other imports only unused; app and server chain beyond depth 2.
const session = body => `export function signIn(name) {\n  return ${body};\n}\nexport function unused() {\n  return 0;\n}\n`;
const files = () => new Map([
  [tenant + 'README.md', identity('Tenant', '1.0.0', [], '\nTenant owns member identity.\n')],
  [tenant + 'specifications/identity.md', '# Identity\n\nA member has one identity.\n'],
  [tenant + 'specifications/flows/login.md', flow],
  [tenant + 'versions/1.0.0/README.md', versionRecord('change-initial')], [tenant + 'changes/change-initial/README.md', '# Initial tenant'], [tenant + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan'],
  ['docs/artifacts/billing/README.md', identity('Billing', '1.0.0', ['tenant'])],
  ['docs/artifacts/billing/specifications/invoice.md', '---\nreferences:\n  - artifact: tenant\n    element: specifications/identity.md\n    requires: Bill one identity per member.\n---\n# Invoice\n\nInvoices name the member.\n'],
  ['docs/artifacts/billing/versions/1.0.0/README.md', versionRecord('change-initial')], ['docs/artifacts/billing/changes/change-initial/README.md', '# Initial billing'], ['docs/artifacts/billing/changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan'],
  ['docs/artifacts/audit/README.md', identity('Audit', '1.0.0', ['tenant'])], ['docs/artifacts/audit/requirements/trail.md', '# Trail\n\nKeep a trail.\n'],
  ['docs/artifacts/audit/versions/1.0.0/README.md', versionRecord('change-initial')], ['docs/artifacts/audit/changes/change-initial/README.md', '# Initial audit'], ['docs/artifacts/audit/changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan'],
  ['src/session.js', session('Boolean(name)')],
  ['src/login.js', "import {signIn} from './session.js';\nexport function login(name) {\n  return signIn(name);\n}\n"],
  ['src/other.js', "import {unused} from './session.js';\nexport const other = () => unused();\n"],
  ['src/app.js', "import {login} from './login.js';\nexport const app = () => login('member');\n"],
  ['src/server.js', "import {app} from './app.js';\nexport const server = () => app();\n"],
  ['src/lonely.js', 'export const lonely = 1;\n'],
  ['test/login.test.js', "import {login} from '../src/login.js';\nlogin('member');\n"],
]);
// main holds the established knowledge; change-rules changes the identity rules and signIn.
async function fixture() {
  const f = await fixtureRepository(files());
  git(f.root, 'checkout', '-q', '-b', 'change-rules');
  const put = async (p, t) => {await mkdir(join(f.root, p, '..'), {recursive: true});await writeFile(join(f.root, p), t);};
  await put(tenant + 'specifications/identity.md', '# Identity\n\nA member has one identity and one verified email.\n');
  await put('src/session.js', session('Boolean(name) && name.length > 0'));
  await put(tenant + 'changes/change-rules/README.md', '# Propose identity rules\n\nPropose identity rules.\n');
  await put(tenant + 'changes/change-rules/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  git(f.root, 'add', '-A');git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Start change-rules');
  return f;
}
const answered = page => expect(impactPage(page).getByRole('group', {name: 'Show tiers'})).toBeVisible({timeout: 30000});
const section = (page, name) => impactPage(page).getByRole('region', {name, exact: true});
const row = (page, sectionName, text) => section(page, sectionName).locator('.impact-row').filter({hasText: text}).first();
async function askMore(page, {path, symbols, commit}) {
  await page.getByRole('button', {name: 'More', exact: true}).click();
  await page.getByRole('menuitem', {name: /^Impact/}).click();
  const form = impactPage(page).getByRole('form', {name: 'Ask what a change affects'});
  if (path) await form.getByLabel('File or document path', {exact: true}).fill(path);
  if (symbols) await form.getByLabel('Changed symbols (optional)', {exact: true}).fill(symbols);
  if (commit) await form.getByLabel('Or a commit', {exact: true}).fill(commit);
  await form.getByRole('button', {name: 'Show impact', exact: true}).click();
  await answered(page);
}

for (const width of [1440, 390]) test.describe(`at ${width} pixels`, () => {
  test.use({viewport: {width, height: width < 500 ? 844 : 1000}});

  test('the change page action shows the branch difference with tiers, filters, one more hop, a path and the graph', async ({page}) => {
    test.setTimeout(90000);
    const f = await fixture(), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
    try {
      await openRepository(page, f.root);
      const change = await openChange(page, 'Propose identity rules');
      await change.getByRole('button', {name: 'What does this change affect?', exact: true}).click();
      await answered(page);
      await expect(impactPage(page).getByRole('heading', {level: 1})).toHaveText('What does this change affect?');
      // The changed entities, with the changed declaration of session.js.
      const changed = impactPage(page).getByLabel('Changed', {exact: true});
      await expect(changed).toContainText('src/session.js');await expect(changed).toContainText('signIn');
      await expect(changed).toContainText(tenant + 'specifications/identity.md');
      // Direct: the importer of signIn, the referencing spec and the flow; not the importer of unused.
      await expect(row(page, 'Direct', 'login.js')).toBeVisible();
      await expect(row(page, 'Direct', 'Invoice')).toBeVisible();
      await expect(row(page, 'Direct', 'Member login')).toContainText('check');
      await expect(impactPage(page).locator('.impact-row').filter({hasText: 'other.js'})).toHaveCount(0);
      await expect(row(page, 'Transitive', 'app.js')).toBeVisible();
      await expect(row(page, 'Verify', 'login.test.js')).toBeVisible();
      await expect(row(page, 'Unresolved', 'audit')).toBeVisible();
      // Tier toggles hide and show a section.
      const directToggle = impactPage(page).getByRole('group', {name: 'Show tiers'}).getByRole('button', {name: /Direct$/});
      await directToggle.click();await expect(directToggle).toHaveAttribute('aria-pressed', 'false');await expect(section(page, 'Direct')).toHaveCount(0);
      await directToggle.click();await expect(section(page, 'Direct')).toBeVisible();
      // The kind filter keeps tests only; the origin filter keeps one changed entity.
      await impactPage(page).getByLabel('Kind', {exact: true}).selectOption('test');
      await expect(section(page, 'Direct')).toHaveCount(0);await expect(row(page, 'Verify', 'login.test.js')).toBeVisible();
      await impactPage(page).getByLabel('Kind', {exact: true}).selectOption('all');
      await impactPage(page).getByLabel('Changed entity', {exact: true}).selectOption(tenant + 'specifications/identity.md');
      await expect(row(page, 'Direct', 'Invoice')).toBeVisible();await expect(impactPage(page).locator('.impact-row').filter({hasText: 'login.js'})).toHaveCount(0);
      await impactPage(page).getByLabel('Changed entity', {exact: true}).selectOption('');
      // One more hop reaches server.js beyond depth 2.
      await expect(impactPage(page).locator('.impact-row').filter({hasText: 'server.js'})).toHaveCount(0);
      const more = impactPage(page).getByRole('button', {name: /^One more hop \(\d+\)$/});
      await expect(more).toBeEnabled();await more.click();
      await expect(row(page, 'Transitive', 'server.js')).toBeVisible({timeout: 30000});
      // The detail panel shows the typed path; Escape closes it.
      await row(page, 'Direct', 'login.js').click();
      const detail = impactPage(page).getByRole('complementary', {name: 'Selected entity'});
      await expect(detail.getByRole('heading', {level: 3})).toHaveText('login.js');
      await expect(detail).toContainText('is imported by (signIn)');await expect(detail).toContainText('src/session.js');
      await page.keyboard.press('Escape');await expect(detail).toHaveCount(0);
      // The focused graph and back to the list.
      await impactPage(page).getByRole('button', {name: 'Show as graph', exact: true}).click();
      await expect(impactPage(page).getByRole('group', {name: 'Impact graph'})).toBeVisible();
      await expect(impactPage(page).locator('.react-flow__node').first()).toBeVisible();
      await impactPage(page).getByRole('button', {name: 'Show as list', exact: true}).click();
      await expect(impactPage(page).getByRole('group', {name: 'Impact graph'})).toHaveCount(0);
      expect(await noOverflow(page)).toBe(true);
      expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });

  test('the document and flow step actions open their impact, and a flow opened from it highlights the affected steps', async ({page}) => {
    test.setTimeout(90000);
    const f = await fixture(), errors = [];page.on('pageerror', e => errors.push(e.message));
    try {
      await openRepository(page, f.root);
      const doc = await openDocument(page, 'Tenant', 'Specifications', 'Identity');
      // Narrow layouts keep the properties in a disclosure.
      const disclosure = doc.locator('details.properties-disclosure > summary');
      if (await disclosure.isVisible()) await disclosure.click();
      await doc.getByRole('button', {name: 'Where is this used?', exact: true}).click();
      await answered(page);
      await expect(impactPage(page).getByRole('heading', {level: 1})).toHaveText('What does Identity affect?');
      await expect(row(page, 'Direct', 'Invoice')).toBeVisible();
      // Open the flow from its detail; the check step is highlighted, the others are not.
      await row(page, 'Direct', 'Member login').click();
      const detail = impactPage(page).getByRole('complementary', {name: 'Selected entity'});
      await detail.getByRole('button', {name: 'Open flow with affected steps', exact: true}).click();
      const flowPage = region(page, 'Flow page');
      await expect(flowPage).toBeVisible();
      await expect(flowPage.getByText('The change affects 1 step of this flow; they are highlighted.', {exact: true})).toBeVisible();
      await expect(flowPage.locator('.flow-steps > li.affected')).toHaveCount(1);
      await expect(flowPage.locator('.flow-steps > li.affected')).toContainText('Check the identity rules');
      await flowPage.getByRole('button', {name: 'Diagram', exact: true}).click();
      await expect(flowPage.locator('.react-flow__node.affected')).toHaveCount(1);
      // A step action asks about its sources.
      const login = await openFlow(page, 'Tenant', 'Member login');
      const head = login.locator('.flow-steps > li').nth(0).locator('.step-head');
      await head.click();await expect(head).toHaveAttribute('aria-expanded', 'true');
      await login.getByRole('button', {name: "What do this step's sources affect?", exact: true}).click();
      await answered(page);
      await expect(impactPage(page).getByLabel('Changed', {exact: true})).toContainText('src/login.js');
      await expect(row(page, 'Direct', 'app.js')).toBeVisible();
      expect(await noOverflow(page)).toBe(true);expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });

  test('the More menu asks about a path or a commit; empty and stale answers say so', async ({page}) => {
    test.setTimeout(90000);
    const f = await fixture(), errors = [];page.on('pageerror', e => errors.push(e.message));
    try {
      await openRepository(page, f.root);
      // A file nothing uses: the empty state names its coverage.
      await askMore(page, {path: 'src/lonely.js'});
      await expect(impactPage(page).getByRole('status').filter({hasText: 'No consumer found in the analyzed relationships'})).toBeVisible();
      await expect(impactPage(page).locator('details.impact-coverage')).toHaveAttribute('open', '');
      // A symbol limits the answer: unused reaches other.js only.
      await askMore(page, {path: 'src/session.js', symbols: 'unused'});
      await expect(row(page, 'Direct', 'other.js')).toBeVisible();
      await expect(impactPage(page).locator('.impact-row').filter({hasText: 'login.js'})).toHaveCount(0);
      // A commit: the change-rules commit names both changed files.
      await askMore(page, {commit: 'HEAD'});
      await expect(impactPage(page).getByRole('heading', {level: 1})).toHaveText('What does Commit HEAD affect?');
      await expect(impactPage(page).getByLabel('Changed', {exact: true})).toContainText('src/session.js');
      // A stale reply offers a reload; the reload answers fresh.
      let stale = true;
      await page.route('**/api/impact/query', async route => {
        const response = await route.fetch(), body = await response.json();
        await route.fulfill({response, json: stale ? {...body, freshness: 'stale'} : body});
      });
      await askMore(page, {path: 'src/login.js'});
      const notice = impactPage(page).getByText('The repository changed while the answer was computed.', {exact: true});
      await expect(notice).toBeVisible();
      stale = false;await impactPage(page).getByRole('button', {name: 'Reload', exact: true}).click();
      await expect(notice).toHaveCount(0);
      expect(await noOverflow(page)).toBe(true);expect(errors).toEqual([]);
    } finally {await f.cleanup();}
  });
});
