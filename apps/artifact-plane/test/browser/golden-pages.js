// Golden captures of claim golden-captures (CP1). One fixture repository
// without models, and one capture procedure that both
// scripts/capture-pages.mjs (on the 1.24.0 build) and golden.spec.js (on the
// current build) use. The fixture is self-contained so that later changes to
// shared test fixtures do not change it.
import {execFileSync} from 'node:child_process';
import {mkdir, realpath, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

export const GOLDEN_ROOT_NAME = 'golden-plane';
export const GOLDEN_FILTER = 'sign';
export const GOLDEN_WIDTHS = [1440, 390];
const tenant = 'docs/artifacts/tenant/';
const auth = 'docs/artifacts/authentication/';
const unit = 'docs/artifacts/units-of-work/member-sign-in/README.md';
const readme = (name, dependencies, body) => `---\ncurrent_version: 1.0.0\ndepends_on: ${JSON.stringify(dependencies)}\n---\n# ${name}\n\n${body}\n`;
const version = '---\nsource_change: change-initial\n---\n# Version\n\nThe first established knowledge.\n';
const emptyPlan = '---\ntasks: []\n---\n# Plan\n';
const flow = `---
flow:
  id: member-sign-in
  artifact: tenant
  title: Member sign-in
  trigger: A member opens the sign-in form.
  outcome: The member is signed in.
  entry_steps: [open]
  steps:
    - id: open
      title: Open the sign-in form
      supports: [form]
    - id: check
      title: Check the identity rules
      supports: [rules, sign-in-test]
  transitions:
    - from: open
      to: check
  support:
    - id: form
      kind: implementation
      path: src/sign-in.js
      requires: Show the sign-in form.
      basis: static
    - id: rules
      kind: element
      artifact: tenant
      element: specifications/identity.md
      requires: Identity rules.
      basis: documented
    - id: sign-in-test
      kind: test
      path: test/sign-in.test.js
      requires: Prove sign-in.
      basis: static
  gaps: []
  exclusions: []
---
# Member sign-in

A member signs in with one identity.
`;
const login = requires => `---\nreferences:\n  - artifact: tenant\n    element: specifications/identity.md\n    requires: ${requires}\n---\n# Login rules\n\nA member signs in with the tenant identity.\n`;
const main = new Map([
  [tenant + 'README.md', readme('Tenant', [], 'Tenant owns member identity.')],
  [tenant + 'requirements/identity.md', '# Identity need\n\nEach member has one identity.\n'],
  [tenant + 'specifications/identity.md', '# Identity\n\nA member has one identity and signs in with it.\n'],
  [tenant + 'specifications/flows/member-sign-in.md', flow],
  [tenant + 'versions/1.0.0/README.md', version],
  [tenant + 'changes/change-initial/README.md', '# Initial tenant\n\nStart the tenant knowledge.\n'],
  [tenant + 'changes/change-initial/tasks/README.md', emptyPlan],
  [auth + 'README.md', readme('Authentication', ['tenant'], 'Authentication signs members in.')],
  [auth + 'requirements/login.md', '# Login need\n\nMembers sign in.\n'],
  [auth + 'specifications/login.md', login('One identity per member.')],
  [auth + 'versions/1.0.0/README.md', version],
  [auth + 'changes/change-initial/README.md', '# Initial authentication\n\nStart the authentication knowledge.\n'],
  [auth + 'changes/change-initial/tasks/README.md', emptyPlan],
  ['src/sign-in.js', "export function signIn(name) {\n  return Boolean(name);\n}\n"],
  ['test/sign-in.test.js', "import {signIn} from '../src/sign-in.js';\nsignIn('member');\n"],
]);
const branch = new Map([
  [auth + 'specifications/login.md', login('One verified identity per member.')],
  [auth + 'changes/change-sign-in/README.md', '---\ntier: medium\n---\n\n# Sign in verified members\n\n## Reason and scope\n\nOnly verified members sign in.\n'],
  [auth + 'changes/change-sign-in/tasks/README.md', '---\ntasks: [01-verify.md]\n---\n# Plan\n\n1. [Verify](01-verify.md): check the verified identity.\n'],
  [auth + 'changes/change-sign-in/tasks/01-verify.md', '---\nid: verify\ndepends_on: []\n---\n# Verify\n\n## Definition of Done\n\n- [ ] Sign-in refuses an unverified member.\n\n## Evidence\n\nImplementation has not started.\n'],
  [unit, '---\nunit_of_work: member-sign-in\nchanges:\n  - artifact: authentication\n    change: change-sign-in\nacceptance:\n  - id: verified\n    criterion: Only verified members sign in.\nevidence: []\n---\n# Member sign-in\n\n## Purpose\n\nSign in verified members only.\n'],
]);

// Fixed names, dates and hooks make the commit IDs the same on every run.
function commit(root, date, message) {
  const env = {...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date, GIT_OPTIONAL_LOCKS: '0'};
  const git = (...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', '-c', 'user.name=Golden Fixture', '-c', 'user.email=golden@example.invalid', '-C', root, ...args], {env, stdio: ['ignore', 'pipe', 'pipe']});
  git('add', '-A');git('commit', '-q', '-m', message);
}
async function put(root, files) {
  for (const [path, text] of files) {await mkdir(join(root, path, '..'), {recursive: true});await writeFile(join(root, path), text);}
}
// Writes <parent>/golden-plane: main with two artifacts and a flow, and the
// checked-out branch change-sign-in with an open change in a unit. Returns the real path.
export async function goldenRepository(parent) {
  const root = join(parent, GOLDEN_ROOT_NAME);
  await put(root, main);
  execFileSync('git', ['init', '-q', '-b', 'main', root]);
  commit(root, '2026-01-01T00:00:00Z', 'Establish tenant and authentication');
  execFileSync('git', ['-C', root, 'checkout', '-q', '-b', 'change-sign-in']);
  await put(root, branch);
  commit(root, '2026-01-02T00:00:00Z', 'Start change-sign-in');
  return realpath(root);
}

// The capture of the top bar, the sidebar and the main region: their visible
// text lines and visible controls. Runs in the page.
function pageFacts() {
  const visible = node => {const r = node.getBoundingClientRect(), s = getComputedStyle(node);return r.width > 0 && r.height > 0 && s.visibility !== 'hidden';};
  const clean = text => (text || '').replace(/\s+/g, ' ').trim();
  const roles = {A: 'link', BUTTON: 'button', SELECT: 'combobox', TEXTAREA: 'textbox', SUMMARY: 'summary'};
  const role = node => node.getAttribute('role') || (node.tagName === 'INPUT' ? (['checkbox', 'radio'].includes(node.type) ? node.type : 'textbox') : roles[node.tagName]);
  const name = node => {
    if (node.getAttribute('aria-label')) return clean(node.getAttribute('aria-label'));
    const by = node.getAttribute('aria-labelledby');
    if (by) return clean(by.split(/\s+/).map(id => document.getElementById(id)?.textContent).join(' '));
    if (node.labels?.length) return clean([...node.labels].map(l => l.textContent).join(' '));
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)) return clean(node.getAttribute('placeholder') || node.getAttribute('title'));
    return clean(node.textContent) || clean(node.getAttribute('title'));
  };
  const selectorOfControls = 'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="menuitemradio"], [role="switch"], [role="treeitem"], [role="checkbox"], [role="radio"], [role="option"], [role="combobox"]';
  const region = selector => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const controls = [...element.querySelectorAll(selectorOfControls)].filter(visible).map(node => {
      const control = {role: role(node), name: name(node)};
      for (const [key, attribute] of [['title', 'title'], ['placeholder', 'placeholder'], ['keys', 'aria-keyshortcuts']]) if (node.getAttribute(attribute)) control[key] = clean(node.getAttribute(attribute));
      return control;
    });
    const text = visible(element) ? element.innerText.split('\n').map(clean).filter(Boolean) : [];
    return {text, controls};
  };
  return {topbar: region('header.topbar'), sidebar: region('nav[aria-label="Navigation"]'), main: region('main'), busy: document.querySelectorAll('[aria-busy="true"]').length};
}
async function facts(page, root) {
  const value = await page.evaluate(pageFacts);
  // The temporary parent of the fixture changes on every run.
  return JSON.parse(JSON.stringify(value).split(root).join('<root>'));
}
// Waits until two captures 400 ms apart are equal and nothing is busy.
async function settled(page, root) {
  let previous = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const current = JSON.stringify(await facts(page, root));
    if (current === previous && !JSON.parse(current).busy) {const {busy, ...rest} = JSON.parse(current);return rest;}
    previous = current;await page.waitForTimeout(400);
  }
  throw Error('The page did not settle.');
}

