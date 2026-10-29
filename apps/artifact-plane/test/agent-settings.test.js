// specifications/agent-orchestration.md: Settings and launch profiles, Provider catalog,
// Model and effort lists, Validity, Save. Every test uses temporary configuration and
// state directories and fake programs on an injected PATH.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync} from 'node:fs';
import {chmod, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {git} from './fixtures.js';
import {CATALOG, BYPASS_ARGUMENTS, BYPASS_PAIRS, CLAUDE_TERMINAL_MODELS, HARNESSES, VERSION_LIMIT_MS, bypassArgument, profileCommand} from '../server/provider-catalog.js';
import {CHECK_FIRST, NOT_IN_CHECK, SettingsError, createSettingsService, modelList, providerRecord, providersPath, readProviders, settingsPath, validateSettings} from '../server/agent-settings.js';

Object.assign(process.env, {GIT_AUTHOR_NAME: 'Author', GIT_AUTHOR_EMAIL: 'author@example.invalid', GIT_COMMITTER_NAME: 'Author', GIT_COMMITTER_EMAIL: 'author@example.invalid'});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const CLAUDE = {id: 'claude-opus-terminal', label: 'Claude Opus (terminal)', harness: 'claude-code', connection: 'terminal', signIn: 'plan', model: 'opus'};
const CODEX = {id: 'codex-fast', label: 'Codex fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5-codex', reasoning: 'low'};
const CODEX_CHECK = {program: 'codex-acp', programVersion: '2.3.0', checkedAt: '2026-10-29T07:00:00.000Z', models: [
 {id: 'gpt-5-codex', name: 'GPT-5 Codex', levels: ['low', 'medium', 'high']}, {id: 'gpt-6-luna', name: 'Luna', levels: []}, {id: 'gpt-x', name: 'X', levels: null}]};
const settings = (profiles, roleDefaults) => ({version: 1, ...(roleDefaults && {roleDefaults}), profiles});

async function dirs(t) {
 const dir = await mkdtemp(join(tmpdir(), 'agent-settings-')), config = join(dir, 'config'), state = join(dir, 'state');
 t.after(() => rm(dir, {recursive: true, force: true}));
 await mkdir(state, {mode: 0o700});
 return {dir, config, state, file: join(config, 'profiles.json')};
}
const writeChecks = (state, providers) => writeFile(providersPath(state), JSON.stringify({version: 1, providers}), {mode: 0o600});
async function writeSettingsFile(file, value, mode = 0o600) {
 await mkdir(join(file, '..'), {recursive: true, mode: 0o700});
 await writeFile(file, typeof value === 'string' ? value : JSON.stringify(value));await chmod(file, mode);
 return sha(await readFile(file));
}
const refusal = (status, message) => error => error instanceof SettingsError && error.status === status && (!message || message.test(error.message));
const profileOf = (profile, options) => validateSettings(settings([profile]), options).profiles[0];

test('the settings file is in ARTIFACT_PLANE_CONFIG_DIR, then $XDG_CONFIG_HOME/artifact-plane, then ~/.config/artifact-plane', async t => {
 assert.equal(settingsPath({ARTIFACT_PLANE_CONFIG_DIR: '/c', XDG_CONFIG_HOME: '/x', HOME: '/h'}), '/c/profiles.json');
 assert.equal(settingsPath({XDG_CONFIG_HOME: '/x', HOME: '/h'}), '/x/artifact-plane/profiles.json');
 assert.equal(settingsPath({HOME: '/h'}), '/h/.config/artifact-plane/profiles.json');
 assert.equal(settingsPath({XDG_CONFIG_HOME: 'relative', HOME: '/h'}), '/h/.config/artifact-plane/profiles.json', 'a relative XDG_CONFIG_HOME is ignored');
 const f = await dirs(t), digest = await writeSettingsFile(f.file, settings([CLAUDE]));
 const service = createSettingsService({env: {ARTIFACT_PLANE_CONFIG_DIR: f.config, PATH: ''}, stateDir: f.state});
 assert.equal(service.path, f.file);
 const view = await service.query();
 assert.deepEqual([view.path, view.digest, view.settings], [f.file, digest, settings([CLAUDE])]);
 const xdg = createSettingsService({env: {XDG_CONFIG_HOME: f.dir, PATH: ''}, stateDir: f.state});
 assert.equal(xdg.path, join(f.dir, 'artifact-plane', 'profiles.json'));
});

test('Plane refuses a settings file inside a repository or worktree, a symbolic link and a file that other users can write', async t => {
 const f = await dirs(t), repo = join(f.dir, 'repo'), wt = join(f.dir, 'wt'), inspected = join(f.dir, 'inspected');
 await mkdir(repo);git(repo, 'init', '-q', '-b', 'main');await writeFile(join(repo, 'a.txt'), 'a\n');git(repo, 'add', '.');git(repo, 'commit', '-qm', 'Start');
 git(repo, 'worktree', 'add', '-q', '-b', 'side', wt);await mkdir(inspected);
 const cases = [[join(repo, 'config'), []], [join(wt, 'deep', 'config'), []], [join(repo, '.git', 'plane'), []], [join(inspected, 'config'), [inspected]]];
 for (const [configDir, roots] of cases) {
  const service = createSettingsService({configDir, roots, stateDir: f.state, env: {PATH: ''}}), view = await service.query();
  assert.equal(view.refused, true, configDir);assert.match(view.error, /outside repositories and worktrees/);assert.equal(view.settings, null);
  assert.throws(() => service.save({settings: settings([CLAUDE]), digest: null}), refusal(409, /outside repositories/));
  assert.equal(existsSync(configDir), false, 'a refused save writes nothing');
 }
 // A symbolic link, even to a private file outside every repository.
 const target = join(f.dir, 'real.json'), linked = join(f.dir, 'linked');
 await writeFile(target, JSON.stringify(settings([CLAUDE])), {mode: 0o600});await mkdir(linked);await symlink(target, join(linked, 'profiles.json'));
 const link = createSettingsService({configDir: linked, stateDir: f.state, env: {PATH: ''}});
 assert.match((await link.query()).error, /symbolic link/);
 const targetDigest = sha(await readFile(target));
 assert.throws(() => link.save({settings: settings([]), digest: targetDigest}), refusal(409, /symbolic link/));
 assert.equal(lstatSync(join(linked, 'profiles.json')).isSymbolicLink(), true);assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), settings([CLAUDE]));
 // Group or other write permission.
 const service = createSettingsService({configDir: f.config, stateDir: f.state, env: {PATH: ''}});
 for (const mode of [0o620, 0o602, 0o666]) {
  const digest = await writeSettingsFile(f.file, settings([CLAUDE]), mode), view = await service.query();
  assert.equal(view.refused, true, mode.toString(8));assert.match(view.error, /Other users can write/);
  assert.throws(() => service.save({settings: settings([]), digest}), refusal(409, /Other users can write/));
 }
 await chmod(f.file, 0o644);
 assert.equal((await service.query()).refused, false, 'read permission for others is allowed');
});

