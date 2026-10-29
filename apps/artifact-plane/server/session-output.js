// Output of an agent session: commits, changed files, diffs and DoD progress
// since the base revision. Git runs read-only in the session worktree under the
// shared process limit; the reader writes no file, index or other Git metadata.
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {lstat, readFile, realpath} from 'node:fs/promises';
import {isAbsolute, join, sep} from 'node:path';
import {gitSlot} from './git-process.js';
import {checklist} from './workflow.js';
import {checklistItems} from './knowledge-writer.js';
import {safeKnowledgePath} from './units-of-work.js';

export const MAX_COMMITS = 100, MAX_FILES = 500, MAX_DIFF = 256 * 1024;
const MAX_LIST = 64 * 1024 * 1024, OID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
// diff.autoRefreshIndex=false: `git diff <commit>` otherwise rewrites a stat-dirty index, even with GIT_OPTIONAL_LOCKS=0.
const CONFIG = ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', '-c', 'diff.autoRefreshIndex=false', '-c', 'core.quotePath=false', '--literal-pathspecs'];
export class OutputError extends Error {
 constructor(status, message) {super(message);this.status = status;}
}
// One Git read. Output beyond limit bytes stops the process and returns the first bytes.
async function run(root, args, {limit = MAX_LIST, codes = [0]} = {}) {
 const release = await gitSlot();
 return new Promise((resolve, reject) => {
  const child = spawn('git', [...CONFIG, '-C', root, ...args], {env: {...process.env, GIT_OPTIONAL_LOCKS: '0'}, stdio: ['ignore', 'pipe', 'pipe']});
  const chunks = [];let size = 0, truncated = false, error = '';
  const timer = setTimeout(() => {child.kill();reject(Error('Git read timed out.'));}, 15000);
  child.stdout.on('data', chunk => {if (truncated) return;chunks.push(chunk);size += chunk.length;if (size > limit) {truncated = true;child.kill();}});
  child.stderr.on('data', chunk => {if (error.length < 4096) error += chunk;});
  child.on('error', e => {clearTimeout(timer);release();reject(e);});
  child.on('close', code => {
   clearTimeout(timer);release();
   if (!truncated && !codes.includes(code)) return reject(Error(error.trim() || `git exited with ${code}`));
   resolve({out: Buffer.concat(chunks), truncated});
  });
 });
}
async function text(root, args, codes) {
 const {out, truncated} = await run(root, args, {codes});
 if (truncated) throw Error('The Git output is larger than 64 MiB.');
 return out.toString('utf8');
}
const names = raw => raw.split('\0').filter(Boolean);
function checkWorktree(worktree) {
 if (typeof worktree !== 'string' || !isAbsolute(worktree) || worktree.includes('\0')) throw new OutputError(400, 'Supply an absolute worktree path.');
}
function check(worktree, base) {
 checkWorktree(worktree);
 if (typeof base !== 'string' || !OID.test(base)) throw new OutputError(400, 'The base revision must be a full commit ID.');
}
async function verifyBase(root, base) {
 if (!(await text(root, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`], [0, 1])).trim()) throw new OutputError(409, 'The base revision is not in the repository.');
}
// `git diff --raw --numstat -z` prints the raw records, then the numstat records. Without an index refresh the
// raw records also list stat-dirty files with unchanged content; numstat compares content and omits them.
const NUMSTAT = /^(\d+|-)\t(\d+|-)\t([\s\S]*)$/;
function parseDiff(raw) {
 const tokens = raw.split('\0'), status = new Map(), files = [];let i = 0;
 while (tokens[i]?.startsWith(':')) {
  const code = tokens[i].split(' ')[4][0], pair = code === 'R' || code === 'C';
  status.set(tokens[i + (pair ? 2 : 1)], ['A', 'D', 'R'].includes(code) ? code : 'M');i += pair ? 3 : 2;
 }
 while (tokens[i]) {
  const [, added, removed, path] = tokens[i].match(NUMSTAT), file = path ? {path} : {path: tokens[i + 2], from: tokens[i + 1]}, binary = added === '-';
  i += path ? 1 : 3;
  files.push({...file, status: status.get(file.path) || 'M', added: binary ? 0 : Number(added), removed: binary ? 0 : Number(removed), binary});
 }
 return files;
}
// Lines of an untracked file as `git diff` counts them; NUL in the first 8000 bytes means binary, as in Git.
async function countLines(file) {
 try {
  if ((await lstat(file)).isSymbolicLink()) return {added: 1, binary: false};
  let added = 0, seen = 0, last = 10;
  for await (const chunk of createReadStream(file)) {
   if (seen < 8000 && chunk.subarray(0, 8000 - seen).includes(0)) return {added: 0, binary: true};
   seen += chunk.length;last = chunk[chunk.length - 1];
   for (let at = chunk.indexOf(10); at >= 0; at = chunk.indexOf(10, at + 1)) added++;
  }
  return {added: added + (last === 10 ? 0 : 1), binary: false};
 } catch {return {added: 0, binary: false};}
}
// Files that differ from the base revision, committed or not, plus untracked files that Git does not ignore.
async function changedFiles(root, base) {
 const [diff, open, others] = await Promise.all([
  text(root, ['diff', '--no-color', '--no-ext-diff', '-M', '--raw', '--numstat', '-z', base]),
  text(root, ['diff', '--no-color', '--no-ext-diff', '--no-renames', '--numstat', '-z', 'HEAD']),
  text(root, ['ls-files', '--others', '--exclude-standard', '-z'])]);
 const uncommitted = new Set(names(open).map(record => record.match(NUMSTAT)[3])), untracked = new Set(names(others).filter(path => !path.endsWith('/')));
 const all = [
  ...parseDiff(diff).map(file => ({...file, committed: !uncommitted.has(file.path) && !(file.from && uncommitted.has(file.from))})),
  ...[...untracked].map(path => ({path, status: 'A', added: 0, removed: 0, binary: false, committed: false}))
 ].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
 const files = all.slice(0, MAX_FILES);
 for (const file of files) if (untracked.has(file.path)) Object.assign(file, await countLines(join(root, file.path)));
 return {files, truncated: all.length > MAX_FILES, untracked};
}
async function readCommits(root, base) {
 const parts = (await text(root, ['log', '--no-color', '--no-show-signature', '-z', '--format=%h%x00%s', '-n', String(MAX_COMMITS), `${base}..HEAD`])).split('\0'), commits = [];
 for (let i = 0; i + 1 < parts.length; i += 2) commits.push({id: parts[i], subject: parts[i + 1]});
 return commits;
}
// DoD progress of the task file in the session worktree. A missing file has state unknown.
async function readDod(root, task) {
 if (task === undefined || task === null) return null;
 if (!safeKnowledgePath(task)) throw new OutputError(400, 'The task path must be a Markdown path inside docs/artifacts.');
 const top = await realpath(root), markdown = await realpath(join(top, task)).then(file => file.startsWith(top + sep) ? readFile(file, 'utf8') : '').catch(() => '');
 return {path: task, ...checklist(markdown), items: checklistItems(markdown).map(({text, checked}) => ({text, checked}))};
}
// The base revision of a new session: HEAD of its worktree.
export async function readBase(worktree) {
 checkWorktree(worktree);
 return (await text(worktree, ['rev-parse', '--verify', 'HEAD'])).trim();
}
export async function readOutput(worktree, base, task) {
 check(worktree, base);await verifyBase(worktree, base);
 const [commits, {files, truncated}, dod] = await Promise.all([readCommits(worktree, base), changedFiles(worktree, base), readDod(worktree, task)]);
 return {base, commits, files, truncated, dod};
}
// Diff of one path of the current changed-file list. A binary file has no diff.
export async function readDiff(worktree, base, path) {
 check(worktree, base);await verifyBase(worktree, base);
 const list = await changedFiles(worktree, base), file = list.files.find(f => f.path === path);
 if (!file) throw new OutputError(400, 'The path is not in the changed-file list.');
 if (file.binary) return {...file, diff: null, truncated: false};
 const untracked = list.untracked.has(path);
 const args = untracked ? ['diff', '--no-index', '--no-color', '--no-ext-diff', '--', '/dev/null', path] : ['diff', '--no-color', '--no-ext-diff', '-M', base, '--', ...(file.from ? [file.from] : []), path];
 const {out, truncated} = await run(worktree, args, {limit: MAX_DIFF, codes: untracked ? [0, 1] : [0]});
 if (!truncated) return {...file, diff: out.toString('utf8'), truncated: false};
 const end = out.lastIndexOf(10, MAX_DIFF - 1);
 return {...file, diff: out.subarray(0, end >= 0 ? end + 1 : MAX_DIFF).toString('utf8'), truncated: true, notice: 'The diff stops at 256 KiB.'};
}