const narrow = width => width <= 800;
async function drawer(page, open) {
  const toggle = page.getByRole('button', {name: 'Navigation', exact: true});
  if (!await toggle.isVisible()) return;
  if ((await toggle.getAttribute('aria-expanded')) !== String(open)) await toggle.click();
}
const tree = page => page.getByRole('tree', {name: 'Knowledge'});
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
async function row(page, name, whole = false) {
  await drawer(page, true);
  await tree(page).getByRole('treeitem', whole ? {name, exact: true} : {name: new RegExp('^' + escape(name))}).first().click();
}
// Expands the kind row of an artifact; each expanded artifact has its own kind rows.
async function expand(page, artifact, kind) {
  await drawer(page, true);
  const key = await tree(page).evaluate((element, [artifact, kind]) => {
    const items = [...element.querySelectorAll('[role="treeitem"]')], title = item => item.querySelector('.tree-title')?.textContent;
    const at = items.findIndex(item => title(item) === artifact), level = Number(items[at]?.getAttribute('aria-level'));
    for (const item of items.slice(at + 1)) {
      const own = Number(item.getAttribute('aria-level'));
      if (own <= level) break;
      if (own === level + 1 && title(item) === kind) return item.dataset.key;
    }
    return null;
  }, [artifact, kind]);
  if (!key) throw Error(`No ${kind} row under ${artifact}.`);
  const item = tree(page).locator(`[data-key="${key.replace(/["\\]/g, '\\$&')}"]`);
  if ((await item.getAttribute('aria-expanded')) !== 'true') await item.click();
}
async function more(page, item) {
  await drawer(page, false);
  await page.getByRole('button', {name: 'More', exact: true}).click();
  await page.getByRole('menuitem', {name: new RegExp('^' + escape(item))}).click();
}
const region = (page, name) => page.getByRole('region', {name, exact: true});
// The seven pages of CPA1, opened from the sidebar and the More menu.
const PAGES = [
  ['work', async page => {await row(page, 'Current work');await region(page, 'Work page').waitFor();}],
  ['artifact', async page => {await row(page, 'Authentication', true);await region(page, 'Artifact page').waitFor();}],
  ['document', async page => {await row(page, 'Authentication', true);await expand(page, 'Authentication', 'Specifications');await row(page, 'Login rules');await region(page, 'Document page').waitFor();}],
  ['flow', async page => {await row(page, 'Tenant', true);await expand(page, 'Tenant', 'Flows');await row(page, 'Member sign-in');await region(page, 'Flow page').waitFor();}],
  ['change', async page => {await row(page, 'Sign in verified members');await region(page, 'Change page').waitFor();}],
  ['discover', async page => {
    await more(page, 'Discover behavior');
    const discover = region(page, 'Discover behavior');
    await discover.getByLabel('Behavior', {exact: true}).fill('member signs in');
    await discover.getByRole('button', {name: 'Search', exact: true}).click();
    await discover.getByRole('status').filter({hasText: /flows found$/}).waitFor({state: 'attached'});
  }],
  ['impact', async page => {
    await more(page, 'Impact');
    const form = page.getByRole('form', {name: 'Ask what a change affects'});
    await form.getByLabel('File or document path', {exact: true}).fill(tenant + 'specifications/identity.md');
    await form.getByRole('button', {name: 'Show impact', exact: true}).click();
    await region(page, 'Impact page').getByRole('group', {name: 'Show tiers'}).waitFor({timeout: 60000});
  }],
];
// One capture of a page state with a sidebar filter. A narrow screen unmounts
// the sidebar when its drawer closes, so the main region and the top bar are
// captured with the drawer closed, and the sidebar with the drawer open.
async function setFilter(page, text) {
  await drawer(page, true);
  await page.getByLabel('Search knowledge', {exact: true}).fill(text);
}
async function captureState(page, root, width, filter) {
  if (!narrow(width)) {await setFilter(page, filter);return settled(page, root);}
  await drawer(page, false);
  const closed = await settled(page, root);
  await setFilter(page, filter);
  const open = await settled(page, root);
  return {topbar: closed.topbar, sidebar: open.sidebar, main: closed.main};
}