test('each validity rule makes a profile invalid with its reason, and the invalid profile stays in the result', () => {
 const reasons = (profile, options) => {const p = profileOf(profile, options);assert.equal(p.valid, false, JSON.stringify(profile));return p.reasons.join(' ');};
 assert.equal(profileOf(CLAUDE).valid, true);assert.equal(profileOf(CODEX).valid, true);
 // Claude plan sign-in with ACP (AO17); the same profile with an API key sign-in is valid.
 assert.match(reasons({...CLAUDE, connection: 'acp'}), /plan sign-in runs only in a terminal/);
 assert.equal(profileOf({...CLAUDE, connection: 'acp', signIn: 'api-key'}).valid, true);
 // A connection that the provider does not offer, with a catalog entry that has no terminal program.
 const catalog = {...CATALOG, 'gemini-cli': {...CATALOG['gemini-cli'], terminal: undefined}};
 assert.match(reasons({id: 'g', harness: 'gemini-cli', connection: 'terminal', signIn: 'harness', model: 'gemini-3-pro'}, {catalog}), /Gemini CLI does not offer the terminal connection/);
 assert.match(reasons({...CODEX, connection: 'ssh'}), /connection must be acp or terminal/);
 // Each entry of the permission-bypass list, in args and in the command of harness other.
 const bypasses = [...BYPASS_ARGUMENTS.map(a => [a]), ...BYPASS_PAIRS, ...BYPASS_PAIRS.map(([flag, value]) => [`${flag}=${value}`])];
 for (const args of bypasses) {
  assert.match(reasons({...CODEX, args: ['--verbose', ...args]}), /skips permission prompts/, args.join(' '));
  assert.match(reasons({id: 'own', harness: 'other', connection: 'acp', signIn: 'harness', model: 'm', command: ['agent', ...args]}), /skips permission prompts/);
 }
 for (const args of [['--approval-mode', 'on-request'], ['-a', 'untrusted'], ['--permission-mode', 'plan'], ['never']]) assert.equal(profileOf({...CODEX, args}).valid, true, args.join(' '));
 // A credential-like variable name; other names pass.
 for (const name of ['OPENAI_API_KEY', 'GITHUB_TOKEN', 'CLIENT_SECRET', 'DB_PASSWORD', 'GOOGLE_APPLICATION_CREDENTIALS', 'api_key'])
  assert.match(reasons({...CODEX, env: {[name]: 'x'}}), new RegExp(`${name} looks like a credential`));
 assert.equal(profileOf({...CODEX, env: {CODEX_PATH: '/opt/codex', NO_COLOR: '1'}}).valid, true);
 // An unknown field and wrong types.
 assert.match(reasons({...CODEX, apiKey: 'x'}), /Unknown field apiKey/);
 for (const [field, value, reason] of [['model', 5, /model must be text/], ['model', '', /model must be text/], ['args', '--x', /args must be a list/], ['args', [1], /args must be a list/],
  ['env', {A: 1}, /env must be an object/], ['env', {'A=B': 'x'}, /not a variable name/], ['reasoning', 3, /reasoning must be text/], ['label', 4, /label must be text/],
  ['signIn', 'oauth', /signIn must be/], ['id', 'Bad_ID', /The id must match/], ['harness', 'nope', /provider of the catalog/], ['harness', 'toString', /provider of the catalog/],
  ['command', ['codex'], /Only a profile with harness other has command/]])
  assert.match(reasons({...CODEX, [field]: value}), reason, field);
 assert.match(reasons({id: 'own', harness: 'other', connection: 'acp', signIn: 'harness', model: 'm'}), /harness other needs command/);
 // The invalid profiles stay in order with their reasons.
 const result = validateSettings(settings([CLAUDE, {...CODEX, id: 'bad', args: ['--yolo']}, CODEX, {...CODEX}, 'text']));
 assert.equal(result.valid, false);
 assert.deepEqual(result.profiles.map(p => [p.id, p.valid]), [['claude-opus-terminal', true], ['bad', false], ['codex-fast', true], ['codex-fast', false], [null, false]]);
 assert.match(result.profiles[3].reasons[0], /Another profile has the id codex-fast/);
 assert.deepEqual(result.profiles[1].command, ['codex-acp', '--yolo'], 'an invalid profile still shows its command');
 // File errors: unknown field and wrong types.
 for (const [value, reason] of [[{...settings([]), theme: 'dark'}, /Unknown field theme/], [{version: 2, profiles: []}, /Set version to 1/], [{version: 1, profiles: {}}, /profiles must be a list/],
  [{version: 1, profiles: null}, /profiles must be a list/], [{version: 1, roleDefaults: []}, /roleDefaults must be an object/], [{version: 1, terminal: {open: 'ghostty'}}, /terminal.open must be a list/],
  [{version: 1, terminal: {open: ['ghostty'], close: []}}, /Unknown field terminal.close/], [{version: 1, roleDefaults: {reviewer: 'x'}}, /Unknown role reviewer/], [[], /must be a JSON object/]]) {
  const v = validateSettings(value);assert.equal(v.valid, false);assert.match(v.errors.join(' '), reason);
 }
 assert.equal(validateSettings({version: 1, terminal: {open: ['ghostty', '-e']}, profiles: []}).valid, true);
});

