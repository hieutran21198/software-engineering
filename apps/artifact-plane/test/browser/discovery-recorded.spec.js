import {test, expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {fixtureRepository, fingerprint, git, sourceFixture} from '../fixtures.js';
import {RuntimeStore} from '../../server/runtime-store.js';
import {runtimeFixture, bind} from '../runtime-fixtures.js';
import {editingFiles, tenant, billing} from './editing-fixtures.js';
import {openRepository, region, refresh, noOverflow, showSidebar, treeItem, layoutFacts} from './workbench.js';
// The More menu pages: Discover behavior (search flows by a described
// behavior) and Recorded executions (captured task attempts of this machine).
const discover = page => region(page, 'Discover behavior');
const recorded = page => region(page, 'Recorded executions');
async function openMore(page, name) {
  await page.getByRole('button', {name: 'More', exact: true}).click();
  await page.getByRole('menu', {name: 'More'}).getByRole('menuitem', {name: new RegExp(`^${name}`)}).click();
}
async function openDiscover(page) {
  await openMore(page, 'Discover behavior');
  await expect(discover(page).getByRole('heading', {level: 1})).toHaveText('Discover behavior');
  return discover(page);
}
async function search(page, text) {
  await discover(page).getByLabel('Behavior', {exact: true}).fill(text);
  await discover(page).getByRole('button', {name: 'Search', exact: true}).click();
}
const results = page => discover(page).locator('.discover-results > li button');

// In-place flows: many tenant routes, one needle, and a billing flow that names tenant knowledge.
const flowDoc = (artifact, id, title, trigger = 'Request access') => '---\nflow:\n  id: ' + id + '\n  artifact: ' + artifact + '\n  title: ' + title + '\n  trigger: ' + trigger + '\n  outcome: Read membership rules\n  entry_steps: [start]\n  steps:\n    - id: start\n      title: Read rules\n      supports: [rule]\n  transitions: []\n  support:\n    - {id: rule, kind: element, artifact: tenant, element: requirements/need.md, requires: Read membership rules, basis: documented}\n  gaps: [Static context only]\n---\n# ' + title + '\n';
function flowFiles() {
  const files = editingFiles();
  for (let i = 0; i < 26; i++) files.set(tenant + `specifications/flows/route-${i}.md`, flowDoc('tenant', `route-${i}`, `Tenant route ${i}`));
  files.set(tenant + 'specifications/flows/z-needle.md', flowDoc('tenant', 'z-needle', 'Needle title'));
  files.set(billing + 'specifications/flows/shared.md', flowDoc('billing', 'shared', 'Shared access', 'An invoice reader asks for shared access'));
  return files;
}
// A mocked search reply.
const reply = (flows, extra = {}) => ({revision: 'same-revision', generation: 1, freshness: 'fresh', completeness: 'complete', diagnostics: [], omissions: [], pagination: {}, ...extra,
  data: {flows: flows.map(([id, title]) => ({id, logicalId: `tenant:${id}`, artifact: 'tenant', source: 'working', title, state: 'valid'})), total: flows.length, semantic: false, ...extra.data}});

test('Discover behavior searches only on submit, ranks the described behavior first and opens its flow', async ({page}) => {
  const f = await fixtureRepository(flowFiles()), before = await fingerprint(f.root), requests = [], errors = [];page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => {if (r.url().endsWith('/api/flows/query')) requests.push(r.postDataJSON());});
  try {
    await openRepository(page, f.root);await openDiscover(page);
    await discover(page).getByLabel('Behavior', {exact: true}).fill('shared access for invoices');
    await expect(discover(page).getByLabel('Behavior', {exact: true})).toHaveValue('shared access for invoices');
    expect(requests.filter(r => r.operation === 'search')).toHaveLength(0);
    await discover(page).getByLabel('Behavior', {exact: true}).press('Enter');
    await expect(results(page).first()).toContainText('Shared access');
    const searches = requests.filter(r => r.operation === 'search').length;
    await expect(results(page).first()).toContainText('Billing · Starts when an invoice reader asks for shared access');
    const request = requests.filter(r => r.operation === 'search').at(-1);
    expect(request).toMatchObject({match: 'discovery', query: 'shared access for invoices', knowledge: 'planning'});
    // An empty text does not search again.
    await search(page, '   ');expect(requests.filter(r => r.operation === 'search')).toHaveLength(searches);
    await expect(results(page).first()).toContainText('Shared access');
    expect(await layoutFacts(page)).toMatchObject({titles: ['Discover behavior'], treesInMain: 0, modeControls: []});
    for (const width of [390, 1440]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page)).toBe(true);}
    await results(page).first().click();
    await expect(region(page, 'Flow page').getByRole('heading', {level: 1})).toHaveText('Shared access');
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('the sidebar search finds flows by normalized title and opens the first match', async ({page}) => {
  const f = await fixtureRepository(flowFiles());
  try {
    await openRepository(page, f.root);await showSidebar(page);
    const field = page.getByLabel('Search knowledge', {exact: true});
    await field.fill('  NEEDLE TITLE  ');
    await expect(treeItem(page, /^Needle title/)).toBeVisible();await expect(treeItem(page, /^Tenant route/)).toHaveCount(0);
    await field.press('Enter');
    await expect(region(page, 'Flow page').getByRole('heading', {level: 1})).toHaveText('Needle title');
    await field.fill('absent title');
    await expect(page.getByRole('status').filter({hasText: 'Nothing matches this title or ID.'})).toBeVisible();
    await page.getByRole('button', {name: 'Clear search', exact: true}).click();
    await expect(field).toHaveValue('');await expect(treeItem(page, /^Tenant$/)).toBeVisible();
  } finally {await f.cleanup();}
});

test('no match and legacy repositories without flow records are stated honestly', async ({page}) => {
  const f = await fixtureRepository(sourceFixture());
  try {
    await openRepository(page, f.root);await openDiscover(page);await search(page, 'tenant identity rules');
    await expect(discover(page)).toContainText('No flow matches. No match does not prove that the behavior does not exist.');
    await expect(results(page)).toHaveCount(0);
  } finally {await f.cleanup();}
});

test('notes, errors with Retry, and Show more results', async ({page}) => {
  const f = await fixtureRepository(flowFiles());let fail = true;
  await page.route('**/api/flows/query', route => {
    const b = route.request().postDataJSON();if (b.operation !== 'search') return route.continue();
    if (fail) return route.fulfill({status: 503, json: {error: 'Flow index temporarily unavailable'}});
    if (b.cursor) return route.fulfill({json: reply([['tail', 'Ranking tail']])});
    return route.fulfill({json: reply([['head', 'Ranking head']], {freshness: 'stale', pagination: {nextCursor: 'next'}, diagnostics: [{code: 'flow-model-unavailable', message: "ENOENT: no such file '/private/models/manifest.json'"}]})});
  });
  try {
    await openRepository(page, f.root);await openDiscover(page);await search(page, 'access behavior');
    await expect(discover(page).getByRole('alert')).toContainText('Flow index temporarily unavailable');
    fail = false;await discover(page).getByRole('alert').getByRole('button', {name: 'Retry', exact: true}).click();
    await expect(results(page)).toHaveCount(1);await expect(results(page).first()).toContainText('Ranking head');
    await expect(discover(page).getByText('Semantic search is not available. Keyword search and graph discovery still work.', {exact: true})).toHaveCount(1);
    await expect(discover(page)).not.toContainText('/private/models');
    await expect(discover(page)).toContainText('The results can be out of date.');
    await discover(page).getByRole('button', {name: 'Show more results', exact: true}).click();
    await expect(results(page)).toHaveCount(2);await expect(results(page).nth(1)).toContainText('Ranking tail');
    await expect(discover(page).getByRole('button', {name: 'Show more results', exact: true})).toHaveCount(0);
  } finally {await page.unrouteAll({behavior: 'ignoreErrors'});await f.cleanup();}
});

test('a refresh with the same revision accepts a changed discovery generation and ranking', async ({page}) => {
  const f = await fixtureRepository(flowFiles());let repaired = false;
  await page.route('**/api/flows/query', route => {
    if (route.request().postDataJSON().operation !== 'search') return route.continue();
    return route.fulfill({json: reply([[repaired ? 'semantic' : 'keyword', repaired ? 'New semantic candidate' : 'Old keyword candidate']], {generation: repaired ? 2 : 1, data: {semantic: repaired}})});
  });
  try {
    await openRepository(page, f.root);await openDiscover(page);await search(page, 'access behavior');
    await expect(results(page)).toHaveText([/Old keyword candidate/]);
    repaired = true;await refresh(page);
    await expect(results(page)).toHaveText([/New semantic candidate/]);
  } finally {await page.unrouteAll({behavior: 'ignoreErrors'});await f.cleanup();}
});

// Product bug: "Show more results" appends a page of a newer ranking generation
// to the first page of the older one instead of restarting the search.
test('a changed discovery generation between pages restarts without mixing rankings', async ({page}) => {
  const f = await fixtureRepository(flowFiles());let repaired = false;
  await page.route('**/api/flows/query', route => {
    const b = route.request().postDataJSON();if (b.operation !== 'search') return route.continue();
    if (b.cursor) repaired = true;
    return route.fulfill({json: reply([[b.cursor ? 'new-tail' : repaired ? 'new-head' : 'old-head', b.cursor ? 'New ranking tail' : repaired ? 'New ranking head' : 'Old ranking head']], {generation: repaired ? 2 : 1, pagination: {nextCursor: b.cursor ? null : 'next'}})});
  });
  try {
    await openRepository(page, f.root);await openDiscover(page);await search(page, 'access behavior');
    await expect(results(page)).toHaveText([/Old ranking head/]);
    await discover(page).getByRole('button', {name: 'Show more results', exact: true}).click();
    await expect(results(page).first()).toContainText('New ranking head');
    await expect(results(page).filter({hasText: 'Old ranking head'})).toHaveCount(0);
  } finally {await page.unrouteAll({behavior: 'ignoreErrors'});await f.cleanup();}
});

test('a late reply of an older read cannot replace the newer results', async ({page}) => {
  const f = await fixtureRepository(flowFiles());let release, entered, searches = 0;
  const blocked = new Promise(resolve => release = resolve), started = new Promise(resolve => entered = resolve);
  await page.route('**/api/flows/query', async route => {
    const b = route.request().postDataJSON();
    if (b.operation !== 'search') return route.continue();
    if (++searches === 1) {entered();await blocked;try {await route.fulfill({json: reply([['late', 'Late first reply']])});} catch {}return;}
    return route.fulfill({json: reply([['second', 'Second reply']])});
  });
  try {
    await openRepository(page, f.root);await openDiscover(page);
    await search(page, 'first behavior');await started;
    // While a search runs, Search is busy and disabled; Refresh reads again.
    await expect(discover(page).getByRole('button', {name: 'Search', exact: true})).toHaveAttribute('aria-busy', 'true');
    await expect(discover(page).getByRole('button', {name: 'Search', exact: true})).toBeDisabled();
    await refresh(page);
    await expect(results(page)).toHaveText([/Second reply/]);
    release();
    await expect(discover(page).getByRole('status')).toHaveText('1 flows found');
    await expect(results(page)).toHaveText([/Second reply/]);
  } finally {release();await page.unrouteAll({behavior: 'wait'});await f.cleanup();}
});

test('a delayed result of the old worktree cannot appear after a worktree switch', async ({page}) => {
  const f = await fixtureRepository(flowFiles()), other = f.root + '-search-other';git(f.root, 'worktree', 'add', '-qb', 'search-other', other);
  let release, entered;const blocked = new Promise(resolve => release = resolve), started = new Promise(resolve => entered = resolve);
  await page.route('**/api/flows/query', async route => {
    const b = route.request().postDataJSON();
    if (b.operation === 'search' && b.worktree === f.root) {entered();await blocked;try {await route.fulfill({json: reply([['wrong', 'Wrong older worktree result']])});} catch {}return;}
    return route.continue();
  });
  try {
    await openRepository(page, f.root);await openDiscover(page);await search(page, 'shared access');await started;
    await page.getByRole('button', {name: /^Branch main/}).click();await page.getByRole('menuitemradio', {name: /^search-other/}).click();
    await expect(page.getByRole('button', {name: /^Branch search-other/})).toBeVisible();
    await openDiscover(page);
    await expect(discover(page).getByLabel('Behavior', {exact: true})).toHaveValue('');
    await search(page, 'shared access');await expect(results(page).first()).toContainText('Shared access');
    release();
    await expect(results(page).filter({hasText: 'Wrong older worktree result'})).toHaveCount(0);
    await expect(results(page).first()).toContainText('Shared access');
  } finally {release();await page.unrouteAll({behavior: 'wait'});git(f.root, 'worktree', 'remove', '--force', other);await f.cleanup();}
});

// Recorded executions.
const stateDir = () => process.env.ARTIFACT_PLANE_TEST_STATE_DIR;
function hook(root, session, kind, extra = {}) {
  execFileSync(process.execPath, ['server/runtime-cli.js', 'hook', '--state-dir', stateDir()], {cwd: new URL('../../', import.meta.url), input: JSON.stringify({cwd: root, session_id: session, hook_event_name: kind, turn_id: 'turn', ...extra}), stdio: ['pipe', 'pipe', 'ignore']});
}
async function moreItems(page) {
  await page.getByRole('button', {name: 'More', exact: true}).click();
  const items = await page.getByRole('menu', {name: 'More'}).getByRole('menuitem').allTextContents();
  await page.keyboard.press('Escape');
  return items;
}

test('More lists Recorded executions only when contexts exist; a recorded graph survives worktree removal', async ({page}) => {
  const f = await runtimeFixture(), other = f.root + '-worker';git(f.root, 'worktree', 'add', '-qb', 'worker', other);
  const store = new RuntimeStore({stateDir: stateDir()});
  try {
    await openRepository(page, f.root);
    await expect.poll(() => moreItems(page)).not.toContainEqual(expect.stringMatching(/^Recorded executions/));
    const attempt = await bind(store, other);hook(other, 'session', 'UserPromptSubmit');hook(other, 'session', 'Stop');
    git(f.root, 'worktree', 'remove', '--force', other);
    await expect.poll(() => moreItems(page)).toContainEqual(expect.stringMatching(/^Recorded executions/));
    await openMore(page, 'Recorded executions');
    await expect(recorded(page).getByRole('heading', {level: 1})).toHaveText('Recorded executions');
    const entry = recorded(page).getByRole('button', {name: /^Live execution/});
    await expect(entry).toContainText('worktree removed');await entry.click();
    await expect(recorded(page).getByRole('heading', {level: 1})).toHaveText('Live execution');
    await expect(recorded(page)).toContainText('the original worktree is removed');
    await expect(recorded(page)).toContainText('A recorded execution context does not verify current knowledge, plan approval or version establishment.');
    const graph = recorded(page).getByRole('group', {name: 'Captured implementation graph'});
    await expect(graph.locator('.task-node').filter({hasText: 'Task'})).toHaveCount(2);
    await expect(graph.locator('.react-flow__node').filter({hasText: 'Task A'})).toContainText('Validating · 1 attempt');
    await graph.locator('.react-flow__node').filter({hasText: 'Task A'}).click();
    const details = recorded(page).locator('.recorded-task');
    await expect(details.getByRole('heading', {level: 3})).toHaveText('Task A');
    await expect(details).toContainText('session · Validating');
    await expect(details).toContainText('Observations and reported validation do not establish versions.');
    expect(attempt.context).toBeTruthy();
    for (const width of [390, 1440]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page)).toBe(true);}
    await page.reload();await expect(region(page, 'Work page')).toBeVisible();
    await openMore(page, 'Recorded executions');await recorded(page).getByRole('button', {name: /^Live execution/}).click();
    await expect(recorded(page).getByRole('group', {name: 'Captured implementation graph'}).locator('.react-flow__node').filter({hasText: 'Task A'})).toBeVisible();
  } finally {store.close();await f.cleanup();}
});

