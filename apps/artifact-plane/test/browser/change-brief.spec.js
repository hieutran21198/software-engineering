import {test, expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {openRepository, openChange, openDocument, region, noOverflow} from './workbench.js';
import {editingRepository, editingFiles, billing, tenant, read} from './editing-fixtures.js';
// The Change brief of the change page: section order, rows, claim cards, the
// hypothesis table, a person's check and wording notes on delivered records.
const next = billing + 'changes/change-next/', task = next + 'tasks/01-rules.md';
const claims = `claims:
  - id: tenant-scope
    kind: decision
    statement: Scope invoices by tenant.
    status: open
    basis: inferred
    check: Create an invoice in two tenants and list each.
    rejected:
      - option: A global invoice list
        reason: Tenants would see each other's invoices.
  - id: slow-totals
    kind: hypothesis
    statement: Totals are slow because of rounding.
    status: refuted
    basis: observed
    evidence: [${task}#rounding]
  - id: missing-index
    kind: root_cause
    statement: Totals are slow because the tenant index is missing.
    status: supported
    basis: observed
    evidence: [${task}#index]
    check: Run the totals query with and without the index.
  - id: currency
    kind: assumption
    statement: All invoices use one currency.
    status: verified
    basis: observed
    evidence: [${task}#index]
    check: Count the currencies in the fixture.
    verified_by: agent
`;
function files() {
  const f = editingFiles();
  f.set(tenant + 'specifications/identity.md', '# Identity\n\nEstablished identity rules. Integrated checks remain pending.\n');
  f.set(tenant + 'specifications/flows/onboarding.md', '---\nflow:\n  id: onboarding\n  title: Onboarding\n  trigger: A tenant signs up.\n  outcome: The tenant exists.\n  entry_steps: [start]\n  steps:\n    - id: start\n      title: Start onboarding\n  gaps:\n    - Browser checks for the\n      current integrated validation remain pending.\n---\n# Onboarding\n');
  f.set(next + 'README.md', '# Invoice rules\n\n## Reason and scope\n\nInvoices need tenant rules.\n');
  f.set(next + 'tasks/README.md', '---\ntasks: [01-rules.md]\n---\n# Plan\n\n## Approval and prerequisites\n\nPresent this plan for explicit user approval before implementation.\n');
  f.set(task, `---\nid: rules\ndepends_on: []\n${claims}---\n# Rules\n\n## Scope and ownership\n\nOwn src/invoices.js.\n\n## Definition of Done\n\n- [ ] Rules hold.\n\n## Evidence\n\n### rounding\n\nRounding took 2 ms of 900 ms.\n\n### index\n\nWith the index the query took 40 ms.\n`);
  return f;
}
const brief = page => region(page, 'Change page').getByRole('region', {name: 'Change brief', exact: true});

test('the change brief sits between the phases and the plan and records a person\'s check', async ({page}) => {
  const f = await editingRepository(files()), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const change = await openChange(page, 'Invoice rules');
    const section = brief(page);
    await expect(section.getByRole('region', {name: 'Claims'})).toBeVisible();
    // Order: phase steps, the brief, then the plan.
    const order = await change.evaluate(el => [...el.querySelectorAll('ol.phase-steps, section.section')].map(s => s.getAttribute('aria-label') || 'Phases'));
    expect(order.slice(0, 3)).toEqual(['Phases', 'Change brief', 'Plan']);
    // Rows in the fixed order; empty rows are hidden; only the attention row is open.
    const questions = await section.locator('.brief-rows summary .brief-question').allTextContents();
    const all = ['What changed?', 'Why?', 'What is affected?', 'What should I care about?', 'What do I need to understand?', 'What can I verify?', 'What needs my decision?'];
    expect(questions).toEqual(all.filter(q => questions.includes(q)));
    expect(questions).toContain('What should I care about?');
    const opened = await section.locator('.brief-rows details[open] .brief-question').allTextContents();
    expect(opened).toEqual(['What should I care about?']);
    await section.locator('summary', {hasText: 'What needs my decision?'}).click();
    await expect(section).toContainText('The plan says: “Present this plan for explicit user approval before implementation.” Approval not verified by this reader.');
    // Claim cards, folded rejected options and the hypothesis table.
    const card = section.getByRole('article', {name: 'Claim tenant-scope'});
    await expect(card).toContainText('Scope invoices by tenant.');
    await card.getByText('1 rejected option, one reason each').click();
    await expect(card).toContainText("Tenants would see each other's invoices.");
    const table = section.getByRole('region', {name: `Hypotheses in ${task.replace('docs/artifacts/', '')}`});
    await expect(table.getByRole('row')).toHaveCount(3);
    // An agent record never shows "verified" without "not independent".
    const agent = section.getByRole('article', {name: 'Claim currency'});
    await expect(agent.locator('.claim-status')).toHaveText('verified by an agent, not independent');
    await expect(agent.locator('.ladder-step').first()).toHaveText('Re-checked by an agent, not independent');
    const statuses = await section.locator('.claim-status').allTextContents();
    expect(statuses.filter(s => s.includes('verified') && !s.includes('not independent'))).toEqual([]);
    // A person's check: the submit button waits for an observed result.
    const target = section.getByRole('article', {name: 'Claim missing-index'});
    await target.getByRole('button', {name: 'Record my check', exact: true}).click();
    const form = target.getByRole('form', {name: 'Record my check of missing-index'});
    const submit = form.getByRole('button', {name: 'Record check', exact: true});
    await expect(submit).toBeDisabled();
    await form.getByLabel('What you observed').fill('Without the index 900 ms; with it 41 ms.');
    await expect(submit).toBeEnabled();
    await submit.click();
    const checked = brief(page).getByRole('article', {name: 'Claim missing-index'});
    await expect(checked.locator('.ladder-step').first()).toHaveText('Checked by a person');
    await expect(checked.locator('.claim-status')).toHaveText('verified');
    const text = await read(f.root, task);
    expect(text).toMatch(/verified_by: person\n/);
    expect(text).toMatch(/### missing-index-check\n\nRan: Run the totals query with and without the index\.\n\nObserved: Without the index 900 ms; with it 41 ms\./);
    // One title and one navigation; no horizontal overflow at four widths.
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('navigation')).toHaveCount(1);
    for (const width of [1440, 851, 700, 390]) {
      await page.setViewportSize({width, height: 900});
      expect(await noOverflow(page), `overflow at ${width}`).toBe(true);
    }
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('wording notes appear only on records of delivered work', async ({page}) => {
  const f = await editingRepository(files());
  try {
    // A record proposed on this branch is not delivered work.
    await writeFile(join(f.root, billing + 'requirements/totals.md'), '# Totals\n\nTotals exist. Integrated checks remain pending.\n');
    await openRepository(page, f.root);
    await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    const note = region(page, 'Document page').getByRole('note');
    await expect(note).toContainText('Inferred from wording');
    await expect(note).toContainText('Integrated checks remain pending.');
    await openDocument(page, 'Billing', 'Requirements', 'Totals');
    await expect(region(page, 'Document page')).toContainText('Integrated checks remain pending.');
    await expect(region(page, 'Document page').locator('.wording-note')).toHaveCount(0);
    // Two artifacts have a Flows row; open the flow from the Tenant artifact page.
    await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    await region(page, 'Document page').getByRole('button', {name: 'Tenant', exact: true}).first().click();
    await region(page, 'Artifact page').getByText('Onboarding', {exact: true}).click();
    await expect(region(page, 'Flow page').getByRole('note')).toContainText('Browser checks for the current integrated validation remain pending.');
  } finally {await f.cleanup();}
});