test('a role default needs a valid profile, and a coordinator, product owner or technical lead default needs a terminal profile', () => {
 const invalid = {...CODEX, id: 'broken', args: ['--yolo']};
 const v = validateSettings(settings([CLAUDE, CODEX, invalid], {implementer: 'missing', 'product-owner': 'broken', 'technical-lead': CLAUDE.id, coordinator: 7}));
 assert.equal(v.valid, false);
 assert.deepEqual(v.roleDefaults, {
  implementer: {profile: 'missing', valid: false, reason: 'No valid profile has the id missing.'},
  'product-owner': {profile: 'broken', valid: false, reason: 'No valid profile has the id broken.'},
  'technical-lead': {profile: CLAUDE.id, valid: true},
  coordinator: {profile: 7, valid: false, reason: 'The role default must name a profile id.'},
 });
 for (const role of ['coordinator', 'product-owner', 'technical-lead']) {
  const r = validateSettings(settings([CLAUDE, CODEX], {[role]: CODEX.id}));
  assert.equal(r.valid, false, role);assert.equal(r.roleDefaults[role].reason, 'Role sessions run in a terminal, where you chat with the harness tool.');
  assert.equal(r.profiles[1].valid, true, 'the ACP profile itself stays valid');
 }
 assert.equal(validateSettings(settings([CLAUDE, CODEX], {implementer: CODEX.id, coordinator: CLAUDE.id})).valid, true);
});