test('Recorded executions show a failed read with Retry, and the entry returns when recording begins', async ({page}) => {
  const f = await runtimeFixture(), store = new RuntimeStore({stateDir: stateDir()}), state = {fail: true};
  await page.route('**/api/runtime/query', async route => {
    if (state.fail) await route.fulfill({status: 500, json: {error: 'History temporarily unavailable'}});
    else await route.continue();
  });
  try {
    await openRepository(page, f.root);
    // A failed read hides the entry; activity after recovery shows it.
    await expect.poll(() => moreItems(page)).not.toContainEqual(expect.stringMatching(/^Recorded executions/));
    state.fail = false;await bind(store, f.root);hook(f.root, 'session', 'UserPromptSubmit');
    await expect.poll(() => moreItems(page), {timeout: 15000}).toContainEqual(expect.stringMatching(/^Recorded executions/));
    await openMore(page, 'Recorded executions');
    await expect(recorded(page).getByRole('button', {name: /^Live execution/})).toBeVisible();
    // A later failed read stays on the page with Retry.
    state.fail = true;hook(f.root, 'session', 'PreToolUse', {tool_name: 'Bash'});
    await expect(recorded(page).getByRole('alert')).toContainText('History temporarily unavailable');
    state.fail = false;await recorded(page).getByRole('alert').getByRole('button', {name: 'Retry', exact: true}).click();
    await expect(recorded(page).getByRole('button', {name: /^Live execution/})).toBeVisible();
    await expect(recorded(page).getByRole('alert')).toHaveCount(0);
  } finally {store.close();await page.unrouteAll({behavior: 'ignoreErrors'});await f.cleanup();}
});