// Opens the fixture at each width and captures each page with an empty
// filter and with the filter `sign`. newPage(width) returns a fresh page at
// the application origin.
export async function capturePages(newPage, root) {
  const captures = {};
  for (const width of GOLDEN_WIDTHS) {
    const page = await newPage(width);
    try {
      await page.goto('/');
      await page.getByLabel('Repository path').fill(root);
      await page.getByRole('button', {name: 'Open repository', exact: true}).click();
      await region(page, 'Work page').waitFor({timeout: 60000});
      for (const [name, open] of PAGES) {
        await open(page);
        for (const filter of ['', GOLDEN_FILTER]) captures[`${width} ${name} filter ${filter || 'empty'}`] = await captureState(page, root, width, filter);
        await setFilter(page, '');await drawer(page, false);
      }
    } finally {await page.close();}
  }
  return captures;
}

// The differences that CP1 allows: the title and aria-keyshortcuts of the
// sidebar search input, and the Discover link while the filter has text.
const discoverLink = /^Find “.*” in Discover behavior$/;
export function withoutAllowedDifferences(captures) {
  return Object.fromEntries(Object.entries(captures).map(([key, capture]) => {
    const filtered = !key.endsWith('filter empty');
    const sidebar = capture.sidebar && {
      text: capture.sidebar.text.filter(line => !(filtered && discoverLink.test(line))),
      controls: capture.sidebar.controls.filter(c => !(filtered && c.role === 'link' && discoverLink.test(c.name)))
        .map(c => {if (c.name !== 'Search knowledge') return c;const {title, keys, ...rest} = c;return rest;}),
    };
    return [key, {...capture, sidebar}];
  }));
}
