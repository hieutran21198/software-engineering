import {test, expect} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository, fingerprint, git, identity, versionRecord} from '../fixtures.js';
import {openRepository, openWork, openArtifact, openDocument, openChange, openUnit, openFlow, noOverflow, layoutFacts, region} from './workbench.js';
// The layout rules of the authoring workbench contract on every page: one
// title, one navigation outside main, no tree or mode control inside main,
// unique names for the visible controls of main, and no horizontal overflow.
const base = 'docs/artifacts/tenant/', change = base + 'changes/change-rules/';
const flow = '---\nflow:\n  id: login\n  artifact: tenant\n  title: Member login\n  trigger: A member opens the sign-in form.\n  outcome: The member is signed in.\n  entry_steps: [start]\n  steps:\n    - id: start\n      title: Read the identity rules\n      supports: [rules, code]\n    - id: check\n      title: Check the password\n      supports: [rules]\n  transitions:\n    - from: start\n      to: check\n  support:\n    - id: rules\n      kind: element\n      artifact: tenant\n      element: specifications/identity.md\n      requires: Identity rules\n      basis: documented\n    - id: code\n      kind: implementation\n      path: src/login.js\n      requires: Sign in\n      basis: static\n  gaps: [Lockout is not traced.]\n  exclusions: []\n---\n# Member login\n';
async function fixture() {
  const f = await fixtureRepository(new Map([
    [base + 'README.md', identity('Tenant', '1.0.0', [], '\nTenant owns member identity.\n')], [base + 'specifications/identity.md', '# Identity\n\nIdentity rules.\n'], [base + 'requirements/need.md', '# Need\n\nStable need.\n'],
    [base + 'specifications/flows/login.md', flow], ['src/login.js', 'export const signIn = () => true;\n'],
    [base + 'versions/1.0.0/README.md', versionRecord('change-initial')], [base + 'changes/change-initial/README.md', '# Initial tenant'], [base + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan'],
    ['docs/artifacts/billing/README.md', identity('Billing', '1.0.0', ['tenant'])], ['docs/artifacts/billing/requirements/invoice.md', '# Invoice\n'],
    ['docs/artifacts/billing/versions/1.0.0/README.md', versionRecord('change-initial')], ['docs/artifacts/billing/changes/change-initial/README.md', '# Initial billing'], ['docs/artifacts/billing/changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan'],
  ]));
  git(f.root, 'checkout', '-q', '-b', 'change-rules');
  const put = async (p, t) => {await mkdir(join(f.root, p, '..'), {recursive: true});await writeFile(join(f.root, p), t);};
  await put(base + 'specifications/identity.md', '---\nself_check:\n  result: passed\n  source: docs/artifacts/tenant/specifications/identity.md#check\n---\n# Identity\n\nProposed identity rules.\n\n## Check\n\nChecked.\n');
  await put(change + 'README.md', '# Propose identity rules\n\nPropose identity rules.\n');
  await put(change + 'tasks/README.md', '---\ntasks: [01-rules.md, 02-docs.md]\n---\n# Plan\n');
  await put(change + 'tasks/01-rules.md', '---\nid: rules\ndepends_on: []\n---\n# Write the rules\n\n## Definition of Done\n\n- [x] Rules written.\n- [ ] Rules reviewed.\n');
  await put(change + 'tasks/02-docs.md', '---\nid: docs\ndepends_on: [rules]\n---\n# Document the rules\n\n## Definition of Done\n\n- [ ] Documented.\n');
  await put('docs/artifacts/units-of-work/member-identity/README.md', '---\nunit_of_work: member-identity\nchanges:\n  - artifact: tenant\n    change: change-rules\nacceptance:\n  - id: rules\n    criterion: Identity rules are proposed.\nevidence: []\n---\n# Member identity outcome\n\n## Purpose\n\nMembers have one identity.\n');
  git(f.root, 'add', '-A');git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Start change-rules');
  return f;
}
const PAGES = [
  ['Work page', page => openWork(page)],
  ['Artifact page', page => openArtifact(page, 'Tenant')],
  ['Document page', page => openDocument(page, 'Tenant', 'Specifications', 'Identity')],
  ['Change page', page => openChange(page, 'Propose identity rules')],
  ['Unit page', page => openUnit(page, 'Propose identity rules', 'Member identity outcome')],
  ['Flow page', page => openFlow(page, 'Tenant', 'Member login')],
  ['Discover behavior', async page => {await page.getByRole('button', {name: 'More', exact: true}).click();await page.getByRole('menuitem', {name: /^Discover behavior/}).click();await expect(region(page, 'Discover behavior')).toBeVisible();}],
  ['Impact page', async page => {
    await page.getByRole('button', {name: 'More', exact: true}).click();await page.getByRole('menuitem', {name: /^Impact/}).click();
    const form = region(page, 'Impact page').getByRole('form', {name: 'Ask what a change affects'});
    await form.getByLabel('File or document path', {exact: true}).fill(base + 'specifications/identity.md');
    await form.getByRole('button', {name: 'Show impact', exact: true}).click();
    await expect(region(page, 'Impact page').getByRole('group', {name: 'Show tiers'})).toBeVisible({timeout: 30000});
  }],
];

test('every page has one title, one navigation outside main, unique control names and no mode control', async ({page}) => {
  const f = await fixture(), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    for (const [name, open] of PAGES) {
      await open(page);await expect(region(page, name)).toBeVisible();
      // Let scoped reads settle so that late controls are counted too.
      await expect(page.getByRole('button', {name: 'Refresh', exact: true})).toHaveAttribute('aria-busy', 'false');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main [role="status"]').filter({hasText: /^(Reading|Loading)/})).toHaveCount(0, {timeout: 20000});
      const facts = await layoutFacts(page);
      expect(facts.titles, name).toHaveLength(1);
      expect(facts.navigations.filter(n => !n.insideMain).map(n => n.name), name).toEqual(['Navigation']);
      expect(facts.navigations.filter(n => n.insideMain), name).toEqual([]);
      expect(facts.treesInMain, name).toBe(0);
      expect(facts.modeControls, name).toEqual([]);
      expect(facts.duplicates, name).toEqual([]);
      expect(facts.controls, name).toBeGreaterThan(0);
    }
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('no page overflows horizontally at 390, 700, 851 and 1440 pixels', async ({page}) => {
  const f = await fixture();
  try {
    await openRepository(page, f.root);
    for (const width of [1440, 851, 700, 390]) {
      await page.setViewportSize({width, height: 900});
      for (const [name, open] of PAGES) {
        await open(page);await expect(region(page, name)).toBeVisible();
        expect(await noOverflow(page), `${name} at ${width}`).toBe(true);
      }
    }
  } finally {await f.cleanup();}
});

// Screenshots of every page for the owner's comparison with the approved mockups.
test('screenshots of every page at 1440 and 390 pixels', async ({page}) => {
  test.setTimeout(120000);
  const f = await fixture();
  try {
    await openRepository(page, f.root);
    for (const width of [1440, 390]) {
      await page.setViewportSize({width, height: width < 500 ? 844 : 900});
      for (const [name, open] of PAGES) {
        await open(page);await expect(region(page, name)).toBeVisible();
        await expect(page.locator('main [role="status"]').filter({hasText: /^(Reading|Loading)/})).toHaveCount(0, {timeout: 20000});
        const file = name.toLowerCase().replace(/ page$/, '').replace(/\s+/g, '-');
        // The page area scrolls inside the window; capture its full height.
        const height = await page.evaluate(() => Math.max(innerHeight, document.querySelector('main').scrollHeight + 60));
        await page.setViewportSize({width, height: Math.min(height, 4000)});
        await page.screenshot({path: `test-results/pages/${file}-${width}.png`});
        await page.setViewportSize({width, height: width < 500 ? 844 : 900});
      }
    }
  } finally {await f.cleanup();}
});
