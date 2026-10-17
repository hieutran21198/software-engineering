import {test, expect} from '@playwright/test';
import {mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {RuntimeStore} from '../../server/runtime-store.js';
import {runtimeFixture, bind} from '../runtime-fixtures.js';
import {formatContextMarkdown} from '../../src/context-packet.js';
import {fixtureRepository, orderingFixture, identity, versionRecord} from '../fixtures.js';
import {openRepository, openChange, region, tree, treeItem, setHistory, refresh, noOverflow, layoutFacts} from './workbench.js';
import {editingRepository, editingFiles, billing, tenant, read, commits, fingerprint, git} from './editing-fixtures.js';
// The change page: header, phase steps, the plan with rows that expand in
// place, version readiness and preparation, and the read-only delivery of a
// retained change. The review part covers Changed knowledge, Compare and Export context.
const next = billing + 'changes/change-next/', unitDir = 'docs/artifacts/units-of-work/';
const changePage = page => region(page, 'Change page');
const plan = page => changePage(page).getByRole('region', {name: 'Plan', exact: true});
const row = (page, number, title) => plan(page).getByRole('button', {name: new RegExp(`^${number} ${title},`)});
const details = (page, number) => plan(page).getByRole('region', {name: `Task ${number} details`});
const commitAs = (root, message, date) => execFileSync('git', ['-C', root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message], {env: {...process.env, ...(date ? {GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date} : {})}});
const put = async (root, path, text) => {await mkdir(join(root, path, '..'), {recursive: true});await writeFile(join(root, path), text);};
const task = (id, title, deps = [], items = [[false, 'Done.']]) => `---\nid: ${id}\ndepends_on: [${deps.join(', ')}]\n---\n# ${title}\n\n## Definition of Done\n\n${items.map(([done, text]) => `- [${done ? 'x' : ' '}] ${text}`).join('\n')}\n\n## Evidence\n\nNot recorded.\n`;
const planOf = names => `---\ntasks: [${names.join(', ')}]\n---\n# Plan\n`;
// The criterion is an integration criterion, so a second member can join.
const brief = (id, title, members) => `---\nunit_of_work: ${id}\nchanges:\n${members.map(([a, c]) => `  - artifact: ${a}\n    change: ${c}\n`).join('')}acceptance:\n  - id: rules\n    criterion: Rules hold.\n    integration: true\nevidence: []\n---\n# ${title}\n`;
// Billing has the open change change-next with a fork/join plan.
function planFiles(extra = []) {
  const files = editingFiles();
  files.set(next + 'README.md', '# Invoice rules\n\nInvoices need tenant rules.\n');
  files.set(next + 'tasks/README.md', planOf(['01-api.md', '02-interface.md', '03-integration.md', '04-validation.md']));
  files.set(next + 'tasks/01-api.md', task('api', 'Build the API', [], [[true, 'Endpoint answers.'], [true, 'Errors are typed.']]));
  files.set(next + 'tasks/02-interface.md', task('interface', 'Build the interface'));
  files.set(next + 'tasks/03-integration.md', task('integration', 'Integrate', ['api', 'interface'], [[true, 'Wired.'], [false, 'Reject <script>window.taskInjected=true</script> input.']]));
  files.set(next + 'tasks/04-validation.md', task('validation', 'Validate', ['integration']));
  for (const [path, text] of extra) files.set(path, text);
  return files;
}

test('start a change, write a requirement, plan tasks, check DoD, record evidence and commit', async ({page}) => {
  const f = await editingRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const work = region(page, 'Work page');
    await work.getByRole('button', {name: 'Start a change', exact: true}).click();
    const start = work.getByRole('form', {name: 'Start change'});
    await start.getByLabel('Artifact').selectOption('billing');await start.getByLabel('Title').fill('Invoice rules');await start.getByLabel('Reason').fill('Invoices need tenant rules.');
    await start.getByRole('button', {name: 'Start change', exact: true}).click();
    const change = changePage(page);
    await expect(change.getByRole('heading', {name: 'Invoice rules', level: 1})).toBeVisible();
    await expect(change.getByRole('button', {name: 'Billing', exact: true})).toBeVisible();await expect(change).toContainText('change-invoice-rules · unit');
    await expect(change.getByRole('button', {name: 'Invoice rules', exact: true})).toBeVisible();
    expect(await read(f.root, billing + 'changes/change-invoice-rules/README.md')).toContain('Invoices need tenant rules.');
    expect(await read(f.root, unitDir + 'invoice-rules/README.md')).toContain('change: change-invoice-rules');
    // Readiness names each unmet item with a link to the place that fixes it.
    const ready = change.getByRole('region', {name: 'Version readiness'});
    await expect(ready.getByRole('listitem').filter({hasText: 'The plan is valid and has tasks'})).toContainText('(not met)');
    await ready.getByRole('button', {name: 'Open the plan', exact: true}).click();await expect(plan(page).getByRole('button', {name: '+ Add task', exact: true})).toBeFocused();
    // A requirement is added on the artifact page; its self-check is recorded from the phase line.
    await change.getByRole('button', {name: 'Billing', exact: true}).click();
    const artifact = region(page, 'Artifact page');await artifact.getByRole('button', {name: '+ New requirement', exact: true}).click();
    const add = artifact.getByRole('form', {name: 'Add requirement'});await add.getByLabel('Title').fill('Invoice tenancy');await add.getByLabel('Text (optional)').fill('# Invoice tenancy\n\nEvery invoice names one tenant.\n');
    await add.getByRole('button', {name: 'Add requirement', exact: true}).click();
    await expect(region(page, 'Document page').getByRole('heading', {name: 'Invoice tenancy', level: 1})).toBeVisible();
    await openChange(page, 'Invoice rules');
    await expect(change.locator('[aria-current="step"]')).toContainText('Requirement');await expect(change).toContainText('“Invoice tenancy” has no self-check.');
    await ready.getByRole('button', {name: 'Record the self-checks', exact: true}).click();await expect(change.getByRole('button', {name: 'Record self-check', exact: true})).toBeFocused();
    await change.getByRole('button', {name: 'Record self-check', exact: true}).click();
    const selfCheck = change.getByRole('form', {name: 'Record self-check'});await expect(selfCheck.getByLabel('Document')).toHaveValue(billing + 'requirements/invoice-tenancy.md');
    await selfCheck.getByRole('button', {name: 'Record self-check', exact: true}).click();
    await expect.poll(() => read(f.root, billing + 'requirements/invoice-tenancy.md')).toContain('self_check:');
    await expect(change.locator('[aria-current="step"]')).toContainText('Specification');
    await change.getByRole('list', {name: 'Phases'}).getByRole('button', {name: 'Requirement', exact: true}).click();
    await expect(region(page, 'Document page').getByRole('heading', {name: 'Invoice tenancy', level: 1})).toBeVisible();
    await openChange(page, 'Invoice rules');
    // Add task opens an inline row form; a new task opens expanded.
    await plan(page).getByRole('button', {name: '+ Add task', exact: true}).click();
    let form = plan(page).getByRole('form', {name: 'Add task'});
    await form.getByLabel('Title').fill('Validate tenancy');await form.getByLabel('Definition of Done, one item per line').fill('Invoices without a tenant are rejected.\nTests pass.');
    await form.getByRole('button', {name: 'Add task', exact: true}).click();
    await expect(row(page, '01', 'Validate tenancy')).toHaveAttribute('aria-expanded', 'true');await expect(row(page, '01', 'Validate tenancy')).toHaveAccessibleName(/Not started, 0 of 2 done$/);
    await plan(page).getByRole('button', {name: '+ Add task', exact: true}).click();
    form = plan(page).getByRole('form', {name: 'Add task'});await form.getByLabel('Title').fill('Remove me');await form.getByRole('checkbox', {name: '01 Validate tenancy'}).check();await form.getByLabel('Definition of Done, one item per line').fill('Nothing.');
    await form.getByRole('button', {name: 'Add task', exact: true}).click();
    await expect(row(page, '02', 'Remove me')).toContainText('01');
    // Remove task sits in Edit task; a task with dependents is refused inline.
    await row(page, '01', 'Validate tenancy').click();await details(page, '01').getByRole('button', {name: 'Edit task', exact: true}).click();
    let edit = details(page, '01').getByRole('form', {name: 'Edit task'});
    await edit.getByRole('button', {name: 'Remove task', exact: true}).click();await edit.getByRole('button', {name: 'Confirm remove', exact: true}).click();
    await expect(edit.getByRole('alert')).toContainText('depend on validate-tenancy');await edit.getByRole('button', {name: 'Cancel', exact: true}).click();
    await row(page, '02', 'Remove me').click();await details(page, '02').getByRole('button', {name: 'Edit task', exact: true}).click();
    edit = details(page, '02').getByRole('form', {name: 'Edit task'});await edit.getByRole('button', {name: 'Remove task', exact: true}).click();await edit.getByRole('button', {name: 'Confirm remove', exact: true}).click();
    await expect(row(page, '02', 'Remove me')).toHaveCount(0);expect(git(f.root, 'status', '--porcelain')).not.toContain('02-remove-me');
    // Definition of Done checkboxes apply at once; a refused write restores the recorded state.
    const taskPath = billing + 'changes/change-invoice-rules/tasks/01-validate-tenancy.md';
    await row(page, '01', 'Validate tenancy').click();
    await details(page, '01').getByRole('checkbox', {name: 'Invoices without a tenant are rejected.'}).check();
    await expect(row(page, '01', 'Validate tenancy')).toHaveAccessibleName(/In progress, 1 of 2 done$/);expect(await read(f.root, taskPath)).toContain('- [x] Invoices without a tenant are rejected.');
    await page.route('**/api/knowledge/edit', route => route.request().postDataJSON().operation === 'task.checklist.set' ? route.fulfill({status: 409, json: {error: 'The task file changed on disk. Retry.'}}) : route.continue());
    await details(page, '01').getByRole('checkbox', {name: 'Tests pass.'}).click();
    await expect(details(page, '01').getByRole('alert')).toContainText('The task file changed on disk. Retry.');
    await expect(details(page, '01').getByRole('checkbox', {name: 'Tests pass.'})).not.toBeChecked();expect(await read(f.root, taskPath)).toContain('- [ ] Tests pass.');
    await page.unroute('**/api/knowledge/edit');
    // Edit task keeps the checked items; Record evidence adds an entry to the row.
    await details(page, '01').getByRole('button', {name: 'Edit task', exact: true}).click();
    edit = details(page, '01').getByRole('form', {name: 'Edit task'});await edit.getByLabel('Title').fill('Validate invoice tenancy');await edit.getByRole('button', {name: 'Save task', exact: true}).click();
    await expect(row(page, '01', 'Validate invoice tenancy')).toBeVisible();await expect(details(page, '01').getByRole('checkbox', {name: 'Invoices without a tenant are rejected.'})).toBeChecked();
    await details(page, '01').getByRole('button', {name: 'Record evidence', exact: true}).click();
    const evidence = details(page, '01').getByRole('form', {name: 'Record evidence'});await evidence.getByLabel('Detail').fill('Rejection tests passed.');await evidence.getByRole('button', {name: 'Record evidence', exact: true}).click();
    await expect(details(page, '01').locator('.evidence-list')).toContainText('Run the task checks.');await expect(details(page, '01').locator('.evidence-list')).toContainText('Passed');await expect(details(page, '01').locator('.evidence-list')).toContainText('Rejection tests passed.');
    const taskText = await read(f.root, taskPath);expect(taskText).toContain('evidence_records:');expect(taskText).toContain('# Validate invoice tenancy');
    // Record plan self-check appears while tasks exist without a plan self-check.
    await plan(page).getByRole('button', {name: 'Record plan self-check', exact: true}).click();
    await plan(page).getByRole('form', {name: 'Record plan self-check'}).getByRole('button', {name: 'Record plan self-check', exact: true}).click();
    await expect.poll(() => read(f.root, billing + 'changes/change-invoice-rules/tasks/README.md')).toContain('self_check:');
    await expect(plan(page).getByRole('button', {name: 'Record plan self-check', exact: true})).toHaveCount(0);
    for (const width of [390, 1440]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page)).toBe(true);}
    // The work page commits the selected files with the prefilled message.
    await writeFile(join(f.root, tenant + 'requirements/need.md'), '# Need\n\nOutside the change.\n');await refresh(page);
    await page.getByRole('button', {name: /^Uncommitted knowledge, \d+ files$/}).click();
    await work.getByRole('checkbox', {name: 'Include Need', exact: true}).uncheck();
    const message = await work.getByLabel('Commit message').inputValue();
    await work.getByRole('button', {name: /^Commit \d+ files$/}).click();
    await expect(page.getByRole('status').filter({hasText: /^Committed \d+ knowledge files/})).toBeVisible();
    expect(commits(f.root)).toEqual([message, 'fixture']);
    expect(git(f.root, 'show', '--name-only', '--format=', 'HEAD').split('\n').every(p => p.startsWith(billing) || p.startsWith(unitDir + 'invoice-rules/'))).toBe(true);
    expect(git(f.root, 'status', '--porcelain')).toContain(tenant + 'requirements/need.md');
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('the header links the artifact, reason and unit, and Add to unit joins an existing unit', async ({page}) => {
  const f = await editingRepository(planFiles([[unitDir + 'tenant-rules/README.md', brief('tenant-rules', 'Tenant rules', [['tenant', 'change-initial']])]]));
  try {
    await openRepository(page, f.root);
    const change = await openChange(page, 'Invoice rules');
    expect(await layoutFacts(page)).toMatchObject({titles: ['Invoice rules'], treesInMain: 0, modeControls: [], duplicates: []});
    await expect(change).toContainText('change-next · No unit · Add to unit');
    await expect(change.getByRole('list', {name: 'Phases'}).getByRole('listitem')).toHaveText(['Requirement (current)', 'Specification', 'Plan', 'Implementation', 'Version'].map(t => new RegExp(t.replace(/[()]/g, '\\$&'))));
    await change.getByRole('button', {name: 'Add to unit', exact: true}).click();
    const join = change.getByRole('form', {name: 'Add to unit'});await expect(join.getByLabel('Unit of work')).toHaveValue('tenant-rules');
    await join.getByRole('button', {name: 'Add to unit', exact: true}).click();
    await expect(change.getByRole('button', {name: 'Tenant rules', exact: true})).toBeVisible();await expect(change).not.toContainText('No unit');
    expect(await read(f.root, unitDir + 'tenant-rules/README.md')).toContain('change: change-next');
    await change.getByRole('button', {name: 'Tenant rules', exact: true}).click();await expect(region(page, 'Unit page').getByRole('heading', {name: 'Tenant rules', level: 1})).toBeVisible();
    await openChange(page, 'Invoice rules');await change.getByRole('button', {name: 'Read reason and scope', exact: true}).click();
    const reason = region(page, 'Document page');await expect(reason.getByRole('heading', {name: 'Invoice rules', level: 1})).toBeVisible();await expect(reason).toContainText('Invoices need tenant rules.');
    await openChange(page, 'Invoice rules');await change.getByRole('button', {name: 'Billing', exact: true}).click();
    await expect(region(page, 'Artifact page').getByRole('heading', {name: 'Billing', level: 1})).toBeVisible();
  } finally {await f.cleanup();}
});

test('the plan table and Graph view are read only on main and show no execution edges for invalid plans', async ({page}) => {
  const f = await fixtureRepository(planFiles()), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const change = await openChange(page, 'Invoice rules');
    await expect(plan(page).getByRole('heading', {level: 2})).toHaveText('Plan · 4 tasks · 1 done');
    await expect(row(page, '01', 'Build the API')).toHaveAccessibleName('01 Build the API, Done, 2 of 2 done');
    await expect(row(page, '03', 'Integrate')).toHaveAccessibleName('03 Integrate, In progress, 1 of 2 done');await expect(row(page, '03', 'Integrate')).toContainText('01, 02');
    await expect(row(page, '04', 'Validate')).toContainText('03');
    // A read-only branch offers no plan writes; the row still reads the task.
    for (const name of ['+ Add task', 'Record plan self-check', 'Add to unit', 'Record self-check']) await expect(change.getByRole('button', {name, exact: true})).toHaveCount(0);
    await row(page, '03', 'Integrate').click();
    const integrate = details(page, '03');await expect(integrate.getByRole('checkbox', {name: 'Wired.'})).toBeDisabled();
    await expect(integrate).toContainText('Reject <script>window.taskInjected=true</script> input.');expect(await page.evaluate(() => window.taskInjected)).toBeUndefined();
    await expect(integrate.getByRole('button', {name: /^(Record evidence|Edit task)$/})).toHaveCount(0);
    await integrate.getByRole('button', {name: 'Open task document', exact: true}).click();await expect(region(page, 'Document page').getByRole('heading', {name: 'Integrate', level: 1})).toBeVisible();
    await openChange(page, 'Invoice rules');
    // Graph shows the declared prerequisites; selecting a task opens its row in the list.
    await plan(page).getByRole('group', {name: 'Plan view'}).getByRole('button', {name: 'Graph', exact: true}).click();
    const graph = plan(page).getByRole('group', {name: 'Task graph'});
    await expect(graph.locator('.react-flow__node')).toHaveCount(4);await expect(graph.locator('.react-flow__edge')).toHaveCount(3);await expect(graph).toContainText('Prerequisite');
    await graph.locator('.react-flow__node').filter({hasText: 'Integrate'}).click();
    await expect(row(page, '03', 'Integrate')).toHaveAttribute('aria-expanded', 'true');
    await page.setViewportSize({width: 700, height: 900});expect(await noOverflow(page)).toBe(true);await page.setViewportSize({width: 1440, height: 1000});
    await changePage(page).getByRole('region', {name: 'Version readiness'}).getByRole('button', {name: 'Create a branch', exact: true}).click();
    await expect(region(page, 'Work page')).toBeVisible();
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
    // Legacy, empty and invalid plans: a message or the diagnostics, and no edges.
    await openChange(page, 'Invoice rules');
    const ready = change.getByRole('region', {name: 'Version readiness'}).getByRole('listitem').filter({hasText: 'The plan is valid and has tasks'});
    for (const [text, message] of [['# Legacy plan\n', 'This plan declares no task list.'], [planOf([]), 'No tasks yet.']]) {
      await put(f.root, next + 'tasks/README.md', text);await refresh(page);
      await expect(plan(page).getByRole('group', {name: 'Tasks'})).toHaveText(message);await expect(plan(page).getByRole('group', {name: 'Plan view'})).toHaveCount(0);await expect(ready).toContainText('(not met)');
    }
    const invalid = async diagnostic => {
      await refresh(page);await expect(plan(page).locator('.plan-diagnostics')).toContainText(diagnostic);await expect(ready).toContainText('(not met)');
      await plan(page).getByRole('button', {name: 'Graph', exact: true}).click();
      await expect(graph.locator('.react-flow__node')).toHaveCount(2);await expect(graph.locator('.react-flow__edge')).toHaveCount(0);
      await plan(page).getByRole('button', {name: 'List', exact: true}).click();
    };
    await put(f.root, next + 'tasks/README.md', planOf(['01-api.md', '03-integration.md']));await invalid('Prerequisite interface is not a listed task.');
    await put(f.root, next + 'tasks/01-api.md', task('api', 'Build the API', ['integration']));await put(f.root, next + 'tasks/03-integration.md', task('integration', 'Integrate', ['api']));
    await invalid('Task prerequisites contain a cycle.');
    await put(f.root, next + 'tasks/03-integration.md', task('api', 'Integrate'));await invalid('Task ID api is not unique.');
  } finally {await f.cleanup();}
});

