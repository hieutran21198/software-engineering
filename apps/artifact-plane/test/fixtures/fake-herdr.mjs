// A fake herdr 0.9.5 CLI for the terminal adapter tests. It never starts a terminal or a
// program. A wrapper script on PATH runs it as `node fake-herdr.mjs <program> <args...>`,
// where <program> is `herdr` or the name of a fake terminal app. Each call appends
// {program, argv, env, pid, sid} to $FAKE_HERDR_DIR/calls.jsonl. The named sessions,
// workspaces and panes live in $FAKE_HERDR_DIR/state.json; a test changes a pane status
// or removes a pane by editing that file. The JSON shapes follow the live record of task
// verify-interfaces: results on standard output, errors on standard error with status 1.
//
// FAKE_HERDR_SERVER_DELAY_MS: the time until a `server` call marks its session running
// (default 300); a negative value never marks it.
// FAKE_HERDR_FAULT: `<command>:<fault>` makes that command (for example `workspace create`)
// fail with `error` (a herdr error), `hang`, `garbage` (no JSON), `exit` (status 3 without
// JSON), `stdout-error` (the error JSON on standard output) or `flood` (2 MiB of output).
import {appendFileSync, existsSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const [program, ...argv] = process.argv.slice(2);
const dir = process.env.FAKE_HERDR_DIR;
const sid = (() => {try {return Number(readFileSync('/proc/self/stat', 'utf8').split(') ')[1].split(' ')[3]);} catch {return null;}})();
appendFileSync(join(dir, 'calls.jsonl'), JSON.stringify({program, argv, env: process.env, pid: process.pid, sid}) + '\n');
if (program !== 'herdr') process.exit(0);

const statePath = join(dir, 'state.json');
const load = () => existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {sessions: {}};
const save = state => {writeFileSync(statePath + '.tmp', JSON.stringify(state, null, 1));renameSync(statePath + '.tmp', statePath);};
const print = value => process.stdout.write(JSON.stringify(value) + '\n');
const fail = (id, code, message, status = 1) => {process.stderr.write(JSON.stringify({id, error: {code, message}}) + '\n');process.exit(status);};

let args = argv, name = 'default';
if (args[0] === '--session') {name = args[1];args = args.slice(2);}
const command = args.slice(0, 2).filter(a => !a.startsWith('-')).join(' ');
const id = `cli:${command.replace(' ', ':')}`;
const [faultCommand, fault] = (process.env.FAKE_HERDR_FAULT || '').split(':');
if (faultCommand === command) {
 if (fault === 'hang') await new Promise(() => setInterval(() => {}, 1000));
 if (fault === 'garbage') {process.stdout.write('herdr: not json\n');process.exit(0);}
 else if (fault === 'exit') process.exit(3);
 else if (fault === 'stdout-error') {print({id, error: {code: 'internal', message: 'fake failure on stdout'}});process.exit(1);}
 else if (fault === 'flood') await new Promise(() => process.stdout.write('x'.repeat(2 * 1024 * 1024), () => process.exit(0)));
 else fail(id, 'internal', 'fake failure');
}

// Options of `workspace create` and `tab create`.
function paneOptions(rest) {
 const options = {env: {}, focus: true};
 for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--cwd') options.cwd = rest[++i];
  else if (rest[i] === '--label') options.label = rest[++i];
  else if (rest[i] === '--env') {const [key, ...value] = rest[++i].split('=');options.env[key] = value.join('=');}
  else if (rest[i] === '--no-focus') options.focus = false;
  else fail(id, 'usage', `unknown option ${rest[i]}`, 2);
 }
 return options;
}
const pane = (workspace, tab, number, options) => ({agent_status: 'unknown', cwd: options.cwd, focused: false, foreground_cwd: options.cwd,
 pane_id: `${workspace}:p${number}`, revision: 0, scroll: {}, tab_id: tab, terminal_id: `term_${number}`, terminal_title: 'bash',
 terminal_title_stripped: 'bash', workspace_id: workspace, label: options.label, env: options.env, runs: []});
const view = p => Object.fromEntries(Object.entries(p).filter(([key]) => !['label', 'env', 'runs'].includes(key)));

if (command === 'server') {
 const delay = Number(process.env.FAKE_HERDR_SERVER_DELAY_MS ?? 300);
 if (delay < 0) process.exit(0);
 await new Promise(done => setTimeout(done, delay));
 const state = load();
 state.sessions[name] = {running: true, workspaces: [], panes: [], next: 1};
 save(state);
 process.stdout.write('herdr server running\n');
 process.exit(0);
}
if (command === 'session attach') {
 if (name !== 'default') {process.stderr.write('usage: herdr session attach <name>\n');process.exit(2);}
 process.exit(0);
}
const state = load(), session = state.sessions[name];
if (!session?.running) fail(id, 'server_not_running', `no herdr server is running at /fake/sessions/${name}/herdr.sock; run \`herdr session attach ${name}\` to start or attach it`);
const rest = args.slice(2);
if (command === 'server stop') {
 session.running = false;session.panes = [];session.workspaces = [];
 save(state);
 print({id, result: {type: 'server_stopped'}});
} else if (command === 'pane list') {
 print({id, result: {panes: session.panes.map(view), type: 'pane_list'}});
} else if (command === 'workspace create') {
 const options = paneOptions(rest), workspace = `w${session.workspaces.length + 1}`, tab = `${workspace}:t1`, root = pane(workspace, tab, session.next++, options);
 session.workspaces.push({workspace_id: workspace, label: options.label, tabs: 1});session.panes.push(root);
 save(state);
 print({id, result: {root_pane: view(root), tab: {agent_status: 'unknown', focused: false, label: options.label, number: 1, pane_count: 1, tab_id: tab, workspace_id: workspace},
  type: 'workspace_created', workspace: {workspace_id: workspace, label: options.label, focused: false}}});
} else if (command === 'tab create') {
 const options = paneOptions(rest), workspace = session.workspaces[0];
 if (!workspace) fail(id, 'workspace_not_found', 'no active workspace');
 const number = ++workspace.tabs, tab = `${workspace.workspace_id}:t${number}`, root = pane(workspace.workspace_id, tab, session.next++, options);
 session.panes.push(root);
 save(state);
 print({id, result: {root_pane: view(root), tab: {agent_status: 'unknown', focused: false, label: options.label, number, pane_count: 1, tab_id: tab, workspace_id: workspace.workspace_id}, type: 'tab_created'}});
} else if (command === 'pane run') {
 const [paneId, line, ...extra] = rest;
 if (extra.length || typeof line !== 'string') fail(id, 'usage', 'usage: herdr pane run <pane_id> <command>', 2);
 const target = session.panes.find(p => p.pane_id === paneId);
 if (!target) fail(id, 'not_found', 'pane not found');
 target.runs.push(line);
 save(state);
 print({id, result: {pane_id: paneId, type: 'pane_run'}});
} else fail(id, 'usage', `unknown command ${command}`, 2);
