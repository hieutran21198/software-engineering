// Agent settings fixtures for browser tests (specifications/agent-orchestration.md,
// Settings and launch profiles, Provider check). Each fixture starts a server in the
// test process with a temporary configuration directory, a private state directory and
// fake harness programs: the only PATH entry is a directory of shell scripts. A fake
// ACP program runs test/fixtures/fake-acp-agent.mjs, which runs no model.
import {chmod, mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAppServer} from '../../server/http.js';
import {createSettingsService} from '../../server/agent-settings.js';

const AGENT = fileURLToPath(new URL('../fixtures/fake-acp-agent.mjs', import.meta.url));
const quote = text => `'${String(text).replace(/'/g, `'\\''`)}'`;

export const CODEX_MODELS = [
  {id: 'gpt-5-codex', name: 'GPT-5 Codex', levels: ['low', 'medium', 'high']},
  {id: 'gpt-5', name: 'GPT-5', levels: ['minimal', 'low', 'medium', 'high']},
  {id: 'gpt-5-mini', name: 'GPT-5 mini', levels: []},
];
// The programs of a computer with Claude Code, Codex, OpenCode 2, Command Code, herdr
// and ttyd, but without Gemini CLI. Command Code needs a sign-in, and the Claude ACP
// agent refuses the plan sign-in (claim claude-acp-plan-sign-in).
export const COMPUTER = {
  'claude': {version: '2.4.1 (Claude Code)'},
  'claude-agent-acp': {version: '0.99.0', agent: {newError: {code: -32000, message: 'This integration does not support using claude.ai subscriptions'}}},
  'codex': {version: 'codex-cli 0.170.0'},
  'codex-acp': {version: 'codex-acp 2.3.0', agent: {models: CODEX_MODELS}},
  'opencode2': {version: '2.2.0', agent: {models: [{id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', levels: []}, {id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', levels: ['low', 'high']},
    {id: 'anthropic/claude-sonnet', name: 'Claude Sonnet', levels: ['low', 'medium', 'high']}]}},
  'cmd': {version: '1.85.1', agent: {authMethods: ['login'], newError: {code: -32000, message: 'Authentication required. Run cmd login in a terminal.'}}},
  'herdr': {version: 'herdr 0.9.5'},
  'ttyd': {version: 'ttyd version 1.7.7', stderr: true},
};

// programs: {name: {version, stderr?, agent?}}; `agent` is the script of the fake ACP agent.
// settings: the settings file (an object, or text); checks: the providers of providers.json.
export async function settingsServer({programs = {}, settings, checks} = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'plane-settings-')), bin = join(dir, 'bin'), config = join(dir, 'config'), state = join(dir, 'state');
  await mkdir(bin);await mkdir(state, {mode: 0o700});
  for (const [name, {version, stderr, agent}] of Object.entries(programs)) {
    let script = `#!/bin/sh\nif [ "$1" = "--version" ]; then echo ${quote(version)}${stderr ? ' >&2' : ''}; exit 0; fi\n`;
    if (agent) {
      const file = join(dir, `${name}.json`);await writeFile(file, JSON.stringify(agent));
      script += `FAKE_ACP_CONFIG_FILE=${quote(file)} exec ${quote(process.execPath)} ${quote(AGENT)} "$@"\n`;
    } else script += 'exit 1\n';
    await writeFile(join(bin, name), script);await chmod(join(bin, name), 0o755);
  }
  const file = join(config, 'profiles.json');
  if (settings !== undefined) await writeSettingsFile(file, settings);
  if (checks) await writeFile(join(state, 'providers.json'), JSON.stringify({version: 1, providers: checks}), {mode: 0o600});
  const settingsService = createSettingsService({configDir: config, stateDir: state, env: {PATH: bin}});
  const server = createAppServer({stateDir: state, settingsService});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`, dir, config, state, file,
    close: async () => {server.closeAllConnections();await new Promise(resolve => server.close(resolve));await rm(dir, {recursive: true, force: true});},
  };
}
export async function writeSettingsFile(file, settings) {
  await mkdir(join(file, '..'), {recursive: true, mode: 0o700});
  await writeFile(file, typeof settings === 'string' ? settings : JSON.stringify(settings, null, 2) + '\n', {mode: 0o600});
  await chmod(file, 0o600);
}
