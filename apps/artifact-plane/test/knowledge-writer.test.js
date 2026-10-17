import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir, writeFile, readFile, symlink, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository, inPlaceFixture, fingerprint, git as fixtureGit} from './fixtures.js';
import {git} from '../server/reader.js';
import {checkPath, editFrontMatter, setFrontMatterText, replaceBody, replaceSection, readSection, setCheckbox, writePlan, undoPlan, createJournal, digestOf, EditError} from '../server/knowledge-writer.js';

const lines = text => text.split('\n');
// Lines that differ between two texts, as [before, after] pairs of removed and added lines.
function changed(before, after) {
  const a = lines(before), b = lines(after);let start = 0;
  while (start < a.length && a[start] === b[start]) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
  return {removed: a.slice(start, a.length - end), added: b.slice(start, b.length - end)};
}
const flowDoc = `---
# Leading comment survives.
unknown_key: {keep: [1, 2]}
flow:
  id: sample
  artifact: tenant
  title: Sample flow
  trigger: A long trigger that the yaml library would fold when it re-serializes the document at eighty columns.
  outcome: Done.
  entry_steps:
    - first
  participants:
    - id: user
      artifact: tenant
      model: user   # inline comment
      requires: A user.
  steps:
    - id: first
      title: First
      supports: [doc]
      interactions:
        - {from: user, to: user, action: Act, outcome: Done, supports: [doc]}
    - id: second
      title: Second
      supports: []
  transitions: []
  support:
    - id: doc
      kind: element
      artifact: tenant
      element: specifications/identity.md
      requires: Identity.
      basis: documented
---

# Sample

Body text.
`;

test('W4: paths outside docs/artifacts, with traversal, .git, backslashes, NUL or other types are rejected', () => {
  for (const path of ['README.md', 'docs/artifacts/../x.md', 'docs/artifacts/a/./b.md', 'docs/artifacts/a/.git/b.md', 'docs/artifacts/a\\b.md', 'docs/artifacts/a/b\0.md', 'docs/artifacts/a/b.txt', 'docs/artifacts//b.md', '/docs/artifacts/a.md'])
    assert.throws(() => checkPath(path), e => e instanceof EditError && e.status === 422, path);
  assert.equal(checkPath('docs/artifacts/a/requirements/b.md'), 'docs/artifacts/a/requirements/b.md');
});

test('W4: front-matter edits change only the targeted nodes and keep comments, unknown keys and order', () => {
  const title = editFrontMatter(flowDoc, [{op: 'set', path: ['flow', 'steps', 1, 'title'], value: 'Renamed'}]);
  assert.deepEqual(changed(flowDoc, title), {removed: ['      title: Second'], added: ['      title: Renamed']});
  const added = editFrontMatter(flowDoc, [{op: 'insert', path: ['flow', 'steps'], index: 1, value: {id: 'middle', title: 'Middle', supports: []}}]);
  assert.deepEqual(changed(flowDoc, added), {removed: [], added: ['    - id: middle', '      title: Middle', '      supports: []']});
  const removed = editFrontMatter(flowDoc, [{op: 'delete', path: ['flow', 'steps', 1]}]);
  assert.deepEqual(changed(flowDoc, removed).removed, ['    - id: second', '      title: Second', '      supports: []']);
  const moved = editFrontMatter(flowDoc, [{op: 'move', path: ['flow', 'steps'], from: 1, to: 0}]);
  assert.ok(moved.includes('# Leading comment survives.') && moved.includes('model: user   # inline comment') && moved.includes('unknown_key: {keep: [1, 2]}'));
  assert.ok(moved.indexOf('id: second') < moved.indexOf('id: first'));
  // Interactions and participants keep their bytes under every edit.
  for (const text of [title, added, removed, moved]) {
    assert.ok(text.includes('        - {from: user, to: user, action: Act, outcome: Done, supports: [doc]}'));
    assert.ok(text.includes('  trigger: A long trigger that the yaml library would fold when it re-serializes the document at eighty columns.'));
    assert.ok(text.endsWith('# Sample\n\nBody text.\n'));
  }
  const support = editFrontMatter(flowDoc, [{op: 'insert', path: ['flow', 'steps', 1, 'supports'], value: 'doc'}]);
  assert.deepEqual(changed(flowDoc, support), {removed: ['      supports: []'], added: ['      supports:', '        - doc']});
});

