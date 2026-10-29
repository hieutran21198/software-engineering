// The settings service of artifact-plane specifications/agent-orchestration.md
// (Settings and launch profiles, Model and effort lists, Validity, Save; ADR 020).
// It reads and writes the personal settings file `profiles.json` and reads the
// provider check results in `providers.json`. It never reads or stores a credential.
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {closeSync, constants, existsSync, fstatSync, fsyncSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, rmSync, writeSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {defaultStateDir, digest} from './runtime-store.js';
import {CATALOG, CLAUDE_TERMINAL_MODELS, CONNECTIONS, HARNESSES, VERSION_LIMIT_MS, bypassArgument, profileCommand, readPrograms} from './provider-catalog.js';

export const ROLES = ['coordinator', 'product-owner', 'technical-lead', 'implementer'];
export const SIGN_INS = ['plan', 'api-key', 'harness'];
export const NOT_IN_CHECK = 'Not in the last check', CHECK_FIRST = 'Check the provider first.';
const ROLE_SESSIONS = new Set(['coordinator', 'product-owner', 'technical-lead']);
const SETTINGS_FIELDS = new Set(['version', 'terminal', 'roleDefaults', 'profiles']);
const PROFILE_FIELDS = new Set(['id', 'label', 'harness', 'connection', 'signIn', 'model', 'reasoning', 'args', 'env', 'command']);
const ID = /^[a-z0-9][a-z0-9-]*$/, ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/, CREDENTIAL = /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i;
// No link is followed, and a FIFO does not block the server.
const READ = constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = v => typeof v === 'string' && v.length > 0 && !v.includes('\0');
const textList = v => Array.isArray(v) && v.every(text);
const inside = (root, path) => {const r = relative(root, path);return !r || (r !== '..' && !r.startsWith('..' + sep) && !isAbsolute(r));};

export class SettingsError extends Error {
 constructor(status, message, body = {}) {super(message);this.status = status;this.body = body;}
}

// ARTIFACT_PLANE_CONFIG_DIR, then $XDG_CONFIG_HOME/artifact-plane, then ~/.config/artifact-plane.
export function settingsDirectory(env = process.env) {
 if (env.ARTIFACT_PLANE_CONFIG_DIR) return resolve(env.ARTIFACT_PLANE_CONFIG_DIR);
 return join(isAbsolute(env.XDG_CONFIG_HOME || '') ? env.XDG_CONFIG_HOME : join(env.HOME || homedir(), '.config'), 'artifact-plane');
}
export const settingsPath = (env = process.env) => join(settingsDirectory(env), 'profiles.json');

// The server keeps no registry of inspected repositories, so the check refuses a path
// in the given roots and in any Git work tree or Git directory around it, as the
// runtime store and the flow state directory do.
function canonical(path) {
 let parent = resolve(path);const suffix = [];
 while (!existsSync(parent)) {suffix.unshift(parent.split(sep).at(-1));parent = dirname(parent);}
 return join(realpathSync(parent), ...suffix);
}
function gitPath(dir, args) {
 try {return execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', dir, 'rev-parse', ...args], {encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'], env: {...process.env, GIT_OPTIONAL_LOCKS: '0'}}).trim() || null;}
 catch {return null;}
}
function insideRepository(path, roots) {
 const p = canonical(path);let parent = dirname(p);
 while (!existsSync(parent)) parent = dirname(parent);
 const tops = [...roots, gitPath(parent, ['--show-toplevel']), gitPath(parent, ['--path-format=absolute', '--git-common-dir'])];
 return tops.some(top => top && inside(canonical(top), p));
}

// The settings file with its digest. `refused` marks a file that Plane must not use or replace.
export function readSettings({path = settingsPath(), roots = []} = {}) {
 const result = {path, settings: null, digest: null, error: null, refused: false};
 if (insideRepository(path, roots)) return {...result, refused: true, error: 'Keep the settings file outside repositories and worktrees.'};
 let fd;
 try {fd = openSync(path, READ);}
 catch (error) {
  if (error.code === 'ENOENT') return result;
  return {...result, refused: true, error: error.code === 'ELOOP' ? 'The settings file must not be a symbolic link.' : 'The settings file cannot be read.'};
 }
 try {
  const stat = fstatSync(fd);
  if (!stat.isFile()) return {...result, refused: true, error: 'The settings file must be a regular file.'};
  if (stat.mode & 0o022) return {...result, refused: true, error: 'Other users can write the settings file. Remove their write permission, for example with chmod 600.'};
  // The owner of a file can always write it, so a file of another user is refused too.
  if (process.getuid && stat.uid !== process.getuid()) return {...result, refused: true, error: 'Another user owns the settings file.'};
  const bytes = readFileSync(fd);
  try {return {...result, settings: JSON.parse(bytes.toString('utf8')), digest: digest(bytes)};}
  catch {return {...result, digest: digest(bytes), error: 'The settings file is not valid JSON.'};}
 } finally {closeSync(fd);}
}

