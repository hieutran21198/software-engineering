// The model of the Agent settings page and the profile editor (specifications/
// agent-orchestration.md: Workbench, Model and effort lists, Validity). The drafts that
// the editor builds pass the validity of the settings service.
import test from 'node:test';
import assert from 'node:assert/strict';
import {CLAUDE_TERMINAL_MODELS, profileCommand} from '../server/provider-catalog.js';
import {CHECK_FIRST, NOT_IN_CHECK, validateSettings} from '../server/agent-settings.js';
import {canCheck, changeDraft, commandPreview, draftProfile, duplicateDraft, levelChoices, listSource, modelChoices, modelSummary, newDraft, parseEnv, profileDraft, profileId, profileState,
  providerList, relativeTime, roleChoices, saveErrors, signInState, withProfile, withRoleDefault, withoutProfile} from '../src/agent-settings-model.js';

const CHECKED = {program: 'codex-acp', programVersion: '2.3.0', checkedAt: '2026-10-29T07:00:00.000Z', models: [
  {id: 'gpt-5-codex', name: 'GPT-5 Codex', levels: ['low', 'medium', 'high']}, {id: 'gpt-5', name: 'GPT-5', levels: ['minimal', 'high']}, {id: 'mini', name: 'mini', levels: []}, {id: 'x', name: 'X', levels: null}]};
const list = check => ({source: 'checked', checkedAt: check.checkedAt, programVersion: check.programVersion, models: check.models});
const program = (name, path = `/bin/${name}`) => ({name, path, version: path ? '1.0.0' : null});
// Providers in the shape of /api/settings/query.
const PROVIDERS = [
  {harness: 'claude-code', label: 'Claude Code', connections: ['acp', 'terminal'], programs: {acp: program('claude-agent-acp'), terminal: program('claude')}, check: null, stale: false,
    lists: {acp: null, terminal: {source: 'documented', models: CLAUDE_TERMINAL_MODELS}}},
  {harness: 'codex', label: 'Codex', connections: ['acp', 'terminal'], programs: {acp: program('codex-acp'), terminal: program('codex')}, check: CHECKED, stale: false, lists: {acp: list(CHECKED), terminal: list(CHECKED)}},
  {harness: 'opencode', label: 'OpenCode', connections: ['acp', 'terminal'], programs: {acp: program('opencode2'), terminal: program('opencode2')}, check: null, stale: false, lists: {acp: null, terminal: null}},
];
const checks = {codex: CHECKED};

test('a new draft selects the first checked provider, ACP and its first model; a provider change selects its defaults', () => {
  const draft = newDraft(PROVIDERS, []);
  assert.deepEqual([draft.harness, draft.connection, draft.signIn, draft.model, draft.reasoning], ['codex', 'acp', 'harness', 'gpt-5-codex', '']);
  const claude = changeDraft(draft, 'harness', 'claude-code', PROVIDERS);
  assert.deepEqual([claude.connection, claude.signIn, claude.model, claude.reasoning], ['terminal', 'plan', 'opus', ''], 'Claude without an ACP check runs in a terminal with the plan');
  const open = changeDraft(draft, 'harness', 'opencode', PROVIDERS);
  assert.deepEqual([open.connection, open.model], ['acp', ''], 'without a list there is no model');
  assert.equal(newDraft([PROVIDERS[0]], []).connection, 'terminal');
});

test('a model change keeps a level that the new model offers; a Claude plan leaves ACP; ACP leaves the role sessions', () => {
  let draft = {...newDraft(PROVIDERS, []), reasoning: 'high', roles: ['coordinator', 'implementer']};
  draft = changeDraft(draft, 'model', 'gpt-5', PROVIDERS);
  assert.equal(draft.reasoning, 'high');
  draft = changeDraft(draft, 'model', 'mini', PROVIDERS);
  assert.equal(draft.reasoning, '', 'a model without levels has no level');
  assert.deepEqual(changeDraft(draft, 'name', 'X', PROVIDERS).roles, ['implementer'], 'an ACP profile is no role session default');
  const claude = {...changeDraft(draft, 'harness', 'claude-code', PROVIDERS), signIn: 'api-key', connection: 'acp'};
  assert.equal(changeDraft(claude, 'signIn', 'plan', PROVIDERS).connection, 'terminal');
});