test('the builder makes the profile command of each catalog provider and connection, and of harness other, as an argument list', () => {
 const cases = [
  [{harness: 'claude-code', connection: 'acp', model: 'sonnet', reasoning: 'high'}, ['claude-agent-acp', '--hide-claude-auth']],
  [{harness: 'claude-code', connection: 'terminal', model: 'opus', reasoning: 'high'}, ['claude', '--model', 'opus', '--effort', 'high']],
  [{harness: 'codex', connection: 'acp', model: 'gpt-5-codex', reasoning: 'low'}, ['codex-acp']],
  [{harness: 'codex', connection: 'terminal', model: 'gpt-6-luna', reasoning: 'low'}, ['codex', '--model', 'gpt-6-luna', '-c', 'model_reasoning_effort=low']],
  [{harness: 'opencode', connection: 'acp', model: 'openai/gpt-6', reasoning: 'high'}, ['opencode', 'acp']],
  [{harness: 'opencode', connection: 'terminal', model: 'openai/gpt-6', reasoning: 'high'}, ['opencode', 'mini', '--model', 'openai/gpt-6#high']],
  [{harness: 'command-code', connection: 'acp', model: 'claude-sonnet', reasoning: 'high'}, ['cmd', 'acp']],
  [{harness: 'command-code', connection: 'terminal', model: 'claude-sonnet', reasoning: 'high'}, ['cmd', '--model', 'claude-sonnet', '--effort', 'high']],
  [{harness: 'gemini-cli', connection: 'acp', model: 'gemini-3-pro'}, ['gemini', '--acp', '--model', 'gemini-3-pro']],
  [{harness: 'gemini-cli', connection: 'terminal', model: 'gemini-3-pro'}, ['gemini', '--model', 'gemini-3-pro']],
 ];
 assert.deepEqual(cases.map(([p]) => `${p.harness} ${p.connection}`).sort(), HARNESSES.flatMap(h => ['acp', 'terminal'].map(c => `${h} ${c}`)).sort(), 'every catalog entry has a case');
 for (const [profile, command] of cases) {
  assert.deepEqual(profileCommand(profile), command, `${profile.harness} ${profile.connection}`);
  assert.equal(bypassArgument(command), null, 'the catalog adds no option that skips a permission prompt');
 }
 // Without a level there is no effort flag; args come last; OpenCode can run as opencode2.
 assert.deepEqual(profileCommand({harness: 'claude-code', connection: 'terminal', model: 'opus', args: ['--verbose']}), ['claude', '--model', 'opus', '--verbose']);
 assert.deepEqual(profileCommand({harness: 'opencode', connection: 'terminal', model: 'openai/gpt-6'}), ['opencode', 'mini', '--model', 'openai/gpt-6']);
 assert.deepEqual(profileCommand({harness: 'opencode', connection: 'acp', model: 'm', args: ['--print-logs']}, {programs: {opencode: 'opencode2'}}), ['opencode2', 'acp', '--print-logs']);
 const command = ['/opt/agent', 'acp', '--flag'], other = profileCommand({harness: 'other', connection: 'acp', model: 'm', command});
 assert.deepEqual(other, command);assert.notEqual(other, command);
 // The query and the validity show the same command.
 assert.deepEqual(profileOf({...CLAUDE, reasoning: 'max'}).command, ['claude', '--model', 'opus', '--effort', 'max']);
});

