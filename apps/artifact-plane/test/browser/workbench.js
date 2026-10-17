// Shared navigation for browser tests of the workbench shell.
import {expect} from '@playwright/test';

export async function openRepository(page, root) {
  await page.goto('/');
  await page.getByLabel('Repository path').fill(root);
  await page.getByRole('button', {name: 'Open repository', exact: true}).click();
  await expect(page.getByRole('region', {name: 'Work page'})).toBeVisible();
}
export const tree = page => page.getByRole('tree', {name: 'Knowledge'});
export const treeItem = (page, name) => tree(page).getByRole('treeitem', {name});
// Narrow layouts keep the tree in a drawer opened from the source bar.
export async function showTree(page) {
  const toggle = page.getByRole('button', {name: 'Navigation', exact: true});
  if (await toggle.isVisible() && (await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await expect(tree(page)).toBeVisible();
}
export async function openArtifact(page, title) {
  await showTree(page);
  await treeItem(page, new RegExp('^' + title)).first().click();
  await expect(page.getByRole('region', {name: 'Artifact page'})).toBeVisible();
  return page.getByRole('region', {name: 'Artifact page'});
}
export async function openGraph(page) {
  await showTree(page);
  await treeItem(page, /^Dependency graph/).click();
  await expect(page.getByRole('region', {name: 'Graph page'})).toBeVisible();
  return page.getByRole('region', {name: 'Graph page'});
}
export async function openFlows(page) {
  await showTree(page);
  await treeItem(page, /^System flows/).click();
  await expect(page.getByRole('region', {name: 'Flow page'})).toBeVisible();
  return page.getByRole('region', {name: 'Flow page'});
}
export const details = page => page.getByRole('complementary', {name: 'Selection details'});
export async function selectOnGraph(page, title) {
  const graph = await openGraph(page);
  await graph.locator('.canvas-surface .react-flow__node-artifact').filter({hasText: title}).first().click();
  await expect(details(page)).toBeVisible();
  return details(page);
}
export async function openChange(page, name, tab) {
  await showTree(page);
  const row = treeItem(page, new RegExp(`/ ${name}\\b`)).first();
  await expect(tree(page)).toContainText(name);
  if (await row.count()) await row.click();
  else await treeItem(page, new RegExp(`^${name}\\b`)).first().click();
  const change = page.getByRole('region', {name: 'Change page'});
  await expect(change).toBeVisible();
  if (tab) await change.getByRole('group', {name: 'Change sections'}).getByRole('button', {name: tab, exact: true}).click();
  return change;
}
export async function openUnit(page, title) {
  await showTree(page);
  await tree(page).getByRole('treeitem', {name: new RegExp('^' + title)}).last().click();
  await expect(page.getByRole('region', {name: 'Unit page'})).toBeVisible();
  return page.getByRole('region', {name: 'Unit page'});
}
export const documentPage = page => page.getByRole('region', {name: 'Document page'});
export const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
export async function refresh(page) {
  await page.getByRole('button', {name: 'Refresh', exact: true}).click();
  await expect(page.getByRole('status', {name: 'Repository update status'})).not.toHaveText('Updating');
}
