// Git actions of the workbench: status, branch creation, knowledge commits and
// discard. The Plane never pushes, fetches, merges, rebases, resets, tags,
// stashes or cleans, and never changes Git configuration.
import {realpath, unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {git as runGit} from './reader.js';
import {parseWorktrees} from './workflow.js';
import {EditError, PROTECTED_BRANCHES, checkPath, requireEditableBranch, serialize} from './knowledge-writer.js';
import {safeFlowSource} from './flow-model.js';

const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
export const GIT_OPERATIONS = ['status', 'files', 'branch.create', 'commit', 'discard'];
// Resolve a registered worktree of the repository at path.
export async function resolveWorktree(path, worktree, git = runGit) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0')) throw new EditError(400, 'Supply an absolute repository path.');
  const root = await realpath(path).catch(() => {throw new EditError(404, 'Repository path does not exist.');});
  const top = await git(root, ['rev-parse', '--show-toplevel']).catch(() => null);
  if (!top || await realpath(top) !== root) throw new EditError(404, 'Select the Git worktree root.');
  if (worktree !== undefined && (typeof worktree !== 'string' || !worktree.startsWith('/') || worktree.includes('\0'))) throw new EditError(400, 'Invalid worktree path.');
  const target = worktree === undefined ? root : await realpath(worktree).catch(() => null);
  const registered = parseWorktrees(await git(root, ['worktree', 'list', '--porcelain', '-z'], true)).map(w => w.path);
  if (!target || !registered.includes(target)) throw new EditError(404, 'Select a currently registered worktree.');
  return {root, target};
}
function parseStatus(raw) {
  const entries = [], parts = raw.split('\0');
  for (let i = 0; i < parts.length; i++) {
    const item = parts[i];if (!item) continue;
    const code = item.slice(0, 2), path = item.slice(3);
    entries.push({status: code, path});
    if (/[RC]/.test(code)) i++;
  }
  return entries;
}
export async function gitStatus(root, git = runGit) {
  const branch = await git(root, ['symbolic-ref', '--quiet', '--short', 'HEAD']).catch(() => null);
  const head = await git(root, ['rev-parse', '--verify', 'HEAD']).catch(() => null);
  const entries = parseStatus(await git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'], true));
  const knowledge = entries.filter(e => e.path.startsWith('docs/artifacts/'));
  return {branch, detached: !branch, protected: !branch || PROTECTED_BRANCHES.includes(branch), head, knowledge, outside: entries.length - knowledge.length};
}
const knowledgePath = (path, field = 'path') => {
  try {return checkPath(path, {yaml: true});}
  catch {throw new EditError(422, `${field} must be a path inside docs/artifacts.`, {code: 'invalid-input', field});}
};
async function createBranch(root, input, git) {
  const name = input?.name;
  if (typeof name !== 'string' || !BRANCH.test(name) || name.includes('..') || name.endsWith('/') || name.endsWith('.lock') || name.includes('//')) throw new EditError(422, 'Use a branch name with letters, digits, dots, hyphens, underscores and slashes.', {code: 'invalid-input', field: 'name'});
  if (PROTECTED_BRANCHES.includes(name)) throw new EditError(422, `${name} is a protected branch.`, {code: 'invalid-input', field: 'name'});
  await git(root, ['check-ref-format', '--branch', name]).catch(() => {throw new EditError(422, 'Git rejects this branch name.', {code: 'invalid-input', field: 'name'});});
  if (await git(root, ['rev-parse', '--verify', '--quiet', `refs/heads/${name}`]).catch(() => null)) throw new EditError(409, `Branch ${name} already exists.`, {code: 'exists', field: 'name'});
  await git(root, ['switch', '-c', name]);
  return {branch: name};
}
async function commit(root, input, git) {
  await requireEditableBranch(root, git);
  const message = typeof input?.message === 'string' ? input.message.trim() : '';
  if (!message) throw new EditError(422, 'Write a commit message.', {code: 'invalid-input', field: 'message'});
  if (!Array.isArray(input.paths) || !input.paths.length || input.paths.length > 500) throw new EditError(422, 'Select the knowledge files to commit.', {code: 'invalid-input', field: 'paths'});
  const paths = [...new Set(input.paths.map(p => knowledgePath(p, 'paths')))];
  const dirty = new Set((await gitStatus(root, git)).knowledge.map(e => e.path));
  const clean = paths.filter(p => !dirty.has(p));
  if (clean.length) throw new EditError(422, `These files have no changes: ${clean.join(', ')}`, {code: 'invalid-input', field: 'paths'});
  await git(root, ['add', '--all', '--', ...paths]);
  // --only commits these paths and leaves other staged changes staged.
  await git(root, ['commit', '--quiet', '--only', '-m', message, '--', ...paths]);
  return {commit: await git(root, ['rev-parse', 'HEAD']), paths};
}
async function discard(root, input, git) {
  await requireEditableBranch(root, git);
  const path = knowledgePath(input?.path);
  const tracked = await git(root, ['cat-file', '-e', `HEAD:${path}`]).then(() => true, () => false);
  if (tracked) {await git(root, ['checkout', 'HEAD', '--', path]);return {path, action: 'restored'};}
  await git(root, ['rm', '--cached', '--quiet', '--ignore-unmatch', '--', path]);
  const target = resolve(root, path), real = await realpath(target).catch(() => null);
  if (!real || real !== target) throw new EditError(404, 'The file does not exist or is a link.', {code: 'missing', path});
  await unlink(target);
  return {path, action: 'deleted'};
}
export async function knowledgeGit(request, {git = runGit} = {}) {
  if (!request || typeof request !== 'object' || Array.isArray(request) || Object.keys(request).some(k => !['path', 'worktree', 'operation', 'input'].includes(k))) throw new EditError(400, 'Supply path, optional worktree, operation and input.');
  if (!GIT_OPERATIONS.includes(request.operation)) throw new EditError(400, `Unknown Git operation. Use ${GIT_OPERATIONS.join(', ')}.`);
  const {target} = await resolveWorktree(request.path, request.worktree, git);
  if (request.operation === 'status') return {worktree: target, operation: 'status', status: await gitStatus(target, git)};
  // Tracked text sources that flow support can name; a read for the target picker.
  if (request.operation === 'files') {
    const files = (await git(target, ['ls-files', '-z'], true)).split('\0').filter(path => path && safeFlowSource(path) && !path.startsWith('docs/artifacts/'));
    return {worktree: target, operation: 'files', files: files.slice(0, 5000), truncated: files.length > 5000};
  }
  return serialize(target, async () => {
    const result = request.operation === 'branch.create' ? await createBranch(target, request.input, git) : request.operation === 'commit' ? await commit(target, request.input, git) : await discard(target, request.input, git);
    return {worktree: target, operation: request.operation, result, status: await gitStatus(target, git)};
  });
}