test('identical task IDs stay scoped to the selected worktree; a removed change says so', async ({page}) => {
  const f = await fixtureRepository(planFiles()), other = f.root + '-other';
  try {
    git(f.root, 'worktree', 'add', '-qb', 'other', other);
    await put(other, next + 'tasks/01-api.md', task('api', 'Build the API', [], [[true, 'Other worktree check.']]));
    const before = await fingerprint(f.root), otherBefore = await fingerprint(other);
    await openRepository(page, f.root);
    await openChange(page, 'Invoice rules');await row(page, '01', 'Build the API').click();
    await expect(details(page, '01')).toContainText('Endpoint answers.');await expect(details(page, '01')).not.toContainText('Other worktree check.');
    await page.getByRole('button', {name: /^Branch main/}).click();await page.getByRole('menuitemradio', {name: /^other/}).click();
    await expect(page.getByRole('button', {name: /^Branch other/})).toBeVisible();
    await openChange(page, 'Invoice rules');await expect(row(page, '01', 'Build the API')).toHaveAccessibleName(/1 of 1 done$/);
    await row(page, '01', 'Build the API').click();
    await expect(details(page, '01')).toContainText('Other worktree check.');await expect(details(page, '01')).not.toContainText('Endpoint answers.');
    expect(await fingerprint(f.root)).toEqual(before);expect(await fingerprint(other)).toEqual(otherBefore);
    await rm(join(other, next), {recursive: true, force: true});await refresh(page);
    await expect(changePage(page).getByRole('heading', {name: 'Change not found', level: 1})).toBeVisible();
  } finally {await rm(other, {recursive: true, force: true});await f.cleanup();}
});