test('W4: short identifier lists use flow style; documents without front matter gain a block only for structural fields; invalid YAML is reported', () => {
  assert.match(editFrontMatter('---\nid: a\n---\n# T\n', [{op: 'set', path: ['depends_on'], value: ['x', 'y']}]), /^---\nid: a\ndepends_on: \[x, y\]\n---\n# T\n$/);
  assert.equal(editFrontMatter('# Title\n\nBody.\n', [{op: 'set', path: ['self_check'], value: {result: 'passed', source: 'a.md#self-check'}}]),
    '---\nself_check:\n  result: passed\n  source: a.md#self-check\n---\n\n# Title\n\nBody.\n');
  assert.equal(replaceBody('# Title\n\nBody.\n', '# Title\n\nNew.'), '# Title\n\nNew.\n');
  assert.throws(() => editFrontMatter('---\na: [\n---\n# T\n', [{op: 'set', path: ['b'], value: 1}]), e => e.status === 422 && /invalid YAML/.test(e.message));
  assert.throws(() => setFrontMatterText('# T\n', 'a: [b'), e => e.status === 422 && e.field === 'frontMatter');
  assert.equal(setFrontMatterText('---\na: 1\n---\n# T\n', 'b: 2\n'), '---\nb: 2\n---\n# T\n');
});

test('W4: section edits replace one heading range, append missing sections and keep CRLF', () => {
  const doc = '---\nid: t\n---\n\n# Task\n\n## Definition of Done\n\n- [ ] One.\n- [ ] Two.\n\n### Nested\n\nKeep.\n\n## Evidence\n\nImplementation has not started.\n';
  const evidence = replaceSection(doc, 'evidence', 'Tests passed.');
  assert.deepEqual(changed(doc, evidence), {removed: ['Implementation has not started.'], added: ['Tests passed.']});
  const nested = replaceSection(doc, 'definition-of-done', '- [x] One.');
  assert.ok(!nested.includes('### Nested') && nested.includes('## Evidence'));
  const appended = replaceSection(doc, 'self-check', 'Passed.', {heading: 'Self-check'});
  assert.ok(appended.startsWith(doc.trimEnd()) && appended.endsWith('\n\n## Self-check\n\nPassed.\n'));
  assert.equal(readSection(evidence, 'evidence'), 'Tests passed.');
  assert.equal(setCheckbox(doc, 1, true), doc.replace('- [ ] Two.', '- [x] Two.'));
  assert.throws(() => setCheckbox(doc, 5, true), e => e.status === 422);
  const crlf = doc.replace(/\n/g, '\r\n'), updated = replaceSection(crlf, 'evidence', 'Done.');
  assert.ok(!/[^\r]\n/.test(updated) && updated.includes('Done.\r\n'));
  assert.ok(editFrontMatter(crlf, [{op: 'set', path: ['depends_on'], value: []}]).startsWith('---\r\nid: t\r\ndepends_on: []\r\n---\r\n'));
});

async function editable(files = inPlaceFixture()) {
  const fixture = await fixtureRepository(files);
  fixtureGit(fixture.root, 'switch', '-q', '-c', 'work');
  return fixture;
}

test('W4: protected branches, detached HEAD, symbolic links, large and non-UTF-8 files refuse every write', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const path = 'docs/artifacts/tenant/specifications/identity.md';
  const edit = [{path, action: 'replace', after: '# Identity\n'}];
  await assert.rejects(writePlan(f.root, edit, {git}), e => e.status === 403 && e.code === 'protected-branch');
  fixtureGit(f.root, 'checkout', '-q', '--detach');
  await assert.rejects(writePlan(f.root, edit, {git}), e => e.status === 403 && /detached/.test(e.message));
  fixtureGit(f.root, 'switch', '-q', '-c', 'work');
  await mkdir(join(f.root, 'outside'));
  await symlink(join(f.root, 'outside'), join(f.root, 'docs/artifacts/tenant/linked'));
  await assert.rejects(writePlan(f.root, [{path: 'docs/artifacts/tenant/linked/x.md', action: 'create', after: '# X\n'}], {git}), e => e.status === 422 && /symbolic link/.test(e.message));
  await writeFile(join(f.root, 'docs/artifacts/tenant/specifications/big.md'), 'x'.repeat(1024 * 1024 + 1));
  await assert.rejects(writePlan(f.root, [{path: 'docs/artifacts/tenant/specifications/big.md', action: 'replace', after: '# Small\n'}], {git}), e => e.code === 'too-large');
  await writeFile(join(f.root, 'docs/artifacts/tenant/specifications/binary.md'), Buffer.from([0xff, 0xfe]));
  await assert.rejects(writePlan(f.root, [{path: 'docs/artifacts/tenant/specifications/binary.md', action: 'replace', after: '# Text\n'}], {git}), e => e.code === 'not-utf8');
  assert.equal(await readFile(join(f.root, 'outside/x.md')).catch(() => null), null);
});