// `providers.json` in the runtime state directory, written by the provider check with mode 0600:
// {"version": 1, "providers": {"<harness>": {"program": "codex-acp", "programVersion": "2.3.0",
//   "checkedAt": "<ISO time>", "state"?: "<text>", "message"?: "<text>", "protocolVersion"?: 2,
//   "signInMethods"?: ["<id>"], "models": [{"id": "<value>", "name": "<text>", "levels": ["low"]}]}}}
// `levels: []` is a model without effort levels; `levels: null` is "not checked".
export const providersPath = (stateDir = defaultStateDir()) => join(stateDir, 'providers.json');
// The record with the known fields only, or null when its shape is wrong.
export function providerRecord(value) {
 if (!plain(value) || !text(value.program) || !text(value.checkedAt) || !(value.programVersion === null || text(value.programVersion)) || !Array.isArray(value.models)) return null;
 const models = value.models.filter(m => plain(m) && text(m.id) && (m.levels === null || textList(m.levels)))
  .map(m => ({id: m.id, name: text(m.name) ? m.name : m.id, levels: m.levels && [...m.levels]}));
 const record = {program: value.program, programVersion: value.programVersion, checkedAt: value.checkedAt, models};
 if (text(value.state)) record.state = value.state;
 if (text(value.message)) record.message = value.message;
 if (Number.isInteger(value.protocolVersion)) record.protocolVersion = value.protocolVersion;
 if (textList(value.signInMethods)) record.signInMethods = [...value.signInMethods];
 return record;
}
// The last check of each catalog provider. A missing, linked or malformed file gives no check.
export function readProviders(stateDir = defaultStateDir()) {
 let value;
 try {const fd = openSync(providersPath(stateDir), READ);try {value = JSON.parse(readFileSync(fd, 'utf8'));} finally {closeSync(fd);}}
 catch {return {};}
 const providers = {};
 if (plain(value) && value.version === 1 && plain(value.providers))
  for (const harness of HARNESSES) {const record = providerRecord(value.providers[harness]);if (record) providers[harness] = record;}
 return providers;
}

// The model list of a provider and connection (Model and effort lists), or null without a list.
export function modelList(harness, connection, providers = {}) {
 if (harness === 'claude-code' && connection === 'terminal') return {source: 'documented', models: CLAUDE_TERMINAL_MODELS};
 const record = providers[harness];
 return record?.models.length ? {source: 'checked', checkedAt: record.checkedAt, programVersion: record.programVersion, models: record.models} : null;
}