const stateDir = () => process.env.ARTIFACT_PLANE_TEST_STATE_DIR;
function hook(root, session, kind, extra = {}) {
  execFileSync(process.execPath, ['server/runtime-cli.js', 'hook', '--state-dir', stateDir()], {cwd: new URL('../../', import.meta.url), input: JSON.stringify({cwd: root, session_id: session, hook_event_name: kind, turn_id: 'turn', ...extra}), stdio: ['pipe', 'pipe', 'ignore']});
}
// An in-place artifact with the open change change-live; Task A is complete.
const live = 'docs/artifacts/demo/changes/change-live/';
function liveRepository() {
  return fixtureRepository(new Map([
    ['docs/artifacts/demo/README.md', identity('Demo', '1.0.0')], ['docs/artifacts/demo/requirements/need.md', '# Need\n'], ['docs/artifacts/demo/versions/1.0.0/README.md', versionRecord('change-initial')],
    ['docs/artifacts/demo/changes/change-initial/README.md', '# Initial\n'], ['docs/artifacts/demo/changes/change-initial/tasks/README.md', planOf([])],
    [live + 'README.md', '# Live\n'], [live + 'tasks/README.md', planOf(['a.md', 'b.md', 'join.md'])],
    [live + 'tasks/a.md', task('a', 'Task A', [], [[true, 'Behavior']])], [live + 'tasks/b.md', task('b', 'Task B')], [live + 'tasks/join.md', task('join', 'Join', ['a', 'b'])],
    ['evidence.md', '# Evidence\n\n## Checks\n\nBehavior suite passed.\n'],
  ]));
}
const bindTask = (store, root, file, session) => store.bind({root, artifact: 'demo', change: 'change-live', task: file, session});
const execution = (page, number) => details(page, number).locator('.task-runtime');
test('a task of a legacy change also shows its observed execution', async ({page}) => {
  const f = await runtimeFixture(), s = new RuntimeStore({stateDir: stateDir()});
  try {
    await openRepository(page, f.root);await openChange(page, 'Live');
    await row(page, '01', 'Task A').click();
    await expect(execution(page, '01')).toContainText('No recorded execution');
    await bind(s, f.root, 'a.md', 'legacy-session');hook(f.root, 'legacy-session', 'UserPromptSubmit');
    await expect(execution(page, '01')).toContainText('Processing');await expect(execution(page, '01')).toContainText('legacy-session ·');
  } finally {s.close();await f.cleanup();}
});
test('the expanded task row shows observed execution; a completed task never observed says so', async ({page}) => {
  const f = await liveRepository(), s = new RuntimeStore({stateDir: stateDir()}), before = await fingerprint(f.root);
  try {
    await openRepository(page, f.root);await openChange(page, 'Live');
    await expect(row(page, '01', 'Task A')).toHaveAccessibleName('01 Task A, Done, 1 of 1 done');
    await row(page, '01', 'Task A').click();
    await expect(execution(page, '01')).toHaveText('Execution No recorded execution · Observations do not verify completion.');
    const a = await bindTask(s, f.root, 'a.md', 'session');hook(f.root, 'session', 'UserPromptSubmit');
    await expect(execution(page, '01')).toContainText('Processing');await expect(execution(page, '01')).toContainText('session ·');
    await page.context().setOffline(true);
    await expect(execution(page, '01')).toContainText('Unknown');await expect(execution(page, '01')).toContainText('stale, last observed processing');
    await page.context().setOffline(false);await expect(execution(page, '01')).toContainText('Processing');
    hook(f.root, 'session', 'PermissionRequest');await expect(execution(page, '01')).toContainText('Blocked');
    hook(f.root, 'session', 'PostToolUse', {tool_name: 'Bash'});await expect(execution(page, '01')).toContainText('Processing');
    hook(f.root, 'session', 'Stop');await expect(execution(page, '01')).toContainText('Validating');
    s.report({attempt: a.attempt, state: 'validated', root: f.root, method: 'Fixture behavior suite', source: 'evidence.md#checks'});await expect(execution(page, '01')).toContainText('Done (reported)');
    const b = await bindTask(s, f.root, 'b.md', 'other');hook(f.root, 'other', 'UserPromptSubmit');
    await row(page, '02', 'Task B').click();await expect(execution(page, '02')).toContainText('Processing');await expect(execution(page, '02')).toContainText('other ·');
    s.report({attempt: b.attempt, state: 'failed'});await expect(execution(page, '02')).toContainText('Failed');
    await bindTask(s, f.root, 'join.md', 'join-session');hook(f.root, 'join-session', 'UserPromptSubmit');hook(f.root, 'join-session', 'Interrupt');
    await row(page, '03', 'Join').click();await expect(execution(page, '03')).toContainText('Interrupted');
    expect(await fingerprint(f.root)).toEqual(before);
  } finally {await page.context().setOffline(false);s.close();await f.cleanup();}
});

