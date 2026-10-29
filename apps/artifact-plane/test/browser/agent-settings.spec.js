import {test, expect} from '@playwright/test';
import {chmod, readFile, stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fixtureRepository} from '../fixtures.js';
import {openRepository, openWork, region, noOverflow} from './workbench.js';
import {COMPUTER, CODEX_MODELS, settingsServer, writeSettingsFile} from './settings-fixtures.js';
// The Agent settings page and the profile editor (specifications/agent-orchestration.md:
// Workbench, Settings and launch profiles, Model and effort lists, Validity, Save).
// Each test runs a server of this process with a temporary configuration directory,
// a private state directory and fake harness programs (settings-fixtures.js).

const CHECK_FIRST = 'Check the provider first.', NOT_IN_CHECK = 'Not in the last check';
const settingsPage = page => region(page, 'Agent settings');
const dialog = page => page.getByRole('dialog');
const providerRow = (page, name) => settingsPage(page).getByRole('region', {name: 'Providers'}).getByRole('row').filter({has: page.getByRole('rowheader', {name, exact: true})});
const profileRow = (page, name) => settingsPage(page).getByRole('region', {name: 'Profiles'}).getByRole('row').filter({has: page.getByRole('rowheader', {name: new RegExp('^' + name)})});
const field = (page, name) => dialog(page).getByLabel(name, {exact: true});
const options = select => select.locator('option');
const readSettings = async file => JSON.parse(await readFile(file, 'utf8'));

async function openSettings(page, root) {
  await openRepository(page, root);
  return showSettings(page);
}
async function showSettings(page) {
  await page.getByRole('button', {name: 'More', exact: true}).click();
  await page.getByRole('menu', {name: 'More'}).getByRole('menuitem', {name: /^Agent settings/}).click();
  await expect(settingsPage(page).getByRole('heading', {level: 1})).toHaveText('Agent settings');
  await expect(settingsPage(page).getByText('Reading agent settings')).toHaveCount(0);
  return settingsPage(page);
}
// A server with fake programs, a repository and a page at the server origin.
async function setup(browser, options) {
  const server = await settingsServer(options), repository = await fixtureRepository(), page = await browser.newPage({baseURL: server.base, viewport: {width: 1440, height: 1000}});
  const errors = [];page.on('pageerror', e => errors.push(e.message));
  return {server, repository, page, errors, cleanup: async () => {await page.close();await server.close();await repository.cleanup();}};
}

