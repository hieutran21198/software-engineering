import {test, expect} from '@playwright/test';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {git} from '../fixtures.js';
import {openRepository, openWork, region, noOverflow, showSidebar, tree} from './workbench.js';
import {writeSettingsFile} from './settings-fixtures.js';
import {PROFILES, SETTINGS, sessionServer} from './session-fixtures.js';
// The session pages and dialogs (specifications/agent-orchestration.md: Workbench, Start rules,
// States, Embedded terminal, Output, Recovery; mockup artboards 1, 2, 3, 3b, 4, 5, 7 and 9).
// Each test runs a server of this process with an injected fake runner client, a stub relay
// page and a private state directory (session-fixtures.js). No harness program, runner, herdr
// or ttyd starts.

const ROLE_TERMINAL = 'Role sessions run in a terminal, where you chat with the harness tool.';
const PERMISSION = {request: 'p1', title: 'The agent asks to run a command', description: null, toolKind: 'execute', command: 'node --test test/acp-client.test.js',
  options: [{optionId: 'allow', name: 'Allow once', kind: 'allow_once'}, {optionId: 'always', name: 'Allow always', kind: 'allow_always'}, {optionId: 'reject', name: 'Reject', kind: 'reject_once'}]};
const sessionPage = page => region(page, 'Session page');
const sessionsPage = page => region(page, 'Sessions page');
const dialog = page => page.getByRole('dialog');

async function setup(browser, options) {
  const f = await sessionServer(options), page = await browser.newPage({baseURL: f.base, viewport: {width: 1440, height: 1000}});
  const errors = [];page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  return {f, page, errors, cleanup: async () => {await page.close();await f.close();}};
}
const implementer = (f, task, profile = 'codex-fast', path = f.worktree) => f.start({path, role: 'implementer', profile, artifact: 'plane', change: 'change-sessions', task});
const role = (f, name, fields = {}) => f.start({path: f.root, role: name, profile: 'claude-opus-terminal', artifact: 'plane', change: 'change-sessions', ...fields});
const calls = (f, method) => f.runner.calls.filter(([m]) => m === method);
// The ACP implementer of task 03 with two commits, one uncommitted file and a permission request.
async function acpSession(f) {
  const session = await implementer(f, '03-acp-adapter.md');
  await f.write('apps/plane/server/acp-client.js', "export function startAgent(command) {\n  return command;\n}\n");
  f.commit('apps/plane/server/acp-client.js', 'Add the ACP JSON-RPC client');
  await f.write('apps/plane/server/runtime-store.js', 'export class RuntimeStore {\n  constructor() {\n    this.sessions = new Map();\n  }\n  close() {}\n}\n');
  f.commit('apps/plane/server/runtime-store.js', 'Map ACP updates to lifecycle events');
  await f.write('apps/plane/test/acp-client.test.js', "import test from 'node:test';\ntest('starts', () => {});\n");
  f.runner.update(session.id, {record: {state: 'working', harnessSession: 'codex-1'}, events: [{kind: 'session:prompted', source: 'initial'}], change: {state: 'processing'}});
  f.runner.update(session.id, {record: {state: 'waiting'}, events: [{kind: 'session:permission-requested', request: 'p1'}], change: {state: 'blocked'},
    live: {lastMessage: 'I added the client and its tests.', pending: [PERMISSION]}});
  return session;
}
async function openSessions(page) {
  await page.getByRole('button', {name: 'More', exact: true}).click();
  await page.getByRole('menu', {name: 'More'}).getByRole('menuitem', {name: /^Sessions/}).click();
  await expect(sessionsPage(page).getByRole('heading', {level: 1})).toHaveText('Sessions');
}
async function openTask(page, title) {
  await showSidebar(page);
  await tree(page).getByRole('treeitem', {name: /Run ADD sessions/}).first().click();
  await expect(region(page, 'Change page')).toBeVisible();
  await page.getByRole('button', {name: new RegExp('^' + title)}).click();
  return page.getByRole('region', {name: new RegExp(`^Task ${title.slice(0, 2)} details`)});
}