test('task execution shows only the activity of the selected worktree', async ({page}) => {
  const f = await liveRepository(), other = f.root + '-scope', s = new RuntimeStore({stateDir: stateDir()});
  try {
    git(f.root, 'worktree', 'add', '-qb', 'scope-worker', other);
    await bindTask(s, other, 'a.md', 'other-worktree');hook(other, 'other-worktree', 'UserPromptSubmit');
    await openRepository(page, f.root);await openChange(page, 'Live');await row(page, '01', 'Task A').click();
    await expect(execution(page, '01')).toContainText('No recorded execution');await expect(execution(page, '01')).not.toContainText('other-worktree');
    await bindTask(s, f.root, 'a.md', 'selected-worktree');hook(f.root, 'selected-worktree', 'UserPromptSubmit');
    await expect(execution(page, '01')).toContainText('Processing');await expect(execution(page, '01')).toContainText('selected-worktree');await expect(execution(page, '01')).not.toContainText('other-worktree');
    await page.getByRole('button', {name: /^Branch main/}).click();await page.getByRole('menuitemradio', {name: /^scope-worker/}).click();
    await expect(page.getByRole('button', {name: /^Branch scope-worker/})).toBeVisible();
    await openChange(page, 'Live');await row(page, '01', 'Task A').click();
    await expect(execution(page, '01')).toContainText('other-worktree');await expect(execution(page, '01')).not.toContainText('selected-worktree');
  } finally {s.close();git(f.root, 'worktree', 'remove', '--force', other);await f.cleanup();}
});