test('save refuses a model or level outside the list and fails without a list; a dropped model gives a warning', async t => {
 const f = await dirs(t), service = createSettingsService({configDir: f.config, stateDir: f.state, env: {PATH: ''}});
 await writeChecks(f.state, {codex: CODEX_CHECK});
 const save = (profiles, digest = null) => service.save({settings: settings(profiles), digest});
 assert.throws(() => save([{...CODEX, model: 'gpt-9'}]), refusal(400, /^Select a model from the list\.$/));
 assert.throws(() => save([{...CODEX, reasoning: 'xhigh'}]), refusal(400, /^Select an effort level that the model offers\.$/));
 assert.throws(() => save([{...CODEX, model: 'gpt-6-luna'}]), refusal(400, /^The model has no effort levels to select\.$/));
 assert.throws(() => save([{...CODEX, model: 'gpt-x'}]), refusal(400, /no effort levels/), 'levels "not checked" offer no level');
 assert.throws(() => save([{id: 'oc', harness: 'opencode', connection: 'terminal', signIn: 'harness', model: 'openai/gpt-6'}]), error => refusal(400)(error) && error.message === CHECK_FIRST);
 assert.throws(() => save([{...CLAUDE, model: 'claude-opus-4-1'}]), refusal(400, /model from the list/), 'the documented Claude list');
 assert.throws(() => save([{...CLAUDE, reasoning: 'ultracode'}]), refusal(400, /effort level/));
 const refused = (() => {try {save([{...CODEX, model: 'gpt-9'}]);} catch (error) {return error;}})();
 assert.equal(refused.body.validity.profiles[0].reasons[0], 'Select a model from the list.');
 assert.equal(existsSync(f.config), false, 'a refused save writes nothing');
 // Valid lists: a checked model and level, a model without levels, "not checked" levels, the documented Claude list.
 const profiles = [CODEX, {...CODEX, id: 'luna', model: 'gpt-6-luna', reasoning: undefined}, {...CODEX, id: 'x', model: 'gpt-x', reasoning: undefined}, {...CODEX, id: 'codex-term', connection: 'terminal', reasoning: 'high'}, {...CLAUDE, reasoning: 'xhigh'}];
 const saved = save(profiles.map(p => JSON.parse(JSON.stringify(p))));
 assert.equal(saved.validity.valid, true);assert.deepEqual(saved.validity.profiles.flatMap(p => p.warnings), []);
 // A later check drops gpt-5-codex: the profile shows the warning and stays valid.
 await writeChecks(f.state, {codex: {...CODEX_CHECK, models: CODEX_CHECK.models.slice(1)}});
 const view = await service.query();
 assert.equal(view.validity.valid, true);
 assert.deepEqual(view.validity.profiles.map(p => p.warnings), [[NOT_IN_CHECK], [], [], [NOT_IN_CHECK], []]);
 // An unchanged launch saves with the warning; a changed level on the dropped model is refused.
 const relabelled = view.settings.profiles.map(p => p.id === CODEX.id ? {...p, label: 'Codex, renamed'} : p);
 const again = service.save({settings: {...view.settings, profiles: relabelled}, digest: view.digest});
 assert.deepEqual(again.validity.profiles[0].warnings, [NOT_IN_CHECK]);
 assert.throws(() => service.save({settings: {...view.settings, profiles: relabelled.map(p => p.id === CODEX.id ? {...p, reasoning: 'medium'} : p)}, digest: again.digest}), refusal(400, /model from the list/));
});

