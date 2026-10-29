// The provider catalog data and the profile command of artifact-plane
// specifications/agent-orchestration.md (Provider catalog; ADR 020). The module is
// plain JavaScript, so the server and the workbench build the same command.

export const CONNECTIONS = ['acp', 'terminal'];
export const ROLES = ['coordinator', 'product-owner', 'technical-lead', 'implementer'];
export const SIGN_INS = ['plan', 'api-key', 'harness'];
// The texts of Model and effort lists and the states of the Provider check.
export const NOT_IN_CHECK = 'Not in the last check', CHECK_FIRST = 'Check the provider first.';
export const SIGN_IN_REQUIRED = 'Sign-in required', API_KEY_SIGN_IN = 'Needs an API key sign-in';
// The refusal of start rule 5 (Start rules; AOA12). The launch dialog shows the same text.
export const ROLE_TERMINAL = 'Role sessions run in a terminal, where you chat with the harness tool.';
// For each provider: the ACP program and whether its model is an ACP option or a flag,
// the terminal program, the model and effort flags, the initial prompt form (`last`, or
// the flag before the prompt) and the terminal resume arguments (the terminal adapter
// adds the prompt and the resume). `{level}` and `{session}` are placeholders; effort
// `suffix` puts `#<level>` after the model value (OpenCode). A provider without an ACP
// program (`acp: null`) has `models`: the arguments of the terminal program that list
// its models, and the effort levels of each model. The catalog is plain data.
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
 'antigravity': {label: 'Antigravity CLI', acp: null,
  terminal: {program: 'agy', args: [], modelFlag: '--model', effort: ['--effort', '{level}'], prompt: '-i', resume: null},
  models: {args: ['models'], levels: ['low', 'medium', 'high', 'xhigh', 'max']}},
};
export const HARNESSES = Object.keys(CATALOG);
// The connection whose program the provider check runs: the ACP program, or the
// terminal program of a provider without one.
export const checkedConnection = harness => CATALOG[harness]?.acp ? 'acp' : 'terminal';

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
