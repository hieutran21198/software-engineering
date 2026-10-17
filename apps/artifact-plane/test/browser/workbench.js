// Shared navigation for browser tests of the workbench: top bar, sidebar and pages.
import {expect} from '@playwright/test';

export async function openRepository(page, root) {
  await page.goto('/');
  await page.getByLabel('Repository path').fill(root);
  await page.getByRole('button', {name: 'Open repository', exact: true}).click();
  await expect(page.getByRole('region', {name: 'Work page'})).toBeVisible();
}
export const main = page => page.getByRole('main');
export const sidebar = page => page.getByRole('navigation', {name: 'Navigation'});
export const tree = page => page.getByRole('tree', {name: 'Knowledge'});
export const treeItem = (page, name) => tree(page).getByRole('treeitem', {name});
export const region = (page, name) => page.getByRole('region', {name});
// Narrow layouts keep the sidebar in a drawer opened from the top bar.
export async function showSidebar(page) {
  const toggle = page.getByRole('button', {name: 'Navigation', exact: true});
  if (await toggle.isVisible() && (await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await expect(tree(page)).toBeVisible();
}
export const showTree = showSidebar;
const exact = text => new RegExp('^' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
async function openRow(page, title, regionName) {
  await showSidebar(page);
  await treeItem(page, exact(title)).first().click();
  await expect(region(page, regionName)).toBeVisible();
  return region(page, regionName);
}
export const openWork = page => openRow(page, 'Current work', 'Work page');
export const openArtifact = (page, title) => openRow(page, title, 'Artifact page');
export const openChange = (page, title) => openRow(page, title, 'Change page');
// A document opens from its kind in the sidebar: artifact, kind, then title.
export async function openDocument(page, artifact, kind, title) {
  await openArtifact(page, artifact);
  const kindRow = treeItem(page, exact(kind)).first();
  if ((await kindRow.getAttribute('aria-expanded')) !== 'true') await kindRow.click();
  return openRow(page, title, kind === 'Flows' ? 'Flow page' : 'Document page');
}
export const openFlow = (page, artifact, title) => openDocument(page, artifact, 'Flows', title);
// Units open from the eyebrow of a member change, or from History when finished.
export async function openUnit(page, changeTitle, unitTitle) {
  const change = await openChange(page, changeTitle);
  await change.getByRole('link', {name: unitTitle}).or(change.getByRole('button', {name: unitTitle})).first().click();
  await expect(region(page, 'Unit page')).toBeVisible();
  return region(page, 'Unit page');
}
export async function setHistory(page, on) {
  await showSidebar(page);
  const toggle = sidebar(page).getByRole('switch', {name: 'Show history'});
  if ((await toggle.getAttribute('aria-checked')) !== String(on)) await toggle.click();
}
export const documentPage = page => region(page, 'Document page');
export const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
export async function refresh(page) {
  await page.getByRole('button', {name: 'Refresh', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Refresh', exact: true})).toHaveAttribute('aria-busy', 'false');
}
// Layout rules of the contract: one title, one navigation, unique control names.
export async function layoutFacts(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    const visible = element => {const r = element.getBoundingClientRect(), s = getComputedStyle(element);return r.width > 0 && r.height > 0 && s.visibility !== 'hidden';};
    const name = element => (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim();
    const controls = [...main.querySelectorAll('button, a[href], [role="button"], [role="link"]')].filter(visible).map(name).filter(Boolean);
    const seen = new Map();for (const c of controls) seen.set(c, (seen.get(c) || 0) + 1);
    return {
      titles: [...main.querySelectorAll('h1')].filter(visible).map(h => h.textContent.trim()),
      navigations: [...document.querySelectorAll('nav, [role="navigation"]')].filter(visible).map(n => ({name: n.getAttribute('aria-label'), insideMain: main.contains(n)})),
      treesInMain: main.querySelectorAll('[role="tree"]').length,
      modeControls: [...main.querySelectorAll('button')].filter(visible).map(name).filter(n => /^(Established|Planning|All snapshots)$/.test(n)),
      duplicates: [...seen].filter(([, n]) => n > 1).map(([c]) => c),
    };
  });
}