const sameLaunch = (a, b) => b && ['harness', 'connection', 'model', 'reasoning'].every(key => a[key] === b[key]);
// One profile with its reasons and warnings. With `save`, a new or changed catalog profile
// needs a model and a level of its list, and a `harness: other` profile must be unchanged.
function checkProfile(profile, seen, {providers, programs, current, save, catalog}) {
 const reasons = [], warnings = [];
 if (!plain(profile)) return {id: null, valid: false, reasons: ['A profile must be a JSON object.'], warnings, command: null};
 const {id, harness, connection, model, reasoning, args, env, command} = profile, other = harness === 'other', entry = typeof harness === 'string' && Object.hasOwn(catalog, harness) ? catalog[harness] : null;
 for (const key of Object.keys(profile)) if (!PROFILE_FIELDS.has(key)) reasons.push(`Unknown field ${key}.`);
 if (typeof id !== 'string' || !ID.test(id)) reasons.push('The id must match [a-z0-9][a-z0-9-]*.');
 else if (seen.has(id)) reasons.push(`Another profile has the id ${id}.`);
 seen.add(id);
 if (profile.label !== undefined && typeof profile.label !== 'string') reasons.push('label must be text.');
 if (!other && !entry) reasons.push('Select a provider of the catalog.');
 if (!CONNECTIONS.includes(connection)) reasons.push('connection must be acp or terminal.');
 else if (entry && !entry[connection]) reasons.push(`${entry.label} does not offer the ${connection} connection.`);
 if (!SIGN_INS.includes(profile.signIn)) reasons.push('signIn must be plan, api-key or harness.');
 if (!text(model)) reasons.push('model must be text.');
 if (reasoning !== undefined && !text(reasoning)) reasons.push('reasoning must be text.');
 if (args !== undefined && !textList(args)) reasons.push('args must be a list of text arguments.');
 if (env !== undefined) {
  if (!plain(env) || !Object.values(env).every(v => typeof v === 'string' && !v.includes('\0'))) reasons.push('env must be an object of text values.');
  else for (const name of Object.keys(env)) {
   if (!ENV_NAME.test(name)) reasons.push(`${name} is not a variable name.`);
   else if (CREDENTIAL.test(name)) reasons.push(`The variable ${name} looks like a credential. Plane never passes a credential.`);
  }
 }
 if (other && !(textList(command) && command.length)) reasons.push('A profile with harness other needs command.');
 if (!other && command !== undefined) reasons.push('Only a profile with harness other has command.');
 if (harness === 'claude-code' && profile.signIn === 'plan' && connection === 'acp') reasons.push('Claude with a plan sign-in runs only in a terminal.');
 const buildable = (other ? textList(command) && command.length : Boolean(entry?.[connection]) && CONNECTIONS.includes(connection)) && text(model) && (args === undefined || textList(args)) && (reasoning === undefined || text(reasoning));
 const launch = buildable ? profileCommand(profile, {programs}) : null, bypass = launch && bypassArgument(launch);
 if (bypass) reasons.push(`${bypass} skips permission prompts. Plane does not start such a profile.`);
 const previous = Array.isArray(current?.profiles) ? current.profiles.find(p => plain(p) && p.id === id) : undefined;
 if (other && save && !isDeepStrictEqual(profile, previous)) reasons.push('The workbench does not edit a profile with harness other. Edit the settings file.');
 if (buildable && !other) {
  const list = modelList(harness, connection, providers), listed = list?.models.find(m => m.id === model);
  const level = reasoning === undefined || Boolean(listed?.levels?.includes(reasoning));
  if (save && !sameLaunch(profile, previous)) {
   if (!list) reasons.push(CHECK_FIRST);
   else if (!listed) reasons.push('Select a model from the list.');
   else if (!level) reasons.push(listed.levels?.length ? 'Select an effort level that the model offers.' : 'The model has no effort levels to select.');
  } else if (list && (!listed || !level)) warnings.push(NOT_IN_CHECK);
 }
 return {id: typeof id === 'string' ? id : null, valid: !reasons.length, reasons, warnings, command: launch};
}

// The validity of a settings object: file errors, each profile in order (an invalid
// profile stays with its reasons), and each role default. `programs` maps a catalog
// program name to the name on PATH; `catalog` is replaceable for tests.
export function validateSettings(settings, {providers = {}, programs = {}, current = null, save = false, catalog = CATALOG} = {}) {
 if (!plain(settings)) return {valid: false, errors: ['The settings must be a JSON object.'], profiles: [], roleDefaults: {}};
 const errors = [];
 for (const key of Object.keys(settings)) if (!SETTINGS_FIELDS.has(key)) errors.push(`Unknown field ${key}.`);
 if (settings.version !== 1) errors.push('Set version to 1.');
 const terminal = settings.terminal;
 if (terminal !== undefined) {
  if (!plain(terminal)) errors.push('terminal must be an object.');
  else {
   for (const key of Object.keys(terminal)) if (key !== 'open') errors.push(`Unknown field terminal.${key}.`);
   if (terminal.open !== undefined && !(textList(terminal.open) && terminal.open.length)) errors.push('terminal.open must be a list of text arguments.');
  }
 }
 const list = settings.profiles === undefined ? [] : settings.profiles;
 if (!Array.isArray(list)) errors.push('profiles must be a list.');
 const seen = new Set(), profiles = Array.isArray(list) ? list.map(p => checkProfile(p, seen, {providers, programs, current, save, catalog})) : [];
 const roleDefaults = {};
 if (settings.roleDefaults !== undefined && !plain(settings.roleDefaults)) errors.push('roleDefaults must be an object.');
 else for (const [role, id] of Object.entries(settings.roleDefaults || {})) {
  if (!ROLES.includes(role)) {errors.push(`Unknown role ${role} in roleDefaults.`);continue;}
  const index = profiles.findIndex(p => p.valid && p.id === id);let reason = null;
  if (typeof id !== 'string') reason = 'The role default must name a profile id.';
  else if (index < 0) reason = `No valid profile has the id ${id}.`;
  else if (ROLE_SESSIONS.has(role) && list[index].connection === 'acp') reason = 'Role sessions run in a terminal, where you chat with the harness tool.';
  roleDefaults[role] = reason ? {profile: id, valid: false, reason} : {profile: id, valid: true};
 }
 const valid = !errors.length && profiles.every(p => p.valid) && Object.values(roleDefaults).every(r => r.valid);
 return {valid, errors, profiles, roleDefaults};
}
const firstReason = v => v.errors[0] || v.profiles.find(p => !p.valid)?.reasons[0] || Object.values(v.roleDefaults).find(r => !r.valid)?.reason;