test('AO18: without a settings file the workbench shows no session control except the Agent settings page', async ({browser}) => {
  const f = await setup(browser, {programs: {}});
  try {
    await openRepository(f.page, f.repository.root);
    // The work page, the sidebar and the top bar show no session control.
    for (const where of [f.page.locator('header.topbar'), f.page.getByRole('navigation', {name: 'Navigation'}), f.page.getByRole('main')])
      await expect(where.getByRole('button', {name: /session/i}).or(where.getByRole('link', {name: /session/i}))).toHaveCount(0);
    await f.page.getByRole('button', {name: 'More', exact: true}).click();
    const items = await f.page.getByRole('menu', {name: 'More'}).getByRole('menuitem').allTextContents();
    expect(items.filter(item => /session/i.test(item))).toEqual([]);
    expect(items).toContainEqual(expect.stringMatching(/^Agent settings/));
    await f.page.keyboard.press('Escape');
    const settings = await showSettings(f.page);
    await expect(settings.locator('.subtitle')).toContainText(`Personal settings in ${f.server.file}, outside every repository.`);
    await expect(settings.getByRole('heading', {name: 'No launch profile yet'})).toBeVisible();
    await expect(settings.getByText('Plane starts no agent session without a profile.')).toBeVisible();
    for (const role of ['Coordinator', 'Product owner', 'Technical lead', 'Implementer']) {
      await expect(settings.getByLabel(role, {exact: true})).toBeDisabled();
      await expect(settings.getByLabel(role, {exact: true})).toHaveValue('');
    }
    for (const name of ['Claude Code', 'Codex', 'OpenCode', 'Command Code', 'Gemini CLI', 'herdr', 'ttyd']) await expect(providerRow(f.page, name)).toContainText('Not found');
    await expect(providerRow(f.page, 'Session runner')).toContainText('Not available');
    await expect(settings.getByRole('button', {name: 'Check all'})).toBeDisabled();
    await f.page.setViewportSize({width: 390, height: 844});
    expect(await noOverflow(f.page)).toBe(true);
    // Reading the page writes no settings file.
    expect(existsSync(f.server.file)).toBe(false);
    expect(f.errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('AOA10: check a provider, create a profile from the lists, set it as the implementer default; another model shows its own levels', async ({browser}) => {
  const f = await setup(browser, {programs: {'codex': COMPUTER.codex, 'codex-acp': COMPUTER['codex-acp']}});
  try {
    const settings = await openSettings(f.page, f.repository.root), codex = providerRow(f.page, 'Codex');
    await expect(codex).toContainText('codex 0.170.0');await expect(codex).toContainText('codex-acp 2.3.0');
    await expect(codex).toContainText('Not checked');await expect(codex).toContainText('Check to read them');
    await codex.getByRole('button', {name: 'Check Codex'}).click();
    await expect(codex).toContainText('Signed in');
    await expect(codex).toContainText('gpt-5-codex, gpt-5 + 1 more');
    await codex.getByText('gpt-5-codex, gpt-5 + 1 more').click();
    await expect(codex.getByRole('listitem')).toHaveText(['gpt-5-codex low, medium, high', 'gpt-5 minimal, low, medium, high', 'gpt-5-mini no effort levels']);

    await settings.getByRole('button', {name: 'New profile'}).click();
    await expect(dialog(f.page)).toHaveAccessibleName('New profile');
    await expect(field(f.page, 'Name')).toBeFocused();
    await expect(field(f.page, 'Harness tool')).toHaveValue('codex');
    await expect(dialog(f.page).getByRole('status', {name: 'Source of the lists'})).toContainText('Checked');
    await expect(dialog(f.page).getByRole('status', {name: 'Source of the lists'})).toContainText('From the check of codex-acp 2.3.0, just now.');
    await expect(dialog(f.page).getByRole('radio', {name: /^ACP/})).toBeChecked();
    await field(f.page, 'Name').fill('Codex fast');
    await expect(dialog(f.page)).toContainText('ID: codex-fast');
    await expect(options(field(f.page, 'Model'))).toHaveText(CODEX_MODELS.map(m => `${m.name} (${m.id})`));
    await expect(field(f.page, 'Model')).toHaveValue('gpt-5-codex');
    await expect(options(field(f.page, 'Effort'))).toHaveText(['Model default', 'low', 'medium', 'high']);
    // Another model shows its own effort levels; a model without levels has none.
    await field(f.page, 'Model').selectOption('gpt-5');
    await expect(options(field(f.page, 'Effort'))).toHaveText(['Model default', 'minimal', 'low', 'medium', 'high']);
    await field(f.page, 'Effort').selectOption('minimal');
    await field(f.page, 'Model').selectOption('gpt-5-mini');
    await expect(field(f.page, 'Effort')).toBeDisabled();
    await expect(options(field(f.page, 'Effort'))).toHaveText(['Not offered for this model']);
    await expect(dialog(f.page)).toContainText('This model has no effort levels.');
    await field(f.page, 'Model').selectOption('gpt-5-codex');
    await field(f.page, 'Effort').selectOption('low');
    await expect(dialog(f.page).getByRole('checkbox', {name: /^Coordinator/})).toBeDisabled();
    await dialog(f.page).getByRole('checkbox', {name: /^Implementer/}).check();
    await expect(dialog(f.page).locator('.command-preview')).toHaveText('codex-acp\nthen select model gpt-5-codex and effort low through the ACP options');
    await f.page.setViewportSize({width: 390, height: 844});
    expect(await noOverflow(f.page)).toBe(true);
    await f.page.setViewportSize({width: 1440, height: 1000});
    await dialog(f.page).getByRole('button', {name: 'Save'}).click();
    await expect(dialog(f.page)).toHaveCount(0);
    await expect(settings.getByRole('status').filter({hasText: 'Saved the profile Codex fast.'})).toBeVisible();

    const row = profileRow(f.page, 'Codex fast');
    await expect(row.getByRole('cell')).toHaveText(['Codex', 'ACP · own sign-in', 'gpt-5-codex · low', 'Ready', 'EditDuplicateDelete']);
    await expect(settings.getByLabel('Implementer', {exact: true})).toHaveValue('codex-fast');
    await expect(settings.getByLabel('Coordinator', {exact: true}).locator('option')).toHaveText(['No terminal profile yet']);
    expect(await readSettings(f.server.file)).toEqual({version: 1, profiles: [{id: 'codex-fast', label: 'Codex fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5-codex', reasoning: 'low'}],
      roleDefaults: {implementer: 'codex-fast'}});
    expect((await stat(f.server.file)).mode & 0o777).toBe(0o600);

    // Edit keeps the ID and the role; another model shows its levels; Cancel writes nothing.
    await row.getByRole('button', {name: 'Edit Codex fast'}).click();
    await expect(dialog(f.page)).toHaveAccessibleName('Edit profile');
    await expect(dialog(f.page).getByRole('checkbox', {name: /^Implementer/})).toBeChecked();
    await expect(field(f.page, 'Effort')).toHaveValue('low');
    await field(f.page, 'Model').selectOption('gpt-5');
    await expect(options(field(f.page, 'Effort'))).toHaveText(['Model default', 'minimal', 'low', 'medium', 'high']);
    await expect(field(f.page, 'Effort')).toHaveValue('low');
    await f.page.keyboard.press('Escape');
    await expect(dialog(f.page)).toHaveCount(0);
    await expect(row.getByRole('button', {name: 'Edit Codex fast'})).toBeFocused();

    // Duplicate opens the editor with a copy; the role default stays with the original.
    await row.getByRole('button', {name: 'Duplicate Codex fast'}).click();
    await expect(dialog(f.page)).toHaveAccessibleName('Duplicate profile');
    await expect(field(f.page, 'Name')).toHaveValue('Codex fast (copy)');
    await expect(dialog(f.page)).toContainText('ID: codex-fast-copy');
    await expect(dialog(f.page).getByRole('checkbox', {name: /^Implementer/})).not.toBeChecked();
    await field(f.page, 'Model').selectOption('gpt-5');await field(f.page, 'Effort').selectOption('high');
    await dialog(f.page).getByRole('button', {name: 'Save'}).click();
    await expect(profileRow(f.page, 'Codex fast \\(copy\\)').getByRole('cell').nth(2)).toHaveText('gpt-5 · high');
    // The role selector saves at once.
    await settings.getByLabel('Implementer', {exact: true}).selectOption('codex-fast-copy');
    await expect(settings.getByRole('status').filter({hasText: 'Implementer sessions now start with Codex fast (copy).'})).toBeVisible();
    expect((await readSettings(f.server.file)).roleDefaults).toEqual({implementer: 'codex-fast-copy'});
    expect(f.errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('the editor shows "Check the provider first.", the documented Claude list, "Not in the last check" and the program it runs', async ({browser}) => {
  const checks = {codex: {program: 'codex-acp', programVersion: '2.3.0', checkedAt: new Date().toISOString(), models: [{id: 'gpt-5-codex', name: 'GPT-5 Codex', levels: ['low', 'high']}]}};
  const old = {id: 'old-codex', label: 'Old Codex', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-4', reasoning: 'high'};
  const f = await setup(browser, {programs: {claude: COMPUTER.claude, 'codex-acp': COMPUTER['codex-acp'], opencode2: COMPUTER.opencode2}, checks, settings: {version: 1, profiles: [old]}});
  try {
    const settings = await openSettings(f.page, f.repository.root);
    await expect(profileRow(f.page, 'Old Codex')).toContainText(NOT_IN_CHECK);
    await expect(profileRow(f.page, 'Old Codex')).toContainText('The profile can still start.');
    await profileRow(f.page, 'Old Codex').getByRole('button', {name: 'Edit Old Codex'}).click();
    await expect(field(f.page, 'Model')).toHaveValue('gpt-4');
    await expect(options(field(f.page, 'Model'))).toHaveText(['GPT-5 Codex (gpt-5-codex)', `gpt-4 · ${NOT_IN_CHECK}`]);
    await expect(options(field(f.page, 'Effort'))).toHaveText(['Model default', `high · ${NOT_IN_CHECK}`]);
    await expect(dialog(f.page).getByText(`${NOT_IN_CHECK}. The profile can still start.`)).toHaveCount(2);
    await dialog(f.page).getByRole('button', {name: 'Cancel'}).click();

    await settings.getByRole('button', {name: 'New profile'}).click();
    // OpenCode has no check: no list, and the editor asks for a check.
    await field(f.page, 'Harness tool').selectOption('opencode');
    const source = dialog(f.page).getByRole('status', {name: 'Source of the lists'});
    await expect(source).toContainText('Not checked');await expect(source).toContainText(CHECK_FIRST);
    await expect(field(f.page, 'Model')).toBeDisabled();
    await expect(options(field(f.page, 'Model'))).toHaveText([CHECK_FIRST]);
    await field(f.page, 'Name').fill('OpenCode Gemini');
    await dialog(f.page).getByRole('button', {name: 'Save'}).click();
    await expect(dialog(f.page).getByRole('alert', {name: 'Validity errors'})).toContainText(CHECK_FIRST);
    // Check from the editor brings the list and selects its first model.
    await source.getByRole('button', {name: 'Check'}).click();
    await expect(source).toContainText('From the check of opencode2 2.2.0, just now. ');
    await expect(field(f.page, 'Model')).toHaveValue('google/gemini-2.5-flash');
    await expect(field(f.page, 'Effort')).toBeDisabled();
    await field(f.page, 'Model').selectOption('google/gemini-2.5-pro');
    await expect(options(field(f.page, 'Effort'))).toHaveText(['Model default', 'low', 'high']);
    await field(f.page, 'Effort').selectOption('high');
    await expect(dialog(f.page).locator('.command-preview')).toHaveText('opencode2 acp\nthen select model google/gemini-2.5-pro and effort high through the ACP options');
    await dialog(f.page).getByRole('radio', {name: /^Terminal/}).check();
    await expect(dialog(f.page).locator('.command-preview')).toHaveText("opencode2 mini --model 'google/gemini-2.5-pro#high' --prompt \"<initial prompt>\"\nin a herdr pane");

    // Claude Code: the plan sign-in runs only in a terminal, with the documented list.
    await field(f.page, 'Harness tool').selectOption('claude-code');
    await expect(field(f.page, 'Sign-in')).toHaveValue('plan');
    await expect(dialog(f.page).getByRole('radio', {name: /^Terminal/})).toBeChecked();
    await expect(dialog(f.page).getByRole('radio', {name: /^ACP/})).toBeDisabled();
    await expect(dialog(f.page).getByText('Needs an API key sign-in for Claude.')).toBeVisible();
    await expect(source).toContainText('Documented');
    await expect(source).toContainText('The list comes from the Claude Code documentation for --model and --effort.');
    await expect(options(field(f.page, 'Model')).first()).toHaveText('Opus (opus)');
    await expect(options(field(f.page, 'Effort'))).toHaveText(['Model default', 'low', 'medium', 'high', 'xhigh', 'max']);
    await field(f.page, 'Effort').selectOption('high');
    await expect(dialog(f.page).locator('.command-preview')).toHaveText('claude --model opus --effort high "<initial prompt>"\nin a herdr pane');
    // An API key sign-in allows ACP; the ACP list needs a check.
    await field(f.page, 'Sign-in').selectOption('api-key');
    await dialog(f.page).getByRole('radio', {name: /^ACP/}).check();
    await expect(source).toContainText(CHECK_FIRST);
    await expect(dialog(f.page).getByText('claude-agent-acp is not on PATH.')).toHaveCount(2);
    expect(f.errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('a save that returns 409 shows the current settings and asks to apply the edit again', async ({browser}) => {
  const checks = {codex: {program: 'codex-acp', programVersion: '2.3.0', checkedAt: new Date().toISOString(), models: CODEX_MODELS}};
  const f = await setup(browser, {programs: {'codex-acp': COMPUTER['codex-acp']}, checks});
  try {
    const settings = await openSettings(f.page, f.repository.root);
    await settings.getByRole('button', {name: 'New profile'}).click();
    await field(f.page, 'Name').fill('Codex deep');
    await field(f.page, 'Model').selectOption('gpt-5');await field(f.page, 'Effort').selectOption('high');
    // Another editor writes the file while this editor is open.
    const hand = {id: 'hand-made', label: 'Hand made', harness: 'codex', connection: 'terminal', signIn: 'harness', model: 'gpt-5-codex'};
    await writeSettingsFile(f.server.file, {version: 1, profiles: [hand]});
    await dialog(f.page).getByRole('button', {name: 'Save'}).click();
    await expect(dialog(f.page)).toHaveCount(0);
    const notice = settings.getByRole('status').filter({hasText: 'The settings file changed after you opened the editor.'});
    await expect(notice).toContainText('The page shows the current settings. Apply your edit again.');
    await expect(profileRow(f.page, 'Hand made')).toBeVisible();
    await expect(profileRow(f.page, 'Codex deep')).toHaveCount(0);
    expect(await readSettings(f.server.file)).toEqual({version: 1, profiles: [hand]});
    // The edit opens again on the current settings and saves.
    await notice.getByRole('button', {name: 'Apply my edit again'}).click();
    await expect(field(f.page, 'Name')).toHaveValue('Codex deep');
    await expect(field(f.page, 'Effort')).toHaveValue('high');
    await dialog(f.page).getByRole('button', {name: 'Save'}).click();
    await expect(profileRow(f.page, 'Codex deep')).toBeVisible();
    expect((await readSettings(f.server.file)).profiles.map(p => p.id)).toEqual(['hand-made', 'codex-deep']);
    // A role default saved from an old read also refuses and shows the current settings.
    await writeSettingsFile(f.server.file, {version: 1, profiles: [hand]});
    await settings.getByLabel('Implementer', {exact: true}).selectOption('codex-deep');
    await expect(settings.getByRole('status').filter({hasText: 'The settings file changed after Plane read it.'})).toBeVisible();
    await expect(profileRow(f.page, 'Codex deep')).toHaveCount(0);
    await expect(settings.getByLabel('Implementer', {exact: true})).toHaveValue('');
    expect(f.errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('validity errors: an invalid profile and role default stay visible, and the editor lists the reasons of a refused save', async ({browser}) => {
  const checks = {codex: {program: 'codex-acp', programVersion: '2.3.0', checkedAt: new Date().toISOString(), models: CODEX_MODELS}};
  const yolo = {id: 'yolo', label: 'Yolo Codex', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5-codex', args: ['--yolo']};
  const f = await setup(browser, {programs: {'codex-acp': COMPUTER['codex-acp']}, checks, settings: {version: 1, roleDefaults: {implementer: 'yolo'}, profiles: [yolo]}});
  try {
    const settings = await openSettings(f.page, f.repository.root), row = profileRow(f.page, 'Yolo Codex');
    await expect(row).toContainText('Invalid');
    await expect(row).toContainText('--yolo skips permission prompts. Plane does not start such a profile.');
    await expect(settings.getByRole('region', {name: 'Default profile for each ADD role'})).toContainText('No valid profile has the id yolo.');
    await row.getByRole('button', {name: 'Edit Yolo Codex'}).click();
    const errors = dialog(f.page).getByRole('alert', {name: 'Validity errors'});
    await expect(errors).toContainText('This profile is not valid:');
    await expect(errors).toContainText('--yolo skips permission prompts.');
    await expect(dialog(f.page).locator('details')).toHaveAttribute('open', '');
    await expect(field(f.page, 'Extra arguments, one on each line')).toHaveValue('--yolo');
    await dialog(f.page).getByRole('button', {name: 'Cancel'}).click();

    await settings.getByRole('button', {name: 'New profile'}).click();
    await field(f.page, 'Name').fill('Unsafe');
    await dialog(f.page).getByText('Advanced: extra arguments and environment variables').click();
    await field(f.page, 'Environment variables, one NAME=value on each line').fill('BROKEN');
    await dialog(f.page).getByRole('button', {name: 'Save'}).click();
    await expect(errors).toContainText('Write each variable as NAME=value: BROKEN');
    await field(f.page, 'Extra arguments, one on each line').fill('--dangerously-skip-permissions');
    await field(f.page, 'Environment variables, one NAME=value on each line').fill('OPENAI_API_KEY=x');
    await dialog(f.page).getByRole('button', {name: 'Save'}).click();
    await expect(errors).toContainText('Plane cannot save this profile:');
    await expect(errors.getByRole('listitem')).toHaveText([
      'The variable OPENAI_API_KEY looks like a credential. Plane never passes a credential.',
      '--dangerously-skip-permissions skips permission prompts. Plane does not start such a profile.',
      'Implementer default: No valid profile has the id yolo.',
      'Profile yolo: --yolo skips permission prompts. Plane does not start such a profile.',
    ]);
    await f.page.setViewportSize({width: 390, height: 844});
    expect(await noOverflow(f.page)).toBe(true);
    await f.page.setViewportSize({width: 1440, height: 1000});
    await dialog(f.page).getByRole('button', {name: 'Cancel'}).click();
    // Delete asks first and removes the role default that names the profile.
    f.page.once('dialog', d => {expect(d.message()).toBe('Delete the profile Yolo Codex? Implementer will have no default profile.');d.accept();});
    await row.getByRole('button', {name: 'Delete Yolo Codex'}).click();
    await expect(settings.getByRole('status').filter({hasText: 'Deleted the profile Yolo Codex.'})).toBeVisible();
    await expect(settings.getByRole('heading', {name: 'No launch profile yet'})).toBeVisible();
    expect(await readSettings(f.server.file)).toEqual({version: 1, profiles: []});
    expect(f.errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('provider states: sign-in required, the Claude plan refusal, a stale check, a missing program and a refused settings file', async ({browser}) => {
  const checks = {codex: {program: 'codex-acp', programVersion: '2.2.0', checkedAt: '2026-10-01T00:00:00.000Z', models: CODEX_MODELS}};
  const f = await setup(browser, {programs: COMPUTER, checks, settings: {version: 1, terminal: {open: ['ghostty', '-e']}, profiles: [
    {id: 'cmd-default', label: 'Command Code default', harness: 'command-code', connection: 'acp', signIn: 'harness', model: 'default'},
    {id: 'script', label: 'Script', harness: 'other', connection: 'terminal', signIn: 'harness', model: 'local', command: ['my-agent', '--model', 'local']}]}});
  try {
    const settings = await openSettings(f.page, f.repository.root);
    await expect(providerRow(f.page, 'Codex')).toContainText('The program changed since the last check. Check again.');
    await expect(providerRow(f.page, 'Gemini CLI')).toContainText('Not found');
    await expect(providerRow(f.page, 'herdr')).toContainText('Open in terminal app runs ghostty -e herdr session attach …');
    await expect(providerRow(f.page, 'ttyd')).toContainText('ttyd 1.7.7');
    await settings.getByRole('button', {name: 'Check all'}).click();
    await expect(providerRow(f.page, 'Command Code')).toContainText('Sign-in required');
    await expect(providerRow(f.page, 'Command Code')).toContainText('Authentication required. Run cmd login in a terminal.');
    await expect(providerRow(f.page, 'Command Code')).toContainText('After sign-in');
    await expect(providerRow(f.page, 'Claude Code')).toContainText('Plan · terminal only');
    await expect(providerRow(f.page, 'Claude Code')).toContainText('ACP needs an API key sign-in');
    await expect(providerRow(f.page, 'Codex')).not.toContainText('The program changed since the last check.');
    await expect(settings.getByRole('button', {name: 'Check all'})).toBeEnabled();
    await expect(profileRow(f.page, 'Command Code default')).toContainText('Sign-in required');
    // A profile with harness other is shown, not edited.
    const script = profileRow(f.page, 'Script');
    await expect(script.getByRole('cell')).toHaveText(['Other command', 'Terminal · own sign-in', 'local', 'Ready', 'Edit this profile in the settings file.Delete']);
    await expect(script.getByRole('button', {name: 'Edit Script'})).toHaveCount(0);
    await f.page.setViewportSize({width: 390, height: 844});
    expect(await noOverflow(f.page)).toBe(true);
    // A settings file that other users can write is refused, shown and never replaced.
    await f.page.setViewportSize({width: 1440, height: 1000});
    await chmod(f.server.file, 0o666);
    await openWork(f.page);
    const again = await showSettings(f.page);
    await expect(again.getByRole('alert').filter({hasText: 'Other users can write the settings file.'})).toContainText('Plane does not use or replace this file.');
    await expect(again.getByRole('button', {name: 'New profile'})).toBeDisabled();
    expect(f.errors).toEqual([]);
  } finally {await f.cleanup();}
});