// All self-checks are recorded and one Definition of Done item is open.
async function readyRepository() {
  const files = editingFiles();
  files.set(next + 'README.md', '# Invoice rules\n\nInvoices need tenant rules.\n');
  files.set(next + 'tasks/README.md', planOf(['01-work.md']));files.set(next + 'tasks/01-work.md', task('work', 'Work', [], [[true, 'Built.'], [false, 'Documented.']]));
  files.set(unitDir + 'invoice-rules/README.md', brief('invoice-rules', 'Invoice rules outcome', [['billing', 'change-next']]));
  const f = await editingRepository(files);
  const selfCheck = (path, anchor) => `self_check:\n  result: passed\n  source: ${path}#${anchor}\n`;
  const requirement = billing + 'requirements/invoice.md', specification = billing + 'specifications/invoice-rules.md', planPath = next + 'tasks/README.md';
  await put(f.root, requirement, `---\n${selfCheck(requirement, 'self-check')}---\n# Invoice\n\nInvoices name a tenant.\n\n## Self-check\n\nThe requirement is complete.\n`);
  await put(f.root, specification, `---\n${selfCheck(specification, 'self-check')}---\n# Invoice rules\n\nThe invoice names its tenant.\n\n## Self-check\n\nThe specification is complete.\n`);
  await put(f.root, planPath, `---\ntasks: [01-work.md]\n${selfCheck(planPath, 'plan-self-check')}---\n# Plan\n\n## Plan self-check\n\nEvery task has a Definition of Done.\n`);
  git(f.root, 'add', '-A', 'docs');commitAs(f.root, 'Billing change-next');
  return f;
}