test('save writes a private file through a temporary file and a rename, returns 409 with the current settings on a digest change, and writes no other file', async t => {
 const f = await dirs(t), config = join(f.config, 'nested'), file = join(config, 'profiles.json');
 const service = createSettingsService({configDir: config, stateDir: f.state, env: {PATH: ''}});
 await writeChecks(f.state, {codex: CODEX_CHECK});
 const stateBefore = await readdir(f.state);
 const first = service.save({settings: settings([CLAUDE, CODEX], {implementer: CODEX.id, coordinator: CLAUDE.id}), digest: null});
 assert.equal((await stat(f.config)).mode & 0o777, 0o700);assert.equal((await stat(config)).mode & 0o777, 0o700);
 assert.equal((await stat(file)).mode & 0o777, 0o600);
 assert.deepEqual(await readdir(config), ['profiles.json']);assert.deepEqual(await readdir(f.state), stateBefore);
 assert.equal(first.digest, sha(await readFile(file)));assert.equal((await service.query()).digest, first.digest);
 // A save with an old digest gets 409 and the current settings.
 const conflict = (() => {try {service.save({settings: settings([]), digest: null});} catch (error) {return error;}})();
 assert.ok(refusal(409)(conflict));assert.deepEqual(conflict.body, {settings: settings([CLAUDE, CODEX], {implementer: CODEX.id, coordinator: CLAUDE.id}), digest: first.digest});
 await writeSettingsFile(file, settings([CLAUDE]));
 assert.throws(() => service.save({settings: settings([]), digest: first.digest}), error => refusal(409)(error) && error.body.settings.profiles.length === 1);
 // A catalog profile with command is refused; the saved catalog profiles have no command.
 const {digest} = await service.query();
 assert.throws(() => service.save({settings: settings([{...CODEX, command: ['sh', '-c', 'x']}]), digest}), refusal(400, /Only a profile with harness other has command/));
 const second = service.save({settings: settings([CLAUDE, CODEX]), digest});
 assert.ok(JSON.parse(await readFile(file, 'utf8')).profiles.every(p => !('command' in p)));
 assert.deepEqual(await readdir(config), ['profiles.json'], 'no temporary file remains');
 // The workbench keeps a hand-written harness other profile but does not create or edit one.
 const own = {id: 'own-agent', harness: 'other', connection: 'acp', signIn: 'harness', model: 'local', command: ['/opt/agent', 'acp']};
 assert.throws(() => service.save({settings: settings([CLAUDE, own]), digest: second.digest}), refusal(400, /does not edit a profile with harness other/));
 const hand = await writeSettingsFile(file, settings([own, CLAUDE]));
 const kept = service.save({settings: settings([{...own}, CLAUDE, CODEX]), digest: hand});
 assert.deepEqual(kept.validity.profiles[0].command, ['/opt/agent', 'acp']);
 assert.throws(() => service.save({settings: settings([{...own, command: ['/opt/other']}]), digest: kept.digest}), refusal(400, /does not edit/));
 // A file that is not JSON: the query shows the error and its digest, and a save with that digest replaces it.
 const broken = await writeSettingsFile(file, '{');
 const view = await service.query();
 assert.deepEqual([view.settings, view.validity, view.digest, view.error], [null, null, broken, 'The settings file is not valid JSON.']);
 assert.equal(service.save({settings: settings([CLAUDE]), digest: broken}).validity.valid, true);
 assert.throws(() => service.save({settings: settings([]), digest: 5}), refusal(400, /digest/));
 assert.throws(() => service.save({settings: settings([]), digest: null, extra: 1}), refusal(400));
});