test('model and effort choices follow the list, and keep a value that the last check does not list', () => {
  const codex = list(CHECKED);
  assert.deepEqual(modelChoices(codex, 'gpt-5').map(c => c.label), ['GPT-5 Codex (gpt-5-codex)', 'GPT-5 (gpt-5)', 'mini', 'X (x)']);
  assert.deepEqual(modelChoices(codex, 'gpt-4').at(-1), {value: 'gpt-4', label: `gpt-4 · ${NOT_IN_CHECK}`, missing: true});
  assert.deepEqual(modelChoices(null, 'gpt-4'), [{value: 'gpt-4', label: 'gpt-4', missing: false}], 'without a list the model is not checked');
  assert.deepEqual(modelChoices(null, ''), []);
  assert.deepEqual(levelChoices(codex, 'gpt-5', '').choices.map(c => c.value), ['', 'minimal', 'high']);
  assert.deepEqual(levelChoices(codex, 'gpt-5', 'low').choices.at(-1), {value: 'low', label: `low · ${NOT_IN_CHECK}`, missing: true});
  assert.deepEqual([levelChoices(codex, 'mini', '').state, levelChoices(codex, 'mini', '').choices[0].label], ['none', 'Not offered for this model']);
  assert.deepEqual([levelChoices(codex, 'x', '').state, levelChoices(codex, 'x', '').choices[0].label], ['not-checked', 'Not checked']);
  assert.equal(levelChoices(codex, 'gpt-4', '').state, 'unknown');
  assert.deepEqual(levelChoices(null, '', '').choices, [{value: '', label: 'Select a model first'}]);
  assert.equal(modelSummary(codex), 'gpt-5-codex, gpt-5 + 2 more');
  assert.equal(modelSummary(PROVIDERS[0].lists.terminal), 'opus, sonnet, haiku + 5 more');
  assert.equal(modelSummary({models: [{id: 'google/gemini-2.5-flash'}, {id: 'google/gemini-2.5-pro'}]}), 'google/gemini-2.5-flash + 1 more');
  assert.equal(listSource(PROVIDERS[2], 'acp').text, CHECK_FIRST);
  assert.equal(listSource(PROVIDERS[0], 'terminal').badge, 'Documented');
  assert.match(listSource(PROVIDERS[1], 'terminal').text, /^From the check of codex-acp 2\.3\.0, .*The terminal program uses the same list\.$/);
});

test('the preview is the profile command of the catalog with the program on PATH, the prompt and the ACP options', () => {
  const codex = {harness: 'codex', connection: 'acp', model: 'gpt-5', reasoning: 'high'};
  assert.deepEqual(commandPreview(codex, PROVIDERS[1]), ['codex-acp', 'then select model gpt-5 and effort high through the ACP options']);
  assert.deepEqual(commandPreview({...codex, connection: 'terminal', args: ['--search', 'two words']}, PROVIDERS[1]),
    [`codex --model gpt-5 -c model_reasoning_effort=high --search 'two words' "<initial prompt>"`, 'in a herdr pane']);
  const opencode = {harness: 'opencode', connection: 'terminal', model: 'openai/gpt-6', reasoning: 'high'};
  assert.deepEqual(commandPreview(opencode, PROVIDERS[2]), [`opencode2 mini --model 'openai/gpt-6#high' --prompt "<initial prompt>"`, 'in a herdr pane']);
  assert.deepEqual(profileCommand(opencode, {programs: {opencode: 'opencode2'}}), ['opencode2', 'mini', '--model', 'openai/gpt-6#high'], 'the server builds the same command');
  assert.deepEqual(commandPreview({harness: 'gemini-cli', connection: 'acp', model: 'flash'}, null), ['gemini --acp --model flash']);
  assert.equal(commandPreview({...codex, model: ''}, PROVIDERS[1]), null);
});

test('Antigravity CLI: the check runs agy, the editor selects the terminal connection, and the preview adds -i before the prompt', () => {
  const AGY_CHECK = {program: 'agy', programVersion: '1.4.9', checkedAt: '2026-10-29T08:00:00.000Z', models: [{id: 'gemini-4-argon-medium', name: 'Gemini 4 Argon (Medium)', levels: ['low', 'medium', 'high', 'xhigh', 'max']}]};
  const agy = {harness: 'antigravity', label: 'Antigravity CLI', connections: ['terminal'], programs: {acp: null, terminal: program('agy')}, check: AGY_CHECK, stale: false, lists: {acp: null, terminal: list(AGY_CHECK)}};
  const providers = [...PROVIDERS, agy];
  assert.equal(canCheck(agy), true);assert.equal(canCheck({...agy, programs: {acp: null, terminal: program('agy', null)}}), false);
  assert.equal(signInState(agy), null, 'agy models reads no sign-in state');
  assert.deepEqual(providerList(agy), list(AGY_CHECK));
  const draft = changeDraft({...newDraft(PROVIDERS, []), roles: ['coordinator']}, 'harness', 'antigravity', providers);
  assert.deepEqual([draft.connection, draft.signIn, draft.model, draft.reasoning, draft.roles], ['terminal', 'harness', 'gemini-4-argon-medium', '', ['coordinator']]);
  assert.equal(changeDraft(draft, 'connection', 'acp', providers).connection, 'terminal', 'Antigravity CLI has no ACP connection');
  assert.equal(newDraft([PROVIDERS[0], agy], []).harness, 'antigravity', 'a new draft selects the first checked provider');
  const source = listSource(agy, 'terminal');
  assert.deepEqual([source.badge, source.text], ['Checked', `From the check of agy 1.4.9, ${relativeTime(AGY_CHECK.checkedAt)}.`]);
  const profile = draftProfile({...changeDraft(draft, 'reasoning', 'max', providers), name: 'Antigravity Argon'});
  assert.deepEqual(commandPreview(profile, agy), ['agy --model gemini-4-argon-medium --effort max -i "<initial prompt>"', 'in a herdr pane']);
  assert.deepEqual(validateSettings({version: 1, profiles: [profile], roleDefaults: {coordinator: profile.id}}, {providers: {antigravity: AGY_CHECK}, save: true}).valid, true);
});