test('Prepare version needs the acknowledgment, previews both files, then the change shows its version and publication review', async ({page}) => {
  const f = await readyRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const change = await openChange(page, 'Invoice rules');
    await expect(change.locator('[aria-current="step"]')).toContainText('Implementation');
    const ready = change.getByRole('region', {name: 'Version readiness'});
    await expect(ready.getByRole('listitem').filter({hasText: '(not met)'})).toHaveText([/All Definition of Done items are checked · 1 open/]);
    await expect(ready.getByRole('button', {name: 'Prepare version', exact: true})).toBeDisabled();
    await ready.getByRole('button', {name: 'Check the open items', exact: true}).click();await expect(row(page, '01', 'Work')).toBeFocused();
    await ready.getByRole('checkbox', {name: 'Prepare with unchecked items'}).check();
    await ready.getByRole('button', {name: 'Prepare version', exact: true}).click();
    const form = ready.getByRole('form', {name: 'Prepare version'});
    await expect(form).toContainText('The version is prepared with unchecked Definition of Done items.');
    await form.getByLabel('Reason').fill('Adds invoice rules.');await form.getByLabel('Summary').fill('Billing gains invoice tenancy.');
    await form.getByRole('button', {name: 'Preview version', exact: true}).click();
    const preview = form.getByRole('region', {name: 'Version preview'});
    await expect(preview.getByRole('heading', {name: 'Version 1.1.0'})).toBeVisible();await expect(preview).toContainText('1 unchecked Definition of Done items are acknowledged.');
    await expect(preview.locator('.preview-path')).toHaveText([`${billing}README.md Changed file`, `${billing}versions/1.1.0/README.md New file`]);
    expect(git(f.root, 'status', '--porcelain', '--', 'docs')).toBe('');
    await form.getByRole('button', {name: 'Prepare 1.1.0', exact: true}).click();
    // A version record that is not on main is prepared, not delivered.
    const delivery = change.getByRole('region', {name: 'Delivery'});
    await expect(delivery.getByText('Version 1.1.0 prepared', {exact: true})).toBeVisible();await expect(delivery.getByText(/^Delivered \d/)).toHaveCount(0);
    await expect(delivery).toContainText('Not possible yet: the version record is not on main');
    await expect(change.getByRole('region', {name: 'Version readiness'})).toHaveCount(0);await expect(plan(page).getByRole('button', {name: '+ Add task', exact: true})).toHaveCount(0);
    expect(await read(f.root, billing + 'versions/1.1.0/README.md')).toContain('source_change: change-next');expect(await read(f.root, billing + 'README.md')).toContain('current_version: 1.1.0');
    await setHistory(page, true);await expect(treeItem(page, /^Invoice rules Billing/)).toHaveAccessibleName('Invoice rules Billing · 1.1.0');
    // After the record is on main the change is delivered and needs a publication review.
    git(f.root, 'add', '-A', 'docs');commitAs(f.root, 'Prepare billing 1.1.0');git(f.root, 'branch', '-f', 'main', 'HEAD');await refresh(page);
    await expect(delivery.getByText('Delivered 1.1.0', {exact: true})).toBeVisible();await expect(delivery).not.toContainText(/prepared|proposed/);
    await expect(delivery).toContainText('Its version record is on the protected ref.');await expect(delivery).toContainText('Approval not verified by this reader.');
    await delivery.getByRole('button', {name: 'Record publication review', exact: true}).click();
    const review = delivery.getByRole('form', {name: 'Record publication review'});
    await review.getByLabel('Pull request URL').fill('https://example.invalid/org/repo/pull/7');await review.getByLabel('Repository URL (empty: the origin remote)').fill('https://example.invalid/org/repo');
    await review.getByRole('button', {name: 'Record publication review', exact: true}).click();
    await expect.poll(() => read(f.root, billing + 'README.md')).toContain('pull_request: https://example.invalid/org/repo/pull/7');
    expect(await read(f.root, unitDir + 'invoice-rules/README.md')).toContain('## Publication review');
    await expect(delivery.getByText('Delivered 1.1.0', {exact: true})).toBeVisible();await expect(delivery).toContainText('Publication reviewRecorded');
    await expect(delivery.getByRole('button', {name: 'Record publication review', exact: true})).toHaveCount(0);
    // The delivered change of 1.0.0 carries the same label without a proposal.
    await treeItem(page, /^Initial Billing/).click();
    const initial = changePage(page).getByRole('region', {name: 'Delivery'});
    await expect(initial.getByText('Delivered 1.0.0', {exact: true})).toBeVisible();await expect(initial).not.toContainText(/prepared|proposed/);
    await expect(initial).toContainText('Declared evidence; Git history is not replayed. This record names no commit.');
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('History lists retained changes newest first; their page is read only with delivery, commits and uncertainty', async ({page}) => {
  const f = await fixtureRepository(orderingFixture()), base = 'docs/artifacts/knowledge/';
  await writeFile(join(f.root, base, 'README.md'), (await readFile(join(f.root, base, 'README.md'), 'utf8')) + '\n## Active change\n[Next](changes/change-next/README.md)\n');
  git(f.root, 'add', '.');commitAs(f.root, 'Declare active source');
  for (const [name, date] of [['change-aold', '2025-01-01T12:00:00Z'], ['change-znew', '2025-03-01T12:00:00Z'], ['change-mid', '2025-02-01T12:00:00Z'], ['change-unknown', null]]) {
    await put(f.root, base + `changes/${name}/README.md`, `# Retained ${name}\n`);await put(f.root, base + `changes/${name}/specifications/main.md`, '# Historic contract\n\n## Self-check\nPassed.');
    if (date) {git(f.root, 'add', base + 'changes/' + name);commitAs(f.root, 'Evidence ' + name, date);}
  }
  const before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    await expect(tree(page).getByRole('treeitem', {name: /^Retained/})).toHaveCount(0);
    await setHistory(page, true);
    await expect(tree(page).getByRole('treeitem', {name: /^Retained/})).toHaveText(['change-znew', 'change-mid', 'change-aold', 'change-unknown'].map(n => new RegExp(`^Retained ${n}`)));
    await treeItem(page, /^Retained change-znew/).click();
    const change = changePage(page), delivery = change.getByRole('region', {name: 'Delivery'});
    await expect(change.getByRole('heading', {name: 'Retained change-znew', level: 1})).toBeVisible();
    await expect(change.getByRole('list', {name: 'Phases'}).getByRole('listitem')).toHaveText(Array(5).fill(/\(done\)$/));
    await expect(delivery.getByText('Retained change record', {exact: true})).toBeVisible();
    await expect(delivery).toContainText('Retained change; the artifact declares another active change. This does not prove completion.');
    const id = git(f.root, 'log', '-1', '--format=%H', '--', base + 'changes/change-znew');
    await expect(delivery.getByRole('listitem')).toHaveText([`${id.slice(0, 8)} Evidence change-znew`]);
    for (const name of ['+ Add task', 'Prepare version', 'Record publication review', 'Add to unit']) await expect(change.getByRole('button', {name, exact: true})).toHaveCount(0);
    await expect(change.getByRole('region', {name: 'Changed knowledge'})).toHaveCount(0);
    await change.getByRole('list', {name: 'Phases'}).getByRole('button', {name: 'Specification', exact: true}).click();
    await expect(region(page, 'Document page').getByRole('heading', {name: 'Historic contract', level: 1})).toBeVisible();
    await page.setViewportSize({width: 700, height: 900});expect(await noOverflow(page)).toBe(true);
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

// The review side of the change page: Changed knowledge with Compare, and
// Export context with the loaded review packet. Late replies of another
// project tab, worktree or change never replace the selected context.
const changed = page => changePage(page).getByRole('region', {name: 'Changed knowledge'});
const feedback = page => changePage(page).getByRole('status', {name: 'Export feedback'});
// Review fixture: billing has the open change change-next; the work branch changes, adds and removes requirements.
async function reviewRepository(extra = []) {
  const files = editingFiles();
  files.set(next + 'README.md', '# Invoice rules\n\nInvoices need tenant rules.\n');
  files.set(next + 'tasks/README.md', '---\ntasks: [01-work.md]\n---\n# Plan\n');
  files.set(next + 'tasks/01-work.md', '---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [ ] Done.\n');
  files.set(billing + 'requirements/retired-rule.md', '# Retired rule\n\nInvoices may omit the tenant.\n');
  for (const [path, text] of extra) files.set(path, text);
  const f = await editingRepository(files);
  await writeFile(join(f.root, billing + 'requirements/invoice.md'), '# Invoice\n\nInvoices name a tenant.\n');
  await writeFile(join(f.root, billing + 'requirements/new-rule.md'), '# New rule\n\n<script>window.reviewExecuted=true</script>\n<img src=x onerror="window.reviewExecuted=true">\n');
  await rm(join(f.root, billing + 'requirements/retired-rule.md'));
  return f;
}
// The menu stays open between checks; an action closes it.
async function exportMenu(page) {
  const menu = changePage(page).getByRole('menu', {name: 'Export context'});
  if (!await menu.isVisible()) await changePage(page).getByRole('button', {name: 'Export context', exact: true}).click();
  await expect(menu).toBeVisible();
  return menu;
}
async function exportReady(page) {
  const menu = await exportMenu(page);
  for (const name of ['Copy Markdown', 'Download Markdown', 'Download JSON']) await expect(menu.getByRole('menuitem', {name})).toBeEnabled();
  return menu;
}
async function closeMenu(page) {
  const menu = changePage(page).getByRole('menu', {name: 'Export context'});
  if (await menu.isVisible()) await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
}
async function download(page, name) {
  const menu = await exportReady(page), wait = page.waitForEvent('download');
  await menu.getByRole('menuitem', {name}).click();
  const file = await wait;return {name: file.suggestedFilename(), text: await readFile(await file.path(), 'utf8')};
}
async function copy(page) {
  await (await exportReady(page)).getByRole('menuitem', {name: 'Copy Markdown'}).click();
  await expect(feedback(page)).toHaveText('Markdown copied.');
  const text = await page.evaluate(() => window.copiedMarkdown);await page.evaluate(() => {window.copiedMarkdown = null;});
  return text;
}
const browserAccess = () => {
  window.copyFails = false;window.downloadFails = false;
  Object.defineProperty(navigator, 'clipboard', {value: {writeText: async text => {if (window.copyFails) throw Error('denied');window.copiedMarkdown = text;}}});
  const original = URL.createObjectURL;URL.createObjectURL = (...args) => {if (window.downloadFails) throw Error('blocked');return original(...args);};
};
// Holds one kind of review reply until release(); later replies pass.
function holdReplies(page, matches, reply = null) {
  const state = {hold: false, held: false, requests: []};let release;const gate = new Promise(resolve => release = resolve);
  state.release = release;
  page.route('**/api/review/query', async route => {
    const body = route.request().postDataJSON();state.requests.push(body);
    if (!state.hold || !matches(body)) return route.continue();
    state.held = true;const response = reply ? null : await route.fetch();await gate;
    try {await (reply ? route.fulfill(reply) : route.fulfill({response}));} catch {}
  });
  return state;
}
const worktreeLine = path => new RegExp(`^- \\*\\*worktree:\\*\\* ${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm');

test('Export context copies and downloads the loaded review packet; a failed copy or download can be retried', async ({page}) => {
  const f = await reviewRepository(), before = await fingerprint(f.root);let packet;
  await page.route('**/api/review/query', async route => {const response = await route.fetch();if (route.request().postDataJSON().operation === 'packet') packet = await response.json();await route.fulfill({response});});
  await page.addInitScript(browserAccess);
  try {
    await openRepository(page, f.root);await openChange(page, 'Invoice rules');
    const menu = await exportReady(page);
    await expect(menu).toContainText('The export holds the loaded records page of the review packet: scope, baseline, records, evidence and limits.');
    await expect(menu).toContainText('Partial context packet. Missing evidence, remaining pages and omitted text stay explicit in exports.');
    await expect(menu).not.toContainText('More knowledge records remain.');
    await page.evaluate(() => {window.copyFails = true;});await menu.getByRole('menuitem', {name: 'Copy Markdown'}).click();
    await expect(feedback(page)).toHaveText('Copy failed. Retry when local browser access is available.');
    await page.evaluate(() => {window.copyFails = false;});expect(await copy(page)).toBe(formatContextMarkdown(packet));
    await page.evaluate(() => {window.downloadFails = true;});await (await exportReady(page)).getByRole('menuitem', {name: 'Download JSON'}).click();
    await expect(feedback(page)).toHaveText('Download failed. Retry when local browser access is available.');
    await page.evaluate(() => {window.downloadFails = false;});
    const md = await download(page, 'Download Markdown'), json = await download(page, 'Download JSON'), data = JSON.parse(json.text);
    await expect(feedback(page)).toHaveText('JSON download requested.');
    expect([md.name, json.name]).toEqual(['billing-change-next-context.md', 'billing-change-next-context.json']);
    expect(md.text).toBe(formatContextMarkdown(data));expect(data.revision).toBe(packet.revision);expect(data.completeness).toBe('partial');
    expect(data.data.records.map(r => [r.status, r.path])).toEqual([['modified', 'requirements/invoice.md'], ['added', 'requirements/new-rule.md'], ['removed', 'requirements/retired-rule.md']]);
    expect(md.text).toContain('Approval not verified by this reader.');
    expect(await fingerprint(f.root)).toEqual(before);
  } finally {await page.unrouteAll({behavior: 'wait'});await f.cleanup();}
});

test('Export is disabled offline and while the packet is stale', async ({page, context}) => {
  const f = await reviewRepository();let stale = false;
  await page.route('**/api/review/query', async route => {
    const response = await route.fetch();
    if (stale && route.request().postDataJSON().operation === 'packet') await route.fulfill({response, json: {...await response.json(), freshness: 'stale'}});
    else await route.fulfill({response});
  });
  try {
    await openRepository(page, f.root);await openChange(page, 'Invoice rules');
    let menu = await exportReady(page);
    await context.setOffline(true);
    await expect(menu.getByRole('status')).toHaveText('Offline. Export needs the local server.');
    for (const name of ['Copy Markdown', 'Download Markdown', 'Download JSON']) await expect(menu.getByRole('menuitem', {name})).toBeDisabled();
    await context.setOffline(false);await exportReady(page);await closeMenu(page);
    stale = true;await refresh(page);menu = await exportMenu(page);
    await expect(menu.getByRole('status')).toHaveText('The review packet is stale. Retry.');
    for (const name of ['Copy Markdown', 'Download Markdown', 'Download JSON']) await expect(menu.getByRole('menuitem', {name})).toBeDisabled();
    await closeMenu(page);stale = false;await refresh(page);await exportReady(page);
  } finally {await context.setOffline(false);await page.unrouteAll({behavior: 'wait'});await f.cleanup();}
});

test('a late packet of another project tab is ignored, and an inactive tab reads no review', async ({page}) => {
  const a = await reviewRepository(), b = await reviewRepository(), held = holdReplies(page, body => body.path === a.root && body.operation === 'packet');
  await page.addInitScript(browserAccess);
  const panel = () => page.getByRole('tabpanel');
  try {
    await openRepository(page, a.root);await openChange(page, 'Invoice rules');await exportReady(page);await closeMenu(page);
    held.hold = true;await refresh(page);await expect.poll(() => held.held).toBe(true);
    await page.getByRole('button', {name: 'New project tab', exact: true}).click();
    await panel().getByLabel('Repository path').fill(b.root);await panel().getByRole('button', {name: 'Open repository', exact: true}).click();
    await openChange(page, 'Invoice rules');
    let text = await copy(page);expect(text).toContain(b.root);expect(text).not.toContain(a.root);
    held.release();held.hold = false;held.requests.length = 0;
    // Only the active project reads: B shows its new document, A sends nothing.
    await writeFile(join(a.root, billing + 'requirements/late.md'), '# Late rule\n');await writeFile(join(b.root, billing + 'requirements/late.md'), '# Late rule\n');
    await refresh(page);await expect(changed(page).getByRole('button', {name: 'Compare Late rule', exact: true})).toBeVisible();
    await exportReady(page);
    expect(held.requests.some(r => r.path === b.root)).toBe(true);expect(held.requests.some(r => r.path === a.root)).toBe(false);
    text = await copy(page);expect(text).toContain(b.root);
    await page.getByRole('tab').first().click();
    await expect(changed(page).getByRole('button', {name: 'Compare Late rule', exact: true})).toBeVisible();
    text = await copy(page);expect(text).toContain(a.root);expect(text).not.toContain(b.root);
  } finally {held.release();await page.unrouteAll({behavior: 'wait'});await a.cleanup();await b.cleanup();}
});

test('a late packet or error of the previous change or worktree cannot replace the selected context', async ({page}) => {
  const tenantNext = tenant + 'changes/change-rules/';
  const f = await reviewRepository([[tenantNext + 'README.md', '# Tenant rules change\n'], [tenantNext + 'tasks/README.md', '---\ntasks: []\n---\n# Plan\n']]), other = f.root + '-other';
  const held = holdReplies(page, body => body.operation === 'packet' && body.worktree === f.root && body.change === 'change-next', {status: 422, json: {error: 'Old worktree unavailable'}});
  await page.addInitScript(browserAccess);
  try {
    git(f.root, 'worktree', 'add', '-qb', 'other', other);
    await openRepository(page, f.root);await openChange(page, 'Invoice rules');await exportReady(page);await closeMenu(page);
    // Another change opens while the first change's packet is held.
    held.hold = true;await refresh(page);await expect.poll(() => held.held).toBe(true);
    await openChange(page, 'Tenant rules change');
    let text = await copy(page);expect(text).toContain('change-rules');expect(text).not.toContain('change-next');
    // Another worktree opens while the old worktree's reply is still held; the old error arrives last.
    await page.getByRole('button', {name: /^Branch work/}).click();await page.getByRole('menuitemradio', {name: /^other/}).click();
    await expect(page.getByRole('button', {name: /^Branch other/})).toBeVisible();
    await openChange(page, 'Invoice rules');text = await copy(page);expect(text).toMatch(worktreeLine(other));
    held.release();
    text = await copy(page);expect(text).toMatch(worktreeLine(other));
    await expect(changePage(page).getByText('Old worktree unavailable')).toHaveCount(0);await expect(changePage(page).getByRole('alert')).toHaveCount(0);
  } finally {held.release();await page.unrouteAll({behavior: 'wait'});await rm(other, {recursive: true, force: true});await f.cleanup();}
});

test('the export holds the first records page and omitted source text; an unavailable baseline stays explicit', async ({page}) => {
  const f = await reviewRepository();
  for (let i = 0; i < 23; i++) await writeFile(join(f.root, billing + `requirements/extra-${String(i).padStart(2, '0')}.md`), `# Extra ${i}\n`);
  await writeFile(join(f.root, billing + 'requirements/long.md'), '# Long source\n' + 'x'.repeat(13000));
  await page.addInitScript(browserAccess);
  try {
    await openRepository(page, f.root);await openChange(page, 'Invoice rules');
    const menu = await exportReady(page);
    await expect(menu).toContainText('More knowledge records remain. This packet contains the loaded page.');
    let data = JSON.parse((await download(page, 'Download JSON')).text);
    expect(data.data.records).toHaveLength(20);expect(data.pagination).toMatchObject({offset: 0, totalRecords: 27});expect(data.pagination.nextCursor).toBeTruthy();
    expect(data.omissions.some(o => o.reason === 'Excerpt budget.' && o.omittedCharacters > 0)).toBe(true);
    // Without a local main or master the baseline is unavailable and no record is compared.
    git(f.root, 'branch', '-D', 'main');await refresh(page);
    await expect.poll(async () => JSON.parse((await download(page, 'Download JSON')).text).data.baseline.state).toBe('unavailable');
    data = JSON.parse((await download(page, 'Download JSON')).text);
    expect(data.data.baseline.reason).toBe('No readable local main or master ref.');expect(data.data.records).toEqual([]);expect(data.completeness).toBe('partial');
    expect(await copy(page)).toContain('No readable local main or master ref.');
  } finally {await f.cleanup();}
});

test('Compare shows the line comparison of new, changed and removed documents as inert text', async ({page}) => {
  const f = await reviewRepository();
  await writeFile(join(f.root, billing + 'requirements/huge.md'), '# Huge\n' + Array.from({length: 2100}, (_, i) => `Line ${i}`).join('\n') + '\n');
  const before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);await openChange(page, 'Invoice rules');
    const section = changed(page), comparison = title => section.getByRole('region', {name: `Comparison of ${title} with main`});
    await expect(section.locator('.row')).toHaveText([/^Huge · requirement\s*New/, /^Invoice · requirement\s*Changed/, /^New rule · requirement\s*New/, /^retired-rule · requirement\s*Removed/]);
    await section.getByRole('button', {name: 'Compare Invoice', exact: true}).click();
    await expect(section.getByRole('button', {name: 'Compare Invoice', exact: true})).toHaveAttribute('aria-expanded', 'true');
    await expect(comparison('Invoice').locator('.diff-line.remove')).toHaveText([/Invoices exist\./]);await expect(comparison('Invoice').locator('.diff-line.add')).toHaveText([/Invoices name a tenant\./]);
    await section.getByRole('button', {name: 'Compare New rule', exact: true}).click();
    await expect(comparison('New rule')).toContainText('<script>window.reviewExecuted=true</script>');await expect(comparison('New rule').locator('.diff-line.remove')).toHaveCount(0);
    expect(await comparison('New rule').locator('script, img').count()).toBe(0);expect(await page.evaluate(() => window.reviewExecuted)).toBeUndefined();
    await section.getByRole('button', {name: 'Compare retired-rule', exact: true}).click();
    await expect(comparison('retired-rule').locator('.diff-line.remove').first()).toContainText('# Retired rule');await expect(comparison('retired-rule').locator('.diff-line.add')).toHaveCount(0);
    await section.getByRole('button', {name: 'Compare Huge', exact: true}).click();
    await expect(section.getByRole('status').filter({hasText: 'Comparison too large: line or comparison-work limit exceeded.'})).toBeVisible();
    // One comparison is open at a time; Hide closes it.
    const invoice = section.getByRole('button', {name: 'Compare Invoice', exact: true});
    await expect(invoice).toHaveAttribute('aria-expanded', 'false');await expect(section.getByRole('region')).toHaveCount(0);
    await invoice.click();await expect(invoice).toHaveText('Hide');await invoice.click();await expect(invoice).toHaveText('Compare');await expect(comparison('Invoice')).toHaveCount(0);
    await invoice.click();
    for (const width of [1440, 700, 390]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page)).toBe(true);}
    await page.setViewportSize({width: 1440, height: 1000});
    await section.getByRole('button', {name: 'Invoice', exact: true}).click();await expect(region(page, 'Document page').getByRole('heading', {name: 'Invoice', level: 1})).toBeVisible();
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});
