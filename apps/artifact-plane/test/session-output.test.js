import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, rm, utimes, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fingerprint, git} from './fixtures.js';
import {gitSlot, processStats} from '../server/git-process.js';
import {MAX_DIFF, OutputError, readBase, readDiff, readOutput} from '../server/session-output.js';

Object.assign(process.env, {GIT_AUTHOR_NAME: 'Author', GIT_AUTHOR_EMAIL: 'author@example.invalid', GIT_COMMITTER_NAME: 'Author', GIT_COMMITTER_EMAIL: 'author@example.invalid'});
const TASK = 'docs/artifacts/plane/changes/change-x/tasks/01-reader.md';
const BASE = {'old name.txt': 'a\nb\nc\nd\ne\nf\n', 'gone.txt': 'x\n', 'edit.txt': 'one\ntwo\n', 'keep.txt': 'keep\n', 'keep2.txt': 'keep\n', '.gitignore': '*.log\n', [TASK]: '---\nid: reader\ndepends_on: []\n---\n\n# Reader\n\n## Definition of Done\n\n- [x] One.\n- [ ] Two.\n- [ ] Three.\n'};
const refused = status => e => e instanceof OutputError && e.status === status;

// A repository with two commits and a linked session worktree on branch session.
async function session(t) {
 const dir = await mkdtemp(join(tmpdir(), 'session-output-')), repo = join(dir, 'repo'), wt = join(dir, 'wt');
 t.after(() => rm(dir, {recursive: true, force: true}));
 const put = async (root, path, content) => {await mkdir(dirname(join(root, path)), {recursive: true});await writeFile(join(root, path), content);};
 for (const [path, content] of Object.entries(BASE)) await put(repo, path, content);
 git(repo, 'init', '-q', '-b', 'main');git(repo, 'add', '.');git(repo, 'commit', '-qm', 'Start');
 await put(repo, 'prep.txt', 'prep\n');git(repo, 'add', '.');git(repo, 'commit', '-qm', 'Prepare');
 git(repo, 'worktree', 'add', '-q', '-b', 'session', wt);
 return {dir, repo, wt, base: await readBase(wt), write: (path, content) => put(wt, path, content)};
}
// Committed rename, deletion and binary file; uncommitted edits; untracked text, binary and ignored files.
async function work(f) {
 git(f.wt, 'mv', 'old name.txt', 'new näme.txt');await f.write('new näme.txt', BASE['old name.txt'] + 'g\n');git(f.wt, 'commit', '-qam', 'Rename the notes');
 git(f.wt, 'rm', '-q', 'gone.txt');await f.write('bin.dat', Buffer.from([0, 1, 2, 3]));await f.write('edit.txt', 'one\nTWO\n');git(f.wt, 'add', '.');git(f.wt, 'commit', '-qm', 'Edit and remove files');
 await f.write('edit.txt', 'one\nTWO\nthree\n');
 await f.write(TASK, BASE[TASK].replace('- [ ] Two.', '- [x] Two.'));
 await f.write('ünï space.txt', 'u\nv');
 await f.write('blob.bin', Buffer.from([7, 0, 7]));
 await f.write('debug.log', 'ignored\n');
}
const FILES = [
 {path: 'bin.dat', status: 'A', added: 0, removed: 0, binary: true, committed: true},
 {path: 'blob.bin', status: 'A', added: 0, removed: 0, binary: true, committed: false},
 {path: TASK, status: 'M', added: 1, removed: 1, binary: false, committed: false},
 {path: 'edit.txt', status: 'M', added: 2, removed: 1, binary: false, committed: false},
 {path: 'gone.txt', status: 'D', added: 0, removed: 1, binary: false, committed: true},
 {path: 'new näme.txt', from: 'old name.txt', status: 'R', added: 1, removed: 0, binary: false, committed: true},
 {path: 'ünï space.txt', status: 'A', added: 2, removed: 0, binary: false, committed: false}
];

test('AO20: the output lists the commits since the base revision with short ID and subject, newest first', async t => {
 const f = await session(t);await work(f);
 assert.equal(f.base, git(f.wt, 'rev-parse', 'main'));
 const {base, commits} = await readOutput(f.wt, f.base);
 assert.equal(base, f.base);
 assert.deepEqual(commits, [{id: git(f.wt, 'rev-parse', '--short', 'HEAD'), subject: 'Edit and remove files'}, {id: git(f.wt, 'rev-parse', '--short', 'HEAD~1'), subject: 'Rename the notes'}]);
});

