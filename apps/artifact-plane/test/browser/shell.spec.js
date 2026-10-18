import {test, expect} from '@playwright/test';
import {mkdir, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository, fingerprint, git, identity, versionRecord} from '../fixtures.js';
import {openRepository, sidebar, tree, treeItem, showSidebar, setHistory, noOverflow, region} from './workbench.js';
// The shell: one top bar, one sidebar, one page. Sidebar rows show titles,
// phases and badges; history and actions stay out of the default sidebar.
const base = 'docs/artifacts/tenant/', change = base + 'changes/change-next/', unit = 'docs/artifacts/units-of-work/tenant-rules/README.md';
async function fixture() {
  return fixtureRepository(new Map([
    [base + 'README.md', identity('Tenant', '1.0.0')], [base + 'specifications/identity.md', '# Identity\n\nEstablished identity rules.\n'], [base + 'requirements/need.md', '# Need\n\nStable need.\n'],
    [base + 'versions/1.0.0/README.md', versionRecord('change-initial')], [base + 'changes/change-initial/README.md', '# Initial tenant'], [base + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan'],
    ['docs/artifacts/billing/README.md', identity('Billing', '1.0.0', ['tenant'])], ['docs/artifacts/billing/requirements/invoice.md', '# Invoice\n'],
    ['docs/artifacts/billing/versions/1.0.0/README.md', versionRecord('change-initial')], ['docs/artifacts/billing/changes/change-initial/README.md', '# Initial billing'], ['docs/artifacts/billing/changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan'],
  ]));
}
const put = async (root, p, t) => {await mkdir(join(root, p, '..'), {recursive: true});await writeFile(join(root, p), t);};
async function branchFixture() {
  const f = await fixture();git(f.root, 'checkout', '-q', '-b', 'change-next');
  await put(f.root, base + 'specifications/identity.md', '# Identity\n\nProposed identity rules.\n');
  await put(f.root, base + 'specifications/sessions.md', '# Sessions\n');
  await put(f.root, change + 'README.md', '# Next identity rules\n\nPropose identity rules.\n');
  await put(f.root, change + 'tasks/README.md', '---\ntasks: [01-rules.md]\n---\n# Plan\n');
  await put(f.root, change + 'tasks/01-rules.md', '---\nid: rules\ndepends_on: []\n---\n# Rules\n\n- [ ] Implement.\n');
  await put(f.root, unit, '---\nunit_of_work: tenant-rules\nchanges:\n  - artifact: tenant\n    change: change-next\nacceptance:\n  - id: rules\n    criterion: Identity rules are proposed.\nevidence: []\n---\n# Tenant rules\n');
  git(f.root, 'add', 'docs');git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Start change-next');
  await put(f.root, base + 'requirements/need.md', '# Need\n\nChanged need, not committed.\n');
  return f;
}

test('sidebar shows work and documents by title, searches, moves by keys and hides history until asked', async ({page}) => {
  const f = await branchFixture(), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    await expect(sidebar(page)).toBeVisible();
    const row = treeItem(page, /^Next identity rules/);
    await expect(row).toContainText('Tenant · Requirement');
    // Actions are not rows, and finished work is not listed by default.
    await expect(tree(page).getByRole('treeitem', {name: /Start a change|New unit|Dependency graph|System flows/})).toHaveCount(0);
    await expect(treeItem(page, /^Initial tenant/)).toHaveCount(0);
    await treeItem(page, /^Tenant/).click();await expect(region(page, 'Artifact page')).toBeVisible();
    await treeItem(page, /^Specifications/).click();
    await expect(treeItem(page, /^Identity/)).toContainText('Changed');await expect(treeItem(page, /^Sessions/)).toContainText('New');
    await treeItem(page, /^Requirements/).click();await expect(treeItem(page, /^Need/)).toContainText('Changed');
    // Search filters by title and opens the first match with Enter.
    const search = page.getByLabel('Search knowledge', {exact: true});
    await search.fill('sessions');await expect(treeItem(page, /^Sessions/)).toBeVisible();await expect(treeItem(page, /^Billing/)).toHaveCount(0);
    await search.press('Enter');await expect(region(page, 'Document page')).toBeVisible();await expect(region(page, 'Document page').getByRole('heading', {level: 1})).toHaveText('Sessions');
    await search.fill('absent');await expect(page.getByRole('status').filter({hasText: 'Nothing matches this title or ID.'})).toBeVisible();
    await page.getByRole('button', {name: 'Clear search', exact: true}).click();
    // Roving focus: one row in the tab order; arrows move, expand and collapse.
    const first = tree(page).getByRole('treeitem').first();await first.focus();
    await expect(tree(page).locator('[role=treeitem][tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press('ArrowDown');await expect(row).toBeFocused();
    await page.keyboard.press('ArrowDown');await expect(treeItem(page, /^Billing/)).toBeFocused();
    await page.keyboard.press('ArrowRight');await expect(treeItem(page, /^Billing/)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowLeft');await expect(treeItem(page, /^Billing/)).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('End');await expect(tree(page).getByRole('treeitem').last()).toBeFocused();
    await page.keyboard.press('Home');await expect(first).toBeFocused();
    await row.focus();await page.keyboard.press('Enter');await expect(region(page, 'Change page')).toBeVisible();await expect(row).toHaveAttribute('aria-selected', 'true');
    // History lists delivered changes and survives a reload with the project.
    await setHistory(page, true);
    await expect(treeItem(page, /^Initial tenant/)).toContainText('Tenant · 1.0.0');await expect(treeItem(page, /^Initial billing/)).toBeVisible();
    await page.reload();await expect(region(page, 'Work page')).toBeVisible();await expect(treeItem(page, /^Initial tenant/)).toBeVisible();
    await setHistory(page, false);await expect(treeItem(page, /^Initial tenant/)).toHaveCount(0);
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('top bar shows the branch, uncommitted files and More; the branch menu switches worktrees and creates a branch', async ({page}) => {
  const f = await fixture(), other = f.root + '-other';git(f.root, 'worktree', 'add', '-qb', 'feature/other', other);
  try {
    await openRepository(page, f.root);
    const branch = page.getByRole('button', {name: /^Branch main, read only/});
    await expect(branch).toContainText('Read only · main');
    await expect(page.getByRole('button', {name: /^Uncommitted knowledge/})).toHaveCount(0);
    await expect(page.getByText('Not up to date')).toHaveCount(0);
    await page.getByRole('button', {name: 'More', exact: true}).click();
    const more = page.getByRole('menu', {name: 'More'});
    await expect(more.getByRole('menuitem', {name: /^Discover behavior/})).toBeVisible();await expect(more.getByRole('menuitem', {name: 'Change repository'})).toBeVisible();
    await page.keyboard.press('Escape');await expect(more).toHaveCount(0);
    await branch.click();
    const menu = page.getByRole('menu', {name: /^Branch main/});
    await expect(menu.getByRole('menuitemradio', {name: /^main/})).toHaveAttribute('aria-checked', 'true');
    await menu.getByLabel('New branch name').fill('change/next-rules');await menu.getByRole('button', {name: 'Create branch', exact: true}).click();
    await expect(page.getByRole('button', {name: /^Branch change\/next-rules, knowledge can be edited/})).toBeVisible();
    await expect(page.getByRole('status').filter({hasText: 'Created and switched to branch change/next-rules.'})).toBeVisible();
    await page.getByRole('button', {name: /^Branch change\/next-rules/}).click();
    await page.getByRole('menuitemradio', {name: /^feature\/other/}).click();
    await expect(page.getByRole('button', {name: /^Branch feature\/other/})).toBeVisible();
    await expect(treeItem(page, /^Tenant/)).toBeVisible();
  } finally {await rm(other, {recursive: true, force: true});await f.cleanup();}
});

test('uncommitted count opens the work page; the sidebar resizes and becomes a drawer without overflow', async ({page}) => {
  const f = await branchFixture();
  try {
    await openRepository(page, f.root);
    await treeItem(page, /^Next identity rules/).click();await expect(region(page, 'Change page')).toBeVisible();
    await page.getByRole('button', {name: 'Uncommitted knowledge, 1 file', exact: true}).click();
    await expect(region(page, 'Work page')).toBeVisible();
    // The work page moves focus to its uncommitted section once that section loads.
    await expect(region(page, 'Work page').getByRole('heading', {name: /^Uncommitted knowledge/})).toBeFocused();
    const divider = page.getByRole('separator', {name: 'Resize navigation'});
    await expect(divider).toHaveAttribute('aria-valuenow', '264');
    await divider.focus();await page.keyboard.press('ArrowRight');await expect(divider).toHaveAttribute('aria-valuenow', '284');
    await page.keyboard.press('End');await expect(divider).toHaveAttribute('aria-valuenow', '400');
    const box = await divider.boundingBox();
    await page.mouse.move(box.x + 2, box.y + 200);await page.mouse.down();await page.mouse.move(250, box.y + 200);await page.mouse.up();
    await expect(divider).toHaveAttribute('aria-valuenow', '250');
    for (const width of [1440, 851, 700, 390]) {
      await page.setViewportSize({width, height: 900});
      const toggle = page.getByRole('button', {name: 'Navigation', exact: true});
      if (width <= 800) {
        await expect(toggle).toBeVisible();await expect(tree(page)).toBeHidden();
        await toggle.click();await expect(tree(page)).toBeVisible();await page.keyboard.press('Escape');await expect(tree(page)).toBeHidden();
        await showSidebar(page);await treeItem(page, /^Next identity rules/).click();await expect(tree(page)).toBeHidden();await expect(region(page, 'Change page')).toBeVisible();
      } else {await expect(toggle).toBeHidden();await expect(tree(page)).toBeVisible();}
      expect(await noOverflow(page)).toBe(true);
    }
  } finally {await f.cleanup();}
});

test('sidebar tree indents children, draws joined guide lines, spaces groups and weights artifact rows', async ({page}) => {
  const f = await branchFixture();
  try {
    await openRepository(page, f.root);
    await treeItem(page, /^Tenant/).click();await treeItem(page, /^Specifications/).click();
    await expect(treeItem(page, /^Identity/)).toBeVisible();
    const facts = await tree(page).evaluate(node => {
      const rows = [...node.querySelectorAll('[role=treeitem]')], find = title => rows.find(r => r.querySelector('.tree-title').textContent.startsWith(title));
      const x = r => r.querySelector('.twisty').getBoundingClientRect().left - r.getBoundingClientRect().left;
      const line = r => {const s = getComputedStyle(r, '::before');return {content: s.content, left: s.left, width: s.width, top: s.top, bottom: s.bottom, events: s.pointerEvents};};
      const artifacts = rows.filter(r => r.classList.contains('level-0') && r.hasAttribute('aria-expanded'));
      const tenant = find('Tenant'), kind = find('Specifications'), doc = find('Identity');
      return {
        offsets: [x(kind) - x(tenant), x(doc) - x(kind)], artifactLine: line(tenant).content, kindLine: line(kind), docLine: line(doc),
        firstMargin: getComputedStyle(artifacts[0]).marginTop, firstAfterHeading: artifacts[0].previousElementSibling.classList.contains('tree-heading'),
        secondMargin: getComputedStyle(artifacts[1]).marginTop, homeMargin: getComputedStyle(rows[0]).marginTop,
        weights: [getComputedStyle(artifacts[1]).fontWeight, getComputedStyle(kind).fontWeight, getComputedStyle(doc).fontWeight],
      };
    });
    expect(facts.offsets).toEqual([20, 20]);
    expect(facts.artifactLine).toBe('none');
    expect(facts.kindLine).toEqual({content: '""', left: '15px', width: '1px', top: '-1px', bottom: '-1px', events: 'none'});
    expect(facts.docLine).toMatchObject({left: '15px', width: '21px', top: '-1px', bottom: '-1px'});
    expect(facts.firstAfterHeading).toBe(true);
    expect([facts.homeMargin, facts.firstMargin, facts.secondMargin]).toEqual(['0px', '0px', '8px']);
    expect(facts.weights).toEqual(['500', '400', '400']);
  } finally {await f.cleanup();}
});
