import {test, expect} from '@playwright/test';
import {join} from 'node:path';
import {openRepository, openChange, region, noOverflow} from './workbench.js';
import {editingRepository, editingFiles, billing} from './editing-fixtures.js';
// The PR description of the change page: the tier, the criteria results, the
// Markdown and the Copy button. The copied text is the text of the HTTP operation.
const next = billing + 'changes/change-next/';
function files() {
  const f = editingFiles();
  f.set(next + 'README.md', '# Invoice rules\n\n## Reason and scope\n\nInvoices need tenant rules so that each tenant sees only its own invoices.\n');
  f.set(next + 'tasks/README.md', '---\ntasks: [01-rules.md]\ncompatibility: minor\n---\n# Plan\n\n## Approval and prerequisites\n\nPresent this plan for explicit user approval before implementation.\n');
  f.set(next + 'tasks/01-rules.md', '---\nid: rules\ndepends_on: []\nclaims:\n  - id: tenant-scope\n    kind: decision\n    statement: Scope invoices by tenant.\n    status: open\n    basis: inferred\n---\n# Rules\n\n## Scope and ownership\n\nOwn src/invoices.js.\n\n## Definition of Done\n\n- [x] Rules hold.\n- [ ] Totals hold.\n\n## Evidence\n\nNot recorded.\n');
  return f;
}
const SECTIONS = ['Summary', 'Tier', 'Plan', 'Changed knowledge', 'Requirement coverage', 'DoD and evidence', 'Validator', 'Impact', 'Compatibility', 'Open claims'];

test('the PR description shows the tier and criteria and copies the text of the description operation', async ({page, context}) => {
  const f = await editingRepository(files()), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openRepository(page, f.root);
    const change = await openChange(page, 'Invoice rules');
    const section = change.getByRole('region', {name: 'PR description', exact: true});
    const criteria = section.getByRole('list', {name: 'Tier criteria'});
    await expect(criteria.getByRole('listitem')).toHaveCount(7);
    await expect(section).toContainText('Tier medium declared');
    await expect(criteria).toContainText('one-repository');
    await expect(criteria).toContainText('coordinator');
    await expect(criteria).toContainText('patch-level');
    await expect(criteria).toContainText('The plan declares compatibility: minor.');
    // The section is the last section of the change page.
    const order = await change.evaluate(el => [...el.querySelectorAll('section.section')].map(s => s.getAttribute('aria-label')));
    expect(order.at(-1)).toBe('PR description');
    // The page text and the copied text equal the HTTP description of the same revision.
    const response = await page.request.post('/api/review/query', {data: {path: f.root, artifact: 'billing', change: 'change-next', operation: 'description'}});
    const http = await response.json();
    expect(response.status()).toBe(200);
    await section.getByText(/^Markdown, [\d,]+ characters$/).click();
    const text = section.getByLabel('PR description text');
    await expect(text).toBeVisible();
    expect(await text.textContent()).toBe(http.data.markdown);
    expect([...http.data.markdown.matchAll(/^## (.+)$/gm)].map(m => m[1])).toEqual(SECTIONS);
    expect(http.data.markdown).toContain('Plan level: minor. Computed version: 1.1.0, from 1.0.0 on the protected branch.');
    expect(http.data.markdown.split('\n').at(-1)).toBe('Approval is not recorded by this description.');
    await section.getByRole('button', {name: 'Copy', exact: true}).click();
    await expect(section.getByRole('status').first()).toHaveText('Copied. Paste it into the PR.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(http.data.markdown);
    // No horizontal overflow; screenshots of the section at 1440 and 390 pixels.
    for (const width of [1440, 390]) {
      await page.setViewportSize({width, height: 900});
      await section.scrollIntoViewIfNeeded();
      expect(await noOverflow(page), `overflow at ${width}`).toBe(true);
      const box = await section.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      if (process.env.PLANE_SCREENSHOT_DIR) {
        // The page view with the text open, then the whole section with the text folded.
        await page.screenshot({path: join(process.env.PLANE_SCREENSHOT_DIR, `pr-description-page-${width}.png`)});
        await section.locator('details summary').click();
        await section.screenshot({path: join(process.env.PLANE_SCREENSHOT_DIR, `pr-description-${width}.png`)});
        await section.locator('details summary').click();
      }
    }
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});