test('the attempt list of a recorded task labels an inferred binding', async ({page}) => {
  // The store persists across tests, so each run uses new session names.
  const f = await runtimeFixture(), store = new RuntimeStore({stateDir: stateDir()}), run = Date.now().toString(36);
  const inferred = 'inferred-' + run, child = 'child-' + run, explicit = 'explicit-' + run;
  try {
    await store.bind({root: f.root, artifact: 'demo', change: 'change-live', task: 'a.md', session: inferred, agent: child, unit: 'live', binding: 'inferred'});
    await bind(store, f.root, 'a.md', explicit);
    hook(f.root, inferred, 'PreToolUse', {agent_id: child, tool_name: 'Read'});hook(f.root, explicit, 'UserPromptSubmit');
    await openRepository(page, f.root);
    await openMore(page, 'Recorded executions');await recorded(page).getByRole('button', {name: /^Live execution/}).click();
    await recorded(page).getByRole('group', {name: 'Captured implementation graph'}).locator('.react-flow__node').filter({hasText: 'Task A'}).click();
    const attempts = recorded(page).locator('.recorded-task li');
    await expect(attempts.filter({hasText: child + ' ·'})).toContainText('Inferred from a task file read');
    await expect(attempts.filter({hasText: explicit + ' ·'})).not.toContainText('Inferred');
  } finally {store.close();await f.cleanup();}
});