// A temporary file with mode 0600 in the same directory, renamed over the settings file.
function writeSettings(path, settings) {
 mkdirSync(dirname(path), {recursive: true, mode: 0o700});
 const bytes = Buffer.from(JSON.stringify(settings, null, 2) + '\n'), temp = join(dirname(path), `.profiles.json.${randomBytes(6).toString('hex')}.tmp`);
 try {
  const fd = openSync(temp, 'wx', 0o600);
  try {writeSync(fd, bytes);fsyncSync(fd);} finally {closeSync(fd);}
  renameSync(temp, path);
 } catch (error) {rmSync(temp, {force: true});throw error;}
 return digest(bytes);
}

// The routes /api/settings/query and /api/settings/save (Commands). `runner` returns the
// runner availability; the runner task supplies it, and the query gives null until then.
export function createSettingsService({configDir, stateDir = defaultStateDir(), roots = [], env = process.env, timeoutMs = VERSION_LIMIT_MS, runner = null} = {}) {
 const path = configDir ? join(resolve(configDir), 'profiles.json') : settingsPath(env);
 return {
  path,
  async query(body = {}) {
   if (!plain(body) || Object.keys(body).length) throw new SettingsError(400, 'Send an empty object.');
   const [{programs, opencode}, runnerState] = await Promise.all([readPrograms({env, timeoutMs}), runner ? runner() : null]);
   const file = readSettings({path, roots}), checks = readProviders(stateDir), names = {opencode: opencode || 'opencode'};
   const program = name => name === 'opencode' ? (opencode ? programs[opencode] : {name, path: null, version: null}) : programs[name];
   const providers = HARNESSES.map(harness => {
    const entry = CATALOG[harness], acp = program(entry.acp.program), check = checks[harness] || null;
    return {harness, label: entry.label, connections: CONNECTIONS.filter(c => entry[c]), programs: {acp, terminal: program(entry.terminal.program)},
     check, stale: Boolean(check && (check.program !== acp.name || check.programVersion !== acp.version)),
     lists: {acp: modelList(harness, 'acp', checks), terminal: modelList(harness, 'terminal', checks)}};
   });
   return {path, settings: file.settings, digest: file.digest, error: file.error, refused: file.refused,
    validity: file.settings === null ? null : validateSettings(file.settings, {providers: checks, programs: names}),
    providers, herdr: programs.herdr, ttyd: programs.ttyd, runner: runnerState};
  },
  // Synchronous from the read to the rename, so two saves of this server never interleave.
  save(body) {
   if (!plain(body) || Object.keys(body).some(k => k !== 'settings' && k !== 'digest') || !(body.digest === null || typeof body.digest === 'string'))
    throw new SettingsError(400, 'Send the settings and the digest that you read.');
   const file = readSettings({path, roots});
   if (file.refused) throw new SettingsError(409, file.error);
   if (file.digest !== body.digest) throw new SettingsError(409, 'The settings file changed since you read it. Review the current settings.', {settings: file.settings, digest: file.digest});
   const validity = validateSettings(body.settings, {providers: readProviders(stateDir), current: file.settings, save: true});
   if (!validity.valid) throw new SettingsError(400, firstReason(validity), {validity});
   let digest;
   try {digest = writeSettings(path, body.settings);} catch {throw new SettingsError(500, 'Plane could not write the settings file.');}
   return {path, digest, validity};
  },
 };
}
