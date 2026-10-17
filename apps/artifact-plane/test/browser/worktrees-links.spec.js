import {test, expect} from '@playwright/test';
import {writeFile, rm} from 'node:fs/promises';
import {fixtureRepository, orderingFixture, fingerprint, git, rootReadme} from '../fixtures.js';
import {openRepository, openArtifact, tree, region, documentPage} from './workbench.js';
// Worktree switching from the branch menu replaces the whole context and
// ignores obsolete or failed replies; knowledge links open exact sources and
// refuse forged or unsafe destinations.
const branchButton = page => page.getByRole('button', {name: /^Branch /});
async function chooseWorktree(page, branch) {
  await branchButton(page).click();
  await page.getByRole('menuitemradio', {name: new RegExp(`^${branch.replace('/', '\\/')}`)}).click();
}

test('one worktree selection replaces the complete context and ignores obsolete replies', async ({page}) => {
  const fixture = await fixtureRepository(orderingFixture()), other = fixture.root + '-other';
  git(fixture.root, 'worktree', 'add', '-qb', 'feature/other', other);
  await writeFile(`${other}/docs/artifacts/knowledge/README.md`, rootReadme('Other worktree knowledge', '1.0.0'));
  const before = await Promise.all([fingerprint(fixture.root), fingerprint(other)]), requests = [];
  try {
    await page.route('**/api/repository/query', async route => {
      const body = route.request().postDataJSON();requests.push(body);
      if (body.section === 'overview' && body.worktree === other) await new Promise(r => setTimeout(r, 250));
      await route.continue().catch(() => {});
    });
    await openRepository(page, fixture.root);
    await expect(tree(page)).toContainText('Knowledge');
    await chooseWorktree(page, 'feature/other');
    await expect(tree(page)).toContainText('Other worktree knowledge');
    await expect(branchButton(page)).toHaveAccessibleName(/^Branch feature\/other/);
    await expect(page.getByRole('tab', {selected: true})).toHaveAttribute('title', fixture.root);
    const artifact = await openArtifact(page, 'Other worktree knowledge');
    await expect(artifact.getByRole('heading', {level: 1})).toHaveText('Other worktree knowledge');
    await page.getByRole('button', {name: 'Refresh', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Refresh', exact: true})).toHaveAttribute('aria-busy', 'false');
    await expect(tree(page)).toContainText('Other worktree knowledge');
    expect(requests.some(r => r.path === fixture.root && r.worktree === other && r.section === 'markdown')).toBe(true);
    await chooseWorktree(page, 'main');
    await expect(tree(page)).not.toContainText('Other worktree knowledge');
    await expect(region(page, 'Work page')).toBeVisible();
    expect(await Promise.all([fingerprint(fixture.root), fingerprint(other)])).toEqual(before);
  } finally {await rm(other, {recursive: true, force: true});await fixture.cleanup();}
});

test('failed and superseded worktree switches keep the committed source', async ({page}) => {
  const fixture = await fixtureRepository(orderingFixture()), other = fixture.root + '-delayed';
  git(fixture.root, 'worktree', 'add', '-qb', 'feature/delayed', other);
  let fail = true;
  try {
    await page.route('**/api/repository/query', async route => {
      const body = route.request().postDataJSON();
      if (body.section === 'overview' && body.worktree === other) {
        await new Promise(r => setTimeout(r, 250));
        if (fail) {await route.fulfill({status: 422, contentType: 'application/json', body: JSON.stringify({error: 'Target unavailable'})}).catch(() => {});return;}
      }
      await route.continue().catch(() => {});
    });
    await openRepository(page, fixture.root);
    await expect(branchButton(page)).toHaveAccessibleName(/^Branch main/);
    await chooseWorktree(page, 'feature/delayed');
    await expect(page.getByRole('alert')).toContainText('Target unavailable');
    await expect(branchButton(page)).toHaveAccessibleName(/^Branch main/);
    fail = false;
    // A second choice supersedes the first before its reply arrives.
    await chooseWorktree(page, 'feature/delayed');
    await chooseWorktree(page, 'main');
    await expect(page.getByRole('button', {name: 'Refresh', exact: true})).toHaveAttribute('aria-busy', 'false');
    await page.waitForTimeout(500);
    await expect(branchButton(page)).toHaveAccessibleName(/^Branch main/);
  } finally {await rm(other, {recursive: true, force: true});await fixture.cleanup();}
});

test('knowledge links open exact sources, refuse forged and unsafe ones, and the eyebrow returns', async ({page}) => {
  const files = orderingFixture();
  files.set('docs/artifacts/knowledge/README.md', rootReadme('Knowledge', '1.0.0') + '\n[Read requirement](versions/1.0.0/requirements/need.md)\n\n[External](https://example.invalid)');
  files.set('docs/artifacts/knowledge/versions/1.0.0/requirements/need.md', '# Exact requirement\n\n<span data-knowledge-index="0">Forged callback</span><script>window.pwned=true</script>\n\n[Unsafe](../../../../../../etc/passwd)');
  const fixture = await fixtureRepository(files), before = await fingerprint(fixture.root), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, fixture.root);
    const artifact = await openArtifact(page, 'Knowledge');
    await artifact.getByRole('button', {name: 'Read the overview', exact: true}).click();
    const reader = documentPage(page);
    await reader.getByRole('button', {name: 'Read requirement', exact: true}).click();
    await expect(reader.getByRole('heading', {level: 1})).toHaveText('Exact requirement');
    await expect(reader.getByRole('button', {name: 'Forged callback', exact: true})).toHaveCount(0);
    expect(await page.evaluate(() => window.pwned)).toBeUndefined();
    await expect(reader.locator('.unavailable-link')).toContainText(['Unsafe']);
    // The eyebrow names the parent page and returns to it.
    await reader.getByRole('button', {name: 'Knowledge', exact: true}).click();
    await expect(region(page, 'Artifact page')).toBeVisible();
    expect(errors).toEqual([]);
    expect(await fingerprint(fixture.root)).toEqual(before);
  } finally {await fixture.cleanup();}
});
