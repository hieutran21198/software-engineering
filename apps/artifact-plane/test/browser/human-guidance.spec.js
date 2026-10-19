import {test, expect} from '@playwright/test';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {identity, versionRecord} from '../fixtures.js';
import {GLOSSARY} from '../../src/glossary.js';
import {openRepository, openWork, openArtifact, openChange, openDocument, openFlow, openUnit, region, refresh, setHistory, showSidebar, tree, treeItem} from './workbench.js';
import {editingRepository, editingFiles, billing, tenant, git} from './editing-fixtures.js';
// Human guidance (requirements/human-guidance.md, HGA1 to HGA7): change
// statuses with their next step, version labels, the stepper, named counts,
// glossary terms, the visual grammar of controls and the status vocabulary.
const next = billing + 'changes/change-next/', rules = tenant + 'changes/change-rules/', unitBrief = 'docs/artifacts/units-of-work/invoice-rules/README.md';
const flowPath = tenant + 'specifications/flows/member-login.md';
const work = page => region(page, 'Work page'), changePage = page => region(page, 'Change page');
const put = async (root, path, text) => {await mkdir(join(root, path, '..'), {recursive: true});await writeFile(join(root, path), text);};
const commit = (root, message) => {git(root, 'add', '-A');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
const selfCheck = path => `self_check:\n  result: passed\n  source: ${path}#self-check\n`;
const task = (checked, claims = '') => `---\nid: work\ndepends_on: []\nevidence_records:\n  - {id: tests, method: npm test, result: passed, source: "${next}tasks/01-work.md#index"}\n${claims}---\n# Work\n\n## Scope and ownership\n\nOwn src/invoices.js.\n\n## Definition of Done\n\n- [x] Built.\n- [${checked ? 'x' : ' '}] Documented.\n\n## Evidence\n\n### index\n\nWith the index the query took 40 ms.\n`;
// Claims of every kind and status that the brief shows as family components.
const claims = `claims:
  - id: tenant-scope
    kind: decision
    statement: Scope invoices by tenant.
    status: open
    basis: inferred
    check: Create an invoice in two tenants and list each.
  - id: slow-totals
    kind: hypothesis
    statement: Totals are slow because of rounding.
    status: refuted
    basis: observed
    evidence: [${next}tasks/01-work.md#index]
  - id: missing-index
    kind: root_cause
    statement: Totals are slow because the tenant index is missing.
    status: supported
    basis: observed
    evidence: [${next}tasks/01-work.md#index]
  - id: currency
    kind: assumption
    statement: All invoices use one currency.
    status: verified
    basis: observed
    evidence: [${next}tasks/01-work.md#index]
    check: Count the currencies in the fixture.
    verified_by: agent
  - id: old-scope
    kind: risk
    statement: Invoices leak across tenants.
    status: superseded
    basis: inferred
    superseded_by: tenant-scope
`;
// A flow with documented, static and observed supports and one support whose file does not exist.
const loginFlow = '---\nflow:\n  id: member-login\n  artifact: tenant\n  title: Member login\n  trigger: A member signs in.\n  outcome: A session exists.\n  entry_steps: [check]\n  steps:\n    - id: check\n      title: Check member\n      supports: [need, code, check-test, gone, invoices]\n    - id: audit\n      title: Record the attempt\n      supports: []\n  transitions:\n    - {from: check, to: audit}\n  support:\n    - {id: need, kind: element, artifact: tenant, element: requirements/need.md, requires: The need, basis: documented}\n    - {id: code, kind: implementation, path: src/login.js, requires: Login code, basis: static}\n    - {id: check-test, kind: test, path: test/login.test.js, requires: Login test, basis: observed, evidence: [test/login.test.js]}\n    - {id: gone, kind: implementation, path: src/gone.js, requires: Removed code, basis: static}\n    - {id: invoices, kind: implementation, path: src/invoices.js, requires: Invoice code, basis: static}\n  gaps: [No runtime trace]\n---\n# Member login\n';

// Billing change-next has every self-check; its task has DoD items checked or
// not; with version, the branch prepares Billing 1.1.0. Tenant change-rules is
// in its Requirement phase. main holds Billing and Tenant 1.0.0, delivered by change-initial.
async function guidanceRepository({checked = true, version = false} = {}) {
  const files = editingFiles();
  files.set(flowPath, loginFlow);
  files.set('src/login.js', 'export const login = true;\n');files.set('src/invoices.js', 'export const invoices = [];\n');
  files.set('src/report.js', "import {invoices} from './invoices.js';\nexport const report = () => invoices.length;\n");files.set('test/login.test.js', 'test("login", () => {});\n');
  files.set(rules + 'README.md', '# Tenant rules\n\n## Reason and scope\n\nTenants need rules.\n');
  files.set(rules + 'tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  const f = await editingRepository(files, 'change-next');
  const requirement = billing + 'requirements/invoice.md', specification = billing + 'specifications/invoice-rules.md', plan = next + 'tasks/README.md';
  await put(f.root, next + 'README.md', '# Invoice rules\n\n## Reason and scope\n\nInvoices need tenant rules.\n');
  await put(f.root, requirement, `---\n${selfCheck(requirement)}---\n# Invoice\n\nInvoices name a tenant.\n\n## Self-check\n\nThe requirement is complete.\n`);
  await put(f.root, specification, `---\n${selfCheck(specification)}---\n# Invoice tenancy\n\nThe invoice names its tenant.\n\n## Self-check\n\nThe specification is complete.\n`);
  await put(f.root, plan, `---\ntasks: [01-work.md]\ncompatibility: minor\n${selfCheck(plan)}---\n# Plan\n\n## Self-check\n\nEvery task has a Definition of Done.\n`);
  await put(f.root, next + 'tasks/01-work.md', task(checked, claims));
  await put(f.root, 'src/invoices.js', 'export const invoices = [];\nexport const total = 0;\n');
  await put(f.root, unitBrief, '---\nunit_of_work: invoice-rules\nchanges:\n  - artifact: billing\n    change: change-next\nacceptance:\n  - id: rules\n    criterion: Invoices name a tenant.\n    integration: true\nevidence: []\n---\n# Invoice rules outcome\n');
  if (version) {
    await put(f.root, billing + 'README.md', identity('Billing', '1.1.0', ['tenant']));
    await put(f.root, billing + 'versions/1.1.0/README.md', versionRecord('change-next'));
  }
  commit(f.root, 'Billing change-next');
  return f;
}
// HGA5 for the status terms of this test: Enter opens the explanation, Escape closes it and focus returns.
async function explains(page, scope, term) {
  const button = scope.getByRole('button', {name: term, exact: true});
  await button.press('Enter');
  await expect(page.getByRole('dialog', {name: term})).toContainText(GLOSSARY.find(e => e.term === term).definition);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(button).toBeFocused();
}
const card = (page, title) => work(page).getByRole('article', {name: title, exact: true});
const statusCard = page => changePage(page).getByRole('region', {name: 'Status', exact: true});
const visiblePrimaries = scope => scope.locator('button.primary:visible');

test('HGA1: in progress and ready for version on the work page and the change page; a delivered change only in History', async ({page}) => {
  const f = await guidanceRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    await expect(work(page).locator('.subtitle')).toContainText('2 changes in progress');
    // In progress: the phase is the status text and the phase hint is the next step.
    const progress = card(page, 'Tenant rules');
    await expect(progress.locator('.status-badge').first()).toHaveText('Requirement');
    await expect(progress).toContainText('Next: write the requirement and record its self-check.');
    await expect(progress.getByRole('button', {name: 'Continue Tenant rules', exact: true})).toBeVisible();
    // Ready for version: Prepare the version record.
    const ready = card(page, 'Invoice rules');
    await expect(ready.locator('.status-badge').first()).toHaveText('Ready for version');
    await expect(ready).toContainText('Next: prepare the version record.');
    await expect(ready.getByRole('button', {name: 'Prepare version of Invoice rules', exact: true})).toBeVisible();
    await expect(visiblePrimaries(work(page))).toHaveCount(1);
    // The same statuses on the change pages.
    await openChange(page, 'Tenant rules');
    await expect(statusCard(page).locator('.status-badge').first()).toHaveText('Requirement');
    await expect(statusCard(page)).toContainText('Write the requirement and record its self-check.');
    await openChange(page, 'Invoice rules');
    await expect(statusCard(page).locator('.status-badge').first()).toHaveText('Ready for version');
    await expect(statusCard(page)).toContainText('Prepare the version record.');
    await expect(statusCard(page).getByRole('button', {name: 'Prepare version', exact: true})).toHaveClass(/primary/);
    expect(await visiblePrimaries(changePage(page)).count()).toBeLessThanOrEqual(1);
    // Delivered: History only, with no next step and no primary button.
    await openWork(page);
    await expect(card(page, 'Initial')).toHaveCount(0);
    await setHistory(page, true);
    await treeItem(page, /^Initial Billing/).click();
    await expect(statusCard(page).locator('.status-badge').first()).toHaveText('Delivered 1.0.0');
    await expect(statusCard(page).locator('.status-card-next')).toHaveCount(0);
    await expect(statusCard(page).locator('button.primary')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('HGA1/HGA2/HGA3: a prepared version with an unchecked item stays in Current work, shows its labels and Implementation not done', async ({page}) => {
  const f = await guidanceRepository({checked: false, version: true}), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    // HGA1: Unchecked items on the work page, with the version label, under Current work.
    const prepared = card(page, 'Invoice rules');
    await expect(prepared.locator('.status-badge').first()).toHaveText('Unchecked items');
    await expect(prepared).toContainText('Next: check or explain 1 unchecked DoD item before team review.');
    await expect(prepared.getByRole('button', {name: 'Open plan of Invoice rules', exact: true})).toBeVisible();
    await expect(prepared.getByText('1.1.0 prepared on this branch', {exact: true})).toBeVisible();
    await expect(visiblePrimaries(work(page))).toHaveCount(1);
    await setHistory(page, false);
    await expect(treeItem(page, /^Invoice rules Billing/)).toHaveAccessibleName('Invoice rules Billing · Unchecked items');
    // HGA1 and HGA3 on the change page.
    const change = await openChange(page, 'Invoice rules');
    await expect(statusCard(page).locator('.status-badge').first()).toHaveText('Unchecked items');
    await expect(statusCard(page)).toContainText('Check or explain 1 unchecked DoD item before team review.');
    await expect(statusCard(page).getByRole('button', {name: 'Open plan', exact: true})).toHaveClass(/primary/);
    const steps = change.getByRole('list', {name: 'Phases'}).getByRole('listitem');
    await expect(steps.nth(3)).toHaveText(/Implementation \(unchecked items\)$/);
    await expect(steps.nth(3)).not.toHaveText(/\(done\)$/);
    await expect(steps.nth(4)).toHaveText(/Version \(prepared\)$/);
    // HGA2 on the change page: the prepared label of this change, in the status card and Delivery.
    await expect(statusCard(page).getByText('1.1.0 prepared on this branch', {exact: true})).toBeVisible();
    await expect(change.getByRole('region', {name: 'Delivery'}).getByText('1.1.0 prepared on this branch', {exact: true})).toBeVisible();
    // HGA2 on the artifact page: established and prepared, each with a link to its change.
    const artifact = await openArtifact(page, 'Billing');
    const header = artifact.locator('.page-header');
    await expect(header.getByText('Version 1.0.0 established', {exact: true})).toBeVisible();
    await expect(header.getByText('1.1.0 prepared by', {exact: true})).toBeVisible();
    await header.getByRole('button', {name: 'Invoice rules', exact: true}).click();
    await expect(changePage(page).getByRole('heading', {name: 'Invoice rules', level: 1})).toBeVisible();
    await openArtifact(page, 'Billing');
    const versions = region(page, 'Artifact page').getByRole('region', {name: 'Versions'});
    await expect(versions).toContainText('Latest: 1.0.0 from Initial.');
    await versions.getByRole('button', {name: 'Initial', exact: true}).click();
    await expect(statusCard(page).locator('.status-badge').first()).toHaveText('Delivered 1.0.0');
    await expect(changePage(page).getByRole('region', {name: 'Delivery'}).getByText('1.0.0 established', {exact: true})).toBeVisible();
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('HGA1: ready for team review without an upstream, waiting for merge when the upstream equals HEAD, and back after a new commit', async ({page}) => {
  const f = await guidanceRepository({version: true}), remote = await mkdtemp(join(tmpdir(), 'plane-remote-')), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const prepared = card(page, 'Invoice rules');
    await expect(prepared.locator('.status-badge').first()).toHaveText('Ready for team review');
    await expect(prepared).toContainText('Next: push branch change-next and open a pull request with the PR description. The Plane never pushes.');
    await expect(prepared.getByRole('button', {name: 'Copy PR description of Invoice rules', exact: true})).toHaveClass(/primary/);
    await openChange(page, 'Invoice rules');
    await expect(statusCard(page).locator('.status-badge').first()).toHaveText('Ready for team review');
    await expect(statusCard(page)).toContainText('Push branch change-next and open a pull request with the PR description.');
    await expect(statusCard(page).getByRole('button', {name: 'Copy PR description', exact: true})).toHaveClass(/primary/);
    await explains(page, statusCard(page), 'Ready for team review');
    // A bare remote with the pushed branch: the upstream equals HEAD.
    git(remote, 'init', '-q', '--bare');git(f.root, 'remote', 'add', 'origin', remote);git(f.root, 'push', '-q', '-u', 'origin', 'change-next');
    await refresh(page);
    await expect(statusCard(page).locator('.status-badge').first()).toHaveText('Waiting for merge');
    await expect(statusCard(page)).toContainText('Team review and the merge of change-next establish version 1.1.0.');
    await expect(statusCard(page).locator('button.primary')).toHaveCount(0);
    await explains(page, statusCard(page), 'Waiting for merge');
    await openWork(page);
    await expect(prepared.locator('.status-badge').first()).toHaveText('Waiting for merge');
    await expect(prepared).toContainText('Next: team review and the merge of change-next establish version 1.1.0.');
    await expect(prepared.locator('button.primary')).toHaveCount(0);
    await expect(prepared.getByRole('button', {name: 'Open Invoice rules', exact: true})).toBeVisible();
    // The claim upstream-from-local-refs: one more local commit returns the status to Ready for team review.
    await put(f.root, 'src/invoices.js', 'export const invoices = [1];\n');commit(f.root, 'One more commit');
    await refresh(page);
    await expect(prepared.locator('.status-badge').first()).toHaveText('Ready for team review');
    expect(errors).toEqual([]);
  } finally {await f.cleanup();await rm(remote, {recursive: true, force: true});}
});

test('HGA4: the change brief and the PR description name what they count', async ({page}) => {
  const f = await guidanceRepository({version: true}), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const change = await openChange(page, 'Invoice rules');
    const brief = change.getByRole('region', {name: 'Change brief', exact: true});
    const changed = brief.locator('.brief-rows summary').filter({hasText: 'What changed?'}).locator('.brief-answer');
    await expect(changed).toHaveText(/^\d+ requirement, specification or decision documents?, \d+ other knowledge files? and \d+ code and test files?/);
    const description = change.getByRole('region', {name: 'PR description', exact: true});
    const criteria = description.getByRole('list', {name: 'Tier criteria'});
    await expect(criteria).toContainText(/\d+ changed knowledge files? under docs\/artifacts/);
    await expect(criteria).toContainText(/\d+ changed code and test lines?/);
    await description.getByText(/^Markdown, [\d,]+ characters$/).click();
    await expect(description.getByLabel('PR description text')).toContainText(/changed knowledge files? under docs\/artifacts/);
    await expect(description.getByLabel('PR description text')).toContainText(/changed code and test lines?/);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

// The six main pages of the fixture with an open change and a prepared change.
const PAGES = [
  ['work', page => openWork(page)],
  ['artifact', page => openArtifact(page, 'Billing')],
  ['document', page => openDocument(page, 'Billing', 'Specifications', 'Invoice tenancy')],
  ['change', page => openChange(page, 'Invoice rules')],
  ['unit', page => openUnit(page, 'Invoice rules', 'Invoice rules outcome')],
  // Two artifacts have Flows rows; the flow opens from the Tenant artifact page with its first step expanded.
  ['flow', async page => {
    await (await openArtifact(page, 'Tenant')).getByText('Member login', {exact: true}).click();
    const flow = region(page, 'Flow page'), head = flow.locator('.flow-steps > li .step-head').first();
    await head.click();await expect(head).toHaveAttribute('aria-expanded', 'true');
    return flow;
  }],
];
// A page is ready when nothing reads any more and its controls stay the same for 300 ms.
async function settle(page) {
  const main = page.getByRole('main');
  await expect(main.getByText(/^(Reading|Checking|Writing)\b.*…$/)).toHaveCount(0, {timeout: 15000});
  let last = '';
  await expect.poll(async () => {const now = JSON.stringify(await main.locator('button, a[href], .status-badge').allTextContents());const same = now === last;last = now;return same;}, {intervals: [300]}).toBe(true);
}
const DEFINITIONS = new Map(GLOSSARY.map(e => [e.term, e.definition]));

test('HGA5: every glossary term on the six pages opens its explanation with Enter, Space and a pointer, once per page', async ({page}) => {
  test.setTimeout(120000);
  const f = await guidanceRepository({checked: false, version: true}), errors = [], seen = new Set();page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    for (const [name, open] of PAGES) {
      const region = await open(page);
      // The change page reads its brief and PR description after the page opens.
      if (name === 'change') await expect(region.getByRole('list', {name: 'Tier criteria'})).toBeVisible();
      await settle(page);
      const terms = page.getByRole('main').locator('button.term');
      const names = await terms.allTextContents();
      expect(new Set(names).size, `${name}: one button for each term name`).toBe(names.length);
      for (let i = 0; i < names.length; i++) {
        const term = terms.nth(i);
        // A term in a folded part of the page shows after the part opens.
        await term.evaluate(el => {for (let d = el.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;});
        await term.scrollIntoViewIfNeeded();
        // Pointer: a first click opens, a second click closes.
        await term.click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toHaveCount(1);
        const label = await dialog.getAttribute('aria-label');
        expect(DEFINITIONS.has(label), `${name}: ${label} is a glossary term`).toBe(true);
        await expect(dialog).toContainText(DEFINITIONS.get(label));
        await term.click();await expect(dialog).toHaveCount(0);await expect(term).toBeFocused();
        // Keyboard: Enter opens and Escape closes; Space opens and Escape closes; focus returns to the term.
        await term.press('Enter');await expect(page.getByRole('dialog', {name: label})).toBeVisible();
        await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(term).toBeFocused();
        await term.press(' ');await expect(page.getByRole('dialog', {name: label})).toBeVisible();
        await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(term).toBeFocused();
        seen.add(label);
      }
    }
    // The fixture pages show the status, basis, version and claim terms.
    for (const term of ['established', 'prepared', 'Unchecked items', 'documented', 'static', 'observed', 'unresolved', 'open claim', 'verified by an agent', 'not independent', 'Fact from Git', 'tier'])
      expect([...seen], `${term} is shown`).toContain(term);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

// Computed styles of the control kinds in the main area of the page.
async function controlStyles(page) {
  return page.getByRole('main').evaluate(main => {
    const visible = el => {const r = el.getBoundingClientRect(), s = getComputedStyle(el);return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';};
    const text = el => (el.innerText || '').replace(/\s+/g, ' ').trim();
    const name = el => el.getAttribute('aria-label') || text(el);
    // A disabled control has the muted look of every disabled control.
    const all = selector => [...main.querySelectorAll(selector)].filter(el => visible(el) && !el.disabled);
    const style = el => {const s = getComputedStyle(el);return {name: name(el), text: text(el), color: s.color, background: s.backgroundColor, line: s.textDecorationLine, thickness: s.textDecorationThickness, decoration: s.textDecorationColor, icon: getComputedStyle(el, '::before').content};};
    return {
      links: all('a[href]:not(.chip):not(.btn), button.link').filter(el => !el.closest('.doc-list')).map(style),
      quiet: all('button.quiet').map(style),
      primary: all('button.primary').map(style),
      danger: all('button.danger').map(style),
    };
  });
}
const ACCENT = 'rgb(31, 91, 216)', DANGER = 'rgb(180, 35, 24)';

test('HGA6: links, quiet actions, primary and danger buttons on the six pages have the computed styles of their kind', async ({page}) => {
  test.setTimeout(120000);
  const f = await guidanceRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const counts = {};
    for (const [name, open] of PAGES) {
      const region = await open(page);
      if (name === 'change') await expect(region.getByRole('list', {name: 'Tier criteria'})).toBeVisible();
      await settle(page);
      const s = await controlStyles(page);
      counts[name] = {links: s.links.length, quiet: s.quiet.length, primary: s.primary.length, danger: s.danger.length};
      for (const l of s.links) {
        expect(l.line, `${name}: link ${l.name} is underlined`).toContain('underline');
        expect(l.thickness, `${name}: link ${l.name} has a 1-pixel underline`).toBe('1px');
        expect(l.color, `${name}: link ${l.name} has the accent color`).toBe(ACCENT);
        expect(l.decoration, `${name}: link ${l.name} has a lighter underline`).not.toBe(l.color);
      }
      for (const q of s.quiet) {
        expect(q.line, `${name}: quiet ${q.name} has no underline`).toBe('none');
        expect(q.color, `${name}: quiet ${q.name} has the accent color`).toBe(ACCENT);
        expect(q.background, `${name}: quiet ${q.name} has no fill`).toBe('rgba(0, 0, 0, 0)');
      }
      expect(s.primary.length, `${name}: at most one primary button`).toBeLessThanOrEqual(1);
      for (const p of s.primary) {expect(p.background, `${name}: primary ${p.name} is filled`).toBe(ACCENT);expect(p.color).toBe('rgb(255, 255, 255)');}
      for (const d of s.danger) {
        expect(d.color, `${name}: danger ${d.name} has the danger color`).toBe(DANGER);
        expect(d.text, `${name}: danger ${d.name} has a visible text label`).toMatch(/^(Remove|Delete|Discard|Confirm remove)\b/);
        expect(d.icon, `${name}: danger ${d.name} has the trash icon`).not.toBe('none');
      }
      // Hover gives a link its full underline.
      if (s.links.length) {
        const link = page.getByRole('main').locator('a[href]:not(.chip):not(.btn), button.link').filter({visible: true}).first();
        await link.hover();
        const color = await link.evaluate(el => [getComputedStyle(el).textDecorationColor, getComputedStyle(el).color]);
        expect(color[0], `${name}: a hovered link has a full underline`).toBe(color[1]);
      }
    }
    // Every page has links; the artifact page has the danger Remove of a dependency, the flow page the danger Remove of a support.
    for (const name of Object.keys(counts)) expect(counts[name].links, `${name} has links`).toBeGreaterThan(0);
    expect(counts.artifact.danger).toBeGreaterThan(0);expect(counts.flow.danger).toBeGreaterThan(0);
    // A destructive control asks for a confirmation: Remove of a dependency, and Escape keeps it.
    const artifact = await openArtifact(page, 'Billing');
    await artifact.getByRole('button', {name: 'Remove dependency on Tenant', exact: true}).click();
    const confirm = artifact.getByRole('group', {name: 'Remove dependency'});
    await expect(confirm.getByRole('button', {name: 'Confirm remove', exact: true})).toBeFocused();
    await page.keyboard.press('Escape');await expect(confirm).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('HGA7: every status badge on the six pages has an icon and a text', async ({page}) => {
  test.setTimeout(120000);
  const f = await guidanceRepository({checked: false, version: true}), errors = [], statuses = new Set(), kinds = new Set();page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    for (const [name, open] of PAGES) {
      const region = await open(page);
      if (name === 'change') await expect(region.getByRole('list', {name: 'Tier criteria'})).toBeVisible();
      if (name === 'change') await expect(region.getByRole('article', {name: 'Claim old-scope'})).toBeVisible();
      await settle(page);
      const badges = await page.getByRole('main').evaluate(main => [...main.querySelectorAll('.status-badge')].map(b => ({
        status: b.dataset.status, icon: Boolean(b.querySelector('svg.family-icon')), text: (b.innerText || '').trim(),
      })));
      if (name !== 'document') expect(badges.length, `${name} has status badges`).toBeGreaterThan(0);
      for (const b of badges) {
        expect(b.icon, `${name}: ${b.status} has an icon`).toBe(true);
        expect(b.text, `${name}: ${b.status} has a text`).not.toBe('');
        statuses.add(b.status);
      }
      for (const k of await page.getByRole('main').locator('.kind-tag').evaluateAll(tags => tags.map(t => t.dataset.kind))) kinds.add(k);
      // No badge of the old tones remains.
      await expect(page.getByRole('main').locator('.badge')).toHaveCount(0);
    }
    // The claim kinds and statuses of the amended contract render as family components.
    for (const status of ['open', 'supported', 'verified', 'refuted', 'superseded', 'prepared', 'established', 'Unchecked items', 'unresolved']) expect([...statuses]).toContain(status);
    for (const kind of ['Decision', 'Hypothesis', 'Root cause', 'Assumption', 'Risk', 'Integration']) expect([...kinds]).toContain(kind);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('HGA7: the Impact page shows its tiers as Kind tags and unresolved as a Status badge with an icon and a text', async ({page}) => {
  test.setTimeout(90000);
  const f = await guidanceRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    // Audit on main depends on Tenant without a reference, so a changed Tenant document leaves Audit unresolved.
    git(f.root, 'switch', '-q', 'main');
    await put(f.root, 'docs/artifacts/audit/README.md', identity('Audit', null, ['tenant']));await put(f.root, 'docs/artifacts/audit/requirements/trail.md', '# Trail\n\nKeep a trail.\n');commit(f.root, 'Audit');
    git(f.root, 'switch', '-q', 'change-next');git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'merge', '-q', '--no-edit', 'main');
    await put(f.root, tenant + 'specifications/identity.md', '# Identity\n\nChanged identity rules.\n');commit(f.root, 'Change identity rules');
    await openRepository(page, f.root);
    await openChange(page, 'Invoice rules');
    await changePage(page).getByRole('button', {name: 'What does this change affect?', exact: true}).click();
    const impact = region(page, 'Impact page');
    await expect(impact.getByRole('group', {name: 'Show tiers'})).toBeVisible({timeout: 30000});
    const titles = impact.locator('.impact-section > .section-title');
    await expect(titles.first()).toBeVisible();
    const tags = await titles.evaluateAll(list => list.map(t => ({section: t.closest('section').getAttribute('aria-label'), kind: [...t.querySelectorAll('.kind-tag')].map(k => k.dataset.kind), status: [...t.querySelectorAll('.status-badge')].map(b => b.dataset.status)})));
    for (const {section, kind, status} of tags) {
      if (section === 'Unresolved') expect(status, section).toEqual(['unresolved']);
      else if (section === 'Investigate') expect([...kind, ...status], section).toEqual([]);
      else if (['Direct', 'Transitive', 'Potential', 'Verify'].includes(section)) expect(kind, section).toEqual([section.toLowerCase()]);
    }
    expect(tags.map(t => t.section)).toContain('Direct');
    expect(tags.map(t => t.section)).toContain('Unresolved');
    await expect(impact.locator('.badge')).toHaveCount(0);
    for (const b of await impact.locator('.status-badge').all()) {await expect(b.locator('svg.family-icon')).toHaveCount(1);await expect(b).not.toHaveText('');}
    // The detail of a selected entity names its tier with the same family.
    await impact.getByRole('region', {name: 'Direct', exact: true}).locator('.impact-row').filter({hasText: 'Member login'}).click();
    const detail = impact.getByRole('complementary', {name: 'Selected entity'});
    await expect(detail.locator('.kind-tag')).toHaveAttribute('data-kind', 'direct');
    // The flow opens with its affected steps; an affected support carries the affected Status badge.
    await detail.getByRole('button', {name: 'Open flow with affected steps', exact: true}).click();
    const flow = region(page, 'Flow page'), head = flow.locator('.flow-steps > li.affected .step-head').first();
    await head.click();await expect(head).toHaveAttribute('aria-expanded', 'true');
    const affected = flow.locator('.status-badge[data-status="affected"]');
    await expect(affected).toHaveCount(1);await expect(affected).toHaveText('affected');await expect(affected.locator('svg.family-icon')).toHaveCount(1);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});