test('the Sessions page groups implementation tasks by change and lists role sessions; the top bar counts the waiting sessions; at phone width the waiting sessions come first (artboards 1 and 7)', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    const acp = await acpSession(f);
    const working = await implementer(f, '04-terminal-adapter.md', 'gemini-flash');
    f.runner.update(working.id, {record: {state: 'working'}, events: [{kind: 'session:prompted', source: 'initial'}], change: {state: 'processing'}});
    const stopped = await implementer(f, '02-launch-profiles.md', 'gemini-flash');
    f.runner.update(stopped.id, {record: {state: 'interrupted', reason: 'process-exit'}, events: [{kind: 'session:interrupted', reason: 'process-exit'}], change: {state: 'interrupted'}});
    const coordinator = await role(f, 'coordinator');
    f.runner.update(coordinator.id, {record: {state: 'waiting', harnessSession: 'h-1'}, events: [{kind: 'session:waiting'}]});
    const lead = await role(f, 'technical-lead');
    f.runner.update(lead.id, {record: {state: 'ended', reason: 'person'}, events: [{kind: 'session:ended', reason: 'person'}]});
    await openRepository(page, f.root);
    // The top bar shows the number of waiting sessions and links to the Sessions page.
    const badge = page.getByRole('button', {name: '2 sessions need you'});
    await expect(badge).toBeVisible();
    await badge.click();
    const sessions = sessionsPage(page);
    await expect(sessions.getByRole('heading', {level: 1})).toHaveText('Sessions');
    const tasks = sessions.getByRole('region', {name: 'change-sessions implementation tasks'});
    await expect(tasks.getByRole('heading', {level: 2})).toContainText('Run ADD sessions across harness tools · implementation tasks');
    const rows = tasks.locator('.session-row');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('02 Launch profiles');await expect(rows.nth(0)).toContainText('2 of 4 DoD');await expect(rows.nth(0)).toContainText('Gemini CLI · gemini-2.5-flash');await expect(rows.nth(0)).toContainText('Interrupted');
    await expect(rows.nth(1)).toContainText('03 ACP adapter');await expect(rows.nth(1)).toContainText('2 of 5 DoD');await expect(rows.nth(1)).toContainText('3 files +8 −1 · 2 commits');
    await expect(rows.nth(1)).toContainText('Codex · gpt-5-codex · low');await expect(rows.nth(1)).toContainText('Permission request');
    await expect(rows.nth(2)).toContainText('04 Terminal adapter');await expect(rows.nth(2)).toContainText('Working');
    await expect(tasks.getByRole('button', {name: 'Recover 02 Launch profiles'})).toBeVisible();
    const roles = sessions.getByRole('region', {name: 'Role sessions'});
    await expect(roles.locator('.session-row')).toHaveCount(2);
    await expect(roles.locator('.session-row').nth(0)).toContainText('Technical lead');await expect(roles.locator('.session-row').nth(0)).toContainText('Ended by you');
    await expect(roles.locator('.session-row').nth(1)).toContainText('Coordinator');await expect(roles.locator('.session-row').nth(1)).toContainText('Waiting in the terminal');
    await expect(roles.locator('.session-row').nth(1)).toContainText('Claude Code · opus');
    await expect(roles.getByRole('button', {name: 'Respawn Technical lead session'})).toBeVisible();
    // A new waiting session updates the count from the lifecycle events.
    f.runner.update(working.id, {record: {state: 'waiting'}, events: [{kind: 'session:permission-requested', request: 'p2'}], live: {pending: [{...PERMISSION, request: 'p2'}]}});
    await expect(page.getByRole('button', {name: '3 sessions need you'})).toBeVisible();
    // Phone width (artboard 7): the waiting sessions first; an ACP request can be answered in its card.
    await page.setViewportSize({width: 390, height: 844});
    await expect(sessions.getByRole('heading', {level: 2}).first()).toHaveText('Needs you · 3');
    await expect(sessions.getByRole('heading', {level: 2})).toHaveText(['Needs you · 3', 'Stopped · 2']);
    const needs = sessions.getByRole('region', {name: 'Needs you'}).getByRole('article');
    await expect(needs).toHaveCount(3);
    const card = needs.filter({hasText: 'Task 03 ACP adapter'});
    await expect(card).toContainText('The agent asks to run a command');
    await card.getByRole('button', {name: 'Allow once'}).click();
    await expect.poll(() => calls(f, 'answer').map(c => c.slice(1))).toEqual([[acp.id, 'p1', 'allow']]);
    await expect(sessions.getByRole('heading', {level: 2}).first()).toHaveText('Needs you · 2');
    await expect(needs.filter({hasText: 'Coordinator'})).toContainText('Open the terminal on the computer that runs Plane to answer.');
    expect(await noOverflow(page)).toBe(true);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('an ACP session page shows the header, Stop turn, End session, the permission request, the DoD, the commits, the last message, the output tree with the diff, and the message field (artboard 2, AOA9)', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    const session = await acpSession(f);
    // Hook observations of the harness session and lifecycle events never show on the page.
    f.hook('codex-1', 'Read', 'PreToolUse');f.hook('codex-1', 'Read', 'PostToolUse');
    await openRepository(page, f.root);
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'Open 03 ACP adapter'}).click();
    const view = sessionPage(page);
    await expect(view.getByRole('heading', {level: 1})).toHaveText('Task 03 ACP adapter');
    await expect(view.locator('.subtitle')).toHaveText(/^Implementer · Codex · gpt-5-codex · low · own sign-in · ACP · impl\/acp-adapter · started (just now|1 min ago)$/);
    await expect(view.locator('.session-actions')).toContainText('Waiting for you');
    // The pending permission request with the options of the agent.
    const request = view.getByRole('region', {name: 'Permission request'});
    await expect(request.getByRole('heading')).toHaveText('The agent asks to run a command');
    await expect(request).toContainText('node --test test/acp-client.test.js');
    await expect(request.getByRole('button')).toHaveText(['Allow once', 'Allow always', 'Reject']);
    // DoD, commits and the last message.
    await expect(view.getByRole('region', {name: 'Definition of Done'}).getByRole('heading')).toHaveText('Definition of Done · 2 of 5');
    await expect(view.getByRole('region', {name: 'Definition of Done'}).getByRole('checkbox', {checked: true})).toHaveCount(2);
    await expect(view.getByRole('region', {name: 'Commits since start'}).getByRole('listitem')).toContainText(['Map ACP updates to lifecycle events', 'Add the ACP JSON-RPC client']);
    await expect(view.getByRole('region', {name: 'Last message of the agent'})).toContainText('I added the client and its tests.');
    // AOA9: the changed files as a tree with their line counts and the diff of a selected file.
    const output = view.getByRole('region', {name: 'Output since start'});
    await expect(output.getByRole('heading')).toHaveText('Output since start · 3 files · +8 −1 · 1 file not committed');
    const files = output.getByRole('tree', {name: 'Changed files'});
    await expect(files.getByRole('group')).toHaveCount(2);
    await expect(files.getByRole('treeitem')).toHaveCount(3);
    await expect(files.getByRole('treeitem', {name: /^apps\/plane\/server\/acp-client\.js, Added · committed, 3 added, 0 removed/})).toHaveAttribute('aria-selected', 'true');
    await expect(output.getByRole('region', {name: 'Diff of apps/plane/server/acp-client.js'})).toContainText('export function startAgent(command) {');
    await files.getByRole('treeitem', {name: /^apps\/plane\/server\/runtime-store\.js/}).click();
    const diff = output.getByRole('region', {name: 'Diff of apps/plane/server/runtime-store.js'});
    await expect(diff).toContainText('Modified · committed');
    await expect(diff.locator('.diff-line.add')).toContainText(['    this.sessions = new Map();']);
    await expect(diff.locator('.diff-line.remove')).toHaveText(/constructor\(\) \{\}/);
    await files.getByRole('treeitem', {name: /^apps\/plane\/server\/runtime-store\.js/}).press('ArrowDown');
    await expect(output.getByRole('region', {name: 'Diff of apps/plane/test/acp-client.test.js'})).toContainText('Added · not committed');
    // Answer the request: the runner receives the option and the request leaves the page.
    await request.getByRole('button', {name: 'Allow always'}).click();
    await expect.poll(() => calls(f, 'answer').map(c => c.slice(1))).toEqual([[session.id, 'p1', 'always']]);
    await expect(view.getByRole('region', {name: 'Permission request'})).toHaveCount(0);
    await expect(view.locator('.session-actions')).toContainText('Working');
    // A message waits for the end of the turn.
    const message = view.getByRole('form', {name: 'Message to the agent'});
    await expect(message.getByRole('textbox')).toBeDisabled();
    await expect(message.getByRole('textbox')).toHaveAttribute('placeholder', 'You can send a message when the turn ends.');
    // A new output notice reads the output again; only the last message shows.
    await f.write('apps/plane/server/extra.js', 'export const extra = 1;\n');
    f.runner.update(session.id, {record: {state: 'idle'}, events: [{kind: 'session:output-changed'}, {kind: 'session:turn-ended', stopReason: 'end_turn'}], change: {state: 'validating'}, live: {lastMessage: 'The tests pass.'}});
    await expect(files.getByRole('treeitem')).toHaveCount(4);
    await expect(view.getByRole('region', {name: 'Last message of the agent'})).toHaveText('Last message of the agentThe tests pass.');
    await message.getByRole('textbox').fill('Record the evidence.');
    await message.getByRole('button', {name: 'Send'}).click();
    await expect.poll(() => calls(f, 'prompt').map(c => c.slice(1))).toEqual([[session.id, 'Record the evidence.']]);
    await expect(message.getByRole('textbox')).toHaveValue('');
    // Stop turn and End session.
    await view.getByRole('button', {name: 'Stop turn'}).click();
    await expect.poll(() => calls(f, 'cancel').length).toBe(1);
    await view.getByRole('button', {name: 'End session'}).click();
    await expect.poll(() => calls(f, 'end').length).toBe(1);
    await expect(view.locator('.session-actions')).toHaveText('Ended by you');
    await expect(view.getByRole('region', {name: 'Recover this task'})).toBeVisible();
    // No tool call log and no message stream.
    for (const text of ['PreToolUse', 'PostToolUse', 'session:prompted', 'session:output-changed', 'I added the client and its tests.']) await expect(page.getByRole('main')).not.toContainText(text);
    await page.setViewportSize({width: 390, height: 844});
    expect(await noOverflow(page)).toBe(true);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('AOA12: a role session page shows the change phases, the state, the embedded terminal with Full screen and Open in terminal app, End session and the output tree, and no chat (artboard 3)', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    const lead = await role(f, 'technical-lead');
    f.runner.update(lead.id, {record: {state: 'working', harnessSession: 'h-lead'}, events: [{kind: 'session:working'}], extra: {agentStatus: 'working'}});
    await f.write('docs/artifacts/plane/specifications/runner.md', '# Runner\n\nThe runner hosts the adapters.\n', f.root);
    await page.addInitScript(() => {window.__fullscreen = [];HTMLElement.prototype.requestFullscreen = function () {window.__fullscreen.push(this.tagName + ':' + this.title);return Promise.resolve();};});
    await openRepository(page, f.root);
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'Open Technical lead session'}).click();
    const view = sessionPage(page);
    await expect(view.getByRole('heading', {level: 1})).toHaveText('Technical lead · change-sessions');
    await expect(view.locator('.subtitle')).toContainText('Claude Code · opus · plan sign-in · terminal · main');
    await expect(view.locator('.session-actions')).toHaveText('WorkingEnd session');
    // The change phases of the session worktree.
    await expect(view.getByRole('list', {name: 'Phases'}).getByRole('listitem')).toHaveCount(5);
    await expect(view.locator('.phase-step[aria-current="step"]')).toContainText('Implementation');
    // The embedded terminal: the relay page in a frame of the same origin.
    const terminal = view.getByRole('region', {name: 'Terminal'});
    await expect(terminal.getByRole('heading')).toHaveText(`Terminal · herdr session plane-${lead.id}`);
    await expect(page.frameLocator(`iframe[title="Terminal of session ${lead.id}"]`).getByRole('textbox', {name: 'Terminal input'})).toBeAttached();
    expect(f.relay.requests).toContain(`/api/sessions/terminal/${lead.id}/`);
    await expect(terminal).toContainText('You chat and approve the plan here; Plane records no approval.');
    await terminal.getByRole('button', {name: 'Full screen'}).click();
    expect(await page.evaluate(() => window.__fullscreen)).toEqual([`IFRAME:Terminal of session ${lead.id}`]);
    await terminal.getByRole('button', {name: 'Open in terminal app'}).click();
    await expect.poll(() => calls(f, 'openTerminal').map(c => c.slice(1))).toEqual([[lead.id, ['ghostty', '-e']]]);
    // The output tree.
    const output = view.getByRole('region', {name: 'Output since start'});
    await expect(output.getByRole('treeitem', {name: /^docs\/artifacts\/plane\/specifications\/runner\.md, Added · not committed/})).toBeVisible();
    await expect(output.getByRole('region', {name: 'Diff of docs/artifacts/plane/specifications/runner.md'})).toContainText('The runner hosts the adapters.');
    // No chat built by Plane: no message field, no send control and no message list.
    await expect(view.getByRole('textbox')).toHaveCount(0);
    await expect(view.getByRole('button', {name: /^(Send|Stop turn)$/})).toHaveCount(0);
    await expect(view.getByRole('region', {name: 'Last message of the agent'})).toHaveCount(0);
    // End session.
    await view.getByRole('button', {name: 'End session'}).click();
    await expect(view.locator('.session-actions')).toHaveText('Ended by you');
    await expect(view.getByRole('region', {name: 'Terminal'})).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('AOA12: the launch dialog refuses a role session with an ACP profile with the reason of the start rule', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    await openRepository(page, f.root);
    await showSidebar(page);
    await tree(page).getByRole('treeitem', {name: /Run ADD sessions/}).first().click();
    await region(page, 'Change page').getByRole('button', {name: 'Start session'}).click();
    await expect(dialog(page)).toHaveAccessibleName('Start session');
    await dialog(page).getByLabel('Role').selectOption('technical-lead');
    // The role default is selected; each ACP profile shows the reason why it cannot start.
    await expect(dialog(page).getByRole('radio', {name: /^Claude Opus \(terminal\)/})).toBeChecked();
    await expect(dialog(page).getByRole('radio', {name: /^Claude Opus \(terminal\)/})).toHaveAccessibleName(/default for technical leads/);
    for (const name of ['Codex fast', 'Gemini Flash', 'Claude Sonnet \\(API key\\)']) {
      const radio = dialog(page).getByRole('radio', {name: new RegExp('^' + name)});
      await expect(radio).toBeDisabled();
      await expect(radio).toHaveAccessibleName(new RegExp(ROLE_TERMINAL.replace(/[.,]/g, '.')));
    }
    await expect(dialog(page).getByRole('note')).toHaveText('Check before you startUpstream artifact Platform has no established version.Plane does not record plan approval.');
    // The settings change after the dialog read them: the server refuses the start with rule 5.
    await writeSettingsFile(f.file, {...SETTINGS, roleDefaults: {}, profiles: SETTINGS.profiles.map(p => p.id === PROFILES.opus.id ? {...p, signIn: 'api-key', connection: 'acp'} : p)});
    await dialog(page).getByRole('button', {name: 'Start session'}).click();
    await expect(dialog(page).getByRole('alert')).toHaveText(`Plane did not start the session. ${ROLE_TERMINAL} (start rule 5)`);
    expect(calls(f, 'start')).toEqual([]);
    const refused = await f.post('/api/sessions/start', {path: f.root, role: 'product-owner', profile: 'codex-fast', artifact: 'plane', change: 'change-sessions'});
    expect([refused.status, refused.body.error, refused.body.rule]).toEqual([409, ROLE_TERMINAL, 5]);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('when a terminal session waits, the notice names the tool of the PermissionRequest observed before herdr reports blocked, marks the terminal and offers Focus terminal without an answer control (artboard 3b)', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    const coordinator = await role(f, 'coordinator');
    f.runner.update(coordinator.id, {record: {state: 'working', harnessSession: 'claude-7f3c'}, events: [{kind: 'session:working'}], extra: {agentStatus: 'working'}});
    await openRepository(page, f.root);
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'Open Coordinator session'}).click();
    const view = sessionPage(page), terminal = view.getByRole('region', {name: 'Terminal'});
    await expect(terminal).toBeVisible();
    await expect(view.getByRole('status').filter({hasText: 'asks to use'})).toHaveCount(0);
    // Claude Code runs the PermissionRequest hook, then herdr reports blocked.
    f.hook('claude-7f3c', 'Bash');
    f.runner.update(coordinator.id, {record: {state: 'waiting'}, events: [{kind: 'session:waiting'}], extra: {agentStatus: 'blocked'}});
    const notice = view.locator('.terminal-wait');
    await expect(notice).toContainText('Claude Code asks to use Bash');
    await expect(notice).toContainText('Read the request and answer it in the terminal below. Plane does not answer for you.');
    await expect(notice.getByRole('button')).toHaveText(['Focus terminal']);
    await expect(view.locator('.session-actions')).toContainText('Waiting for you · permission');
    await expect(terminal).toHaveClass(/waiting/);
    await expect(page.getByRole('button', {name: '1 session needs you'})).toBeVisible();
    await notice.getByRole('button', {name: 'Focus terminal'}).click();
    await expect(page.frameLocator(`iframe[title="Terminal of session ${coordinator.id}"]`).getByRole('textbox', {name: 'Terminal input'})).toBeFocused();
    // The next wait without a new request has the general text.
    f.runner.update(coordinator.id, {record: {state: 'working'}, events: [{kind: 'session:working'}], extra: {agentStatus: 'working'}});
    await expect(notice).toHaveCount(0);
    f.runner.update(coordinator.id, {record: {state: 'waiting'}, events: [{kind: 'session:waiting'}], extra: {agentStatus: 'blocked'}});
    await expect(notice).toContainText('Claude Code waits for you in the terminal');
    await expect(view.locator('.session-actions')).toContainText(/^Waiting for you(End session)$/);
    // herdr reports unknown for an agent that it does not detect.
    f.runner.update(coordinator.id, {extra: {agentStatus: 'unknown'}});
    await expect(view).toContainText('Plane cannot see when this agent waits.');
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('at a narrow width a terminal session page shows Open this session on a computer; without the relay it offers Open in terminal app only', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    const owner = await f.start({path: f.root, role: 'product-owner', profile: 'codex-frontier-terminal', artifact: 'plane', change: 'change-sessions'});
    f.runner.update(owner.id, {record: {state: 'waiting'}, events: [{kind: 'session:waiting'}], extra: {agentStatus: 'blocked', relay: {available: false, reason: 'The program ttyd is missing.'}}});
    await openRepository(page, f.root);
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'Open Product owner session'}).click();
    const view = sessionPage(page), terminal = view.getByRole('region', {name: 'Terminal'});
    await expect(terminal).toContainText('The embedded terminal is not available.');
    await expect(terminal).toContainText('The program ttyd is missing.');
    await expect(terminal.locator('iframe')).toHaveCount(0);
    await expect(view.getByRole('button', {name: /^(Full screen|Focus terminal)$/})).toHaveCount(0);
    await expect(terminal.getByRole('button')).toHaveText(['Open in terminal app']);
    await expect(view.locator('.terminal-wait')).toContainText('Codex waits for you in the terminal');
    expect(f.relay.requests).toEqual([]);
    // With the relay at a narrow width: no frame, the sentence and Open in terminal app.
    f.runner.update(owner.id, {extra: {relay: {available: true, reason: null}}});
    await expect(terminal.locator('iframe')).toHaveCount(1);
    await page.setViewportSize({width: 390, height: 844});
    await expect(terminal).toContainText('Open this session on a computer');
    await expect(terminal.locator('iframe')).toHaveCount(0);
    await expect(terminal.getByRole('button')).toHaveText(['Open in terminal app']);
    await terminal.getByRole('button', {name: 'Open in terminal app'}).click();
    await expect.poll(() => calls(f, 'openTerminal').length).toBe(1);
    expect(await noOverflow(page)).toBe(true);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('the launch dialog opens from the task details, the change page and the Sessions page, selects the role default, shows the warnings and each refusal reason (artboard 4)', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    await openRepository(page, f.root);
    const details = await openTask(page, '03 ACP adapter');
    await details.getByRole('button', {name: 'Start implementer for task 03'}).click();
    await expect(dialog(page)).toHaveAccessibleName('Start implementer');
    await expect(dialog(page)).toContainText('Task 03 ACP adapter · plane/change-sessions');
    await expect(dialog(page).getByLabel('Role')).toHaveCount(0);
    await expect(dialog(page).getByRole('radio', {name: /^Codex fast/})).toBeChecked();
    await expect(dialog(page).getByRole('radio', {name: /^Codex fast/})).toHaveAccessibleName(/default for implementers/);
    await expect(dialog(page).getByRole('radio')).toHaveCount(5);
    await expect(dialog(page).getByRole('note').locator('span')).toHaveText([
      'Prerequisite task 01 Session store has 1 unchecked DoD item.', 'Prerequisite task 02 Launch profiles has 2 unchecked DoD items.',
      'Upstream artifact Platform has no established version.', 'Plane does not record plan approval. Start only a task of an approved plan.']);
    // The worktree of the task branch is the default; main is refused with the reason of rule 3.
    await expect(dialog(page).getByLabel('Worktree')).toHaveValue(f.worktree);
    await dialog(page).getByLabel('Worktree').selectOption(f.root);
    await dialog(page).getByRole('button', {name: 'Start session'}).click();
    await expect(dialog(page).getByRole('alert')).toHaveText('Plane did not start the session. An implementer session does not run on main. Select the worktree of the task branch. (start rule 3)');
    // A missing program: the reason of the runner.
    await dialog(page).getByLabel('Worktree').selectOption(f.worktree);
    await expect(dialog(page).getByRole('alert')).toHaveCount(0);
    const {RunnerError} = await import('../../server/runner-client.js');
    f.runner.fail = new RunnerError('missing-program', 'The program codex-acp is missing.', {program: 'codex-acp'});
    await dialog(page).getByRole('button', {name: 'Start session'}).click();
    await expect(dialog(page).getByRole('alert')).toHaveText('Plane did not start the session. The program codex-acp is missing.');
    f.runner.fail = null;
    await dialog(page).getByRole('radio', {name: /^Gemini Flash/}).check();
    await dialog(page).getByRole('button', {name: 'Start session'}).click();
    await expect(sessionPage(page).getByRole('heading', {level: 1})).toHaveText('Task 03 ACP adapter');
    const started = calls(f, 'start').at(-1)[1];
    expect([started.role, started.profile.id, started.task, started.worktree, started.branch]).toEqual(['implementer', 'gemini-flash', '03-acp-adapter.md', f.worktree, 'impl/acp-adapter']);
    // The task details now open the session; a second start returns the open session.
    const again = await openTask(page, '03 ACP adapter');
    await expect(again.getByRole('button', {name: 'Start implementer for task 03'})).toHaveCount(0);
    await again.getByRole('button', {name: 'Open session'}).click();
    await expect(sessionPage(page).getByRole('heading', {level: 1})).toHaveText('Task 03 ACP adapter');
    const before = calls(f, 'start').length;
    await (await openTask(page, '02 Launch profiles')).getByRole('button', {name: 'Start implementer for task 02'}).click();
    await dialog(page).getByRole('button', {name: 'Start session'}).click();
    await expect(sessionPage(page).getByRole('heading', {level: 1})).toHaveText('Task 02 Launch profiles');
    const second = await implementer(f, '02-launch-profiles.md');
    expect(calls(f, 'start').length).toBe(before + 1);
    expect(second.id).toBe(calls(f, 'start').at(-1)[1].session);
    // The change page: Start session with a role select.
    await showSidebar(page);
    await tree(page).getByRole('treeitem', {name: /Run ADD sessions/}).first().click();
    await region(page, 'Change page').getByRole('button', {name: 'Start session'}).click();
    await expect(dialog(page)).toHaveAccessibleName('Start session');
    await dialog(page).getByLabel('Role').selectOption('product-owner');
    await expect(dialog(page).getByRole('radio', {name: /^Claude Opus \(terminal\)/})).toBeChecked();
    await dialog(page).getByRole('button', {name: 'Cancel'}).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(region(page, 'Change page').getByRole('button', {name: 'Start session'})).toBeFocused();
    // The Sessions page: New session with role, change and task selects.
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'New session'}).click();
    await expect(dialog(page)).toHaveAccessibleName('New session');
    await expect(dialog(page).getByLabel('Role')).toHaveValue('implementer');
    await expect(dialog(page).getByLabel('Task').locator('option')).toHaveText(['01 Session store · 3 of 4 DoD', '02 Launch profiles · 2 of 4 DoD', '03 ACP adapter · 2 of 5 DoD', '04 Terminal adapter · 1 of 4 DoD']);
    await page.setViewportSize({width: 390, height: 844});
    expect(await noOverflow(page)).toBe(true);
    expect(await dialog(page).evaluate(node => node.parentElement.scrollWidth <= node.parentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('the Work page has Start ADD work: the dialog takes the request, the worktree and a terminal coordinator profile, and Start opens the session page (artboard 9, AOA11)', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    const coordWorktree = f.addWorktree('coord', 'claude/report');
    await openRepository(page, f.root);
    await region(page, 'Work page').getByRole('button', {name: 'Start ADD work'}).click();
    await expect(dialog(page)).toHaveAccessibleName('Start ADD work');
    await expect(dialog(page).getByLabel('What do you need?')).toBeFocused();
    await expect(dialog(page).getByLabel('Worktree')).toHaveValue(f.root);
    await expect(dialog(page).getByLabel('Worktree').locator('option')).toHaveText(['Repository root · main', /acp · impl\/acp-adapter$/, /coord · claude\/report$/]);
    // Only terminal profiles; the coordinator default is selected.
    await expect(dialog(page).getByLabel('Coordinator profile').locator('option')).toHaveText(['Claude Opus (terminal) · opus · default', 'Codex frontier (terminal) · gpt-5']);
    await expect(dialog(page)).toContainText('Write in any language. Plane sends this text to the agent and keeps no copy.');
    await dialog(page).getByRole('button', {name: 'Start', exact: true}).click();
    await expect(dialog(page).getByRole('alert')).toHaveText('Write what you need.');
    const request = 'Export the progress of one unit of work as a PDF. MARK-91c2';
    await dialog(page).getByLabel('What do you need?').fill(request);
    await dialog(page).getByLabel('Worktree').selectOption(coordWorktree);
    await dialog(page).getByLabel('Coordinator profile').selectOption('codex-frontier-terminal');
    await dialog(page).getByRole('button', {name: 'Start', exact: true}).click();
    await expect(sessionPage(page).getByRole('heading', {level: 1})).toHaveText('Coordinator');
    const started = calls(f, 'start').at(-1)[1];
    expect([started.role, started.profile.id, started.worktree, started.artifact, started.change]).toEqual(['coordinator', 'codex-frontier-terminal', coordWorktree, null, null]);
    expect(started.prompt).toContain(`The person asks: \`${request}\``);
    // The runtime store keeps no copy of the request.
    const bytes = ['runtime.sqlite', 'runtime.sqlite-wal'].map(name => join(f.state, name)).filter(existsSync).map(file => readFileSync(file).toString('latin1')).join('');
    expect(bytes.includes('MARK-91c2')).toBe(false);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('while a start runs, the Start button shows a spinner and "Starting <harness tool>…", a live region announces the start, the controls are disabled, a second click sends no second start, and Cancel still closes the dialog', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    let requests = 0, release;
    page.on('request', request => {if (request.url().endsWith('/api/sessions/start')) requests++;});
    const hold = () => {f.runner.hold = new Promise(done => {release = done;});};
    await openRepository(page, f.root);
    // The launch dialog: the runner holds the start, and the dialog shows it as busy.
    hold();
    const details = await openTask(page, '03 ACP adapter');
    await details.getByRole('button', {name: 'Start implementer for task 03'}).click();
    await dialog(page).getByRole('button', {name: 'Start session'}).click();
    const busy = dialog(page).getByRole('button', {name: 'Starting Codex…'});
    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(busy).toHaveText('Starting Codex…');
    await expect(busy.locator('.spinner')).toHaveCount(1);
    await expect(busy).toBeFocused();
    await expect(dialog(page).getByRole('status')).toHaveText('Starting Codex. This can take a few seconds.');
    await expect(dialog(page).getByLabel('Worktree')).toBeDisabled();
    await expect(dialog(page).getByRole('radio')).toHaveCount(5);
    for (const radio of await dialog(page).getByRole('radio').all()) await expect(radio).toBeDisabled();
    await expect(dialog(page).getByRole('button', {name: 'Cancel'})).toBeEnabled();
    // A second click and Enter on the busy button send no second start.
    await busy.click({force: true});
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    expect(requests).toBe(1);
    await expect.poll(() => calls(f, 'start').length).toBe(1);
    // After the reply, the session page opens.
    release();
    await expect(sessionPage(page).getByRole('heading', {level: 1})).toHaveText('Task 03 ACP adapter');
    expect(requests).toBe(1);
    // A failed start shows its reason after the wait, and the controls take input again.
    const {RunnerError} = await import('../../server/runner-client.js');
    hold();f.runner.fail = new RunnerError('missing-program', 'The program gemini is missing.', {program: 'gemini'});
    await (await openTask(page, '02 Launch profiles')).getByRole('button', {name: 'Start implementer for task 02'}).click();
    await dialog(page).getByRole('radio', {name: /^Gemini Flash/}).check();
    await dialog(page).getByRole('button', {name: 'Start session'}).click();
    await expect(dialog(page).getByRole('button', {name: 'Starting Gemini CLI…'})).toHaveAttribute('aria-busy', 'true');
    release();
    await expect(dialog(page).getByRole('alert')).toHaveText('Plane did not start the session. The program gemini is missing.');
    await expect(dialog(page).getByRole('button', {name: 'Start session'})).toHaveAttribute('aria-busy', 'false');
    await expect(dialog(page).getByLabel('Worktree')).toBeEnabled();
    f.runner.fail = null;
    await dialog(page).getByRole('button', {name: 'Cancel'}).click();
    // Start ADD work: the same busy Start button. Cancel closes the dialog during the start, and
    // the page stays when the start ends later.
    await openWork(page);
    hold();
    await region(page, 'Work page').getByRole('button', {name: 'Start ADD work'}).click();
    await dialog(page).getByLabel('What do you need?').fill('Export the progress of one unit of work.');
    await dialog(page).getByRole('button', {name: 'Start', exact: true}).click();
    const work = dialog(page).getByRole('button', {name: 'Starting Claude Code…'});
    await expect(work).toHaveAttribute('aria-busy', 'true');
    await expect(work.locator('.spinner')).toHaveCount(1);
    await expect(dialog(page).getByRole('status')).toHaveText('Starting Claude Code. This can take a few seconds.');
    for (const control of ['What do you need?', 'Worktree', 'Coordinator profile']) await expect(dialog(page).getByLabel(control)).toBeDisabled();
    await work.click({force: true});
    await page.waitForTimeout(300);
    expect(requests).toBe(3);
    await dialog(page).getByRole('button', {name: 'Cancel'}).click();
    await expect(dialog(page)).toHaveCount(0);
    const id = calls(f, 'start').at(-1)[1].session, reply = page.waitForResponse(response => response.url().endsWith('/api/sessions/start'));
    release();
    expect((await reply).status()).toBe(200);
    expect(f.store.session(id)?.state).toBe('starting');
    await page.waitForTimeout(300);
    await expect(region(page, 'Work page')).toBeVisible();
    await expect(sessionPage(page)).toHaveCount(0);
    await openSessions(page);
    const row = sessionsPage(page).getByRole('region', {name: 'Role sessions'}).locator('.session-row');
    await expect(row).toContainText('Coordinator');
    await expect(row.locator('.status-badge')).toHaveText('Starting');
    expect(calls(f, 'start')).toHaveLength(3);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('the state badge of a starting or working session shows a spinner, which stands still for reduced motion; an ACP session that starts says that the start can take a few seconds', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    // 01 starting (the fake runner leaves a new session in starting), 02 working, 03 waiting, 04 idle.
    const starting = await implementer(f, '01-session-store.md');
    const working = await implementer(f, '02-launch-profiles.md', 'gemini-flash');
    f.runner.update(working.id, {record: {state: 'working'}, events: [{kind: 'session:prompted', source: 'initial'}], change: {state: 'processing'}});
    const waiting = await implementer(f, '03-acp-adapter.md');
    f.runner.update(waiting.id, {record: {state: 'waiting'}, events: [{kind: 'session:permission-requested', request: 'p1'}], change: {state: 'blocked'}, live: {pending: [PERMISSION]}});
    const idle = await implementer(f, '04-terminal-adapter.md', 'gemini-flash');
    f.runner.update(idle.id, {record: {state: 'idle'}, events: [{kind: 'session:turn-ended', stopReason: 'end_turn'}]});
    const coordinator = await role(f, 'coordinator');
    f.runner.update(coordinator.id, {record: {state: 'interrupted', reason: 'process-exit'}, events: [{kind: 'session:interrupted', reason: 'process-exit'}]});
    const lead = await role(f, 'technical-lead');
    f.runner.update(lead.id, {record: {state: 'ended', reason: 'person'}, events: [{kind: 'session:ended', reason: 'person'}]});
    await openRepository(page, f.root);
    await openSessions(page);
    const badge = text => sessionsPage(page).locator('.session-row').filter({hasText: text}).locator('.status-badge');
    for (const [text, state, spinners] of [['01 Session store', 'Starting', 1], ['02 Launch profiles', 'Working', 1], ['03 ACP adapter', 'Permission request', 0],
      ['04 Terminal adapter', 'Idle', 0], ['Coordinator', 'Interrupted', 0], ['Technical lead', 'Ended by you', 0]]) {
      await expect(badge(text)).toHaveText(state);
      await expect(badge(text).locator('.spinner')).toHaveCount(spinners);
    }
    // The session page of the starting ACP session: the spinner and the line about the start.
    await sessionsPage(page).getByRole('button', {name: 'Open 01 Session store'}).click();
    const view = sessionPage(page), header = view.locator('.session-actions .status-badge'), line = view.getByText('Starting the agent. This can take a few seconds.');
    await expect(header).toHaveText('Starting');
    await expect(header.locator('.spinner')).toHaveCount(1);
    await expect(line).toBeVisible();
    // The spinner turns, and stands still for reduced motion; the text stays.
    const animation = () => header.locator('.spinner').evaluate(node => getComputedStyle(node).animationName);
    expect(await animation()).toBe('spin');
    await page.emulateMedia({reducedMotion: 'reduce'});
    expect(await animation()).toBe('none');
    await expect(header).toHaveText('Starting');
    await expect(line).toBeVisible();
    await page.emulateMedia({reducedMotion: 'no-preference'});
    // The line goes when the agent works; the spinner stays.
    f.runner.update(starting.id, {record: {state: 'working'}, events: [{kind: 'session:prompted', source: 'initial'}], change: {state: 'processing'}});
    await expect(header).toHaveText('Working');
    await expect(header.locator('.spinner')).toHaveCount(1);
    await expect(line).toHaveCount(0);
    // A terminal session that starts shows its terminal and no such line.
    await role(f, 'product-owner');
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'Open Product owner session'}).click();
    await expect(header).toHaveText('Starting');
    await expect(view.getByRole('region', {name: 'Terminal'})).toBeVisible();
    await expect(line).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('an interrupted or ended session offers the Recovery choices; Respawn of a role session starts the same role and change (artboard 5)', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    const stopped = await implementer(f, '02-launch-profiles.md', 'gemini-flash');
    f.runner.update(stopped.id, {record: {state: 'interrupted', reason: 'process-exit', harnessSession: 'gem-1'}, events: [{kind: 'session:interrupted', reason: 'process-exit'}], change: {state: 'interrupted'}, live: {protocolVersion: 1, resumable: true}});
    await openRepository(page, f.root);
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'Recover 02 Launch profiles'}).click();
    const view = sessionPage(page), recover = view.getByRole('region', {name: 'Recover this task'});
    await expect(view.locator('.session-actions')).toHaveText('Interrupted · agent process exited');
    await expect(recover).toContainText(`Gemini CLI · gemini-2.5-flash · ACP version 1 · stopped`);
    await expect(recover).toContainText(`Uncommitted files stay in the worktree ${f.worktree}; Plane changed no file.`);
    await expect(recover).toContainText('Gemini CLI offers session loading. The agent replays its history, and the attempt continues.');
    await expect(recover.getByRole('button')).toHaveText(['Resume', 'Respawn', 'Respawn']);
    await recover.getByRole('button', {name: 'Resume'}).click();
    await expect.poll(() => calls(f, 'resume').map(c => c[1])).toEqual([stopped.id]);
    await expect(view.locator('.session-actions')).toContainText('Working');
    await expect(view.getByRole('region', {name: 'Recover this task'})).toHaveCount(0);
    // Interrupted again: Respawn with another profile starts a new session with respawnOf.
    f.runner.update(stopped.id, {record: {state: 'interrupted', reason: 'process-exit'}, events: [{kind: 'session:interrupted', reason: 'process-exit'}], change: {state: 'interrupted'}, live: {resumable: false}});
    await expect(recover.getByRole('button')).toHaveText(['Respawn', 'Respawn']);
    await expect(recover.getByLabel('Respawn with another profile')).toHaveValue('codex-fast');
    await recover.getByLabel('Respawn with another profile').selectOption('claude-sonnet-api');
    await recover.getByRole('button', {name: 'Respawn with the selected profile'}).click();
    await expect.poll(() => calls(f, 'start').length).toBe(2);
    const respawn = calls(f, 'start').at(-1)[1];
    expect([respawn.role, respawn.profile.id, respawn.task, respawn.respawnOf]).toEqual(['implementer', 'claude-sonnet-api', '02-launch-profiles.md', stopped.id]);
    await expect(view.getByRole('heading', {level: 1})).toHaveText('Task 02 Launch profiles');
    await expect(view.locator('.subtitle')).toContainText('Claude Code · sonnet');
    // A role session: Respawn starts the same role and change, without respawnOf.
    const lead = await role(f, 'technical-lead');
    f.runner.update(lead.id, {record: {state: 'ended', reason: 'person'}, events: [{kind: 'session:ended', reason: 'person'}]});
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'Respawn Technical lead session'}).click();
    const leadRecovery = view.getByRole('region', {name: 'Recover this session'});
    await expect(leadRecovery).toContainText('A new technical lead session starts for the same change.');
    await expect(leadRecovery.getByRole('button', {name: 'Resume'})).toHaveCount(0);
    await leadRecovery.getByRole('button', {name: 'Respawn', exact: true}).click();
    await expect.poll(() => calls(f, 'start').length).toBe(4);
    const roleRespawn = calls(f, 'start').at(-1)[1];
    expect([roleRespawn.role, roleRespawn.profile.id, roleRespawn.artifact, roleRespawn.change, roleRespawn.respawnOf]).toEqual(['technical-lead', 'claude-opus-terminal', 'plane', 'change-sessions', null]);
    await expect(view.locator('.session-actions')).toContainText('Starting');
    // A coordinator without a change needs the request again: Plane kept no copy.
    const earlier = await f.start({path: f.root, role: 'coordinator', profile: 'claude-opus-terminal', request: 'First request.'});
    f.runner.update(earlier.id, {record: {state: 'ended', reason: 'error'}, events: [{kind: 'session:ended', reason: 'error'}], extra: {error: 'Sign in with the harness tool in a terminal, then start again.'}});
    await openSessions(page);
    await sessionsPage(page).getByRole('button', {name: 'Respawn Coordinator session'}).click();
    await expect(view).toContainText('Sign in with the harness tool in a terminal, then start again.');
    const coordinatorRecovery = view.getByRole('region', {name: 'Recover this session'});
    await coordinatorRecovery.getByRole('button', {name: 'Respawn', exact: true}).click();
    await expect(coordinatorRecovery.getByRole('alert')).toHaveText('Write what you need.');
    await coordinatorRecovery.getByLabel('What do you need?').fill('Second request.');
    await coordinatorRecovery.getByRole('button', {name: 'Respawn', exact: true}).click();
    await expect.poll(() => calls(f, 'start').length).toBe(6);
    expect(calls(f, 'start').at(-1)[1].prompt).toContain('The person asks: `Second request.`');
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('a coordinator session without a change shows the phases of the current change of its worktree when exactly one exists', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    // The root has two current changes; the worktree of the coordinator has one.
    const coord = f.addWorktree('coord', 'claude/report');
    git(coord, 'rm', '-rq', 'docs/artifacts/reports/changes/change-unit-report');
    git(coord, '-c', 'user.name=Agent', '-c', 'user.email=agent@example.invalid', 'commit', '-qm', 'Keep one change');
    const single = await f.start({path: coord, role: 'coordinator', profile: 'claude-opus-terminal', request: 'Continue the session work.'});
    const two = await f.start({path: f.root, role: 'coordinator', profile: 'claude-opus-terminal', request: 'Start new work.'});
    await openRepository(page, f.root);
    await openSessions(page);
    const rows = sessionsPage(page).getByRole('region', {name: 'Role sessions'}).locator('.session-row');
    await expect(rows).toHaveCount(2);
    await rows.nth(1).getByRole('button', {name: 'Open Coordinator session'}).click();
    const view = sessionPage(page);
    await expect(view.getByRole('heading', {level: 1})).toHaveText('Coordinator');
    await expect(view.getByRole('list', {name: 'Phases'})).toBeVisible();
    await expect(view.locator('.phase-step[aria-current="step"]')).toContainText('Implementation');
    await expect(view).toContainText('Phases of plane/change-sessions, the current change of this worktree.');
    expect(single.worktree).toBe(coord);
    await openSessions(page);
    await rows.nth(0).getByRole('button', {name: 'Open Coordinator session'}).click();
    await expect(view.getByRole('list', {name: 'Phases'})).toHaveCount(0);
    await expect(view).toContainText('No change yet. The phases show when the worktree has exactly one current change.');
    expect(two.worktree).toBe(f.root);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('the task runtime details show the harness tool and the model of the attempt', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser);
  try {
    const session = await implementer(f, '04-terminal-adapter.md', 'gemini-flash');
    f.runner.update(session.id, {record: {state: 'working'}, events: [{kind: 'session:prompted', source: 'initial'}], change: {state: 'processing'}});
    await openRepository(page, f.root);
    await page.getByRole('button', {name: /^Branch /}).click();
    await page.getByRole('menuitemradio', {name: /^impl\/acp-adapter/}).click();
    await expect(page.getByRole('button', {name: /^Branch impl\/acp-adapter/})).toBeVisible();
    const details = await openTask(page, '04 Terminal adapter');
    await expect(details.locator('.task-runtime')).toContainText('Processing');
    await expect(details.locator('.task-runtime')).toContainText(`${session.id} · Gemini CLI · gemini-2.5-flash ·`);
    await expect(details.getByRole('button', {name: 'Open session'})).toBeVisible();
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});

test('AO18: without a launch profile the change page, the task details, the Work page and the top bar show no session control', async ({browser}) => {
  const {f, page, errors, cleanup} = await setup(browser, {settings: null});
  try {
    await openRepository(page, f.root);
    await expect(page.getByRole('button', {name: 'Start ADD work'})).toHaveCount(0);
    const details = await openTask(page, '03 ACP adapter');
    await expect(details.getByRole('button')).toHaveText(['Open task document']);
    await expect(region(page, 'Change page').getByRole('button', {name: /^(Start session|Start implementer|Open session|Recover)/})).toHaveCount(0);
    await page.getByRole('button', {name: 'More', exact: true}).click();
    expect((await page.getByRole('menu', {name: 'More'}).getByRole('menuitem').allTextContents()).filter(item => /^Sessions/.test(item))).toEqual([]);
    await expect(page.locator('header.topbar').getByRole('button', {name: /need/})).toHaveCount(0);
    expect(existsSync(f.file)).toBe(false);
    expect(errors).toEqual([]);
  } finally {await cleanup();}
});