test('drafts become profiles that the settings service accepts, with role defaults, and IDs stay unique', () => {
  const ids = ['codex-fast'];
  let draft = {...newDraft(PROVIDERS, ids), name: 'Codex fast', reasoning: 'low', roles: ['implementer'], args: '--search\n\n', env: 'HTTPS_PROXY=http://proxy:3128'};
  const profile = draftProfile(draft);
  assert.deepEqual(profile, {id: 'codex-fast-2', label: 'Codex fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5-codex', reasoning: 'low', args: ['--search'], env: {HTTPS_PROXY: 'http://proxy:3128'}});
  const current = {version: 1, roleDefaults: {implementer: 'codex-fast', coordinator: 'claude'}, profiles: [{id: 'codex-fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5'},
    {id: 'claude', harness: 'claude-code', connection: 'terminal', signIn: 'plan', model: 'opus'}]};
  const {settings, index} = withProfile(current, null, profile, draft.roles);
  assert.equal(index, 2);
  assert.deepEqual(settings.roleDefaults, {implementer: 'codex-fast-2', coordinator: 'claude'});
  assert.equal(validateSettings(settings, {providers: checks, current, save: true}).valid, true);
  // Edit keeps the ID; an unchecked role leaves the default.
  draft = profileDraft(settings.profiles[2], settings, ids);
  assert.deepEqual([draft.id, draft.roles, draft.args, draft.env], ['codex-fast-2', ['implementer'], '--search', 'HTTPS_PROXY=http://proxy:3128']);
  const edited = withProfile(settings, 'codex-fast-2', draftProfile({...draft, roles: []}), []);
  assert.deepEqual([edited.index, edited.settings.roleDefaults], [2, {coordinator: 'claude'}]);
  assert.deepEqual(duplicateDraft(settings.profiles[1], settings, ['claude']).roles, []);
  assert.equal(draftProfile(duplicateDraft(settings.profiles[1], settings, ['claude', 'claude-copy'])).id, 'claude-copy-2');
  // Delete removes the role defaults that name the profile.
  assert.deepEqual(withoutProfile(settings, 'claude'), {settings: {version: 1, roleDefaults: {implementer: 'codex-fast-2'}, profiles: [settings.profiles[0], settings.profiles[2]]}, roles: ['coordinator']});
  assert.deepEqual(withRoleDefault(withRoleDefault(current, 'implementer', ''), 'coordinator', ''), {version: 1, profiles: current.profiles});
  assert.deepEqual(withProfile(null, null, profile, []).settings, {version: 1, profiles: [profile]});
  assert.equal(profileId('  Ünïcode / Profile!! ', []), 'unicode-profile');
  assert.equal(profileId('***', [], 'codex'), 'codex');
  assert.deepEqual(parseEnv('A=1\nB==2\n\n'), {env: {A: '1', B: '=2'}, error: null});
  assert.equal(parseEnv('=x').error, 'Write each variable as NAME=value: =x');
});

test('profile states, role choices and the errors of a refused save', () => {
  const settings = {version: 1, roleDefaults: {coordinator: 'acp'}, profiles: [
    {id: 'acp', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5'}, {id: 'term', harness: 'codex', connection: 'terminal', signIn: 'harness', model: 'gpt-4'},
    {id: 'bad', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5', args: ['--yolo']}]};
  const validity = validateSettings(settings, {providers: checks});
  assert.deepEqual(settings.profiles.map((p, i) => profileState(p, validity.profiles[i], PROVIDERS[1]).text), ['Ready', NOT_IN_CHECK, 'Invalid']);
  assert.equal(profileState(settings.profiles[0], validity.profiles[0], {check: {state: 'Sign-in required', message: 'Run login.'}}).detail, 'Run login.');
  assert.deepEqual(roleChoices(settings, validity, 'coordinator').map(p => p.id), ['acp', 'term'], 'the current default stays; other role sessions take terminal profiles');
  assert.deepEqual(roleChoices(settings, validity, 'implementer').map(p => p.id), ['acp', 'term']);
  assert.deepEqual(saveErrors(validity, 0), ['Coordinator default: Role sessions run in a terminal, where you chat with the harness tool.',
    'Profile bad: --yolo skips permission prompts. Plane does not start such a profile.']);
  assert.deepEqual(signInState({...PROVIDERS[0], check: {state: 'Needs an API key sign-in'}}), {status: 'Passed', text: 'Plan · terminal only', detail: 'ACP needs an API key sign-in'});
  assert.deepEqual(signInState({...PROVIDERS[2], programs: {acp: program('opencode', null), terminal: program('opencode', null)}}), null);
});
