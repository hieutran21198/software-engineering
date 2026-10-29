// The provider catalog of artifact-plane specifications/agent-orchestration.md
// (Provider catalog, Model and effort lists, Validity; ADR 020). The program set is
// fixed: a catalog profile names a provider, and Plane derives the argument list.
// Programs run without a shell.
import {execFile} from 'node:child_process';
import {accessSync, constants, statSync} from 'node:fs';
import {delimiter, isAbsolute, join} from 'node:path';

export const CONNECTIONS = ['acp', 'terminal'];
// The time limit of one `--version` run.
export const VERSION_LIMIT_MS = 5000;
// For each provider: the ACP program and whether its model is an ACP option or a flag,
// the terminal program, the model and effort flags, the initial prompt form and the
// terminal resume arguments (the terminal adapter adds the prompt and the resume).
// `{level}` and `{session}` are placeholders; effort `suffix` puts `#<level>` after
// the model value (OpenCode). The catalog is plain data.
export const CATALOG = {
 'claude-code': {label: 'Claude Code', acp: {program: 'claude-agent-acp', args: ['--hide-claude-auth'], model: 'option'},
  terminal: {program: 'claude', args: [], modelFlag: '--model', effort: ['--effort', '{level}'], prompt: 'last', resume: ['--resume', '{session}']}},
 'codex': {label: 'Codex', acp: {program: 'codex-acp', args: [], model: 'option'},
  terminal: {program: 'codex', args: [], modelFlag: '--model', effort: ['-c', 'model_reasoning_effort={level}'], prompt: 'last', resume: null}},
 'opencode': {label: 'OpenCode', acp: {program: 'opencode', args: ['acp'], model: 'option'},
  terminal: {program: 'opencode', args: ['mini'], modelFlag: '--model', effort: 'suffix', prompt: '--prompt', resume: null}},
 'command-code': {label: 'Command Code', acp: {program: 'cmd', args: ['acp'], model: 'option'},
  terminal: {program: 'cmd', args: [], modelFlag: '--model', effort: ['--effort', '{level}'], prompt: 'last', resume: null}},
 'gemini-cli': {label: 'Gemini CLI', acp: {program: 'gemini', args: ['--acp'], model: 'flag', modelFlag: '--model'},
  terminal: {program: 'gemini', args: [], modelFlag: '--model', effort: null, prompt: 'last', resume: null}},
};
export const HARNESSES = Object.keys(CATALOG);
// The programs whose version the settings query reads. OpenCode has two candidate names.
export const PROGRAMS = ['claude', 'claude-agent-acp', 'codex', 'codex-acp', 'opencode', 'opencode2', 'cmd', 'gemini', 'herdr', 'ttyd'];

// The documented list of a Claude Code terminal profile: the model aliases of
// code.claude.com/docs/en/model-config ("Model aliases"; `default` is not an alias)
// and the `--effort` levels of code.claude.com/docs/en/cli-reference. Read through
// Context7 (/websites/code_claude) on 2026-10-29. The aliases resolve to Fable 5.1,
// Opus 5.5, Sonnet 5.5 and Haiku 5.5, which offer low, medium, high, xhigh and max
// ("Adjust effort level"). `ultracode` is left out: it is a mode that requests xhigh.
const CLAUDE_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];
export const CLAUDE_TERMINAL_MODELS = [
 ['opus', 'Opus'], ['sonnet', 'Sonnet'], ['haiku', 'Haiku'], ['fable', 'Fable'], ['best', 'Best available'],
 ['opus[1m]', 'Opus, 1M context'], ['sonnet[1m]', 'Sonnet, 1M context'], ['opusplan', 'Opus to plan, Sonnet to execute'],
].map(([id, name]) => ({id, name, levels: CLAUDE_LEVELS}));

// The permission-bypass list (Validity). A pair also matches as `--flag=value`.
export const BYPASS_ARGUMENTS = ['--dangerously-skip-permissions', '--allow-dangerously-skip-permissions', '--dangerously-bypass-approvals-and-sandbox', '--yolo', '-y', 'bypassPermissions', '--approval-mode=yolo'];
export const BYPASS_PAIRS = [['--approval-mode', 'yolo'], ['--permission-mode', 'bypass'], ['--permission-mode', 'yolo'], ['--permission-mode', 'dont-ask'], ['--ask-for-approval', 'never'], ['-a', 'never']];
// The first argument of the list that bypasses permission prompts, or null.
export function bypassArgument(args) {
 for (let i = 0; i < args.length; i++) {
  if (BYPASS_ARGUMENTS.includes(args[i])) return args[i];
  for (const [flag, value] of BYPASS_PAIRS) {
   if (args[i] === flag && args[i + 1] === value) return `${flag} ${value}`;
   if (args[i] === `${flag}=${value}`) return args[i];
  }
 }
 return null;
}

// The profile command as an argument list: the program of the connection, the model
// flag and model for a terminal profile or an ACP model flag, the effort of a terminal
// profile, then `args`. `programs` maps a catalog program name to the name found on
// PATH (OpenCode: `opencode2`). `harness: other` runs its `command`.
export function profileCommand(profile, {programs = {}} = {}) {
 if (profile.harness === 'other') return [...profile.command];
 const entry = CATALOG[profile.harness]?.[profile.connection];
 if (!entry) throw Error(`No catalog program for ${profile.harness} ${profile.connection}.`);
 const command = [programs[entry.program] || entry.program, ...entry.args];
 const terminal = profile.connection === 'terminal', level = terminal && profile.reasoning;
 if (terminal || entry.model === 'flag') command.push(entry.modelFlag, level && entry.effort === 'suffix' ? `${profile.model}#${level}` : profile.model);
 if (level && Array.isArray(entry.effort)) command.push(...entry.effort.map(part => part.replace('{level}', () => level)));
 return [...command, ...(profile.args || [])];
}

// The first executable file with this name in an absolute directory of PATH, or null.
export function findProgram(name, env = process.env) {
 for (const dir of (env.PATH || '').split(delimiter)) {
  if (!isAbsolute(dir)) continue;
  const path = join(dir, name);
  try {if (statSync(path).isFile()) {accessSync(path, constants.X_OK);return path;}} catch {}
 }
 return null;
}
const VERSION = /\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.]+)?/;
// The version that `<path> --version` prints, or null after an error or the time limit.
export function programVersion(path, {env = process.env, timeoutMs = VERSION_LIMIT_MS} = {}) {
 return new Promise(resolve => {
  const child = execFile(path, ['--version'], {env, timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: 64 * 1024, windowsHide: true}, (error, stdout, stderr) =>
   resolve(error ? null : (String(stdout).match(VERSION) || String(stderr).match(VERSION))?.[0] || null));
  child.stdin?.end();
 });
}
const major = version => Number(version?.split('.')[0]) || 0;
// Each program of PROGRAMS with its path and version, read in parallel. `opencode`
// names the first of `opencode` and `opencode2` with version 2 or later, or null.
export async function readPrograms({env = process.env, timeoutMs = VERSION_LIMIT_MS} = {}) {
 const found = await Promise.all(PROGRAMS.map(async name => {
  const path = findProgram(name, env);
  return [name, {name, path, version: path ? await programVersion(path, {env, timeoutMs}) : null}];
 }));
 const programs = Object.fromEntries(found);
 const opencode = ['opencode', 'opencode2'].find(name => programs[name].path && major(programs[name].version) >= 2) || null;
 return {programs, opencode};
}
