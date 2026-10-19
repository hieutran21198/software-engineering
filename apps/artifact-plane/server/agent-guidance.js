// Guidance of an agent session (artifact-plane specifications/agent-integration.md):
// the change state of one worktree, the session context text, the reserved
// actions and the stop check. It reads local Git and the knowledge files of one
// worktree only. It never executes a checked command and never writes.
import pkg from '../package.json' with {type: 'json'};
import {stat} from 'node:fs/promises';
import {homedir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {scanRepository, git as readerGit} from './reader.js';
import {evidenceFor} from './workflow.js';
import {unitBriefs} from './units-of-work.js';
import {validateKnowledge} from '../scripts/validate-knowledge.mjs';
import {changeStatus, isCurrent, memberUnit} from '../src/work-model.js';

const PROTECTED = ['main', 'master'];
const LIMIT = 4000, MORE = 'More in get_change_status.', STOP_LIMIT = 10;
const isDirectory = path => stat(path).then(s => s.isDirectory(), () => false);
const topLevel = (dir, git) => git(dir, ['rev-parse', '--show-toplevel']).catch(() => null);
// The Git top level of dir when it is an ADD repository, else null.
async function addRoot(dir, git) {
  const top = await topLevel(dir, git);
  return top && await isDirectory(join(top, 'docs/artifacts')) ? top : null;
}
const branchOf = (dir, git) => git(dir, ['symbolic-ref', '--short', 'HEAD']).catch(() => null);

// The record of get_change_status for the worktree of cwd, or null outside an
// ADD repository. It reads the top level of cwd, never `git worktree list`.
export async function worktreeStatus(cwd, {git = readerGit, version = pkg.version} = {}) {
  if (typeof cwd !== 'string' || !cwd) return null;
  const top = await addRoot(resolve(cwd), git);
  if (!top) return null;
  const scan = await scanRepository(top, {git});
  const {snapshot, files} = scan, worktree = snapshot.repository.path, branch = snapshot.repository.branch;
  const common = await git(worktree, ['rev-parse', '--path-format=absolute', '--git-common-dir']).catch(() => null);
  const repository = common && basename(common) === '.git' ? dirname(common) : worktree;
  const changes = await evidenceFor(worktree, scan, git, snapshot.repository.head, []);
  const units = {unitsOfWork: unitBriefs(files)};
  const record = {repository, worktree, branch, changes: changes.filter(isCurrent).map(change => {
    const meta = snapshot.artifacts.find(a => a.id === change.artifact)?.changes.find(c => c.name === change.name);
    const {name, text, next, family} = changeStatus(change, {branch});
    return {artifact: change.artifact, change: change.name, title: meta?.title || change.name, tier: meta?.tier || 'medium',
      unit: memberUnit(units, change.artifact, change.name)?.id || null, status: {name, text, next, family}, version: change.version || null,
      unchecked: (change.tasks || []).filter(t => t.unchecked > 0).map(t => ({task: basename(t.path), count: t.unchecked}))};
  })};
  return {...record, text: sessionContext(record, {version})};
}

// The session context text of a worktreeStatus record, at most 4,000 characters.
export function sessionContext(status, {version = pkg.version} = {}) {
  if (!status) return '';
  const head = `Artifact Plane ${version}: ADD state of ${status.worktree} on branch ${status.branch}.`;
  const tail = ['ADD reserves for people: the merge of a pull request, and commits and pushes to main or master.', 'MCP: get_change_status and check_records give this state and the record checks.'];
  // Each change gives one line and, with unchecked items, one task line.
  const blocks = status.changes.map(c => ({line: `- ${c.artifact}/${c.change} (tier ${c.tier}${c.unit ? `, unit ${c.unit}` : ''}): ${c.status.text}.${c.status.next ? ` Next: ${c.status.next}` : ''}`,
    tasks: c.unchecked.length ? `  Unchecked DoD items: ${c.unchecked.map(u => `${u.task} ${u.count}`).join('; ')}` : null}));
  const text = (more = false) => [head, ...(blocks.length ? blocks.flatMap(b => b.tasks ? [b.line, b.tasks] : [b.line]) : ['No current change in this worktree.']), ...(more ? [MORE] : []), ...tail].join('\n');
  if (text().length <= LIMIT) return text();
  for (let i = blocks.length - 1; i >= 0 && text(true).length > LIMIT; i--) blocks[i].tasks = null;
  while (blocks.length > 1 && text(true).length > LIMIT) blocks.pop();
  return text(true).slice(0, LIMIT);
}

// Simple commands of a shell text, each a list of words. Splits at newlines,
// `;`, `&&`, `||`, `|` and `&` outside quotes; honors single quotes, double
// quotes and backslash escapes. It only reads the text.
export function simpleCommands(text) {
  const commands = [];let words = [], word = null;
  const endWord = () => {if (word !== null) words.push(word);word = null;};
  const endCommand = () => {endWord();if (words.length) commands.push(words);words = [];};
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'") {const end = text.indexOf("'", i + 1), stop = end < 0 ? text.length : end;word = (word ?? '') + text.slice(i + 1, stop);i = stop;}
    else if (c === '"') {
      word ??= '';
      for (i++; i < text.length && text[i] !== '"'; i++) {
        if (text[i] === '\\' && '$`"\\\n'.includes(text[i + 1] ?? 'x')) {i++;if (text[i] !== '\n') word += text[i];}
        else word += text[i];
      }
    }
    else if (c === '\\') {if (i + 1 < text.length && text[i + 1] !== '\n') word = (word ?? '') + text[i + 1];i++;}
    else if (c === ' ' || c === '\t') endWord();
    else if (c === '\n' || c === ';') endCommand();
    else if (c === '&' && (word?.endsWith('>') || word?.endsWith('<'))) word += c;
    else if (c === '&' || c === '|') {if (text[i + 1] === c) i++;endCommand();}
    else word = (word ?? '') + c;
  }
  endCommand();
  return commands;
}

