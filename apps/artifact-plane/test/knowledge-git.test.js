import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixtureRepository, inPlaceFixture, git} from './fixtures.js';
import {knowledgeGit} from '../server/knowledge-git.js';

const author = {GIT_AUTHOR_NAME: 'Author', GIT_AUTHOR_EMAIL: 'author@example.invalid', GIT_COMMITTER_NAME: 'Author', GIT_COMMITTER_EMAIL: 'author@example.invalid'};
Object.assign(process.env, author);

test('W6: status reports branch protection, dirty knowledge paths and other dirty paths', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  await writeFile(join(f.root, 'docs/artifacts/tenant/specifications/identity.md'), '# Changed\n');
  const {status} = await knowledgeGit({path: f.root, operation: 'status'});
  assert.equal(status.branch, 'main');
  assert.equal(status.protected, true);
  assert.equal(status.detached, false);
  assert.deepEqual(status.knowledge, [{status: ' M', path: 'docs/artifacts/tenant/specifications/identity.md'}]);
  assert.equal(status.outside, 1);
  git(f.root, 'checkout', '-q', '--detach');
  assert.equal((await knowledgeGit({path: f.root, operation: 'status'})).status.detached, true);
});

test('W6: branch creation validates names and keeps uncommitted changes', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const path = join(f.root, 'docs/artifacts/tenant/specifications/identity.md');
  await writeFile(path, '# Changed\n');
  for (const name of ['main', 'master', '-x', 'a..b', 'a b', 'x.lock', '']) await assert.rejects(knowledgeGit({path: f.root, operation: 'branch.create', input: {name}}), e => e.status === 422 && e.field === 'name', name);
  const created = await knowledgeGit({path: f.root, operation: 'branch.create', input: {name: 'feature/names'}});
  assert.equal(created.status.branch, 'feature/names');
  assert.equal(await readFile(path, 'utf8'), '# Changed\n');
  await assert.rejects(knowledgeGit({path: f.root, operation: 'branch.create', input: {name: 'feature/names'}}), e => e.status === 409);
});

test('W6: commit stages only the selected knowledge paths and refuses protected branches', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const a = 'docs/artifacts/tenant/specifications/identity.md', b = 'docs/artifacts/authentication/requirements/login.md';
  await writeFile(join(f.root, a), '# A\n');await writeFile(join(f.root, b), '# B\n');
  await assert.rejects(knowledgeGit({path: f.root, operation: 'commit', input: {paths: [a], message: 'Edit'}}), e => e.status === 403);
  git(f.root, 'switch', '-q', '-c', 'work');
  git(f.root, 'add', 'untracked.txt');
  await assert.rejects(knowledgeGit({path: f.root, operation: 'commit', input: {paths: [a], message: '  '}}), e => e.field === 'message');
  await assert.rejects(knowledgeGit({path: f.root, operation: 'commit', input: {paths: ['untracked.txt'], message: 'X'}}), e => e.field === 'paths');
  await assert.rejects(knowledgeGit({path: f.root, operation: 'commit', input: {paths: ['docs/artifacts/tenant/README.md'], message: 'X'}}), e => e.field === 'paths' && /no changes/.test(e.message));
  await mkdir(join(f.root, 'docs/artifacts/tenant/decisions'));
  const added = 'docs/artifacts/tenant/decisions/001-x.md';
  await writeFile(join(f.root, added), '# X\n');
  const result = await knowledgeGit({path: f.root, operation: 'commit', input: {paths: [a, added], message: 'Tenant: edit identity'}});
  assert.match(result.result.commit, /^[a-f0-9]{40}$/);
  assert.equal(git(f.root, 'log', '-1', '--format=%an %s'), 'Author Tenant: edit identity');
  assert.deepEqual(git(f.root, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort(), [added, a].sort());
  // Other dirty and staged files stay as they were.
  assert.deepEqual(result.status.knowledge, [{status: ' M', path: b}]);
  assert.match(git(f.root, 'status', '--porcelain'), /^A  untracked\.txt$/m);
});

test('W6: discard restores tracked knowledge or deletes untracked knowledge only', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  git(f.root, 'switch', '-q', '-c', 'work');
  const a = 'docs/artifacts/tenant/specifications/identity.md', added = 'docs/artifacts/tenant/specifications/new.md';
  await writeFile(join(f.root, a), '# Changed\n');await writeFile(join(f.root, added), '# New\n');
  assert.equal((await knowledgeGit({path: f.root, operation: 'discard', input: {path: a}})).result.action, 'restored');
  assert.equal(await readFile(join(f.root, a), 'utf8'), '# Identity\n\nStable identity rules.\n');
  assert.equal((await knowledgeGit({path: f.root, operation: 'discard', input: {path: added}})).result.action, 'deleted');
  await assert.rejects(knowledgeGit({path: f.root, operation: 'discard', input: {path: 'untracked.txt'}}), e => e.status === 422);
  assert.equal(await readFile(join(f.root, 'untracked.txt'), 'utf8'), 'Preserve this file.');
});

test('W6: the Git module runs no remote, history-rewriting or cleanup command', async () => {
  const source = await readFile(fileURLToPath(new URL('../server/knowledge-git.js', import.meta.url)), 'utf8');
  const code = source.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
  for (const command of ['push', 'fetch', 'pull', 'merge', 'rebase', 'reset', 'tag', 'stash', 'clean', 'config']) assert.doesNotMatch(code, new RegExp(`['"]${command}['"]`), command);
});

test('W6: files lists tracked source files outside docs/artifacts for the support picker', async t => {
  const files = inPlaceFixture();files.set('src/names.js', 'export const a = 1;\n');files.set('.env', 'SECRET=1\n');
  const f = await fixtureRepository(files);t.after(f.cleanup);
  const result = await knowledgeGit({path: f.root, operation: 'files'});
  assert.deepEqual(result.files, ['src/names.js']);
});