test('AO20: the commit list stops at the 100 newest commits', async t => {
 const f = await session(t);
 for (let i = 1; i <= 101; i++) git(f.wt, 'commit', '-q', '--allow-empty', '-m', `Commit ${i}`);
 const {commits} = await readOutput(f.wt, f.base);
 assert.equal(commits.length, 100);
 assert.deepEqual([commits[0].subject, commits[99].subject], ['Commit 101', 'Commit 2']);
 assert.equal(commits[0].id, git(f.wt, 'rev-parse', '--short', 'HEAD'));
});

test('AO20: changed files cover renames, deletions, binary files, spaces, non-ASCII names, untracked files and the committed flag', async t => {
 const f = await session(t);await work(f);
 const output = await readOutput(f.wt, f.base);
 assert.deepEqual(output.files, FILES);
 assert.equal(output.truncated, false);
});

test('AO20: the changed-file list stops at 500 files and says so', async t => {
 const f = await session(t);
 for (let i = 0; i < 501; i++) await f.write(`many/${String(i).padStart(3, '0')}.txt`, `${i}\n`);
 const {files, truncated} = await readOutput(f.wt, f.base);
 assert.equal(files.length, 500);
 assert.equal(truncated, true);
 assert.deepEqual(files.at(-1), {path: 'many/499.txt', status: 'A', added: 1, removed: 0, binary: false, committed: false});
 await assert.rejects(readDiff(f.wt, f.base, 'many/500.txt'), refused(400));
});

test('AOA9: the diff of a listed path shows its changes; an untracked text file shows as added lines', async t => {
 const f = await session(t);await work(f);
 const edit = await readDiff(f.wt, f.base, 'edit.txt');
 assert.deepEqual({...edit, diff: undefined}, {...FILES[3], diff: undefined, truncated: false});
 assert.match(edit.diff, /^-two$/m);assert.match(edit.diff, /^\+TWO$/m);assert.match(edit.diff, /^\+three$/m);
 const renamed = await readDiff(f.wt, f.base, 'new näme.txt');
 assert.match(renamed.diff, /^rename from old name\.txt$/m);assert.match(renamed.diff, /^rename to new näme\.txt$/m);assert.match(renamed.diff, /^\+g$/m);
 const gone = await readDiff(f.wt, f.base, 'gone.txt');
 assert.match(gone.diff, /^deleted file mode/m);assert.match(gone.diff, /^-x$/m);
 const untracked = await readDiff(f.wt, f.base, 'ünï space.txt');
 assert.equal(untracked.status, 'A');assert.equal(untracked.committed, false);
 assert.match(untracked.diff, /^@@ -0,0 \+1,2 @@$/m);assert.match(untracked.diff, /^\+u$/m);assert.match(untracked.diff, /^\+v$/m);
 assert.doesNotMatch(untracked.diff, /^[- ][^-]/m);
});

test('AOA9: a binary file shows no diff, and a path that is not in the list is refused', async t => {
 const f = await session(t);await work(f);
 for (const path of ['bin.dat', 'blob.bin']) assert.deepEqual(await readDiff(f.wt, f.base, path), {...FILES.find(file => file.path === path), diff: null, truncated: false});
 for (const path of ['keep.txt', 'debug.log', 'old name.txt', '../repo/keep.txt', 'missing.txt', '', null]) await assert.rejects(readDiff(f.wt, f.base, path), refused(400), String(path));
});

test('AOA9: a diff stops at 256 KiB with a truncation notice', async t => {
 const f = await session(t);
 const large = Array.from({length: 30000}, (_, i) => `line ${String(i).padStart(5, '0')}\n`).join('');
 await f.write('large.txt', large);git(f.wt, 'add', '.');git(f.wt, 'commit', '-qm', 'Add a large file');
 await f.write('big.txt', large);await f.write('small.txt', 'small\n');
 for (const path of ['large.txt', 'big.txt']) {
  const {diff, truncated, notice} = await readDiff(f.wt, f.base, path);
  assert.equal(truncated, true, path);assert.equal(notice, 'The diff stops at 256 KiB.');
  assert.ok(Buffer.byteLength(diff) <= MAX_DIFF && Buffer.byteLength(diff) > MAX_DIFF - 64, path);
  assert.match(diff, /\+line \d{5}\n$/);
 }
 const small = await readDiff(f.wt, f.base, 'small.txt');
 assert.equal(small.truncated, false);assert.equal(small.notice, undefined);
});

