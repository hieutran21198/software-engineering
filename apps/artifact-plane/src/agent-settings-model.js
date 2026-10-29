// The model of the Agent settings page and the profile editor of artifact-plane
// specifications/agent-orchestration.md (Workbench; Settings and launch profiles;
// Model and effort lists). Plain functions over the reply of /api/settings/query.
import {API_KEY_SIGN_IN, CATALOG, CHECK_FIRST, NOT_IN_CHECK, ROLES, SIGN_IN_REQUIRED, checkedConnection, profileCommand} from './launch-catalog.js';

export {CHECK_FIRST, NOT_IN_CHECK, ROLES};
export const ROLE_LABELS = {coordinator: 'Coordinator', 'product-owner': 'Product owner', 'technical-lead': 'Technical lead', implementer: 'Implementer'};
// Coordinator, product owner and technical lead sessions run in a terminal (Validity).
export const ROLE_SESSIONS = ['coordinator', 'product-owner', 'technical-lead'];
export const CONNECTION_LABELS = {acp: 'ACP', terminal: 'Terminal'};
// The sign-in kind in a profile row, and the choices of the editor.
const SIGN_IN_TEXT = {plan: 'plan', 'api-key': 'API key', harness: 'own sign-in'};
export const SIGN_IN_CHOICES = [
  {value: 'harness', label: 'Own sign-in of the harness tool'},
  {value: 'plan', label: 'Plan subscription'},
  {value: 'api-key', label: 'API key'},
];

export const harnessLabel = harness => CATALOG[harness]?.label || (harness === 'other' ? 'Other command' : String(harness ?? 'Unknown'));
export const profileName = profile => (typeof profile?.label === 'string' && profile.label) || profile?.id || 'Profile without an ID';
export const connectionText = profile => `${CONNECTION_LABELS[profile.connection] || profile.connection} · ${SIGN_IN_TEXT[profile.signIn] || profile.signIn}`;
export const modelText = profile => [profile.model, profile.reasoning].filter(v => typeof v === 'string' && v).join(' · ');
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const profilesOf = settings => Array.isArray(settings?.profiles) ? settings.profiles.filter(plainObject) : [];
export const roleDefaultsOf = settings => plainObject(settings?.roleDefaults) ? settings.roleDefaults : {};

// "just now", "12 min ago", "3 h ago" or the date.
export function relativeTime(iso, now = Date.now()) {
  const seconds = (now - Date.parse(iso)) / 1000;
  if (!Number.isFinite(seconds)) return 'at an unknown time';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `on ${new Date(iso).toLocaleDateString()}`;
}

// The programs of a provider without repeats: OpenCode has one program for both connections.
export function providerPrograms(provider) {
  const programs = new Map();
  for (const connection of ['terminal', 'acp']) {const p = provider.programs?.[connection];if (p && !programs.has(p.name)) programs.set(p.name, p);}
  return [...programs.values()];
}
// The check runs the ACP program, or the terminal program of a provider without one.
export const canCheck = provider => Boolean(provider?.programs?.[checkedConnection(provider.harness)]?.path);

// The sign-in cell of a provider: {status, text, detail} for a StatusBadge, or null. The
// check of a provider without an ACP program reads no sign-in state.
export function signInState(provider) {
  const check = provider.check;
  if (!CATALOG[provider.harness]?.acp) return null;
  if (!check) return canCheck(provider) ? {status: 'Unknown', text: 'Not checked', detail: null} : null;
  if (check.state === SIGN_IN_REQUIRED) return {status: 'Incomplete', text: SIGN_IN_REQUIRED, detail: check.message || null};
  if (check.state === API_KEY_SIGN_IN) return {status: 'Passed', text: 'Plan · terminal only', detail: 'ACP needs an API key sign-in'};
  if (check.state) return {status: 'Incomplete', text: check.state, detail: check.message || null};
  return {status: 'Passed', text: 'Signed in', detail: null};
}

// The list that the provider row shows: the checked ACP list, else the documented terminal list.
export const providerList = provider => provider.lists?.acp || provider.lists?.terminal || null;
export function levelText(levels) {
  if (levels === null || levels === undefined) return 'levels not checked';
  return levels.length ? levels.join(', ') : 'no effort levels';
}
// The first model IDs that fit in about 22 characters, then the number of the others.
export function modelSummary(list, budget = 22) {
  const ids = list.models.map(m => m.id), shown = [];
  for (const id of ids) {if (shown.length && [...shown, id].join(', ').length > budget) break;shown.push(id);}
  return shown.length < ids.length ? `${shown.join(', ')} + ${ids.length - shown.length} more` : shown.join(', ');
}