const GIT_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix']);
const PUSH_VALUE = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);
const SHELLS = new Set(['sh', 'bash', 'zsh']);
// The destination branch of a refspec; `HEAD` pushes to the branch of the same name.
const destination = (refspec, branch) => {const ref = refspec.replace(/^\+/, ''), dst = ref.slice(ref.indexOf(':') + 1).replace(/^refs\/heads\//, '');return dst === 'HEAD' ? branch : dst;};
const reserved = (action, what) => ({action, reason: `ADD reserves ${what} for people (AGENTS.md). Work on a change branch and stop for team review.`});
// One git command in dir: null or the reserved action.
async function reservedGit(rest, cwd, git) {
  let dir = cwd, j = 0;
  for (; j < rest.length && rest[j].startsWith('-'); j++) if (GIT_VALUE.has(rest[j])) {if (rest[j] === '-C') dir = resolve(dir, rest[j + 1] ?? '');j++;}
  const sub = rest[j], args = rest.slice(j + 1);
  if (sub !== 'commit' && sub !== 'push') return null;
  if (!await addRoot(dir, git)) return null;
  const branch = await branchOf(dir, git);
  if (sub === 'commit') return PROTECTED.includes(branch) ? reserved('commit', `commits to ${branch}`) : null;
  const positional = [];let all = false;
  for (let k = 0; k < args.length; k++) {
    if (args[k] === '--') {positional.push(...args.slice(k + 1));break;}
    if (args[k] === '--all' || args[k] === '--mirror') all = true;
    else if (args[k].startsWith('-')) {if (PUSH_VALUE.has(args[k])) k++;}
    else positional.push(args[k]);
  }
  if (all) return reserved('push', 'pushes to main or master');
  const refspecs = positional.slice(1);
  const target = refspecs.length ? refspecs.map(r => destination(r, branch)).find(d => PROTECTED.includes(d)) : PROTECTED.includes(branch) ? branch : null;
  return target ? reserved('push', `pushes to ${target}`) : null;
}
// Simple commands in order: `cd` changes the effective directory of the
// commands after it; a shell with a `c` option has its script checked.
async function reservedCommands(commands, cwd, git, depth = 0) {
  let dir = cwd;
  for (const words of commands) {
    let i = 0;
    while (i < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) i++;
    const [word, ...rest] = words.slice(i), command = word === undefined ? '' : basename(word);
    let result = null;
    if (command === 'cd') {const target = rest.find(w => w === '-' || !w.startsWith('-'));if (target !== '-') dir = target === undefined ? homedir() : resolve(dir, target);}
    else if (command === 'gh') result = rest[0] === 'pr' && rest[1] === 'merge' && await addRoot(dir, git) ? reserved('merge', 'the merge of a pull request') : null;
    else if (command === 'git') result = await reservedGit(rest, dir, git);
    else if (SHELLS.has(command) && depth < 3) {
      let k = 0, script = false;
      for (; k < rest.length && rest[k].startsWith('-') && rest[k] !== '--'; k++) if (/^-[A-Za-z]*c/.test(rest[k])) script = true;
      if (rest[k] === '--') k++;
      if (script && typeof rest[k] === 'string') result = await reservedCommands(simpleCommands(rest[k]), dir, git, depth + 1);
    }
    if (result) return result;
  }
  return null;
}
// The reserved action of a hook input ({cwd, tool_input: {command}}), or null.
export async function reservedAction(input, {git = readerGit} = {}) {
  const cwd = input?.cwd, command = input?.tool_input?.command;
  if (typeof cwd !== 'string' || !cwd) return null;
  const commands = typeof command === 'string' ? simpleCommands(command) : Array.isArray(command) && command.every(w => typeof w === 'string') ? [command] : [];
  return reservedCommands(commands, resolve(cwd), git);
}

// The stop check of a hook input ({cwd, stop_hook_active}): null, or {reason}
// with at most ten error diagnostics of the current changes of the worktree.
export async function stopCheck(input, {git = readerGit, validate = validateKnowledge} = {}) {
  if (input?.stop_hook_active === true) return null;
  const status = await worktreeStatus(input?.cwd, {git});
  if (!status?.changes.length) return null;
  const lines = [];
  for (const c of status.changes) {
    const result = await validate(status.worktree, {change: `${c.artifact}/${c.change}`});
    for (const d of result.diagnostics) if (d.severity === 'error') lines.push(`${c.artifact}/${c.change}: ${d.code} ${d.message}`);
  }
  return lines.length ? {reason: [...lines.slice(0, STOP_LIMIT), 'Fix the records, or say why they stay, before you stop.'].join('\n')} : null;
}