test('AO20: the DoD progress comes from the task file in the session worktree', async t => {
 const f = await session(t);await work(f);
 assert.deepEqual((await readOutput(f.wt, f.base, TASK)).dod, {path: TASK, checked: 2, unchecked: 1, state: 'observed', items: [{text: 'One.', checked: true}, {text: 'Two.', checked: true}, {text: 'Three.', checked: false}]});
 assert.equal((await readOutput(f.wt, f.base)).dod, null);
 const missing = TASK.replace('01-reader', '99-none');
 assert.deepEqual((await readOutput(f.wt, f.base, missing)).dod, {path: missing, checked: 0, unchecked: 0, state: 'unknown', items: []});
 for (const task of ['../repo/' + TASK, 'src/x.md', 'docs/artifacts/x.txt']) await assert.rejects(readOutput(f.wt, f.base, task), refused(400), task);
});

test('AO20: a base revision that is no longer an ancestor of HEAD still gives commits and changed files', async t => {
 const f = await session(t);
 await f.write('a.txt', 'a\n');git(f.wt, 'add', '.');git(f.wt, 'commit', '-qm', 'First');
 git(f.wt, 'reset', '-q', '--hard', 'HEAD~2');
 await f.write('b.txt', 'b\n');git(f.wt, 'add', '.');git(f.wt, 'commit', '-qm', 'Rewritten');
 assert.throws(() => git(f.wt, 'merge-base', '--is-ancestor', f.base, 'HEAD'));
 const output = await readOutput(f.wt, f.base);
 assert.deepEqual(output.commits.map(c => c.subject), ['Rewritten']);
 assert.deepEqual(output.files, [
  {path: 'b.txt', status: 'A', added: 1, removed: 0, binary: false, committed: true},
  {path: 'prep.txt', status: 'D', added: 0, removed: 1, binary: false, committed: true}
 ]);
 assert.match((await readDiff(f.wt, f.base, 'prep.txt')).diff, /^-prep$/m);
});

test('AO20: the reader refuses an invalid or missing base revision and an invalid worktree path', async t => {
 const f = await session(t);
 for (const base of ['HEAD', '--output=/tmp/x', f.base.slice(0, 12), undefined]) await assert.rejects(readOutput(f.wt, base), refused(400), String(base));
 await assert.rejects(readOutput(f.wt, '0'.repeat(40)), refused(409));
 await assert.rejects(readOutput('relative/path', f.base), refused(400));
});

test('AO20: the reader waits for the shared Git process limit', async t => {
 const f = await session(t);await work(f);
 const releases = await Promise.all(Array.from({length: 8}, () => gitSlot()));
 let done = false;const read = readOutput(f.wt, f.base, TASK).then(() => {done = true;});
 await new Promise(resolve => setTimeout(resolve, 200));
 assert.equal(done, false);assert.equal(processStats().active, 8);
 for (const release of releases) release();
 await read;assert.equal(done, true);assert.equal(processStats().active, 0);
});

test('AO20: a read changes no file, index or other Git metadata', async t => {
 const f = await session(t);await work(f);
 // Stat-dirty files with base content: a refreshing `git diff` would rewrite the index.
 for (const path of ['keep.txt', 'keep2.txt']) await utimes(join(f.wt, path), new Date(2001, 0, 1), new Date(2001, 0, 1));
 const before = await fingerprint(f.dir);
 assert.equal(await readBase(f.wt), git(f.wt, 'rev-parse', 'HEAD'));
 const output = await readOutput(f.wt, f.base, TASK);
 assert.deepEqual(output.files, FILES, 'stat-dirty files with unchanged content stay out of the list');
 for (const file of output.files) await readDiff(f.wt, f.base, file.path);
 await assert.rejects(readDiff(f.wt, f.base, 'keep.txt'), refused(400));
 assert.deepEqual(await fingerprint(f.dir), before);
});
