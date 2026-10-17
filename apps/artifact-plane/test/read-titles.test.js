// Pages show documents and changes by title; the overview derives titles from
// the first level-1 heading without changing other fields.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildSnapshot, headingTitle} from '../src/model.js';
import {inPlaceFixture} from './fixtures.js';
import {mergeChange} from '../src/reload.js';

test('T1: a document title is its first level-1 heading, else its file name', () => {
  const files = inPlaceFixture();
  files.set('docs/artifacts/authentication/requirements/untitled.md', '---\nself_check: {result: passed}\n---\nNo heading here.\n## Only a second level\n');
  files.set('docs/artifacts/authentication/decisions/001-fenced.md', '```text\n# Not a title\n```\n\n# Use tokens  \n');
  const auth = buildSnapshot(files).artifacts.find(a => a.id === 'authentication');
  const title = path => auth.elements.find(e => e.path === path).title;
  assert.equal(title('requirements/login.md'), 'Login need');
  assert.equal(title('requirements/untitled.md'), 'untitled');
  assert.equal(title('decisions/001-fenced.md'), 'Use tokens');
});

test('T1: a change title is the first heading of its README, else null', () => {
  const files = inPlaceFixture();
  files.set('docs/artifacts/authentication/changes/change-login/README.md', '# Add password login\n\n## Reason and scope\n');
  files.set('docs/artifacts/authentication/changes/change-bare/tasks/README.md', '---\ntasks: []\n---\n');
  const auth = buildSnapshot(files).artifacts.find(a => a.id === 'authentication');
  const change = name => auth.changes.find(c => c.name === name);
  assert.equal(change('change-login').title, 'Add password login');
  assert.equal(change('change-bare').title, null);
  assert.equal(headingTitle('Text without heading'), null);
});

test('T1: a scoped change reply without a title keeps the overview title', () => {
  const snapshot = {workflow: {worktrees: [{path: '/w', changes: [{artifact: 'a', name: 'change-x', title: 'Do X', loadState: 'not-loaded'}]}]}};
  const merged = mergeChange(snapshot, JSON.stringify(['/w', 'a', 'change-x']), {artifact: 'a', name: 'change-x', loadState: 'loaded'});
  assert.deepEqual(merged.workflow.worktrees[0].changes[0], {title: 'Do X', artifact: 'a', name: 'change-x', loadState: 'loaded'});
});