test('W4: version records, delivered tasks and legacy artifacts are protected records', async t => {
  const f = await editable();t.after(f.cleanup);
  const policy = {layouts: {tenant: 'in-place', legacy: 'legacy'}, delivered: new Set(['tenant/change-initial'])};
  const refuse = (edit, extra = {}) => assert.rejects(writePlan(f.root, [edit], {git, policy: {...policy, ...extra}}), e => e.status === 422 && e.code === 'protected-record');
  await refuse({path: 'docs/artifacts/tenant/versions/1.0.0/README.md', action: 'replace', after: '# Changed\n'});
  await refuse({path: 'docs/artifacts/tenant/versions/1.0.0/README.md', action: 'delete'});
  await refuse({path: 'docs/artifacts/tenant/versions/2.0.0/specifications/x.md', action: 'create', after: '# X\n'});
  await refuse({path: 'docs/artifacts/tenant/changes/change-initial/tasks/01-initial.md', action: 'replace', after: '# Changed\n'});
  await refuse({path: 'docs/artifacts/legacy/README.md', action: 'create', after: '# Legacy\n'});
  const created = await writePlan(f.root, [{path: 'docs/artifacts/tenant/versions/2.0.0/README.md', action: 'create', after: '---\nsource_change: change-x\n---\n# V\n'}], {git, policy});
  assert.equal(created.files[0].action, 'create');
});

test('W4: writes are atomic, need expected digests, report conflicts and restore earlier files after a failed rename', async t => {
  const f = await editable();t.after(f.cleanup);
  const a = 'docs/artifacts/authentication/requirements/login.md', b = 'docs/artifacts/tenant/specifications/identity.md';
  const before = await fingerprint(f.root), digest = async path => digestOf(await readFile(join(f.root, path)));
  await assert.rejects(writePlan(f.root, [{path: a, action: 'replace', after: '# A\n'}], {git}), e => e.status === 409 && e.code === 'expected-required' && /^[a-f0-9]{64}$/.test(e.digests[a]));
  await assert.rejects(writePlan(f.root, [{path: a, action: 'replace', after: '# A\n'}], {git, expected: {[a]: '0'.repeat(64)}}), e => e.status === 409 && e.code === 'digest-mismatch' && e.current[a] === '# Login need\n');
  await assert.rejects(writePlan(f.root, [{path: a, action: 'create', after: '# A\n'}], {git}), e => e.status === 409 && e.code === 'exists');
  const expected = {[a]: await digest(a), [b]: await digest(b)};
  const c = 'docs/artifacts/tenant/specifications/new/deep.md';
  await assert.rejects(writePlan(f.root, [{path: a, action: 'replace', after: '# A\n'}, {path: b, action: 'replace', after: '# B\n'}, {path: c, action: 'create', after: '# C\n'}], {git, expected, beforeRename: index => {if (index === 2) throw Error('disk full');}}),
    e => e.status === 500 && e.code === 'partial-write' && e.unrestored.length === 0);
  assert.deepEqual(await fingerprint(f.root), before);
  assert.deepEqual((await readdir(join(f.root, 'docs/artifacts/tenant/specifications'))).sort(), ['identity.md']);
});

test('W4: the journal keeps 50 operations and undo restores pre-images only while post-images are current', async t => {
  const f = await editable();t.after(f.cleanup);
  const journal = createJournal(50), path = 'docs/artifacts/authentication/requirements/login.md';
  const read = () => readFile(join(f.root, path), 'utf8');
  const write = async (text, operation = 'document.save') => writePlan(f.root, [{path, action: 'replace', after: text}], {git, journal, operation, expected: {[path]: digestOf(await read())}});
  const first = await write('# One\n');
  const undo = await undoPlan(f.root, journal, first.operationId);
  await writePlan(f.root, undo.edits, {git, expected: undo.expected});
  assert.equal(await read(), '# Login need\n');
  const second = await write('# Two\n');
  await writeFile(join(f.root, path), '# External edit\n');
  await assert.rejects(undoPlan(f.root, journal, second.operationId), e => e.status === 409 && e.code === 'undo-conflict' && e.current[path] === '# External edit\n');
  for (let i = 0; i < 55; i++) await write(`# Edit ${i}\n`);
  assert.equal(journal.list(f.root).length, 50);
  await assert.rejects(undoPlan(f.root, journal, second.operationId), e => e.status === 404);
  const created = await writePlan(f.root, [{path: 'docs/artifacts/tenant/requirements/new.md', action: 'create', after: '# New\n'}], {git, journal, operation: 'document.add'});
  const reverse = await undoPlan(f.root, journal, created.operationId);
  await writePlan(f.root, reverse.edits, {git, expected: reverse.expected});
  assert.equal(await readFile(join(f.root, 'docs/artifacts/tenant/requirements/new.md')).catch(() => null), null);
});