// The state of one profile row: invalid, then the sign-in state of its provider, then
// the warning of the last check, then ready.
export function profileState(profile, validity, provider) {
  if (!validity) return {status: 'Unknown', text: 'Unknown', detail: null};
  if (!validity.valid) return {status: 'Failed', text: 'Invalid', detail: validity.reasons.join(' ')};
  const state = provider?.check?.state;
  if (state === SIGN_IN_REQUIRED) return {status: 'Incomplete', text: SIGN_IN_REQUIRED, detail: provider.check.message || null};
  if (state === API_KEY_SIGN_IN && profile.connection === 'acp') return {status: 'Incomplete', text: API_KEY_SIGN_IN, detail: provider.check.message || null};
  if (validity.warnings.length) return {status: 'Incomplete', text: NOT_IN_CHECK, detail: 'The profile can still start.'};
  return {status: 'Passed', text: 'Ready', detail: null};
}

// The list of the editor for a provider and connection, or null without a list.
export const listOf = (provider, connection) => provider?.lists?.[connection] || null;
const modelLabel = model => model.name && model.name !== model.id ? `${model.name} (${model.id})` : model.id;
// The model choices: the list, plus the current model when the list does not hold it.
export function modelChoices(list, current) {
  const choices = (list?.models || []).map(m => ({value: m.id, label: modelLabel(m)}));
  if (current && !choices.some(c => c.value === current)) choices.push({value: current, label: list ? `${current} · ${NOT_IN_CHECK}` : current, missing: Boolean(list)});
  return choices;
}
// The effort choices of the selected model. '' is the default level of the model.
// `state` is 'levels', 'none' ([]), 'not-checked' (null) or 'unknown' (no list entry).
export function levelChoices(list, model, current) {
  if (!model) return {state: 'unknown', choices: [{value: '', label: 'Select a model first'}]};
  const entry = list?.models.find(m => m.id === model);
  const missing = value => ({value, label: `${value} · ${NOT_IN_CHECK}`, missing: true});
  if (!entry) return {state: 'unknown', choices: [{value: '', label: 'Model default'}, ...(current ? [list ? missing(current) : {value: current, label: current}] : [])]};
  if (entry.levels === null) return {state: 'not-checked', choices: [{value: '', label: 'Not checked'}, ...(current ? [missing(current)] : [])]};
  if (!entry.levels.length) return {state: 'none', choices: [{value: '', label: 'Not offered for this model'}, ...(current ? [missing(current)] : [])]};
  return {state: 'levels', choices: [{value: '', label: 'Model default'}, ...entry.levels.map(l => ({value: l, label: l})), ...(current && !entry.levels.includes(current) ? [missing(current)] : [])]};
}

// The text of the list source with its badge (status name and text).
export function listSource(provider, connection) {
  const list = listOf(provider, connection), check = provider?.check;
  if (list?.source === 'documented') return {status: 'open', badge: 'Documented', text: 'Plane does not check a plan sign-in. The list comes from the Claude Code documentation for --model and --effort.'};
  if (list) {
    const program = check?.program ? `${check.program}${check.programVersion ? ' ' + check.programVersion : ''}` : 'the ACP program';
    const shared = connection === 'terminal' && CATALOG[provider.harness]?.acp ? ' The terminal program uses the same list.' : '';
    return {status: 'Passed', badge: 'Checked', text: `From the check of ${program}, ${relativeTime(list.checkedAt)}.${shared}${provider.stale ? ' The program changed since then. Check again.' : ''}`};
  }
  if (check?.state === SIGN_IN_REQUIRED) return {status: 'Incomplete', badge: SIGN_IN_REQUIRED, text: `${check.message ? check.message + ' ' : ''}Sign in, then check again.`};
  if (check?.state === API_KEY_SIGN_IN) return {status: 'Incomplete', badge: API_KEY_SIGN_IN, text: 'The ACP agent offers no list without an API key sign-in. The terminal connection uses your plan.'};
  return {status: 'Unknown', badge: 'Not checked', text: CHECK_FIRST};
}