test('query returns the providers with their programs, versions, last checks and lists, and the herdr, ttyd and runner availability', async t => {
 const f = await dirs(t), bin = join(f.dir, "bin dir's"), slow = join(f.dir, 'slow');
 await mkdir(bin);await mkdir(slow);
 const fake = async (dir, name, script) => {await writeFile(join(dir, name), `#!/bin/sh\n${script}\n`);await chmod(join(dir, name), 0o755);};
 for (const [name, output] of [['claude', '2.1.312 (Claude Code)'], ['claude-agent-acp', '0.99.0'], ['codex', 'codex-cli 0.165.0'], ['codex-acp', 'codex-acp 2.3.0'],
  ['opencode', '1.14.2'], ['opencode2', '2.2.0'], ['herdr', 'herdr 0.9.5']]) await fake(bin, name, `echo "${output}"`);
 await fake(bin, 'ttyd', 'echo "ttyd version 1.7.7-40e79c7" >&2');
 await fake(slow, 'cmd', `exec "${process.execPath}" -e "setTimeout(() => console.log('1.88.0'), 5000)"`);await writeFile(join(bin, 'gemini'), 'not executable');
 await writeChecks(f.state, {codex: CODEX_CHECK, opencode: {program: 'opencode2', programVersion: '2.1.0', checkedAt: '2026-10-28T00:00:00.000Z', models: [{id: 'openai/gpt-6', name: 'GPT-6', levels: ['low', 'high']}]}});
 const digest = await writeSettingsFile(f.file, settings([CLAUDE, {id: 'oc', harness: 'opencode', connection: 'terminal', signIn: 'harness', model: 'openai/gpt-6', reasoning: 'high'}], {implementer: 'oc'}));
 const service = createSettingsService({configDir: f.config, stateDir: f.state, env: {PATH: ['relative', bin, slow].join(':')}, timeoutMs: 500, runner: async () => ({available: false})});
 const started = Date.now(), view = await service.query();
 assert.ok(Date.now() - started < 3000, 'the version limit stops a slow program');assert.equal(VERSION_LIMIT_MS, 5000);
 assert.deepEqual([view.path, view.digest, view.error, view.refused, view.validity.valid], [f.file, digest, null, false, true]);
 assert.deepEqual(view.validity.profiles[1].command, ['opencode2', 'mini', '--model', 'openai/gpt-6#high'], 'OpenCode runs as the first program with version 2');
 const by = Object.fromEntries(view.providers.map(p => [p.harness, p]));
 assert.deepEqual(view.providers.map(p => p.harness), HARNESSES);
 const versions = p => [p.programs.acp.name, p.programs.acp.version, p.programs.terminal.name, p.programs.terminal.version];
 assert.deepEqual(versions(by['claude-code']), ['claude-agent-acp', '0.99.0', 'claude', '2.1.312']);
 assert.deepEqual(versions(by.codex), ['codex-acp', '2.3.0', 'codex', '0.165.0']);
 assert.deepEqual(versions(by.opencode), ['opencode2', '2.2.0', 'opencode2', '2.2.0']);
 assert.deepEqual(by['command-code'].programs.acp, {name: 'cmd', path: join(slow, 'cmd'), version: null});
 assert.deepEqual(by['gemini-cli'].programs.acp, {name: 'gemini', path: null, version: null}, 'a file that is not executable is missing');
 assert.deepEqual(by.codex.connections, ['acp', 'terminal']);
 assert.deepEqual(view.herdr, {name: 'herdr', path: join(bin, 'herdr'), version: '0.9.5'});
 assert.deepEqual(view.ttyd, {name: 'ttyd', path: join(bin, 'ttyd'), version: '1.7.7-40e79c7'});
 assert.deepEqual(view.runner, {available: false});
 // Last checks, stale results and lists.
 assert.deepEqual([by.codex.check, by.codex.stale], [CODEX_CHECK, false]);
 assert.equal(by.opencode.stale, true, 'a changed program version marks the check stale');
 assert.deepEqual([by['claude-code'].check, by['claude-code'].lists.acp], [null, null]);
 assert.deepEqual(by['claude-code'].lists.terminal, {source: 'documented', models: CLAUDE_TERMINAL_MODELS});
 assert.deepEqual(by.codex.lists.terminal, by.codex.lists.acp, 'a terminal profile uses the check of the ACP program');
 assert.equal(by.codex.lists.acp.source, 'checked');assert.equal(by['gemini-cli'].lists.terminal, null);
 // OpenCode 2 under the name opencode wins over opencode2; without version 2 there is no OpenCode program.
 await fake(bin, 'opencode', 'echo "2.0.1"');
 assert.equal((await service.query()).providers.find(p => p.harness === 'opencode').programs.acp.name, 'opencode');
 const none = await createSettingsService({configDir: f.config, stateDir: f.state, env: {PATH: ''}}).query();
 assert.deepEqual(none.providers.find(p => p.harness === 'opencode').programs.acp, {name: 'opencode', path: null, version: null});
 assert.equal(none.runner, null, 'the runner task adds the runner availability');
 await assert.rejects(service.query({path: '/x'}), refusal(400));
});