// Display text of an argument list. Plane runs programs without a shell; quotes only show the argument limits.
const SAFE = /^[A-Za-z0-9_@%+=:,./-]+$/, PROMPT = Symbol('prompt');
export const commandText = args => args.map(a => a === PROMPT ? '"<initial prompt>"' : SAFE.test(a) ? a : `'${a.replace(/'/g, `'\\''`)}'`).join(' ');
// "Plane will run": the command of the profile, the initial prompt of a terminal
// profile and the ACP options that the adapter selects. Lines of text.
export function commandPreview(profile, provider) {
  const entry = CATALOG[profile.harness]?.[profile.connection];
  if (!entry || !profile.model) return null;
  const found = provider?.programs?.[profile.connection]?.name;
  const command = profileCommand(profile, {programs: found ? {[entry.program]: found} : {}});
  if (profile.connection === 'terminal') return [commandText([...command, ...(entry.prompt === 'last' ? [] : [entry.prompt]), PROMPT]), 'in a herdr pane'];
  const options = [entry.model === 'option' ? `model ${profile.model}` : null, profile.reasoning ? `effort ${profile.reasoning}` : null].filter(Boolean);
  return [commandText(command), ...(options.length ? [`then select ${options.join(' and ')} through the ACP options`] : [])];
}

// An ID from a name: lowercase letters, digits and hyphens, unique among `ids`.
export function profileId(name, ids, fallback = 'profile') {
  const base = String(name).toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '') || fallback;
  let id = base;
  for (let n = 2; ids.includes(id); n++) id = `${base}-${n}`;
  return id;
}

// One argument for each line; empty lines are left out.
export const argsText = args => (args || []).join('\n');
export const parseArgs = text => text.split('\n').map(line => line.replace(/\r$/, '')).filter(line => line.trim());
// One NAME=value for each line.
export const envText = env => Object.entries(env || {}).map(([name, value]) => `${name}=${value}`).join('\n');
export function parseEnv(text) {
  const env = {};
  for (const line of text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim())) {
    const at = line.indexOf('=');
    if (at < 1) return {env: null, error: `Write each variable as NAME=value: ${line.trim()}`};
    env[line.slice(0, at).trim()] = line.slice(at + 1);
  }
  return {env, error: null};
}

// The sign-in and connection that the editor selects for a provider: Claude Code
// without a checked ACP list runs in a terminal with the plan sign-in, and a provider
// without an ACP program runs in a terminal.
function providerDefaults(provider) {
  const claude = provider?.harness === 'claude-code' && !listOf(provider, 'acp');
  return {signIn: claude ? 'plan' : 'harness', connection: claude || !CATALOG[provider?.harness]?.acp ? 'terminal' : 'acp'};
}
// The draft of the editor for a new, edited or duplicated profile.
export function newDraft(providers, ids) {
  const provider = providers.find(p => listOf(p, checkedConnection(p.harness))?.models.length) || providers.find(p => p.harness === 'claude-code') || providers[0];
  const defaults = providerDefaults(provider), list = listOf(provider, defaults.connection);
  return {id: null, name: '', harness: provider?.harness || 'claude-code', ...defaults, model: list?.models[0]?.id || '', reasoning: '', roles: [], args: '', env: '', ids};
}
export function profileDraft(profile, settings, ids) {
  const defaults = roleDefaultsOf(settings);
  return {id: profile.id, name: profileName(profile), harness: profile.harness, signIn: profile.signIn, connection: profile.connection, model: profile.model || '', reasoning: profile.reasoning || '',
    roles: ROLES.filter(role => defaults[role] === profile.id), args: argsText(profile.args), env: envText(profile.env), ids};
}
export const duplicateDraft = (profile, settings, ids) => ({...profileDraft(profile, settings, ids), id: null, name: `${profileName(profile)} (copy)`, roles: []});

// The dependent fields of the editor. A change of provider selects its sign-in,
// connection and first model, a change of model keeps a level that the new model
// offers, and a Claude plan sign-in and a provider without an ACP program run only in a
// terminal (Validity).
export function changeDraft(draft, field, value, providers) {
  const next = {...draft, [field]: value};
  if (field === 'harness') Object.assign(next, providerDefaults(providers.find(p => p.harness === value)));
  if (next.harness === 'claude-code' && next.signIn === 'plan' && next.connection === 'acp') next.connection = 'terminal';
  if (next.connection === 'acp' && CATALOG[next.harness] && !CATALOG[next.harness].acp) next.connection = 'terminal';
  if (next.connection === 'acp') next.roles = next.roles.filter(role => !ROLE_SESSIONS.includes(role));
  const list = listOf(providers.find(p => p.harness === next.harness), next.connection);
  if (field === 'harness' || (field !== 'model' && list && !list.models.some(m => m.id === next.model))) next.model = list?.models[0]?.id || '';
  if (field === 'harness') next.reasoning = '';
  const entry = list?.models.find(m => m.id === next.model);
  if (next.reasoning && entry && !entry.levels?.includes(next.reasoning)) next.reasoning = '';
  return next;
}

// The profile of a draft: the original ID or a new one from the name.
export function draftProfile(draft) {
  const id = draft.id || profileId(draft.name, draft.ids, draft.harness);
  const args = parseArgs(draft.args), {env} = parseEnv(draft.env);
  return {id, ...(draft.name.trim() ? {label: draft.name.trim()} : {}), harness: draft.harness, connection: draft.connection, signIn: draft.signIn, model: draft.model,
    ...(draft.reasoning ? {reasoning: draft.reasoning} : {}), ...(args.length ? {args} : {}), ...(env && Object.keys(env).length ? {env} : {})};
}

// The settings with one profile added or replaced, and the role defaults of `roles`
// set to it. Returns the settings and the index of the profile.
export function withProfile(settings, originalId, profile, roles) {
  const base = plainObject(settings) ? settings : {version: 1};
  const profiles = Array.isArray(base.profiles) ? [...base.profiles] : [];
  const at = originalId ? profiles.findIndex(p => p?.id === originalId) : -1;
  if (at >= 0) profiles[at] = profile;else profiles.push(profile);
  const defaults = {...roleDefaultsOf(base)};
  for (const role of ROLES) {
    if (roles.includes(role)) defaults[role] = profile.id;
    else if (defaults[role] === profile.id || (originalId && defaults[role] === originalId)) delete defaults[role];
  }
  return {settings: withDefaults({...base, version: base.version ?? 1, profiles}, defaults), index: at >= 0 ? at : profiles.length - 1};
}
function withDefaults(settings, defaults) {
  const next = {...settings};
  if (Object.keys(defaults).length) next.roleDefaults = defaults;else delete next.roleDefaults;
  return next;
}
// The settings without a profile and without the role defaults that name it.
export function withoutProfile(settings, id) {
  const defaults = {...roleDefaultsOf(settings)}, roles = ROLES.filter(role => defaults[role] === id);
  for (const role of roles) delete defaults[role];
  return {settings: withDefaults({...settings, profiles: (settings.profiles || []).filter(p => p?.id !== id)}, defaults), roles};
}
export function withRoleDefault(settings, role, id) {
  const defaults = {...roleDefaultsOf(settings)};
  if (id) defaults[role] = id;else delete defaults[role];
  return withDefaults(settings, defaults);
}
// The profiles that a role selector offers: valid profiles, terminal profiles for role
// sessions, and the current default in any case.
export function roleChoices(settings, validity, role) {
  const current = roleDefaultsOf(settings)[role];
  return profilesOf(settings).filter((p, i) => p.id === current || (validity?.profiles[i]?.valid !== false && (!ROLE_SESSIONS.includes(role) || p.connection === 'terminal')));
}

// The validity errors of a refused save: file errors, the reasons of the edited
// profile, the role defaults and other invalid profiles. A role default that fails only
// because the edited profile is invalid adds no error.
export function saveErrors(validity, index) {
  if (!validity) return [];
  const profiles = validity.profiles || [], edited = profiles[index];
  return [...validity.errors, ...(edited?.reasons || []),
    ...Object.entries(validity.roleDefaults || {}).filter(([, r]) => !r.valid && !(edited && !edited.valid && r.profile === edited.id))
      .map(([role, r]) => `${ROLE_LABELS[role] || role} default: ${r.reason}`),
    ...profiles.filter((p, i) => i !== index && !p.valid).map(p => `Profile ${p.id || 'without an ID'}: ${p.reasons.join(' ')}`)];
}