test('the Claude terminal list holds the documented aliases and effort levels', () => {
 assert.deepEqual(CLAUDE_TERMINAL_MODELS.map(m => m.id), ['opus', 'sonnet', 'haiku', 'fable', 'best', 'opus[1m]', 'sonnet[1m]', 'opusplan']);
 for (const model of CLAUDE_TERMINAL_MODELS) assert.deepEqual(model.levels, ['low', 'medium', 'high', 'xhigh', 'max']);
 assert.equal(modelList('claude-code', 'terminal').source, 'documented');assert.equal(modelList('claude-code', 'acp'), null);
});

test('the providers.json reader keeps the record shape and ignores a missing, linked or malformed file', async t => {
 const f = await dirs(t);
 assert.equal(providersPath(f.state), join(f.state, 'providers.json'));
 assert.deepEqual(readProviders(f.state), {});
 const record = {...CODEX_CHECK, state: 'checked', message: 'Ready.', protocolVersion: 2, signInMethods: ['chatgpt', 'api-key'], token: 'x', models: [...CODEX_CHECK.models, {id: 5}, {id: 'n', levels: 'low'}]};
 await writeChecks(f.state, {codex: record, unknown: CODEX_CHECK, gemini: {program: 'gemini'}});
 assert.deepEqual(readProviders(f.state), {codex: {...CODEX_CHECK, state: 'checked', message: 'Ready.', protocolVersion: 2, signInMethods: ['chatgpt', 'api-key']}});
 assert.equal(providerRecord({...CODEX_CHECK, checkedAt: 5}), null);
 assert.deepEqual(providerRecord({...CODEX_CHECK, models: [{id: 'm', levels: []}]}).models, [{id: 'm', name: 'm', levels: []}]);
 await writeFile(providersPath(f.state), '{');assert.deepEqual(readProviders(f.state), {});
 await rm(providersPath(f.state));await writeChecks(f.dir, {codex: CODEX_CHECK});await symlink(providersPath(f.dir), providersPath(f.state));
 assert.deepEqual(readProviders(f.state), {});
});
